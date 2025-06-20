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
        this.load.image('resource_solar_orb', 'assets/resource_solar_orb.png'); // Solar energy resource
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
        this.levelCompleted = false;
        this.platformsPlaced = 0;
        this.levelEndPlatformCreated = false;
        this.levelEndPlatform = null;
        this.levelEndText = null;
    
        // Track initial resources for level completion calculation
        this.initialResources = {
            stone: window.SHARED.resources.stone,
            ice: window.SHARED.resources.ice,
            energy: window.SHARED.resources.energy
        };
    
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
            if (!this.levelCompleted) {
                this.loseLife();
            }
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
        
        // Increment platform counter for level completion tracking
        this.platformsPlaced++;
        
        return platform;
    }
    
    // Helper method to get the actual platform width for spacing calculations
    getPlatformWidth() {
        // Platforms are 200 pixels wide
        return 200;
    }
    
    generateFixedPlatformPattern() {
        // Safety check: ensure platforms group exists
        if (!this.platforms?.getChildren) {
            console.warn('[WARNING] Platforms group not properly initialized');
            return null;
        }
        
        const platformCount = this.platforms.getChildren().length;
        console.log('[DEBUG] Total platforms:', platformCount);
        
        // Create initial starting platform if none exists
        if (platformCount === 0) {
            const startPlatform = this.createPlatform(250, 450);
            this.addResourceToPlatform(startPlatform);
            return startPlatform;
        }
        
        // Get the rightmost platform
        const rightmostPlatform = this.getRightmostPlatform();
        if (!rightmostPlatform) {
            console.warn('[WARNING] No rightmost platform found');
            return null;
        }
        
        // Simple platform placement logic
        const PLATFORM_WIDTH = 200;
        const MIN_GAP = 120;
        const MAX_GAP = 180;
        const Y_LEVELS = [250, 350, 450];
        
        // Calculate new platform position
        const gap = Phaser.Math.Between(MIN_GAP, MAX_GAP);
        const newX = rightmostPlatform.x + gap;
        
        // Choose Y level - alternate between levels for variety
        let newY;
        if (platformCount % 3 === 0) {
            newY = 250; // High level
        } else if (platformCount % 3 === 1) {
            newY = 350; // Mid level
        } else {
            newY = 450; // Low level
        }
        
        // Check if the jump is reachable
        const dx = Math.abs(newX - rightmostPlatform.x);
        const dy = Math.abs(newY - rightmostPlatform.y);
        
        // Maximum jump distances (based on player capabilities)
        const MAX_HORIZONTAL_JUMP = 200;
        const MAX_VERTICAL_JUMP = 150;
        
        // If the jump is too difficult, adjust the Y position
        if (dx > MAX_HORIZONTAL_JUMP || dy > MAX_VERTICAL_JUMP) {
            console.log(`[DEBUG] Jump too difficult: dx=${dx}, dy=${dy}. Adjusting Y position.`);
            
            // Find a reachable Y position
            let adjustedY = newY;
            
            // If jumping up too high, lower the target
            if (newY < rightmostPlatform.y && dy > MAX_VERTICAL_JUMP) {
                adjustedY = rightmostPlatform.y - Math.min(100, MAX_VERTICAL_JUMP);
                console.log(`[DEBUG] Lowered target from ${newY} to ${adjustedY}`);
            }
            // If jumping down too far, raise the target
            else if (newY > rightmostPlatform.y && dy > MAX_VERTICAL_JUMP) {
                adjustedY = rightmostPlatform.y + Math.min(100, MAX_VERTICAL_JUMP);
                console.log(`[DEBUG] Raised target from ${newY} to ${adjustedY}`);
            }
            
            // If horizontal gap is too large, reduce it
            if (dx > MAX_HORIZONTAL_JUMP) {
                const adjustedX = rightmostPlatform.x + Math.min(180, MAX_HORIZONTAL_JUMP);
                console.log(`[DEBUG] Reduced gap from ${dx} to ${adjustedX - rightmostPlatform.x}`);
                
                console.log(`[DEBUG] Placing platform at (${adjustedX}, ${adjustedY}) - adjusted for reachability`);
                const platform = this.createPlatform(adjustedX, adjustedY);
                this.addResourceToPlatform(platform);
                return platform;
            }
            
            console.log(`[DEBUG] Placing platform at (${newX}, ${adjustedY}) - adjusted Y for reachability`);
            const platform = this.createPlatform(newX, adjustedY);
            this.addResourceToPlatform(platform);
            return platform;
        }
        
        console.log(`[DEBUG] Placing platform at (${newX}, ${newY})`);
        const platform = this.createPlatform(newX, newY);
        this.addResourceToPlatform(platform);
        return platform;
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
        if (this.levelCompleted) return;

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
        if (!this.levelCompleted) {
            const rightmostPlatform = this.getRightmostPlatform();
            if (rightmostPlatform && this.player.x > rightmostPlatform.x - 200) {
                // Spawn new platform when player is getting close to the rightmost platform
                const newPlatform = this.generateFixedPlatformPattern();
                if (newPlatform) {
                    console.log('[DEBUG] New platform successfully placed at:', newPlatform.x, newPlatform.y);
                } else {
                    console.warn('[WARNING] Failed to place new platform');
                }
            }
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
        if (this.player.y >= 570 && !this.gameOver && !this.levelCompleted) {
            this.loseLife();
        }

        // Check for level completion
        this.checkLevelCompletion();
    }
    
    checkLevelCompletion() {
        // Level is complete when player reaches the level end platform
        // Create level end platform after a certain number of platforms (scales with level)
        const targetPlatformCount = 20 + (window.SHARED.level - 1);
        
        if (this.platformsPlaced >= targetPlatformCount && !this.levelEndPlatformCreated) {
            this.createLevelEndPlatform();
        }
        
        // Check if player has reached the level end platform
        if (this.levelEndPlatform && this.player && !this.levelCompleted) {
            const distanceToEnd = Math.abs(this.player.x - this.levelEndPlatform.x);
            if (distanceToEnd < 50) { // Player is close to the end platform
                this.levelCompleted = true;
                this.completeLevel();
            }
        }
    }

    createLevelEndPlatform() {
        // Get the rightmost platform to place the end platform after it
        const rightmostPlatform = this.getRightmostPlatform();
        if (!rightmostPlatform) {
            console.warn('[WARNING] No rightmost platform found for level end platform');
            return;
        }
        
        // Create the level end platform
        const endX = rightmostPlatform.x + 150; // 150px after the last platform
        const endY = 350; // Mid level for easy access
        
        this.levelEndPlatform = this.add.rectangle(endX, endY, 200, 20, 0x00ff00); // Green platform
        this.platforms.add(this.levelEndPlatform);
        this.physics.add.existing(this.levelEndPlatform, true);
        this.levelEndPlatform.body.allowGravity = false;
        
        // Add "ENTER TO NEXT LEVEL" text
        this.levelEndText = this.add.text(endX, endY - 40, 'ENTER TO NEXT LEVEL', {
            fontSize: '16px',
            fill: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add a collectible resource on the end platform
        this.addResourceToPlatform(this.levelEndPlatform);
        
        this.levelEndPlatformCreated = true;
        
        console.log(`[DEBUG] Level end platform created at (${endX}, ${endY})`);
    }

    completeLevel() {
        // Calculate resources collected during this level
        const resourcesCollected = {
            iron: window.SHARED.resources.stone - (this.initialResources?.stone || 0),
            ice: window.SHARED.resources.ice - (this.initialResources?.ice || 0),
            solar: window.SHARED.resources.energy - (this.initialResources?.energy || 0)
        };
        
        // Prepare level data to pass to LevelComplete scene
        const levelData = {
            resourcesCollected: resourcesCollected,
            livesRemaining: this.lives,
            level: window.SHARED.level,
            score: this.score
        };
        
        console.log('[DEBUG] Level completed! Resources collected:', resourcesCollected);
        
        // Stop the game and show level complete screen
        this.gameOver = true;
        this.scene.start('LevelComplete', levelData);
    }
    
    loseLife() {
        // Don't call loseLife if game is already over or level is completed
        if (this.gameOver || this.levelCompleted) {
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
        // Reset player when returning from LifeLost scene or LevelComplete scene
        this.resetPlayer();
        
        // Refresh lives display to ensure it's current
        this.lives = window.SHARED.lives;
        this.livesText.setText(`Lives: ${this.lives}`);
        
        // Reset level completion state
        this.levelCompleted = false;
        this.platformsPlaced = 0;
        this.levelEndPlatformCreated = false;
        this.levelEndPlatform = null;
        if (this.levelEndText) {
            this.levelEndText.destroy();
            this.levelEndText = null;
        }
        
        // Update auto speed based on current level
        this.autoSpeed = 150 + (window.SHARED.level - 1) * 20;
        
        // Track initial resources for the new level
        this.initialResources = {
            stone: window.SHARED.resources.stone,
            ice: window.SHARED.resources.ice,
            energy: window.SHARED.resources.energy
        };
        
        console.log(`[DEBUG] Waking up for level ${window.SHARED.level} with speed ${this.autoSpeed}`);
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
        } else if (resourceType === 'solar') {
            // Use the solar orb asset with proper scaling
            resource = this.resources.create(resourceX, resourceY, 'resource_solar_orb');
            resource.setScale(0.08); // Same scale as other resources
            resource.body.setSize(resource.width * 0.08, resource.height * 0.08); // Match physics body to new size
            console.log('[DEBUG] Solar resource created at', resourceX, resourceY);
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
        if (this.nextResourceType === 'iron') {
            this.nextResourceType = 'ice';
        } else if (this.nextResourceType === 'ice') {
            this.nextResourceType = 'solar';
        } else {
            this.nextResourceType = 'iron'; // Cycle back to iron
        }
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
        } else if (resourceType === 'solar') {
            window.SHARED.resources.energy += 1;
            this.energyText.setText(`Energy: ${window.SHARED.resources.energy}`);
        }
        
        console.log(`[DEBUG] Collected ${resourceType} resource! Score: ${this.score}`);
    }
}