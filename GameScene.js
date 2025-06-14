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
        // Set default values if not defined
        this.level = this.level || 1;
        this.lives = this.lives || 3;
        this.resources = this.resources || 0;
        this.score = 0;

        // Create lava effect at the bottom of the screen
        this.lava = this.add.rectangle(0, this.game.config.height - 50, this.game.config.width, 50, 0xff0000, 0.5);
        this.lava.setOrigin(0, 0);

        // Create player
        this.player = this.physics.add.sprite(100, 300, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(800); // Reduced gravity
        this.player.setVelocityX(0);
        this.player.setVelocityY(0); // Ensure no initial velocity

        // Player state
        this.playerState = {
            onPlatform: false,
            jumping: false,
            doubleJumpAvailable: false,
            lastPlatformY: 300
        };

        // Create platforms group
        this.platforms = this.physics.add.staticGroup();

        // Create starting platform
        const startPlatform = this.platforms.create(100, 300, 'platform');
        startPlatform.setScale(2, 1).refreshBody();
        startPlatform.setData('isStartingPlatform', true);

        // Create second platform
        const secondPlatform = this.platforms.create(500, 250, 'platform');
        secondPlatform.setScale(2, 1).refreshBody();

        // Add collision between player and platforms
        this.physics.add.collider(this.player, this.platforms, (player, platform) => {
            // Only trigger landing when falling
            if (player.body.velocity.y > 0) {
                // Calculate the bottom of the player and top of the platform
                const playerBottom = player.y + player.height / 2;
                const platformTop = platform.y - platform.height / 2;
                
                // Check if player is actually landing on top of the platform
                if (Math.abs(playerBottom - platformTop) < 10) {
                    player.setVelocityY(0);
                    player.y = platformTop - player.height / 2;
                    this.playerState.onPlatform = true;
                    this.playerState.jumping = false;
                    this.playerState.doubleJumpAvailable = true;
                    this.playerState.lastPlatformY = platform.y;
                }
            }
        });

        // Create UI
        this.createUI();

        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Set up camera
        this.cameras.main.setBounds(0, 0, 2000, this.game.config.height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(100, 50);

        // Set up world bounds
        this.physics.world.setBounds(0, 0, 2000, this.game.config.height);

        // Start spawning platforms
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnPlatform,
            callbackScope: this,
            loop: true
        });
    }

    createUI() {
        // Create score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#fff'
        });
        this.scoreText.setScrollFactor(0);

        // Create level text
        this.levelText = this.add.text(16, 56, `Level: ${this.level}`, {
            fontSize: '32px',
            fill: '#fff'
        });
        this.levelText.setScrollFactor(0);

        // Create lives text
        this.livesText = this.add.text(16, 96, `Lives: ${this.lives}`, {
            fontSize: '32px',
            fill: '#fff'
        });
        this.livesText.setScrollFactor(0);
    }

    spawnPlatform() {
        const lastPlatform = this.getRightmostPlatform();
        if (!lastPlatform) return;

        const minX = lastPlatform.x + 200;
        const maxX = lastPlatform.x + 400;
        const x = Phaser.Math.Between(minX, maxX);

        const minY = 100;
        const maxY = 250;
        const y = Phaser.Math.Between(minY, maxY);

        const platform = this.platforms.create(x, y, 'platform');
        platform.setScale(2, 1).refreshBody();
    }

    getRightmostPlatform() {
        let rightmost = null;
        let maxX = -Infinity;

        this.platforms.getChildren().forEach(platform => {
            if (platform.x > maxX) {
                maxX = platform.x;
                rightmost = platform;
            }
        });

        return rightmost;
    }

    gameOver() {
        this.lives--;
        this.livesText.setText(`Lives: ${this.lives}`);

        if (this.lives <= 0) {
            // Game over
            this.scene.start('GameOverScene', { score: this.score });
        } else {
            // Reset player position
            this.player.setPosition(100, 300);
            this.player.setVelocity(0, 0);
            this.playerState.onPlatform = true;
            this.playerState.jumping = false;
            this.playerState.doubleJumpAvailable = true;
        }
    }

    update() {
        // Debug logging
        console.log('Update frame →', {
            playerY: this.player.y,
            velocityY: this.player.body.velocity.y,
            onPlatform: this.playerState.onPlatform,
            jumping: this.playerState.jumping,
            doubleJumpAvailable: this.playerState.doubleJumpAvailable
        });

        // Handle jumping
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            console.log('Jump attempted - State:', this.playerState);
            
            if (this.playerState.onPlatform) {
                // Regular jump from platform
                this.player.setVelocityY(-500); // Increased jump force
                this.playerState.jumping = true;
                this.playerState.onPlatform = false;
            } else if (this.playerState.doubleJumpAvailable && this.playerState.jumping) {
                // Double jump
                this.player.setVelocityY(-450); // Increased double jump force
                this.playerState.doubleJumpAvailable = false;
            }
        }

        // Move platforms
        this.platforms.getChildren().forEach(platform => {
            if (!platform.getData('isStartingPlatform')) {
                platform.x -= 2;
                if (platform.x < -platform.width) {
                    platform.destroy();
                }
            }
        });

        // Update score based on height
        const newScore = Math.floor(this.player.y / 10);
        if (newScore > this.score) {
            this.score = newScore;
            this.scoreText.setText(`Score: ${this.score}`);
        }

        // Check for game over
        if (this.player.y > this.game.config.height - 100) {
            console.log('Game Over: Player too close to lava');
            this.gameOver();
        }
    }

    onPlayerLanding(player, platform) {
        // Only handle landing when falling
        if (player.body.velocity.y >= 0) {
            const verticalDistance = platform.body.top - player.body.bottom;
            if (verticalDistance >= -10 && verticalDistance <= 10) {
                console.log('Physics landing detected', {
                    playerY: player.y,
                    platformTop: platform.body.top,
                    verticalDistance
                });
                
                // Snap player to platform
                player.y = platform.body.top - player.displayHeight / 2;
                player.body.velocity.y = 0;
                player.body.updateFromGameObject();
                
                // Update states
                this.jumping = false;
                this.doubleJumpAvailable = true;
                this.onPlatform = true;
                this.player.setTint(0x00aaff);
            }
        }
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
            const adjustedY = platformY - 50; // Reduced adjustment distance
            if (adjustedY >= minHeight) {
                this.spawnPlatform(this.lastPlatformX, adjustedY, platformWidth);
            } else {
                // If can't move up, try moving down
                const adjustedY = platformY + 50; // Reduced adjustment distance
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

    resString() {
        return `Resources: Stone ${this.resources.stone}  Ice ${this.resources.ice}  Energy ${this.resources.energy}`;
    }
}