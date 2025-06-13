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

        // Input setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.on('pointerdown', () => this.handleJump(this.time.now));

        // Constants matching Pygame values
        this.PLAYER_X = 100;
        this.GRAVITY = 0.8 * 60; // Pygame gravity 0.8 scaled to Phaser's 60fps
        this.JUMP_FORCE = -15 * 60; // Pygame jump force -15 scaled to Phaser's 60fps
        this.BASE_PLATFORM_SPEED = 2 * 60; // 2 pixels per frame scaled to Phaser's 60fps
        this.platformSpeed = this.BASE_PLATFORM_SPEED;
        
        // Platform spawn settings
        this.MIN_PLATFORM_Y = 300;
        this.MAX_PLATFORM_Y = 500;
        this.MIN_PLATFORM_GAP = 200;
        this.MAX_PLATFORM_GAP = 400;
        this.lastPlatformX = 0;
        
        // Background
        this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0, 0);
        
        // Configure physics
        this.physics.world.setBoundsCollision(false, false, false, false);
        this.physics.world.gravity.y = this.GRAVITY;
        
        // Create static platforms group
        this.platforms = this.physics.add.staticGroup();
        this.collectibles = this.physics.add.staticGroup();
        
        // Initial platform
        const startPlatform = this.spawnPlatform(100, 450, 300); // Starting platform
        
        // Create player sprite and enable physics
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00aaff);
        graphics.fillRect(0, 0, 40, 60);
        graphics.generateTexture('player', 40, 60);
        graphics.destroy();
        
        this.player = this.physics.add.sprite(this.PLAYER_X, 400, 'player');
        this.player.body.setGravityY(this.GRAVITY);
        this.player.body.setCollideWorldBounds(false);
        
        // Jump state
        this.lastJumpTime = 0;
        this.canDoubleJump = false;
        this.doubleJumpWindow = 300; // 0.3 seconds for double jump
        this.hasDoubleJumped = false;
        
        // Spawn second platform
        this.lastPlatformX = 500;
        this.spawnPlatform(this.lastPlatformX, randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y), 200);
        
        // Set up collisions
        this.physics.add.collider(
            this.player, 
            this.platforms,
            this.onPlatformCollide,
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
        
        // UI
        this.setupUI();

        // Platform spawn timer
        this.time.addEvent({
            delay: 1000, // 1 second
            callback: this.spawnNextPlatform,
            callbackScope: this,
            loop: true
        });
    }

    update(time) {
        if (!this.player || !this.player.body) return;
        
        // Keep player at fixed X position
        this.player.x = this.PLAYER_X;
        this.player.body.setVelocityX(0);

        // Handle jump input
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
            Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.handleJump(time);
        }

        // Check for game over
        if (this.player.y > 600) {
            this.loseLife();
            return;
        }

        // Move platforms and collectibles left
        const moveAmount = (this.platformSpeed * this.game.loop.delta) / 1000;
        
        // Use getChildren() to safely iterate and filter active game objects
        const platforms = this.platforms.getChildren();
        for (let i = platforms.length - 1; i >= 0; i--) {
            const platform = platforms[i];
            platform.x -= moveAmount;
            if (platform.x < -100) {
                platform.destroy();
            }
        }

        const collectibles = this.collectibles.getChildren();
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            collectible.x -= moveAmount;
            if (collectible.x < -50) {
                collectible.destroy();
            }
        }
    }

    handleJump(time) {
        if (!this.player || !this.player.body) return;
        
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;
        
        if (onGround) {
            // First jump
            this.player.body.velocity.y = this.JUMP_FORCE;
            this.lastJumpTime = time;
            this.canDoubleJump = true;
            this.hasDoubleJumped = false;
            this.player.setTint(0x00ff00);
        } else if (this.canDoubleJump && !this.hasDoubleJumped && 
                  time - this.lastJumpTime <= this.doubleJumpWindow) {
            // Double jump within 0.3 seconds
            this.player.body.velocity.y = this.JUMP_FORCE;
            this.hasDoubleJumped = true;
            this.canDoubleJump = false;
            this.player.setTint(0xffff00);
        }
    }

    spawnNextPlatform() {
        const gap = randInt(this.MIN_PLATFORM_GAP, this.MAX_PLATFORM_GAP);
        this.lastPlatformX = Math.max(850, this.lastPlatformX + gap);
        this.spawnPlatform(
            this.lastPlatformX,
            randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y),
            randInt(100, 200)
        );
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
        
        // Create static platform sprite
        const platform = this.platforms.create(x, y, 'platform_' + width);
        
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
        
        const collectible = this.add.rectangle(x, y, 30, 30, color);
        this.physics.add.existing(collectible);
        collectible.type = type;
        this.collectibles.add(collectible);
        
        this.tweens.add({
            targets: collectible,
            y: y - 20,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    onPlatformCollide(player, platform) {
        // Only count landing if we're coming from above
        if (player.body.velocity.y > 0) {
            player.body.velocity.y = 0;
            this.canDoubleJump = false;
            this.hasDoubleJumped = false;
            player.setTint(0x00aaff);
            
            // Count landing for score if it's a new platform
            if (platform.x > this.PLAYER_X - 50) {
                this.platformsLanded++;
                this.score += 10;
                this.scoreText.setText(`Score: ${this.score}`);
                
                if (this.platformsLanded >= this.nextLevelAt) {
                    this.levelUp();
                }
            }
        }
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
        
        collectible.destroy();
    }

    setupUI() {
        const uiGroup = this.add.container(0, 0);
        this.levelText = this.add.text(10, 10, `Level: ${this.level}`, { fontSize: 20, color: '#fff' });
        this.livesText = this.add.text(10, 40, `Lives: ${this.lives}`, { fontSize: 20, color: '#fff' });
        this.resText = this.add.text(10, 70, this.resString(), { fontSize: 20, color: '#fff' });
        this.scoreText = this.add.text(10, 100, `Score: ${this.score}`, { fontSize: 20, color: '#fff' });
        uiGroup.add([this.levelText, this.livesText, this.resText, this.scoreText]);
    }

    resString() {
        const r = this.resources;
        return `Stone: ${r.stone}  Ice: ${r.ice}  Energy: ${r.energy}`;
    }

    levelUp() {
        this.level++;
        window.SHARED.level = this.level;
        this.platformSpeed = this.BASE_PLATFORM_SPEED * (1 + this.level * 0.1); // 10% faster per level
        this.platformsLanded = 0;
        this.nextLevelAt = 30; // Reset platforms needed
        this.levelText.setText(`Level: ${this.level}`);
        
        const levelText = this.add.text(400, 300, `Level ${this.level}!`, {
            fontSize: 48,
            color: '#ffff00'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: levelText,
            alpha: 0,
            y: 250,
            duration: 1500,
            onComplete: () => levelText.destroy()
        });
    }

    loseLife() {
        this.lives--;
        window.SHARED.lives = this.lives;
        this.livesText.setText(`Lives: ${this.lives}`);
        
        if (this.lives > 0) {
            this.cameras.main.shake(200, 0.01);
            this.cameras.main.flash(300, 255, 0, 0);
            this.time.delayedCall(300, () => this.scene.restart());
        } else {
            window.SHARED.lives = 3;
            window.SHARED.level = 1;
            this.scene.start('GameOver', { score: this.score });
        }
    }
} 