function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Import constants from config
const CONSTANTS = {
    PLAYER: {
        SCALE: 1.0,
        GRAVITY: 800,
        BOUNCE: 0.1,
        BODY_SIZE: 64,
        DEPTH: 9999
    }
};

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
        this.load.image('game_bg', 'assets/game_bg.png');
        
        // Load new cat colonist as spritesheet (4 vertical frames, 60x60 each)
        this.load.spritesheet('cat_colonist_new', 'assets/cat_colonist_sheet.png', {
            frameWidth: 60,
            frameHeight: 60
        });
        // Load tuxedo cat as spritesheet (4 vertical frames, 60x60 each)
        this.load.spritesheet('tuxedo_cat_sprite', 'assets/tuxedo_cat_sprite.png', {
            frameWidth: 60,
            frameHeight: 60
        });
        
        // Load static cat images as fallbacks
        this.load.image('cat_white_static', 'assets/cat_white.png');
        this.load.image('cat_tuxedo_static', 'assets/cat_tuxedo.png');
        
        // Load resource assets
        this.load.image('iron', 'assets/resource_iron_orb.png');
        this.load.image('resource_ice_orb', 'assets/resource_ice_orb.png');
        this.load.image('resource_solar_orb', 'assets/resource_solar_orb.png');
        
        // (Optional) Mew sound
        // this.load.audio('mew', 'assets/mew.wav');
        this.load.image('icon_catcrete', 'assets/icon_catcrete.png');
        this.load.image('icon_fishice', 'assets/icon_fishice.png');
        this.load.image('icon_solarpurr', 'assets/icon_solarpurr.png');

        // Create animated player with better visuals
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00aaff);
        playerGraphics.fillRect(0, 0, 40, 60);
        // Add some details to make player more interesting
        playerGraphics.fillStyle(0x0088cc);
        playerGraphics.fillRect(5, 10, 30, 20); // Helmet
        playerGraphics.fillRect(15, 45, 10, 15); // Legs
        playerGraphics.generateTexture('player', 40, 60);
        playerGraphics.destroy();

        console.log('[DEBUG] Enhanced player texture created (40x60)');
    }

    create(data) {
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
    
        this.autoSpeed = 150 + (window.SHARED.progress.level - 1) * 20;
    
        // ALWAYS re-initialize platforms group
        this.platforms = this.physics.add.staticGroup();
    
        // Initialize resources group for collectibles BEFORE any resource logic
        this.resources = this.physics.add.group();
        
        // Initialize resource type for collectibles BEFORE creating platforms
        this.nextResourceType = 'iron'; // Start with iron
        
        // Create initial platforms
        const firstPlatform = this.generateFixedPlatformPattern();
        
        // Create a second platform closer to the first one for better gameplay
        const secondPlatformX = 250 + 200 + 120; // Right edge of first platform (200px wide) + gap
        const secondPlatformY = 350; // Different Y level for variety
        const secondPlatform = this.createPlatform(secondPlatformX, secondPlatformY);
        this.addResourceToPlatform(secondPlatform);
        
        console.log(`[DEBUG] Created second platform at (${secondPlatformX}, ${secondPlatformY}) for better gameplay`);
        
        // 🎨 Просто рисуем "лаву" как декорацию
        this.lava = this.add.rectangle(0, 580, 4000, 40, 0xff0000, 0.5);
        this.lava.setOrigin(0, 0);

        // Position player on the first platform
        if (firstPlatform) {
            this.startX = firstPlatform.x;
            this.startY = firstPlatform.y - 47;
        } else {
            this.startX = 250;
            this.startY = 403;
        }
    
        // --- Cat selection logic ---
        let playerTexture = 'cat_colonist_new';
        let useAnimations = true;
        
        if (data && data.selectedCat) {
            if (data.selectedCat === 'cat_white') {
                // Try spritesheet first, fallback to static image
                if (this.textures.exists('cat_colonist_new')) {
                    playerTexture = 'cat_colonist_new';
                    useAnimations = true;
                } else {
                    playerTexture = 'cat_white_static';
                    useAnimations = false;
                }
            } else if (data.selectedCat === 'cat_tuxedo') {
                // Try spritesheet first, fallback to static image
                if (this.textures.exists('tuxedo_cat_sprite')) {
                    playerTexture = 'tuxedo_cat_sprite';
                    useAnimations = true;
                } else {
                    playerTexture = 'cat_tuxedo_static';
                    useAnimations = false;
                }
            }
        }
        
        this.player = this.physics.add.sprite(this.startX, this.startY, playerTexture, 0);
        this.player.setScale(1.15);
        this.player.body.setSize(60, 60);
        this.player.body.setOffset(0, 0);
        this.player.setVisible(true);
        this.player.setDepth(1000);
        this.player.setAlpha(1);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(CONSTANTS.PLAYER.GRAVITY);
        this.player.setBounce(CONSTANTS.PLAYER.BOUNCE);
        this.player.setVisible(true);
        this.player.setDepth(CONSTANTS.PLAYER.DEPTH);
        this.player.setData('onPlatform', true);
        this.player.setData('jumping', false);
        this.player.setData('doubleJumpAvailable', true);
        
        // Only create and play animations if using spritesheets
        if (useAnimations) {
            this.createCatAnimations(playerTexture);
            // Store animation prefix for this cat type
            this.catAnimPrefix = playerTexture === 'tuxedo_cat_sprite' ? 'tuxedo' : 'cat';
            this.player.play(`${this.catAnimPrefix}_idle`);
        } else {
            // For static images, just ensure they're visible
            this.player.setVisible(true);
            this.catAnimPrefix = null;
        }
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.scrollX = this.player.x - this.cameras.main.width / 2;
        this.cameras.main.scrollY = this.player.y - this.cameras.main.height / 2;
        console.log('[DEBUG] Camera forcibly centered on player:', this.cameras.main.scrollX, this.cameras.main.scrollY);
        console.log('[DEBUG] Camera follow target (after force):', this.cameras.main.followTarget);
        console.log('[DEBUG] Camera world view:', this.cameras.main.worldView);
        
        // Immediately remove test players and fallback rectangles
        if (this.playerFallback) this.playerFallback.destroy();
        if (this.testPlayer) this.testPlayer.destroy();
        if (this.testSprite) this.testSprite.destroy();
        
        // Add collision between player and platforms
        this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, null, this);
        
        // Add overlap detection between player and resources
        this.physics.add.overlap(this.player, this.resources, this.collectResource, null, this);

        // Create visual effects for cat colonist (since we're using single image for now)
        this.createCatEffects();
        
        // Start with normal state
        // this.player.setTint(0xffffff); // Normal color - removed to preserve spritesheet colors

        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        this.cameras.main.setBounds(0, 0, 4000, 600);
        this.cameras.main.setZoom(1.0);
        this.cameras.main.setBackgroundColor(0x87CEEB); // Sky blue background
        this.physics.world.setBounds(0, 0, 4000, 600, false, false, false, false);
        
        // Debug camera settings
        console.log('[DEBUG] Camera bounds:', this.cameras.main.getBounds());
        console.log('[DEBUG] Camera scroll:', this.cameras.main.scrollX, this.cameras.main.scrollY);
        console.log('[DEBUG] Camera zoom:', this.cameras.main.zoom);
        console.log('[DEBUG] Camera following player:', this.cameras.main.followTarget);
        
        // Ensure camera is following player properly
        if (this.cameras.main.followTarget !== this.player) {
            console.log('[DEBUG] Re-establishing camera follow');
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        }

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceWasDown = false;
        
        this.physics.add.overlap(this.player, this.lava, () => {
            if (!this.levelCompleted) {
                this.loseLife();
            }
        }, null, this);        
    
        // Add Catcrete resource icon and display
        const catcreteIcon = this.add.image(16, 80, 'icon_catcrete').setScale(1.0).setScrollFactor(0).setDepth(10);
        this.catcreteText = this.add.text(50, 70, `Catcrete: ${window.SHARED.resources.stone}`, { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);
        // Add Fish-Ice resource icon and display
        const fishiceIcon = this.add.image(16, 110, 'icon_fishice').setScale(1.0).setScrollFactor(0).setDepth(10);
        this.fishiceText = this.add.text(50, 100, `Fish-Ice: ${window.SHARED.resources.ice}`, { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);
        // Add Solar Purr resource icon and display
        const solarpurrIcon = this.add.image(16, 140, 'icon_solarpurr').setScale(1.0).setScrollFactor(0).setDepth(10);
        this.energyText = this.add.text(50, 130, `Solar Purr: ${window.SHARED.resources.energy}`, { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);
        
        // Add Iron text (for legacy compatibility)
        this.ironText = this.add.text(50, 70, `Iron: ${window.SHARED.resources.stone}`, { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);
        
        // Add Score display
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, { 
            fontSize: '24px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(10);
        
        // Add Lives display
        this.livesText = this.add.text(16, 50, `Lives: ${this.lives}`, { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(10);
        
        // Add Terraforming progress display
        this.terraformingText = this.add.text(width - 16, 4, `Terraforming: ${window.SHARED.progress.terraforming || 0}%`, { 
            fontSize: '20px', 
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(10).setOrigin(1, 0);

        // Start with idle animation (already set above)
        // Log animation state
        console.log('[DEBUG] Player animation after play:', this.player.anims.currentAnim && this.player.anims.currentAnim.key);
        console.log('[DEBUG] Player animation frame:', this.player.anims.currentFrame && this.player.anims.currentFrame.index);
        console.log('[DEBUG] Player alpha:', this.player.alpha);
        console.log('[DEBUG] Camera follow target:', this.cameras.main.followTarget);
    }

    // Helper method to create platforms with proper collision boxes
    createPlatform(x, y) {
        const platformWidth = this.getPlatformWidth();
        const platform = this.add.rectangle(x, y, platformWidth, 30, 0x8B4513);
        this.platforms.add(platform);
        
        // Manually set up the physics body for the rectangle
        this.physics.add.existing(platform, true);
        platform.body.setSize(platformWidth, 30);
        platform.body.setOffset(0, 0);
        platform.body.immovable = true;
        platform.body.allowGravity = false;

        return platform;
    }
    
    // Helper method to get the actual platform width for spacing calculations
    getPlatformWidth() {
        // Platform width decreases as level increases to make it harder
        return Math.max(100, 200 - (window.SHARED.progress.level - 1) * 15);
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
            this.platformsPlaced++;
            return startPlatform;
        }
        
        // Get the rightmost platform
        const rightmostPlatform = this.getRightmostPlatform();
        if (!rightmostPlatform) {
            console.warn('[WARNING] No rightmost platform found');
            return null;
        }
        
        // Enhanced platform placement logic with better balance
        const PLATFORM_WIDTH = 200;
        const MIN_GAP = 120;
        const MAX_GAP = 180;
        const Y_LEVELS = [250, 350, 450];
        
        // Calculate new platform position with better spacing
        let gap = Phaser.Math.Between(MIN_GAP, MAX_GAP);
        
        // Add variety: occasional larger gaps for challenge
        if (platformCount % 5 === 0 && platformCount > 5) {
            gap = Phaser.Math.Between(160, 200);
        }
        
        const newX = rightmostPlatform.x + gap;
        
        // Smart Y level selection based on previous platform
        let newY;
        const lastY = rightmostPlatform.y;
        
        // Avoid impossible jumps by considering the previous platform
        if (lastY === 450) { // Last platform was low
            // Prefer mid or high level, avoid staying low
            newY = platformCount % 2 === 0 ? 350 : 250;
        } else if (lastY === 250) { // Last platform was high
            // Prefer mid or low level, avoid staying high
            newY = platformCount % 2 === 0 ? 350 : 450;
        } else { // Last platform was mid
            // Mix it up
            newY = Y_LEVELS[platformCount % 3];
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
                this.platformsPlaced++;
                return platform;
            }
            
            console.log(`[DEBUG] Placing platform at (${newX}, ${adjustedY}) - adjusted Y for reachability`);
            const platform = this.createPlatform(newX, adjustedY);
            this.addResourceToPlatform(platform);
            this.platformsPlaced++;
            return platform;
        }
        
        console.log(`[DEBUG] Placing platform at (${newX}, ${newY})`);
        const platform = this.createPlatform(newX, newY);
        this.addResourceToPlatform(platform);
        this.platformsPlaced++;
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
            if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
        }
    
        // Update resource displays to stay current
        if (this.ironText) this.ironText.setText(`Iron: ${window.SHARED.resources.stone}`);
        if (this.fishiceText) this.fishiceText.setText(`Fish-Ice: ${window.SHARED.resources.ice}`);
        if (this.energyText) this.energyText.setText(`Energy: ${window.SHARED.resources.energy}`);
        if (this.terraformingText) this.terraformingText.setText(`Terraforming: ${window.SHARED.progress.terraforming || 0}%`);
        if (this.catcreteText) this.catcreteText.setText(`Catcrete: ${window.SHARED.resources.stone}`);

        // Platform spawning logic - generate new platforms as player progresses
        if (!this.levelCompleted && !this.levelEndPlatformCreated) {
            const rightmostPlatform = this.getRightmostPlatform();
            if (rightmostPlatform && this.player.x > rightmostPlatform.x - 200) {
                // Spawn new platform when player is getting close to the rightmost platform
                this.generateFixedPlatformPattern();
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
            // Add screen shake effect
            this.cameras.main.shake(500, 0.02);
            this.loseLife();
        }

        // Check for level completion
        this.checkLevelCompletion();

        // Animation logic for cat colonist (only if using spritesheets)
        if (this.catAnimPrefix) {
            const playerOnGround = this.player.body.touching.down || this.player.body.blocked.down;
            let currentState = 'idle';
            
            if (playerOnGround) {
                if (Math.abs(this.player.body.velocity.x) > 10) {
                    // Walking
                    currentState = 'walk';
                    if (this.player.anims.currentAnim?.key !== `${this.catAnimPrefix}_walk`) {
                        this.player.play(`${this.catAnimPrefix}_walk`, true);
                    }
                } else {
                    // Idle
                    currentState = 'idle';
                    if (this.player.anims.currentAnim?.key !== `${this.catAnimPrefix}_idle`) {
                        this.player.play(`${this.catAnimPrefix}_idle`, true);
                    }
                }
            } else {
                // Jumping/Falling
                currentState = 'jump';
                if (this.player.anims.currentAnim?.key !== `${this.catAnimPrefix}_jump`) {
                    this.player.play(`${this.catAnimPrefix}_jump`, true);
                }
            }
            
            // Update state tracking with delay to prevent rapid changes
            const lastState = this.player.getData('lastState');
            const lastStateTime = this.player.getData('lastStateTime') || 0;
            const currentTime = this.time.now;
            
            if (currentState !== lastState && (currentTime - lastStateTime) > 100) {
                this.player.setData('lastState', currentState);
                this.player.setData('currentState', currentState);
                this.player.setData('lastStateTime', currentTime);
                console.log(`[DEBUG] Cat state changed from ${lastState} to ${currentState}`);
            }
        }
        
        // Ensure player is always visible
        this.player.setVisible(true);
        
        // Robust resource UI updates
        if (this.catcreteText) this.catcreteText.setText(`Catcrete: ${window.SHARED.resources.stone}`);
        if (this.fishiceText) this.fishiceText.setText(`Fish-Ice: ${window.SHARED.resources.ice}`);
        if (this.energyText) this.energyText.setText(`Solar Purr: ${window.SHARED.resources.energy}`);
        if (this.terraformingText) this.terraformingText.setText(`Terraforming: ${window.SHARED.progress.terraforming || 0}%`);
        if (this.livesText) this.livesText.setText(`Lives: ${this.lives}`);
        if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
    }
    
    checkLevelCompletion() {
        // Level is complete when player reaches the level end platform
        // Create level end platform after a certain number of platforms (scales with level)
        const targetPlatformCount = 10 + (window.SHARED.progress.level - 1);
        
        if (this.platformsPlaced >= targetPlatformCount && !this.levelEndPlatformCreated) {
            this.createLevelEndPlatform();
        }
        
        // Check if player has reached the level end platform
        if (this.levelEndPlatform && this.player && !this.levelCompleted) {
            const distanceToEnd = Math.abs(this.player.x - this.levelEndPlatform.x);
            if (distanceToEnd < 50) {
                this.levelCompleted = true;
                this.completeLevel();
            }
        }
    }

    createLevelEndPlatform() {
        const rightmostPlatform = this.getRightmostPlatform();
        if (!rightmostPlatform) return;
        const endX = rightmostPlatform.x + 200;
        const endY = 300;
        // Create a special green rectangle as the end platform
        this.levelEndPlatform = this.add.rectangle(endX, endY, 200, 20, 0x00ff00);
        this.platforms.add(this.levelEndPlatform);
        this.physics.add.existing(this.levelEndPlatform, true);
        this.levelEndPlatform.body.allowGravity = false;
        // Add pulsing animation
        this.tweens.add({
            targets: this.levelEndPlatform,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // Add a clear label above the platform
        this.levelEndText = this.add.text(endX, endY - 40, 'LEVEL COMPLETE!\nJump on this platform', {
            fontSize: '20px',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        this.levelEndPlatformCreated = true;
        // Log finish platform and player info
        const cam = this.cameras.main;
        const inView = (endX >= cam.scrollX && endX <= cam.scrollX + cam.width && endY >= cam.scrollY && endY <= cam.scrollY + cam.height);
        console.log(`[LEVEL END] Finish platform created at X: ${endX}, Y: ${endY}, in camera view: ${inView}`);
        console.log(`[LEVEL END] Player position at finish platform creation: X: ${this.player.x}, Y: ${this.player.y}`);
        // Dynamically extend world and camera bounds so the end platform is reachable
        const newWorldWidth = endX + 400; // Add extra space after the end platform
        this.physics.world.setBounds(0, 0, newWorldWidth, this.physics.world.bounds.height);
        this.cameras.main.setBounds(0, 0, newWorldWidth, this.cameras.main.height);
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
            level: window.SHARED.progress.level,
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
        window.SHARED.lives = this.lives; // Update shared lives value
        if (this.livesText) this.livesText.setText(`Lives: ${this.lives}`);
    
        if (this.lives <= 0) {
            this.gameOver = true;
            this.player.body.enable = false;
            this.player.setVisible(false);
            localStorage.setItem('lastLifeLostAt', Date.now().toString());
            this.scene.start('GameOver', { resources: window.SHARED.resources });
        } else {
            this.scene.start('LifeLost', { 
                lives: this.lives,
                resources: window.SHARED.resources 
            });
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
        if (this.livesText) this.livesText.setText(`Lives: ${this.lives}`);
        
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
        this.autoSpeed = 150 + (window.SHARED.progress.level - 1) * 20;
        
        // Track initial resources for the new level
        this.initialResources = {
            stone: window.SHARED.resources.stone,
            ice: window.SHARED.resources.ice,
            energy: window.SHARED.resources.energy
        };
        
        console.log(`[DEBUG] Waking up for level ${window.SHARED.progress.level} with speed ${this.autoSpeed}`);
    }

    endGame() {
        this.gameOver = true;
        const earned = Math.floor(this.score / 5);
        window.SHARED.resources.stone += earned;
        window.SHARED.resources.ice += Math.floor(earned / 2);
        window.SHARED.progress.terraforming += Math.min(1, 100 - window.SHARED.progress.terraforming);
    
        // Update resource display
        if (this.ironText) this.ironText.setText(`Iron: ${window.SHARED.resources.stone}`);
        if (this.fishiceText) this.fishiceText.setText(`Fish-Ice: ${window.SHARED.resources.ice}`);
        if (this.energyText) this.energyText.setText(`Energy: ${window.SHARED.resources.energy}`);
        if (this.terraformingText) this.terraformingText.setText(`Terraforming: ${window.SHARED.progress.terraforming}%`);
    
        console.log('Game ended:', {
            finalScore: this.score,
            resourcesEarned: {
                stone: earned,
                ice: Math.floor(earned / 2),
                terraforming: Math.min(1, 100 - window.SHARED.progress.terraforming)
            }
        });
    
        this.scene.start('GameOver', { score: this.score });
    }

    handlePlatformCollision(player, platform) {
        console.log('[DEBUG] handlePlatformCollision fired');
        if (player.body.velocity.y > 0) {
            player.setData('onPlatform', true);
            player.setData('jumping', false);
            player.setData('doubleJumpAvailable', true);
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
            resource.setScale(0.25); // Increased scale to make resources more visible
            resource.body.setSize(resource.width * 0.25, resource.height * 0.25); // Match physics body to new size
            console.log('[DEBUG] Ice resource created at', resourceX, resourceY);
        } else if (resourceType === 'solar') {
            // Use the solar orb asset with proper scaling
            resource = this.resources.create(resourceX, resourceY, 'resource_solar_orb');
            resource.setScale(0.25); // Increased scale to make resources more visible
            resource.body.setSize(resource.width * 0.25, resource.height * 0.25); // Match physics body to new size
            console.log('[DEBUG] Solar resource created at', resourceX, resourceY);
        } else {
            // Handle iron and other resources with scaling
            resource = this.resources.create(resourceX, resourceY, resourceType);
            
            // Specific handling for different resources - scaling and physics body
            if (resourceType === 'iron') {
                resource.setScale(0.25); // Increased scale to make iron orbs more visible
                resource.body.setSize(resource.width * 0.25, resource.height * 0.25); // Match physics body to new size
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
        
        // Increase score with visual feedback
        this.score += 10;
        if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
        
        // Animate score text
        if (this.scoreText) {
            this.tweens.add({
                targets: this.scoreText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 200,
                yoyo: true,
                ease: 'Power2'
            });
        }
        
        // Update shared resources based on type
        if (resourceType === 'iron') {
            window.SHARED.resources.stone += 1;
            if (this.ironText) this.ironText.setText(`Iron: ${window.SHARED.resources.stone}`);
            // Animate iron text
            if (this.ironText) {
                this.tweens.add({
                    targets: this.ironText,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
        } else if (resourceType === 'ice') {
            window.SHARED.resources.ice += 1;
            if (this.fishiceText) this.fishiceText.setText(`Fish-Ice: ${window.SHARED.resources.ice}`);
            // Animate ice text
            if (this.fishiceText) {
                this.tweens.add({
                    targets: this.fishiceText,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
        } else if (resourceType === 'solar') {
            window.SHARED.resources.energy += 1;
            if (this.energyText) this.energyText.setText(`Energy: ${window.SHARED.resources.energy}`);
            // Animate energy text
            if (this.energyText) {
                this.tweens.add({
                    targets: this.energyText,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
        }
        
        console.log(`[DEBUG] Collected ${resourceType} resource! Score: ${this.score}`);
    }

    createCatEffects() {
        // Create visual effects for cat colonist (since we're using single image for now)
        console.log('[DEBUG] Cat effects system initialized');
        
        // Set initial state
        this.player.setData('currentState', 'idle');
        this.player.setData('lastState', 'idle');
    }

    // Create animations for cat colonist
    createCatAnimations(textureKey = 'cat_colonist_new') {
        console.log(`[DEBUG] Creating cat animations for ${textureKey}...`);
        
        // Create unique animation keys based on the texture
        const animPrefix = textureKey === 'tuxedo_cat_sprite' ? 'tuxedo' : 'cat';
        
        if (this.textures.exists(textureKey)) {
            this.anims.create({
                key: `${animPrefix}_idle`,
                frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
            this.anims.create({
                key: `${animPrefix}_walk`,
                frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
            this.anims.create({
                key: `${animPrefix}_jump`,
                frames: [{ key: textureKey, frame: 2 }],
                frameRate: 1,
                repeat: -1
            });
            console.log(`[DEBUG] Cat animations for ${textureKey} created successfully`);
        } else {
            console.warn(`[WARNING] Texture ${textureKey} not found, skipping animation creation`);
        }
    }
}