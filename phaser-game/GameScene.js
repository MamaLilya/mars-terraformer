function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Create a simple circle texture for particles
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('particle', 8, 8);
        graphics.destroy();
    }

    create() {
        // Game state
        this.level = window.SHARED.level || 1;
        this.lives = window.SHARED.lives || 3;
        this.resources = window.SHARED.resources || { stone: 0, ice: 0, energy: 0 };
        this.score = 0;
        this.platformsLanded = 0;
        this.nextLevelAt = 30;
        this.isGameOver = false;
        this.justJumped = false;

        // Input setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', this.handleJump, this);
        this.input.on('pointerdown', this.handleJump, this);

        // Constants
        this.PLAYER_X = 100;
        this.GRAVITY = 1000;
        this.JUMP_FORCE = -400;
        this.DOUBLE_JUMP_FORCE = -350;
        this.BASE_PLATFORM_SPEED = 1.5 * 60;
        this.platformSpeed = this.BASE_PLATFORM_SPEED;
        
        // Jump state - initialize all flags
        this.jumping = false;
        this.onPlatform = false;
        this.doubleJumpAvailable = false;
        this.justSnapped = false;
        
        // Calculate max jump height: h = (v²) / (2 * g)
        this.MAX_JUMP_HEIGHT = (this.JUMP_FORCE * this.JUMP_FORCE) / (2 * this.GRAVITY);
        console.log('Max jump height:', this.MAX_JUMP_HEIGHT);
        
        // Platform generation
        this.MIN_PLATFORM_Y = 200;
        this.MAX_PLATFORM_Y = 350;
        this.lastPlatformX = 0;
        this.MIN_PLATFORM_GAP = 60;
        this.MAX_PLATFORM_GAP = 100;
        this.MIN_PLATFORM_DISTANCE_FROM_BOTTOM = 100;
        
        // Background
        this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0, 0);
        
        // Add lava effect at bottom
        this.lava = this.add.rectangle(0, this.cameras.main.height - 20, 800, 20, 0xff0000);
        this.lava.setOrigin(0, 0);
        this.lava.alpha = 0.5;
        
        // Configure physics
        this.physics.world.gravity.y = this.GRAVITY;
        
        // Create dynamic platforms group with proper physics settings
        this.platforms = this.physics.add.group({
            allowGravity: false,
            immovable: true,
            collideWorldBounds: true
        });
        this.collectibles = this.physics.add.staticGroup();
        
        // Create player sprite
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00aaff);
        graphics.fillRect(0, 0, 40, 60);
        graphics.generateTexture('player', 40, 60);
        graphics.destroy();
     
        this.player = this.physics.add.sprite(this.PLAYER_X, 300, 'player');
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(this.GRAVITY);
        this.player.body.setSize(40, 60, true);
        
        // Create starting platform
        const startPlatform = this.spawnPlatform(100, 400, 200);
        this.player.y = startPlatform.body.top - this.player.displayHeight / 2 + 1;
        
        // Spawn second platform
        this.lastPlatformX = 500;
        this.spawnPlatform(this.lastPlatformX, randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y), 200);
        
        // Set up collisions with proper callbacks
        this.physics.add.collider(
            this.player, 
            this.platforms,
            this.onPlayerLanding,
            null,
            this
        );
        
        this.physics.add.overlap(
            this.player,
            this.collectibles,
            this.collectItem,
            null,
            this
        );

        // Set up UI
        this.setupUI();

        // (Optional) Enable Arcade Physics debug
        // this.physics.world.drawDebug = true;
        // this.physics.world.debugGraphic = this.add.graphics();

        // Calculate max jump distance based on physics
        // t_apex = -JUMP_FORCE / GRAVITY
        // t_total = 2 * t_apex
        // maxJumpDistance = platformSpeed * t_total
        const t_apex = -this.JUMP_FORCE / this.GRAVITY;
        const t_total = 2 * t_apex;
        this.maxJumpDistance = this.platformSpeed * t_total;
    }

    handleJump() {
        console.log('Jump attempted - State:', {
            onPlatform: this.onPlatform,
            jumping: this.jumping,
            doubleJumpAvailable: this.doubleJumpAvailable,
            velocityY: this.player.body.velocity.y
        });

        if (this.onPlatform && !this.jumping) {
            // First jump
            console.log('First jump triggered');
            this.player.setVelocityY(this.JUMP_FORCE);
            this.jumping = true;
            this.onPlatform = false;
            console.log('First jump triggered →', {
                playerY: this.player.y,
                velocityY: this.player.body.velocity.y
            });
        } else if (this.jumping && this.doubleJumpAvailable) {
            // Double jump
            console.log('Double jump triggered');
            this.player.setVelocityY(this.DOUBLE_JUMP_FORCE);
            this.doubleJumpAvailable = false;
            console.log('Double jump triggered →', {
                playerY: this.player.y,
                velocityY: this.player.body.velocity.y
            });
        }
    }

    update() {
        if (this.isGameOver) {
            if (this.player?.body) {
                this.player.setVelocity(0, 0);
                this.player.body.enable = false;
            }
            return;
        }

        // Check if player is too close to bottom (lava)
        if (this.player?.y > this.cameras.main.height - this.MIN_PLATFORM_DISTANCE_FROM_BOTTOM) {
            console.log('Game Over: Player too close to lava');
            this.isGameOver = true;
            this.loseLife();
            return;
        }

        // Handle player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        // Keep player at fixed X position
        this.player.x = this.PLAYER_X;

        // Handle jumping
        if (this.cursors.up.isDown || this.cursors.space.isDown) {
            this.handleJump();
        }

        // Reset platform state at start of frame
        this.onPlatform = false;

        // Check each platform
        this.platforms.getChildren().forEach(platform => {
            // Get collision bounds
            const playerBottom = this.player.body.bottom;
            const platformTop = platform.body.top;
            const playerLeft = this.player.body.left;
            const playerRight = this.player.body.right;
            const platformLeft = platform.body.left;
            const platformRight = platform.body.right;

            // Check horizontal overlap
            const horizontalOverlap = playerRight > platformLeft && playerLeft < platformRight;
            
            if (horizontalOverlap) {
                // Normal landing check
                if (this.player.body.touching.down && this.player.body.blocked.down) {
                    const verticalDistance = platformTop - playerBottom;
                    if (verticalDistance >= -10 && verticalDistance <= 10) {
                        console.log('Normal landing detected', {
                            playerY: this.player.y,
                            platformTop,
                            verticalDistance
                        });
                        this.onPlatform = true;
                        this.jumping = false;
                        this.doubleJumpAvailable = true;  // Enable double jump on landing
                        this.player.body.velocity.y = 0;
                    }
                }
                // Backup snap check
                else if (!this.onPlatform && this.player.body.velocity.y >= 0) {
                    const verticalDistance = platformTop - playerBottom;
                    if (verticalDistance > 0 && verticalDistance <= 15) {  // Reduced snap distance
                        console.log('Backup snap triggered', {
                            playerY: this.player.y,
                            platformTop,
                            verticalDistance,
                            velocityY: this.player.body.velocity.y
                        });

                        // Perform the snap
                        this.player.y = platformTop - this.player.body.height/2;
                        this.player.body.velocity.y = 0;
                        this.player.body.updateFromGameObject();
                        
                        // Update states
                        this.onPlatform = true;
                        this.jumping = false;
                        this.doubleJumpAvailable = true;  // Enable double jump on snap
                    }
                }
            }
        });

        // Update score based on height
        const newScore = Math.floor(this.player.y / 10);
        if (newScore > this.score) {
            this.score = newScore;
            this.scoreText.setText(`Score: ${this.score}`);
        }

        // Check for level progression
        if (this.platformsLanded >= this.nextLevelAt) {
            this.level++;
            this.nextLevelAt += 30;
            this.platformSpeed = this.BASE_PLATFORM_SPEED * (1 + (this.level - 1) * 0.05);
            this.levelText.setText(`Level: ${this.level}`);
        }

        // Spawn new platforms
        const rightmostPlatform = this.getRightmostPlatform();
        if (rightmostPlatform && rightmostPlatform.x < this.cameras.main.width + 200) {
            this.spawnNextPlatform();
        }

        // Remove platforms that are off screen
        this.platforms.getChildren().forEach(platform => {
            if (platform.x < -platform.width) {
                platform.destroy();
            }
        });

        // Move platforms
        this.platforms.getChildren().forEach(platform => {
            platform.setVelocityX(-this.platformSpeed);
        });

        // Debug logging
        console.log('Update frame →', {
            playerY: this.player.y,
            velocityY: this.player.body.velocity.y,
            onPlatform: this.onPlatform,
            jumping: this.jumping,
            doubleJumpAvailable: this.doubleJumpAvailable
        });
    }

    onPlayerLanding(player, platform) {
        // Debug log collision
        console.log('Collision detected:', {
            playerY: player.y,
            platformY: platform.y,
            playerBottom: player.body.bottom,
            platformTop: platform.body.top,
            verticalDistance: platform.body.top - player.body.bottom
        });

        // Check if player is landing on top of platform
        if (player.body.velocity.y >= 0 && 
            player.body.bottom >= platform.body.top - 10 && 
            player.body.bottom <= platform.body.top + 10) {
            
            // Update player state
            this.onPlatform = true;
            this.jumping = false;
            this.doubleJumpAvailable = true;
            player.body.velocity.y = 0;
            
            // Snap player to platform
            player.y = platform.body.top - player.body.height/2;
            player.body.updateFromGameObject();
            
            console.log('Player landed on platform:', {
                playerY: player.y,
                platformY: platform.y,
                onPlatform: this.onPlatform,
                jumping: this.jumping,
                doubleJumpAvailable: this.doubleJumpAvailable
            });
        }
    }

    spawnPlatform(x, y, width) {
        // Create platform with proper physics body
        const platform = this.platforms.create(x, y, null);
        platform.setSize(width, 20);
        platform.setOffset(0, -10);  // Center the hitbox vertically
        platform.body.setImmovable(true);
        platform.body.allowGravity = false;
        
        // Create visual representation
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(0, 0, width, 20);
        graphics.generateTexture('platform', width, 20);
        graphics.destroy();
        
        platform.setTexture('platform');
        
        // Debug log platform creation
        console.log('Platform created:', {
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: platform.height,
            bodyOffset: platform.body.offset,
            bodySize: platform.body.size
        });
        
        return platform;
    }

    spawnCollectible(x, y) {
        const types = ['stone', 'ice', 'energy'];
        const type = types[randInt(0, 2)];
        const color = type === 'stone' ? 0xaaaaaa : type === 'ice' ? 0x66ccff : 0xffee00;
        
        // Create collectible texture if it doesn't exist
        if (!this.textures.exists('collectible_' + type)) {
            const graphics = this.add.graphics();
            graphics.fillStyle(color);
            graphics.fillRect(0, 0, 30, 30);
            graphics.generateTexture('collectible_' + type, 30, 30);
            graphics.destroy();
        }
        
        const collectible = this.collectibles.create(x, y, 'collectible_' + type);
        collectible.type = type;
        
        this.tweens.add({
            targets: collectible,
            y: y - 20,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    collectItem(player, collectible) {
        this.resources[collectible.type]++;
        this.score += 50;
        this.scoreText.setText(`Score: ${this.score}`);
        this.resText.setText(this.resString());
        // Create a one-time particle burst effect
        const particles = this.add.particles(0, 0, 'particle', {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            gravityY: 0,
            quantity: 1,
            frequency: 50,
            emitting: false
        });
        particles.setPosition(collectible.x, collectible.y);
        particles.start();
        // Clean up particles after animation
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
        // Make collectible disappear
        collectible.disableBody(true, true);
    }

    spawnNextPlatform() {
        // Calculate max allowed height based on player's current position
        const maxAllowedHeight = this.player.y - this.MAX_JUMP_HEIGHT;
        
        // Ensure maxAllowedHeight is within game bounds
        const minY = Math.max(this.MIN_PLATFORM_Y, maxAllowedHeight);
        const maxY = Math.min(this.MAX_PLATFORM_Y, maxAllowedHeight);
        
        // Calculate new platform position
        const gap = randInt(this.MIN_PLATFORM_GAP, this.MAX_PLATFORM_GAP);
        const newX = this.lastPlatformX + gap;
        const newY = randInt(minY, maxY);
        
        console.log('Platform spawn attempt:', {
            playerY: this.player.y,
            maxAllowedHeight,
            newY,
            isWithinJumpRange: newY >= maxAllowedHeight,
            maxJumpHeight: this.MAX_JUMP_HEIGHT
        });

        // Check for overlapping platforms
        let overlapping = false;
        this.platforms.getChildren().forEach(platform => {
            const horizontalOverlap = Math.abs(platform.x - newX) < 100;
            const verticalOverlap = Math.abs(platform.y - newY) < 50;
            if (horizontalOverlap && verticalOverlap) {
                overlapping = true;
            }
        });

        if (!overlapping) {
            this.lastPlatformX = newX;
            const platform = this.spawnPlatform(newX, newY, 200);
            
            // Add debug log for platform spawn
            console.log('Platform spawned:', {
                platformY: platform.y,
                playerY: this.player.y,
                distance: platform.y - this.player.y,
                isWithinJumpRange: platform.y - this.player.y <= this.MAX_JUMP_HEIGHT
            });
            
            // Spawn collectible above platform
            if (Math.random() < 0.3) {
                this.spawnCollectible(newX, newY - 50);
            }
        } else {
            // If overlapping, try again with adjusted height
            this.spawnNextPlatform();
        }
    }

    levelUp() {
        this.level++;
        window.SHARED.level = this.level;
        this.levelText.setText(`Level: ${this.level}`);
        // More gradual speed increase
        this.platformSpeed = this.BASE_PLATFORM_SPEED * (1 + this.level * 0.05);
        this.nextLevelAt += 30;
        
        // Visual feedback
        this.cameras.main.flash(500, 0, 255, 0);
        this.tweens.add({
            targets: this.levelText,
            scale: 1.5,
            duration: 200,
            yoyo: true
        });
    }

    loseLife() {
        if (this.isGameOver) return;  // Prevent multiple calls
        
        this.lives--;
        if (this.lives <= 0) {
            // Game over - return to menu
            window.SHARED.lives = 3;
            window.SHARED.level = 1;
            window.SHARED.resources = { stone: 0, ice: 0, energy: 0 };
            this.scene.start('MenuScene');
        } else {
            // Reset level
            window.SHARED.lives = this.lives;
            this.scene.restart();
        }
    }

    setupUI() {
        const textStyle = { fontSize: '24px', color: '#fff' };
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, textStyle);
        this.levelText = this.add.text(20, 50, `Level: ${this.level}`, textStyle);
        this.livesText = this.add.text(20, 80, `Lives: ${this.lives}`, textStyle);
        this.resText = this.add.text(20, 110, this.resString(), textStyle);
    }

    resString() {
        return `Resources: Stone ${this.resources.stone}  Ice ${this.resources.ice}  Energy ${this.resources.energy}`;
    }
}