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
        this.load.image('iron', 'assets/resource_iron_orb.png');
        this.load.image('ice', 'assets/ice_icon.png'); // Use ice_icon for ice collectibles too
        this.load.image('resource_ice_orb', 'assets/resource_ice_orb.png'); // New ice orb asset
        this.load.image('progress_bar', 'assets/progress_bar.png');
        this.load.image('rover', 'assets/rover.png');
        this.load.image('solar_panel', 'assets/solar_panel.png');
        this.load.image('title', 'assets/title.png');
        this.load.image('habitat', 'assets/habitat.png');
        this.load.image('gameover_screen', 'assets/gameover_screen.png');
        this.load.image('life_lost_screen', 'assets/life_lost_screen.png');
        this.load.image('game_bg', 'assets/game_bg.png');

        // Create simple graphics for player
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00aaff);
        playerGraphics.fillRect(0, 0, 40, 60);
        playerGraphics.generateTexture('player', 40, 60);
        playerGraphics.destroy();
        
        console.log('[DEBUG] Simple player texture created (40x60)');
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
        this.nextResourceType = 'iron'; // Start with iron
        
        // Create initial platforms
        this.generateFixedPlatformPattern();
        
        // Create a second platform closer to the first one for better gameplay
        const secondPlatformX = 250 + 200 + 120; // Right edge of first platform (200px wide) + gap
        const secondPlatformY = 350; // Different Y level for variety
        const secondPlatform = this.createPlatform(secondPlatformX, secondPlatformY);
        this.addResourceToPlatform(secondPlatform);
        
        console.log(`[DEBUG] Created second platform at (${secondPlatformX}, ${secondPlatformY}) for better gameplay`);
        
        // 🎨 Просто рисуем "лаву" как декорацию
        this.lava = this.add.rectangle(0, 580, 4000, 40, 0xff0000, 0.5);
        this.lava.setOrigin(0, 0);

    
        this.player = this.physics.add.sprite(this.startX, this.startY, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(800);

        // Ensure player collision box is properly set up
        this.player.body.setSize(40, 60);
        this.player.body.setOffset(0, 0);

        console.log('[DEBUG] Player created at position (250, 430)');
        console.log('[DEBUG] Player body size:', this.player.body.width, 'x', this.player.body.height);
        console.log('[DEBUG] Player body offset:', this.player.body.offset.x, 'x', this.player.body.offset.y);

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        // Ensure physics collider is set up after both player and platforms are created
        this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, null, this);
        
        console.log('[DEBUG] Physics collider set up between player and platforms');
        console.log('[DEBUG] Total platforms in group:', this.platforms.getChildren().length);
        
        // Position player exactly on top of the starting platform AFTER collider setup
        // Platform is at (250, 450) with height 30, so platform top is at Y=450
        // Player height is 60, so player bottom should be at Y=450, meaning player Y should be 450-60=390
        this.player.setPosition(250, 390); // Player bottom at Y=450 (platform top)
        console.log('[DEBUG] Player positioned at (250, 390) after collider setup');
        
        // Debug: Show platform collision boxes
        this.platforms.getChildren().forEach((platform, index) => {
            console.log(`[DEBUG] Platform ${index} collision box: (${platform.x}, ${platform.y}) ${platform.body.width}x${platform.body.height}`);
        });
        
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
        this.add.image(16, 80, 'iron').setScale(0.05).setScrollFactor(0).setDepth(10); // Match collectible scale
        this.add.image(16, 110, 'resource_ice_orb').setScale(0.05).setScrollFactor(0).setDepth(10); // Use ice orb asset for UI
        this.add.image(16, 140, 'energy_icon').setScale(0.5).setScrollFactor(0).setDepth(10);
        
        this.ironText = this.add.text(50, 70, `Iron: ${window.SHARED.resources.stone}`, { fontSize: '20px', fill: '#fff' })
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
        // Create a visible platform using graphics instead of a texture
        const platform = this.add.rectangle(x, y, 200, 20, 0x8B4513); // Brown rectangle
        this.platforms.add(platform); // Add to the physics group
        
        // Set up the physics body
        this.physics.add.existing(platform, true); // `true` for a static body
        platform.body.allowGravity = false;
        
        return platform;
    }
    
    // Helper method to get the actual platform width for spacing calculations
    getPlatformWidth() {
        // Platforms are 200 pixels wide
        return 200;
    }
    
    generateFixedPlatformPattern() {
        // Fix platform generation tracking variables - reset all counters
        this.platformsInCurrentPattern = 0;
        this.patternIndex = 0;
        this.currentPattern = Phaser.Utils.Array.GetRandom(PLATFORM_PATTERNS);
        this.currentYIndex = 0;
        
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
            
            // Update reference positions for generator
            this.lastPlatformX = 250 + PLATFORM_WIDTH; // Right edge of platform
            this.lastPlatformY = 450;
            this.lastPlacedX = 250;
            this.lastPlacedY = 450;
            
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
        if (this.gameOver) return;

        // Handle input
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        // Check if game is over or player doesn't exist
        if (!this.player || !this.player.body) return;
    
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
        this.ironText.setText(`Iron: ${window.SHARED.resources.stone}`);
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
        this.ironText.setText(`Iron: ${window.SHARED.resources.stone}`);
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
        // Check if player is landing on platform (moving downward)
        if (player.body.velocity.y > 0) {
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
        // Always add a resource to every platform (100% chance)
        const resourceXOffset = platform.width / 4;
        const resourceX = platform.x + randInt(-resourceXOffset, resourceXOffset);
        const resourceY = platform.y - 30; // 30px above the platform
        const resourceType = this.nextResourceType;

        let resource;
        if (resourceType === 'ice') {
            // Use the new ice orb asset with same scaling as iron
            resource = this.resources.create(resourceX, resourceY, 'resource_ice_orb');
            resource.setScale(0.08); // Same scale as iron orbs
            resource.body.setSize(resource.width * 0.08, resource.height * 0.08); // Match physics body to new size
            console.log('[DEBUG] Ice resource created at', resourceX, resourceY);
        } else {
            // Handle iron and other resources with scaling
            resource = this.resources.create(resourceX, resourceY, resourceType);
            
            // Specific handling for different resources - scaling and physics body
            if (resourceType === 'iron') {
                resource.setScale(0.08); // Reduced from 0.15 to make iron orbs smaller
                resource.body.setSize(resource.width * 0.08, resource.height * 0.08); // Match physics body to new size
            } else {
                // Assuming other resources are sized correctly
                resource.body.setSize(resource.width, resource.height);
            }
        }

        resource.setData('type', resourceType);

        // Make resources static so they don't fall
        resource.setImmovable(true);
        resource.body.allowGravity = false;
        
        console.log(`[DEBUG] Added ${resourceType} resource at (${resourceX}, ${resourceY})`);

        // Alternate between resource types for next platform
        this.nextResourceType = this.nextResourceType === 'iron' ? 'ice' : 'iron';
    }

    collectResource(player, resource) {
        const resourceType = resource.getData('type');
        
        // Destroy the resource
        resource.destroy();
        
        // Increase score
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Update shared resources based on type
        if (resourceType === 'iron') {
            window.SHARED.resources.stone += 1;
            this.ironText.setText(`Iron: ${window.SHARED.resources.stone}`);
        } else if (resourceType === 'ice') {
            window.SHARED.resources.ice += 1;
            this.iceText.setText(`Ice: ${window.SHARED.resources.ice}`);
        }
        
        console.log(`[DEBUG] Collected ${resourceType} resource! Score: ${this.score}`);
    }
}