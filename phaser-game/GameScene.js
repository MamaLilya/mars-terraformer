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
        this.level = window.SHARED.level;
        this.lives = window.SHARED.lives;
        this.resources = window.SHARED.resources;
        this.score = 0;
        this.platformsLanded = 0;
        this.nextLevelAt = 30; // Level up every 30 platforms
        this.gameOver = false; // Add game over flag
        this.justJumped = false;

        // Input setup - SPACE key only for jumping
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', this.handleJump, this);
        
        // Touch/click input for mobile support
        this.input.on('pointerdown', this.handleJump, this);

        // Constants matching Pygame values
        this.PLAYER_X = 100;
        this.GRAVITY = 1000;       // Standard Phaser gravity
        this.JUMP_FORCE = -400;    // Standard Phaser jump force
        this.DOUBLE_JUMP_FORCE = -350; // Slightly weaker double jump
        this.BASE_PLATFORM_SPEED = 1.5 * 60; // Reduced platform speed for simpler gameplay
        this.platformSpeed = this.BASE_PLATFORM_SPEED;
        
        // Jump state flags
        this.jumping = false;           // True when in any jump (first or double)
        this.onPlatform = false;        // True only when standing on platform
        this.doubleJumpAvailable = false; // True after first jump, false after using double jump
        
        // Platform generation constants - adjusted to match jump height
        // Calculate max jump height based on physics
        // h = (v0^2) / (2g) where v0 is initial velocity (JUMP_FORCE)
        const maxJumpHeight = (this.JUMP_FORCE * this.JUMP_FORCE) / (2 * this.GRAVITY);
        this.MIN_PLATFORM_Y = 300;  // Keep minimum height reasonable
        this.MAX_PLATFORM_Y = Math.min(450, 350 + maxJumpHeight * 0.7); // Ensure platforms are reachable
        this.lastPlatformX = 0;
     
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
        this.MIN_PLATFORM_GAP = 60;  // Reduced minimum gap
        this.MAX_PLATFORM_GAP = 120; // Reduced maximum gap
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
        if (!this.player?.body) return;

        // Check for falling below screen
        if (this.player.y > this.physics.world.bounds.height + 100) {
            console.log('GAME OVER - Player fell off screen');
            this.scene.restart();
            return;
        }

        // Keep player at fixed X position
        this.player.x = this.PLAYER_X;
        this.player.body.setVelocityX(0);

        // Skip updating if we just snapped
        if (this.justSnapped) {
            this.justSnapped = false;
            return;
        }

        // Reset platform state
        this.onPlatform = false;

        // Check each platform for landing or potential snap
        this.platforms.getChildren().forEach(platform => {
            // Get exact positions for overlap check
            const playerLeft = this.player.body.left;
            const playerRight = this.player.body.right;
            const platformLeft = platform.body.left;
            const platformRight = platform.body.right;
            
            // Strict horizontal overlap check
            const horizontalOverlap = playerRight > platformLeft && playerLeft < platformRight;
            
            if (horizontalOverlap) {
                // Check for normal landing
                if (this.player.body.touching.down && this.player.body.blocked.down) {
                    if (this.player.body.bottom === platform.body.top) {
                        this.onPlatform = true;
                    }
                }
                // Check for backup snap
                else if (!this.onPlatform && this.player.body.velocity.y >= 0) {
                    const verticalDistance = platform.body.top - this.player.body.bottom;
                    if (verticalDistance > 0 && verticalDistance <= 20) {
                        console.log(`Backup snap → player.left: ${playerLeft}, player.right: ${playerRight}, platform.left: ${platformLeft}, platform.right: ${platformRight}, verticalDistance: ${verticalDistance}`);
                        
                        // Snap to platform
                        this.player.setPosition(this.player.x, platform.body.top - this.player.body.height/2);
                        this.player.body.setVelocityY(0);
                        this.onPlatform = true;
                        this.jumping = false;
                        this.doubleJumpAvailable = false;
                        this.justSnapped = true;
                    }
                }
            }
        });

        // Log player state
        console.log('Update frame → player.y:', this.player.y, 'velocityY:', this.player.body.velocity.y, 'onPlatform:', this.onPlatform);
        if (this.onPlatform) {
            console.log(`Stable on platform → player.body.bottom: ${this.player.body.bottom}`);
        }

        // Move platforms using physics velocity only
        const platforms = this.platforms.getChildren();
        for (let i = platforms.length - 1; i >= 0; i--) {
            const platform = platforms[i];
            platform.setVelocityX(-this.platformSpeed); // Use physics velocity
            if (platform.x < -100) {
                platform.destroy();
            }
        }
        // Move collectibles visually (if needed)
        const moveAmount = (this.platformSpeed * this.game.loop.delta) / 1000;
        const collectibles = this.collectibles.getChildren();
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            collectible.x -= moveAmount;
            if (collectible.x < -50) {
                collectible.destroy();
            }
        }
        // Spawn new platform if needed
        if (this.lastPlatformX < 900) {
            this.spawnNextPlatform();
        }
    }

    onPlayerLanding(player, platform) {
        // Increased landing check margin
        if (player.body.velocity.y > 0 && player.body.bottom <= platform.body.top + 40) {
            console.log('Landing on platform');
            console.log('Player:', {
                x: player.x,
                y: player.y,
                left: player.body.left,
                right: player.body.right,
                bottom: player.body.bottom
            });
            console.log('Platform:', {
                x: platform.x,
                y: platform.y,
                top: platform.body.top,
                bottom: platform.body.bottom
            });
            // Set player position and velocity
            player.y = platform.body.top - player.displayHeight / 2 + 1;
            player.body.velocity.y = 0;
            player.body.updateFromGameObject();
            this.jumping = false;
            this.doubleJumpAvailable = false;
            this.player.setTint(0x00aaff);
            this.onPlatform = true;
            this.justSnapped = true;
            console.log('Normal landing triggered');
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
        // Set body to match sprite exactly with slightly thicker hitbox
        platform.body.setSize(width, 25, true);
        platform.body.setOffset(0, -5); // Move hitbox up slightly
        // Log platform position and width
        console.log('Spawned platform:', {x, y, width});
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
        this.lastPlatformX = Math.max(800, this.lastPlatformX + gap);
        // Random platform width between 100 and 150
        const platformWidth = randInt(100, 150);
        this.spawnPlatform(
            this.lastPlatformX,
            randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y),
            platformWidth
        );
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
        console.log('Losing life - Current lives:', this.lives);
        this.gameOver = true; // Ensure game over flag is set
        this.lives--;
        console.log('Lives after decrement:', this.lives);
        window.SHARED.lives = this.lives;
        window.SHARED.resources = this.resources;
        
        if (this.lives <= 0) {
            console.log('Game Over triggered');
            this.scene.start('GameOver', { score: this.score });
        } else {
            console.log('Restarting scene');
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