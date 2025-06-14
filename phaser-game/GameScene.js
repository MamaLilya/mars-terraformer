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
        this.gameOver = false;
        this.justJumped = false;

        // Input setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', this.handleJump, this);
        this.input.on('pointerdown', this.handleJump, this);

        // Constants
        this.PLAYER_X = 100;
        this.GRAVITY = 1000;
        this.JUMP_FORCE = -500;
        this.DOUBLE_JUMP_FORCE = -450;
        this.BASE_PLATFORM_SPEED = 1.5 * 60;
        this.platformSpeed = this.BASE_PLATFORM_SPEED;
        
        // Jump state
        this.jumping = false;
        this.onPlatform = false;
        this.doubleJumpAvailable = false;
        this.justSnapped = false;
        
        // Calculate max jump height: h = (v²) / (2 * g)
        this.MAX_JUMP_HEIGHT = (this.JUMP_FORCE * this.JUMP_FORCE) / (2 * this.GRAVITY);
        console.log('Max jump height:', this.MAX_JUMP_HEIGHT);
        
        // Platform generation
        this.MIN_PLATFORM_Y = 300;
        this.MAX_PLATFORM_Y = 400;
        this.lastPlatformX = 0;
        this.MIN_PLATFORM_GAP = 40;
        this.MAX_PLATFORM_GAP = 80;
        
        // Background
        this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0, 0);
        
        // Configure physics
        this.physics.world.gravity.y = this.GRAVITY;
        
        // Create dynamic platforms group - better for moving platforms
        this.platforms = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        this.collectibles = this.physics.add.staticGroup();
        
        // Create player sprite and enable physics
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00aaff);
        graphics.fillRect(0, 0, 40, 60);
        graphics.generateTexture('player', 40, 60);
        graphics.destroy();
     
        this.player = this.physics.add.sprite(this.PLAYER_X, 300, 'player');
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        // Set player physics properties
        this.player.body.setGravityY(this.GRAVITY);
        this.player.body.setSize(40, 60, true); // Match visual size
        
        // Create starting platform
        const startPlatform = this.spawnPlatform(100, 400, 200);
        // Position player on starting platform, aligned with platform body top
        this.player.y = startPlatform.body.top - this.player.displayHeight / 2 + 1;
        console.log('Initial player position:', {
            x: this.player.x,
            y: this.player.y,
            platformTop: startPlatform.body.top,
            platformY: startPlatform.y
        });
        
        // Spawn second platform
        this.lastPlatformX = 500;
        this.spawnPlatform(this.lastPlatformX, randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y), 200);
        
        // Set up collisions
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
        if (!this.player?.body) return;
        console.log('Jump attempted - State:', {
            onPlatform: this.onPlatform,
            jumping: this.jumping,
            doubleJumpAvailable: this.doubleJumpAvailable,
            velocityY: this.player.body.velocity.y
        });
        // First jump: only when on platform and not jumping
        if (this.onPlatform && !this.jumping) {
            console.log('First jump triggered');
            this.player.body.velocity.y = this.JUMP_FORCE;
            this.jumping = true;
            this.onPlatform = false;
            this.doubleJumpAvailable = true;
            this.player.setTint(0x00ff00);
            this.justJumped = true;
            console.log('First jump triggered → player.y:', this.player.y, 'velocityY:', this.player.body.velocity.y);
        }
        // Double jump: only when in air, already jumping, and double jump available
        else if (!this.onPlatform && this.jumping && this.doubleJumpAvailable) {
            console.log('Double jump triggered');
            this.player.body.velocity.y = this.DOUBLE_JUMP_FORCE; // Use weaker double jump force
            this.doubleJumpAvailable = false;
            this.player.setTint(0xffff00);
            this.justJumped = true;
            console.log('Double jump triggered → player.y:', this.player.y, 'velocityY:', this.player.body.velocity.y);
        }
    }

    update() {
        if (this.gameOver) {
            // Stop all player movement when game is over
            if (this.player?.body) {
                this.player.setVelocity(0, 0);
                this.player.body.enable = false;
            }
            return;
        }

        // Check if player has fallen below the screen
        if (this.player?.y > this.cameras.main.height) {
            console.log('Game Over: Player fell below screen');
            this.gameOver = true;
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
                    if (verticalDistance >= -5 && verticalDistance <= 5) {
                        console.log('Normal landing detected', {
                            playerY: this.player.y,
                            platformTop,
                            verticalDistance
                        });
                        this.onPlatform = true;
                        this.jumping = false;
                        this.doubleJumpAvailable = false;
                        this.player.body.velocity.y = 0;
                    }
                }
                // Backup snap check
                else if (!this.onPlatform && this.player.body.velocity.y >= 0) {
                    const verticalDistance = platformTop - playerBottom;
                    if (verticalDistance > 0 && verticalDistance <= 20) {
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
                        this.doubleJumpAvailable = false;
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
    }

    onPlayerLanding(player, platform) {
        const verticalDistance = platform.body.top - player.body.bottom;
        if (verticalDistance >= -5 && verticalDistance <= 5) {
            console.log('Physics landing detected', {
                playerY: player.y,
                platformTop: platform.body.top,
                verticalDistance
            });
            
            player.y = platform.body.top - player.displayHeight / 2;
            player.body.velocity.y = 0;
            player.body.updateFromGameObject();
            
            this.jumping = false;
            this.doubleJumpAvailable = false;
            this.player.setTint(0x00aaff);
            this.onPlatform = true;
            this.justSnapped = true;
        }
    }

    spawnPlatform(x, y, width) {
        // Create platform texture if it doesn't exist
        if (!this.textures.exists('platform_' + width)) {
            const graphics = this.add.graphics();
            graphics.fillStyle(0x888888);
            graphics.fillRect(0, 0, width, 20);
            graphics.generateTexture('platform_' + width, width, 20);
            graphics.destroy();
        }
        // Create platform sprite in the dynamic group
        const platform = this.platforms.create(x, y, 'platform_' + width);
        // Ensure proper physics settings
        platform.setImmovable(true);
        platform.body.allowGravity = false;
        platform.body.setSize(width, 30, true); // Increased hitbox height
        platform.body.setOffset(0, -10); // Increased offset for better collision
        // Log platform position and width
        console.log('Spawned platform:', {x, y, width, hitboxHeight: 30, offset: -10});
        // 70% chance to spawn a collectible
        if (Math.random() < 0.7) {
            this.spawnCollectible(x, y - 40);
        }
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
        // Use fixed safe MIN/MAX gap
        const gap = randInt(this.MIN_PLATFORM_GAP, this.MAX_PLATFORM_GAP);
        this.lastPlatformX = Math.max(700, this.lastPlatformX + gap);
        
        // Random platform width between 100 and 150
        const platformWidth = randInt(100, 150);
        
        // Get current player position
        const currentPlayerY = this.player.y;
        
        // Calculate maximum allowed height for new platform
        const maxAllowedHeight = currentPlayerY - this.MAX_JUMP_HEIGHT;
        
        // Calculate platform height range
        const minHeight = Math.max(this.MIN_PLATFORM_Y, maxAllowedHeight);
        const maxHeight = Math.min(this.MAX_PLATFORM_Y, currentPlayerY);
        
        // Ensure platform is within reachable range
        const platformY = randInt(minHeight, maxHeight);
        
        // Check for overlapping platforms
        const newPlatformBounds = {
            left: this.lastPlatformX,
            right: this.lastPlatformX + platformWidth,
            top: platformY - 25, // Platform hitbox height
            bottom: platformY + 25
        };
        
        // Check if new platform overlaps with any existing platform
        const overlappingPlatform = this.platforms.getChildren().find(platform => {
            const existingBounds = {
                left: platform.x,
                right: platform.x + platform.width,
                top: platform.y - 25,
                bottom: platform.y + 25
            };
            
            return !(newPlatformBounds.right < existingBounds.left || 
                    newPlatformBounds.left > existingBounds.right || 
                    newPlatformBounds.bottom < existingBounds.top || 
                    newPlatformBounds.top > existingBounds.bottom);
        });
        
        if (overlappingPlatform) {
            console.log('Platform overlap detected, adjusting position');
            // If overlap detected, try spawning at a different height
            const adjustedY = platformY - 100; // Move up by 100 pixels
            if (adjustedY >= minHeight) {
                this.spawnPlatform(this.lastPlatformX, adjustedY, platformWidth);
            } else {
                // If can't move up, try moving down
                const adjustedY = platformY + 100;
                if (adjustedY <= maxHeight) {
                    this.spawnPlatform(this.lastPlatformX, adjustedY, platformWidth);
                } else {
                    // If can't adjust height, skip this platform
                    console.log('Could not find valid position for platform, skipping');
                    return;
                }
            }
        } else {
            this.spawnPlatform(this.lastPlatformX, platformY, platformWidth);
        }
        
        console.log('Platform spawn calculation:', {
            currentPlayerY,
            maxJumpHeight: this.MAX_JUMP_HEIGHT,
            maxAllowedHeight,
            minHeight,
            maxHeight,
            finalPlatformY: platformY,
            heightDifference: currentPlayerY - platformY,
            gap,
            platformBounds: newPlatformBounds
        });
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
        this.lives--;
        this.livesText.setText(`Lives: ${this.lives}`);
        window.SHARED.lives = this.lives;
        
        if (this.lives <= 0) {
            console.log('Game Over: No lives remaining');
            // Stop all game mechanics
            this.gameOver = true;
            if (this.player?.body) {
                this.player.setVelocity(0, 0);
                this.player.body.enable = false;
            }
            
            // Show game over screen
            this.scene.start('GameOver', {
                score: this.score,
                level: this.level,
                resources: this.resources
            });
        } else {
            // Reset player position and state
            this.player.setPosition(this.PLAYER_X, 100);
            this.player.setVelocity(0, 0);
            this.jumping = false;
            this.onPlatform = false;
            this.doubleJumpAvailable = false;
            this.justSnapped = false;
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