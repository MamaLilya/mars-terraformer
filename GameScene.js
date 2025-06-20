function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Platform pattern definitions - moved to top level for global access
const PLATFORM_PATTERNS = [
    [450, 350], // Simple ascent - 2 platforms
    [350, 250, 450], // Complex pattern - 3 platforms
    [450, 250, 350], // Mixed pattern - 3 platforms
    [350, 450, 250], // Wave pattern - 3 platforms
    [250, 450, 350], // High-low pattern - 3 platforms
    [450, 350, 250], // Zigzag pattern - 3 platforms
];

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load game assets
        this.load.image('energy_icon', 'assets/energy_icon.png');
        this.load.image('ice_icon', 'assets/ice_icon.png');
        this.load.image('ore_icon', 'assets/ore_icon.png');
        this.load.image('progress_bar', 'assets/progress_bar.png');
        this.load.image('rover', 'assets/rover.png');
        this.load.image('solar_panel', 'assets/solar_panel.png');
        this.load.image('title', 'assets/title.png');
        this.load.image('habitat', 'assets/habitat.png');
        this.load.image('gameover_screen', 'assets/gameover_screen.png');
        this.load.image('life_lost_screen', 'assets/life_lost_screen.png');
        this.load.image('game_bg', 'assets/game_bg.png');
        this.load.image('platform', 'assets/platform_mars.png');

        // Create simple graphics for player
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00aaff);
        playerGraphics.fillRect(0, 0, 40, 60);
        playerGraphics.generateTexture('player', 40, 60);
        playerGraphics.destroy();
        
        // Debug: Check platform image dimensions when loaded
        this.load.on('complete', () => {
            const platformTexture = this.textures.get('platform');
            if (platformTexture) {
                const frame = platformTexture.getSourceImage();
                console.log('[DEBUG] Platform image dimensions:', frame.width, 'x', frame.height);
                console.log('[DEBUG] Platform scaled dimensions:', frame.width * 0.8, 'x', frame.height * 0.8);
                
                // Store the actual dimensions for use in platform creation
                this.platformImageWidth = frame.width;
                this.platformImageHeight = frame.height;
            } else {
                console.error('[ERROR] Platform texture not found!');
            }
        });
    }

    create() {
        const { width, height } = this.scale;

        // Add background - make it cover the entire world
        const bg = this.add.image(0, 0, 'game_bg')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-1);

        // Scale background to cover the entire screen
        bg.setDisplaySize(width, height);
        
        // Clear existing platforms on scene restart - with proper null checks
        if (this.platforms?.clear) {
            try {
                this.platforms.clear(true, true);
                console.log('[DEBUG] Platforms cleared successfully');
            } catch (error) {
                console.warn('[WARNING] Failed to clear platforms:', error);
            }
        } else {
            console.log('[DEBUG] Platforms group not yet initialized, skipping clear');
        }
        
        this.startX = 100;
        this.startY = 410; // Position player on top of first platform at (100, 450)

        this.score = 0;
        this.lives = window.SHARED.lives;
        this.gameOver = false;
        this.hasTouchedLava = false;
    
        this.autoSpeed = 150 + (window.SHARED.level - 1) * 20;
    
        // ALWAYS re-initialize platforms group
        this.platforms = this.physics.add.staticGroup();
        
        // Initialize resources group for collectibles BEFORE any resource logic
        this.resources = this.physics.add.group();
        
        // Initialize resource type for collectibles BEFORE creating platforms
        this.nextResourceType = 'rock'; // Start with rock
        
        // Restore the first starting platform manually
        const startPlatform = this.platforms.create(250, 450, 'platform');
        startPlatform.setImmovable(true);
        startPlatform.body.allowGravity = false;
        startPlatform.setScale(0.25).refreshBody();
        
        // Calculate the actual visual size of the scaled platform
        const startScaledWidth = startPlatform.width * 0.25;
        const startScaledHeight = startPlatform.height * 0.25;
        startPlatform.body.setSize(startScaledWidth, startScaledHeight);
        
        this.addResourceToPlatform(startPlatform);

        // Update reference positions for generator
        this.lastPlatformX = 250 + startPlatform.displayWidth;
        this.lastPlatformY = 450;
        this.lastPlacedX = 250;
        this.lastPlacedY = 450;
        
        console.log('[DEBUG] Starting platform created at (250, 450) with reference positions updated');
        
        // Fixed platform Y-levels
        this.PLATFORM_Y_TOP = 250;
        this.PLATFORM_Y_MID = 350;
        this.PLATFORM_Y_BOTTOM = 450;

        // Platform generation constraints - strict spacing rules
        const MIN_HORIZONTAL_GAP = 80;  // Minimum gap (greater than player width)
        const MAX_HORIZONTAL_GAP = 250; // Maximum gap (less than max double jump)
        const Y_LEVELS = [250, 350, 450]; // Fixed Y levels to choose from
        const SKIP_CHANCE = 60; // Reduced skip chance to 60% for more platforms
        const MAX_PLATFORMS_PER_PATTERN = 2; // Reduced to 2-3 platforms per pattern
        const PLATFORM_WIDTH = this.getPlatformWidth(); // Use actual scaled platform width

        // Create initial platforms
        this.generateFixedPlatformPattern();
        
        // 🎨 Просто рисуем "лаву" как декорацию
        this.lava = this.add.rectangle(0, 580, 4000, 40, 0xff0000, 0.5);
        this.lava.setOrigin(0, 0);

    
        this.player = this.physics.add.sprite(this.startX, this.startY, 'player');
        this.player.setPosition(250, 410); // Y is above the platform at (250, 450)
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(800);

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, null, this);
        
        // Add overlap detection for resource collection
        this.physics.add.overlap(this.player, this.resources, this.collectResource, null, this);
    
        // Create UI elements that stay fixed on screen
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '28px', fill: '#fff' })
            .setScrollFactor(0)
            .setDepth(10);
        this.livesText = this.add.text(16, 48, `Lives: ${this.lives}`, { fontSize: '28px', fill: '#fff' })
            .setScrollFactor(0)
            .setDepth(10);

        // Add resource icons and display - all fixed on screen
        this.add.image(16, 80, 'ore_icon').setScale(0.5).setScrollFactor(0).setDepth(10);
        this.add.image(16, 110, 'ice_icon').setScale(0.5).setScrollFactor(0).setDepth(10);
        this.add.image(16, 140, 'energy_icon').setScale(0.5).setScrollFactor(0).setDepth(10);
        
        this.oreText = this.add.text(50, 70, `Stone: ${window.SHARED.resources.stone}`, { fontSize: '20px', fill: '#fff' })
            .setScrollFactor(0)
            .setDepth(10);
        this.iceText = this.add.text(50, 100, `Ice: ${window.SHARED.resources.ice}`, { fontSize: '20px', fill: '#fff' })
            .setScrollFactor(0)
            .setDepth(10);
        this.energyText = this.add.text(50, 130, `Energy: ${window.SHARED.resources.energy}`, { fontSize: '20px', fill: '#fff' })
            .setScrollFactor(0)
            .setDepth(10);

        // Add progress bar for terraforming - fixed on screen
        this.progressBar = this.add.image(400, 30, 'progress_bar').setScale(0.3).setScrollFactor(0).setDepth(10);
        this.terraformingText = this.add.text(400, 20, `Terraforming: ${window.SHARED.terraforming || 0}%`, { 
            fontSize: '16px', 
            fill: '#fff' 
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

        // Add decorative elements - fixed on screen
        this.add.image(750, 50, 'rover').setScale(0.3).setScrollFactor(0).setDepth(10);
        this.add.image(750, 100, 'solar_panel').setScale(0.3).setScrollFactor(0).setDepth(10);
        this.add.image(750, 150, 'habitat').setScale(0.3).setScrollFactor(0).setDepth(10);
    
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        this.cameras.main.setBounds(0, 0, 4000, 600);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.physics.world.setBounds(0, 0, 4000, 600, false, false, false, false);

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceWasDown = false;
        
        this.physics.add.overlap(this.player, this.lava, () => {
            this.loseLife();
        }, null, this);        
    
        this.player.setData('onPlatform', true);
        this.player.setData('jumping', false);
        this.player.setData('doubleJumpAvailable', true);
    }
    
    // Helper method to create platforms with proper collision boxes
    createPlatform(x, y) {
        const platform = this.platforms.create(x, y, 'platform');
        platform.setImmovable(true);
        platform.body.allowGravity = false;
        
        // Use more reasonable scaling since the platform image is 1024x1024
        platform.setScale(0.25).refreshBody();
        
        // Calculate the actual visual size of the scaled platform
        const scaledWidth = platform.width * 0.25;
        const scaledHeight = platform.height * 0.25;
        
        // Set collision box to match the actual visual size
        platform.body.setSize(scaledWidth, scaledHeight);
        platform.body.setOffset(0, 0);
        
        // Debug logging for first few platforms
        if (this.platforms.getChildren().length <= 3) {
            console.log(`[DEBUG] Platform created at (${x}, ${y}) with visual size: ${scaledWidth}x${scaledHeight}, collision box: ${scaledWidth}x${scaledHeight}`);
        }
        
        return platform;
    }
    
    // Fallback method to create basic platforms if image-based ones fail
    createBasicPlatform(x, y) {
        const platform = this.platforms.create(x, y, 'platform');
        platform.setImmovable(true);
        platform.body.allowGravity = false;
        platform.setScale(0.8).refreshBody();
        
        // Use the original collision box approach
        platform.body.setSize(platform.width * 0.8, platform.height * 0.8);
        
        console.log(`[FALLBACK] Basic platform created at (${x}, ${y})`);
        return platform;
    }
    
    // Helper method to get the actual platform width for spacing calculations
    getPlatformWidth() {
        // Use the actual scaled width of the platform image
        const platformTexture = this.textures.get('platform');
        if (platformTexture) {
            const frame = platformTexture.getSourceImage();
            return frame.width * 0.25; // Scaled width (more reasonable now)
        }
        return 250; // Fallback to a reasonable width if texture not available
    }
    
    generateFixedPlatformPattern() {
        // Fix platform generation tracking variables - reset all counters
        this.platformsInCurrentPattern = 0;
        this.patternIndex = 0;
        this.currentPattern = Phaser.Utils.Array.GetRandom(PLATFORM_PATTERNS);
        this.currentYIndex = 0;
        
        // Platform generation constraints - strict spacing rules
        const MIN_HORIZONTAL_GAP = 80;  // Minimum gap (greater than player width)
        const MAX_HORIZONTAL_GAP = 250; // Maximum gap (less than max double jump)
        const Y_LEVELS = [250, 350, 450]; // Fixed Y levels to choose from
        const SKIP_CHANCE = 60; // Reduced skip chance to 60% for more platforms
        const MAX_PLATFORMS_PER_PATTERN = 2; // Reduced to 2-3 platforms per pattern
        const PLATFORM_WIDTH = this.getPlatformWidth(); // Use actual scaled platform width
        
        // Safety check: ensure platforms group exists and has getChildren method
        if (!this.platforms?.getChildren) {
            console.warn('[WARNING] Platforms group not properly initialized in generateFixedPlatformPattern');
            return null;
        }
        
        const platformCount = this.platforms.getChildren().length;
        console.log('[DEBUG] Total platforms:', platformCount);
        
        // Create initial starting platform if none exists
        if (platformCount === 0) {
            const startPlatform = this.createPlatform(250, 450);
            
            // Add collectible resource on the platform
            this.addResourceToPlatform(startPlatform);
            
            console.log('[DEBUG] Placed initial platform at (250, 450)');
            return startPlatform;
        }
        
        // RESET LOGIC: Initialize or reset tracking variables
        if (!this.lastPlacedX || !this.lastPlacedY || !this.currentPattern || !this.currentYIndex || platformCount === 1) {
            this.lastPlacedX = 250;
            this.lastPlacedY = 450;
            this.currentPattern = Phaser.Utils.Array.GetRandom(PLATFORM_PATTERNS);
            this.currentYIndex = 0; // Reset Y pattern index
            this.patternIndex = 0;
            this.platformsInCurrentPattern = 0;
            this.lastPlatformX = 250;
            this.lastPlatformY = 450;
            console.log(`[DEBUG] Selected pattern: [${this.currentPattern.join(', ')}]`);
        }
        
        // ENFORCE STRICTLY INCREASING X: Get the rightmost platform X position
        const rightmostPlatform = this.getRightmostPlatform();
        if (rightmostPlatform) {
            this.lastPlatformX = rightmostPlatform.x + PLATFORM_WIDTH; // Right edge of rightmost platform
            console.log(`[DEBUG] Rightmost platform at X: ${rightmostPlatform.x}, lastPlatformX updated to: ${this.lastPlatformX}`);
        } else {
            console.warn('[WARNING] No rightmost platform found, using default lastPlatformX');
            this.lastPlatformX = 250 + PLATFORM_WIDTH;
        }
        
        // Special logic for second platform placement
        if (platformCount === 1) {
            const children = this.platforms.getChildren();
            if (!children || children.length === 0) {
                console.warn('[WARNING] No platforms found when expecting 1 platform');
                return null;
            }
            
            const initialPlatform = children[0]; // First platform at (250, 450)
            
            // Get target Y from pattern at current index, ensuring alternation
            let targetY = this.currentPattern[this.currentYIndex];
            
            // ENFORCE Y-LEVEL ALTERNATION: Must be different from first platform
            if (targetY === this.lastPlacedY) {
                // Try next pattern index
                const nextIndex = (this.currentYIndex + 1) % this.currentPattern.length;
                targetY = this.currentPattern[nextIndex];
                if (targetY === this.lastPlacedY) {
                    // If still same, pick opposite level
                    if (this.lastPlacedY === 450) targetY = 250;
                    else if (this.lastPlacedY === 250) targetY = 450;
                    else targetY = 450; // Default for 350
                }
            }
            
            // ENFORCE STRICTLY INCREASING X: Calculate X position with strict spacing rules
            const desiredGap = Phaser.Math.Between(MIN_HORIZONTAL_GAP, MAX_HORIZONTAL_GAP);
            const newX = this.lastPlatformX + desiredGap; // Use lastPlatformX (right edge) + gap
            
            // VALIDATE X INCREASE: Ensure new platform is strictly to the right
            if (newX <= this.lastPlatformX) {
                console.warn(`[WARNING] Platform would be placed backward! newX: ${newX} <= lastPlatformX: ${this.lastPlatformX}`);
                // Force minimum gap to ensure forward placement
                const forcedX = this.lastPlatformX + MIN_HORIZONTAL_GAP;
                console.log(`[DEBUG] Forcing platform to X: ${forcedX} to maintain forward progression`);
            }
            
            console.log(`[DEBUG] Placing platform at X: ${newX}, Y: ${targetY} (pattern index ${this.currentYIndex})`);
            
            // Try to place at calculated position first
            if (this.isReachable(this.lastPlacedX, this.lastPlacedY, newX, targetY)) {
                const platform = this.createPlatform(newX, targetY);
                
                // Add collectible resource on the platform
                this.addResourceToPlatform(platform);
                
                this.lastPlatformX = newX + PLATFORM_WIDTH; // Update to right edge of new platform
                this.lastPlatformY = targetY;
                this.lastPlacedX = newX;
                this.lastPlacedY = targetY;
                this.currentYIndex = (this.currentYIndex + 1) % this.currentPattern.length; // Cycle pattern index
                this.patternIndex++;
                this.platformsInCurrentPattern++;
                
                console.log(`[DEBUG] Placed platform at (${newX}, ${targetY}), lastPlatformX updated to: ${this.lastPlatformX}`);
                return platform;
            }
            
            // Fallback: try different Y levels with same X, respecting alternation
            const fallbackYLevels = Y_LEVELS.filter(level => level !== this.lastPlacedY);
            for (const fallbackY of fallbackYLevels) {
                if (this.isReachable(this.lastPlacedX, this.lastPlacedY, newX, fallbackY)) {
                    const platform = this.createPlatform(newX, fallbackY);
                    
                    // Add collectible resource on the platform
                    this.addResourceToPlatform(platform);
                    
                    this.lastPlatformX = newX + PLATFORM_WIDTH; // Update to right edge of new platform
                    this.lastPlatformY = fallbackY;
                    this.lastPlacedX = newX;
                    this.lastPlacedY = fallbackY;
                    this.currentYIndex = (this.currentYIndex + 1) % this.currentPattern.length; // Cycle pattern index
                    this.patternIndex++;
                    this.platformsInCurrentPattern++;
                    
                    console.log(`[DEBUG] Placed platform at (${newX}, ${fallbackY}), lastPlatformX updated to: ${this.lastPlatformX}`);
                    return platform;
                }
            }
            
            // GUARANTEED FALLBACK: If no position is reachable, force place at minimum distance
            const guaranteedX = this.lastPlatformX + MIN_HORIZONTAL_GAP;
            const guaranteedY = this.currentPattern[this.currentYIndex]; // Use pattern Y
            
            // ENFORCE STRICTLY INCREASING X: Final validation
            if (guaranteedX <= this.lastPlatformX) {
                console.error(`[ERROR] Guaranteed fallback would place platform backward! X: ${guaranteedX} <= lastPlatformX: ${this.lastPlatformX}`);
                // Force a minimum forward step
                const forcedX = this.lastPlatformX + 100; // Force 100px forward
                console.log(`[DEBUG] Forcing platform to X: ${forcedX} as emergency fallback`);
            }
            
            const platform = this.createPlatform(guaranteedX, guaranteedY);
            
            // Add collectible resource on the platform
            this.addResourceToPlatform(platform);
            
            this.lastPlatformX = guaranteedX + PLATFORM_WIDTH; // Update to right edge of new platform
            this.lastPlatformY = guaranteedY;
            this.lastPlacedX = guaranteedX;
            this.lastPlacedY = guaranteedY;
            this.currentYIndex = (this.currentYIndex + 1) % this.currentPattern.length; // Cycle pattern index
            this.patternIndex++;
            this.platformsInCurrentPattern++;
            
            console.log(`[DEBUG] Placed platform at (${guaranteedX}, ${guaranteedY}), lastPlatformX updated to: ${this.lastPlatformX}`);
            return platform;
        }
        
        // If pattern complete or max platforms reached, select new pattern
        if (this.patternIndex >= this.currentPattern.length || this.platformsInCurrentPattern >= MAX_PLATFORMS_PER_PATTERN) {
            this.currentPattern = Phaser.Utils.Array.GetRandom(PLATFORM_PATTERNS);
            this.currentYIndex = 0; // Reset Y pattern index
            this.patternIndex = 0;
            this.platformsInCurrentPattern = 0; // Reset pattern counter
            
            // Add extra spacing after each pattern
            this.lastPlatformX += Phaser.Math.Between(50, 100);
            console.log(`[DEBUG] New pattern selected: [${this.currentPattern.join(', ')}], lastPlatformX: ${this.lastPlatformX}, platformsInCurrentPattern reset to 0`);
        }
        
        // Get current Y level from pattern at current index, ensuring alternation
        let targetY = this.currentPattern[this.currentYIndex];
        
        // ENFORCE Y-LEVEL ALTERNATION: Must be different from last platform
        if (targetY === this.lastPlatformY) {
            // Try next pattern index
            const nextIndex = (this.currentYIndex + 1) % this.currentPattern.length;
            targetY = this.currentPattern[nextIndex];
            if (targetY === this.lastPlatformY) {
                // If still same, pick opposite level
                if (this.lastPlatformY === 450) targetY = 250;
                else if (this.lastPlatformY === 250) targetY = 450;
                else targetY = 450; // Default for 350
            }
        }
        
        // ENFORCE STRICTLY INCREASING X: Calculate X position with strict spacing rules
        let desiredGap = Phaser.Math.Between(MIN_HORIZONTAL_GAP, MAX_HORIZONTAL_GAP);
        
        // Introduce occasional large jumps every 3rd platform (less frequent now)
        if (this.platformsInCurrentPattern > 0 && this.platformsInCurrentPattern % 2 === 0) {
            const bonus = Phaser.Math.Between(40, 80); // Reduced bonus
            desiredGap += bonus;
        }
        
        // Ensure desired gap is within strict constraints
        desiredGap = Phaser.Math.Clamp(desiredGap, MIN_HORIZONTAL_GAP, MAX_HORIZONTAL_GAP);
        
        // ENFORCE STRICTLY INCREASING X: Calculate new X position from right edge of last platform
        const newX = this.lastPlatformX + desiredGap;
        
        // VALIDATE X INCREASE: Ensure new platform is strictly to the right
        if (newX <= this.lastPlatformX) {
            console.warn(`[WARNING] Platform would be placed backward! newX: ${newX} <= lastPlatformX: ${this.lastPlatformX}`);
            // Force minimum gap to ensure forward placement
            const forcedX = this.lastPlatformX + MIN_HORIZONTAL_GAP;
            console.log(`[DEBUG] Forcing platform to X: ${forcedX} to maintain forward progression`);
        }
        
        console.log(`[DEBUG] Placing platform at X: ${newX}, Y: ${targetY} (pattern index ${this.currentYIndex})`);
        
        // Check if we should skip this platform - reduced skip chance for more platforms
        const shouldSkip = Phaser.Math.Between(0, 100) < SKIP_CHANCE;
        if (shouldSkip) {
            this.currentYIndex = (this.currentYIndex + 1) % this.currentPattern.length; // Still cycle pattern index
            this.patternIndex++;
            return null; // Do NOT place or adjust
        }
        
        // PROGRESSIVE FALLBACK: Try positions with gradually smaller horizontal gaps
        const fallbackAttempts = [
            // Attempt 1: Original calculated position with pattern Y
            { x: newX, y: targetY },
            // Attempt 2: Same X, different Y levels (excluding current Y)
            ...Y_LEVELS.filter(y => y !== this.lastPlatformY).map(y => ({ x: newX, y })),
            // Attempt 3: Reduced gap positions with different Y levels
            ...Y_LEVELS.filter(y => y !== this.lastPlatformY).map(y => ({ 
                x: this.lastPlatformX + MIN_HORIZONTAL_GAP, 
                y 
            })),
            // Attempt 4: Even smaller gap as last resort with different Y levels
            ...Y_LEVELS.filter(y => y !== this.lastPlatformY).map(y => ({ 
                x: this.lastPlatformX + 80, 
                y 
            }))
        ];
        
        // Try each fallback attempt
        for (const attempt of fallbackAttempts) {
            // ENFORCE STRICTLY INCREASING X: Validate X position
            if (attempt.x <= this.lastPlatformX) {
                console.warn(`[WARNING] Fallback attempt would place platform backward! X: ${attempt.x} <= lastPlatformX: ${this.lastPlatformX}`);
                continue; // Skip this attempt
            }
            
            if (this.isReachable(this.lastPlacedX, this.lastPlacedY, attempt.x, attempt.y)) {
                const platform = this.createPlatform(attempt.x, attempt.y);
                
                // Add collectible resource on the platform
                this.addResourceToPlatform(platform);
                
                this.lastPlatformX = attempt.x + PLATFORM_WIDTH; // Update to right edge of new platform
                this.lastPlatformY = attempt.y;
                this.lastPlacedX = attempt.x;
                this.lastPlacedY = attempt.y;
                this.currentYIndex = (this.currentYIndex + 1) % this.currentPattern.length; // Cycle pattern index
                this.patternIndex++;
                this.platformsInCurrentPattern++;
                
                console.log(`[DEBUG] Placed platform at (${attempt.x}, ${attempt.y}), lastPlatformX updated to: ${this.lastPlatformX}`);
                return platform;
            }
        }
        
        // GUARANTEED FALLBACK: If all attempts fail, force place at minimum distance
        const guaranteedX = this.lastPlatformX + MIN_HORIZONTAL_GAP;
        const guaranteedY = this.currentPattern[this.currentYIndex]; // Use pattern Y
        
        // ENFORCE STRICTLY INCREASING X: Final validation
        if (guaranteedX <= this.lastPlatformX) {
            console.error(`[ERROR] Guaranteed fallback would place platform backward! X: ${guaranteedX} <= lastPlatformX: ${this.lastPlatformX}`);
            // Force a minimum forward step
            const forcedX = this.lastPlatformX + 100; // Force 100px forward
            console.log(`[DEBUG] Forcing platform to X: ${forcedX} as emergency fallback`);
        }
        
        const platform = this.createPlatform(guaranteedX, guaranteedY);
        
        // Add collectible resource on the platform
        this.addResourceToPlatform(platform);
        
        this.lastPlatformX = guaranteedX + PLATFORM_WIDTH; // Update to right edge of new platform
        this.lastPlatformY = guaranteedY;
        this.lastPlacedX = guaranteedX;
        this.lastPlacedY = guaranteedY;
        this.currentYIndex = (this.currentYIndex + 1) % this.currentPattern.length; // Cycle pattern index
        this.patternIndex++;
        this.platformsInCurrentPattern++;
        
        console.log(`[DEBUG] Placed platform at (${guaranteedX}, ${guaranteedY}), lastPlatformX updated to: ${this.lastPlatformX}`);
        return platform;
    }

    // Helper function to check if a platform is reachable from another platform
    isReachable(fromX, fromY, toX, toY) {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);
        
        // Check if this is the second platform (from initial platform at 250, 450)
        const isSecondPlatform = fromX === 250 && fromY === 450;
        
        // Maximum reachable distances (based on player jump capabilities)
        let MAX_HORIZONTAL_REACH, MAX_VERTICAL_REACH;
        
        if (isSecondPlatform) {
            // Stricter constraints for second platform
            MAX_HORIZONTAL_REACH = 220; // Maximum horizontal jump distance for second platform
            MAX_VERTICAL_REACH = 110;   // Maximum vertical jump distance for second platform
        } else {
            // Less strict constraints for normal platforms
            MAX_HORIZONTAL_REACH = 140; // Increased from 120 for normal platforms
            MAX_VERTICAL_REACH = 120;   // Increased from 100 for normal platforms
        }
        
        // Check if the gap is within reachable limits
        const isReachable = dx <= MAX_HORIZONTAL_REACH && dy <= MAX_VERTICAL_REACH;
        
        return isReachable;
    }

    getRightmostPlatform() {
        // Safety check: ensure platforms group exists and has children
        if (!this.platforms?.getChildren) {
            console.warn('[WARNING] Platforms group not properly initialized');
            return null;
        }
        
        const children = this.platforms.getChildren();
        if (!children || children.length === 0) {
            return null;
        }
        
        return children.reduce((rightmost, p) => {
            return (!rightmost || p.x > rightmost.x) ? p : rightmost;
        }, null);
    }

    update() {
        // Check if game is over or player doesn't exist
        if (this.gameOver || !this.player || !this.player.body) return;
    
        // Update onPlatform based on physics state
        const isOnGround = this.player.body.touching.down || this.player.body.blocked.down;
        if (isOnGround && !this.player.getData('onPlatform')) {
            this.player.setData('onPlatform', true);
            this.player.setData('jumping', false);
            this.player.setData('doubleJumpAvailable', true);
        } else if (!isOnGround && this.player.getData('onPlatform')) {
            this.player.setData('onPlatform', false);
        }
    
        // Автоматическое движение
        this.player.setVelocityX(this.autoSpeed);
    
        // Прыжок по пробелу — только если на платформе
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (this.player.getData('onPlatform')) {
                // First jump from ground
                this.player.setVelocityY(-550);
                this.player.setData('jumping', true);
                this.player.setData('onPlatform', false);
            } else if (this.player.getData('doubleJumpAvailable') && this.player.getData('jumping')) {
                // Double jump in mid-air
                this.player.setVelocityY(-500);
                this.player.setData('doubleJumpAvailable', false);
            }
        }
    
        // Обновляем счёт по X-координате
        const newScore = Math.floor(this.player.x / 10);
        if (newScore > this.score) {
            this.score = newScore;
            this.scoreText.setText(`Score: ${this.score}`);
        }

        // Update resource displays to stay current
        this.oreText.setText(`Stone: ${window.SHARED.resources.stone}`);
        this.iceText.setText(`Ice: ${window.SHARED.resources.ice}`);
        this.energyText.setText(`Energy: ${window.SHARED.resources.energy}`);
        this.terraformingText.setText(`Terraforming: ${window.SHARED.terraforming || 0}%`);

        // Platform spawning logic - generate new platforms as player progresses
        const rightmostPlatform = this.getRightmostPlatform();
        if (rightmostPlatform && this.player.x > rightmostPlatform.x - 200) {
            // Spawn new platform when player is getting close to the rightmost platform
            const newPlatform = this.generateFixedPlatformPattern();
            if (newPlatform) {
                console.log('[DEBUG] New platform successfully placed at:', newPlatform.x, newPlatform.y);
            } else {
                console.warn('[WARNING] Failed to place new platform');
            }
            
            // Debug logging - show total platforms in scene
            console.log('[DEBUG] Platforms in scene:', this.platforms.getChildren().length);
        }

        // Platform validation - ensure platforms are working correctly
        if (this.platforms?.getChildren) {
            const children = this.platforms.getChildren();
            if (children && children.length > 0) {
                // Check if player is on any platform using physics system
                const isOnGround = this.player.body.touching.down || this.player.body.blocked.down;
                
                // Debug: log if player should be on platform but isn't
                if (isOnGround && !this.player.getData('onPlatform')) {
                    console.log('[DEBUG] Player touching ground but onPlatform flag is false - fixing...');
                    this.player.setData('onPlatform', true);
                } else if (!isOnGround && this.player.getData('onPlatform')) {
                    console.log('[DEBUG] Player not touching ground but onPlatform flag is true - fixing...');
                    this.player.setData('onPlatform', false);
                }
                
                // Clean up platforms that are far behind the player
                children.forEach(platform => {
                    if (platform.x < this.player.x - 600) {
                        // Clean up any resources associated with this platform
                        if (this.resources?.getChildren) {
                            const resources = this.resources.getChildren();
                            resources.forEach(resource => {
                                if (Math.abs(resource.x - platform.x) < 50) {
                                    resource.destroy();
                                }
                            });
                        }
                        platform.destroy();
                    }
                });
            }
        }
    
        // Check if player fell below screen and trigger loseLife()
        if (this.player.y >= 570 && !this.gameOver) {
            this.loseLife();
        }
    }
    
    
    loseLife() {
        // Don't call loseLife if game is already over
        if (this.gameOver) {
            return;
        }
    
        this.lives--;
        this.livesText.setText(`Lives: ${this.lives}`);
    
        if (this.lives <= 0) {
            this.gameOver = true;
            this.player.body.enable = false;
            this.player.setVisible(false);
            localStorage.setItem('lastLifeLostAt', Date.now().toString());
            this.scene.start('GameOver', { score: this.score });
        } else {
            this.scene.start('LifeLost', { lives: this.lives });
        }
    }

    resetPlayer() {
        // Reset position to starting position
        this.player.setPosition(this.startX, this.startY);
        
        // Clear all velocity
        this.player.setVelocity(0, 0);
        
        // Reset jump flags
        this.player.setData('onPlatform', true);
        this.player.setData('jumping', false);
        this.player.setData('doubleJumpAvailable', true);
        
        // Ensure physics body is enabled and visible
        this.player.body.enable = true;
        this.player.setVisible(true);
        
        // Reset game over state
        this.gameOver = false;
    }

    wake() {
        // Reset player when returning from LifeLost scene
        this.resetPlayer();
        
        // Refresh lives display to ensure it's current
        this.lives = window.SHARED.lives;
        this.livesText.setText(`Lives: ${this.lives}`);
    }

    endGame() {
        this.gameOver = true;
        const earned = Math.floor(this.score / 5);
        window.SHARED.resources.stone += earned;
        window.SHARED.resources.ice += Math.floor(earned / 2);
        window.SHARED.terraforming += Math.min(1, 100 - window.SHARED.terraforming);
    
        // Update resource display
        this.oreText.setText(`Stone: ${window.SHARED.resources.stone}`);
        this.iceText.setText(`Ice: ${window.SHARED.resources.ice}`);
        this.energyText.setText(`Energy: ${window.SHARED.resources.energy}`);
        this.terraformingText.setText(`Terraforming: ${window.SHARED.terraforming}%`);
    
        console.log('Game ended:', {
            finalScore: this.score,
            resourcesEarned: {
                stone: earned,
                ice: Math.floor(earned / 2),
                terraforming: Math.min(1, 100 - window.SHARED.terraforming)
            }
        });
    
        this.scene.start('GameOver', { score: this.score });
    }

    handlePlatformCollision(player, platform) {
        console.log('[DEBUG] Platform collision detected! Player at:', player.x, player.y, 'Platform at:', platform.x, platform.y);
        
        // Check if player is landing on platform (moving downward)
        if (player.body.velocity.y > 0) {
            console.log('[DEBUG] Player landing on platform - setting onPlatform to true');
            
            // Reset all jump flags consistently
            player.setData('onPlatform', true);
            player.setData('jumping', false);
            player.setData('doubleJumpAvailable', true);
            
            // Additional safety check to ensure flags are set correctly
            if (!player.getData('onPlatform') || player.getData('jumping') || !player.getData('doubleJumpAvailable')) {
                player.setData('onPlatform', true);
                player.setData('jumping', false);
                player.setData('doubleJumpAvailable', true);
            }
        }
    }

    addResourceToPlatform(platform) {
        // Position the collectible slightly above the platform (y - 20)
        const resourceX = platform.x;
        const resourceY = platform.y - 20;
        
        // Safety check: ensure nextResourceType is initialized
        if (!this.nextResourceType) {
            console.warn('[WARNING] nextResourceType is undefined, defaulting to rock');
            this.nextResourceType = 'rock';
        }
        
        // Create the resource sprite based on current type
        let resource;
        if (this.nextResourceType === 'rock') {
            resource = this.resources.create(resourceX, resourceY, 'ore_icon');
            resource.setScale(0.8); // Slightly smaller than UI icon
        } else if (this.nextResourceType === 'ice') {
            resource = this.resources.create(resourceX, resourceY, 'ice_icon');
            resource.setScale(0.8); // Slightly smaller than UI icon
        } else {
            console.warn(`[WARNING] Unknown resource type: ${this.nextResourceType}, defaulting to rock`);
            resource = this.resources.create(resourceX, resourceY, 'ore_icon');
            resource.setScale(0.8);
            this.nextResourceType = 'rock';
        }
        
        // Set physics properties
        resource.setImmovable(true);
        resource.body.allowGravity = false;
        
        // Store resource type for collection
        resource.setData('type', this.nextResourceType);
        
        // Toggle to next resource type for next platform
        this.nextResourceType = this.nextResourceType === 'rock' ? 'ice' : 'rock';
        
        console.log(`[DEBUG] Added ${resource.getData('type')} resource at (${resourceX}, ${resourceY})`);
    }

    collectResource(player, resource) {
        const resourceType = resource.getData('type');
        
        // Destroy the resource
        resource.destroy();
        
        // Increase score
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Update shared resources based on type
        if (resourceType === 'rock') {
            window.SHARED.resources.stone += 1;
            this.oreText.setText(`Stone: ${window.SHARED.resources.stone}`);
        } else if (resourceType === 'ice') {
            window.SHARED.resources.ice += 1;
            this.iceText.setText(`Ice: ${window.SHARED.resources.ice}`);
        }
        
        console.log(`[DEBUG] Collected ${resourceType} resource! Score: ${this.score}`);
    }
}