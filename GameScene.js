function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Game state
        this.level = window.SHARED.level;
        this.lives = window.SHARED.lives;
        this.resources = window.SHARED.resources;
        this.score = 0;
        this.platformsLanded = 0;
        this.nextLevelAt = 10;

        // Constants
        this.PLAYER_X = 100;
        this.GRAVITY = 0.8 * 1000; // Convert Pygame gravity to Phaser scale
        this.JUMP_FORCE = -15 * 60; // Convert Pygame jump force to Phaser scale
        this.PLATFORM_SPEED = 5;
        this.MIN_PLATFORM_Y = 300;
        this.MAX_PLATFORM_Y = 500;
        this.PLATFORM_SPAWN_INTERVAL = 1000; // 1 second
        this.lastPlatformTime = 0;

        // Background
        this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0, 0);
        
        // Create groups
        this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });
        this.collectibles = this.physics.add.group({ allowGravity: false });
        
        // Player setup
        this.player = this.add.rectangle(this.PLAYER_X, 300, 40, 60, 0x00aaff);
        this.physics.add.existing(this.player);
        this.player.body.setGravityY(this.GRAVITY);
        this.player.body.setCollideWorldBounds(false); // Allow falling off screen
        
        // Jump state
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;
        this.isJumping = false;
        
        // Initial platforms
        this.spawnPlatform(100, 450, 300); // Starting platform
        this.spawnPlatform(500, randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y), 200);
        
        // Collisions
        this.physics.add.collider(this.player, this.platforms, this.onPlatformCollide, null, this);
        this.physics.add.overlap(this.player, this.collectibles, this.collectItem, null, this);
        
        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', () => this.handleJump());
        
        // UI
        this.setupUI();

        // Prevent horizontal movement
        this.player.body.setAllowGravity(true);
        this.player.body.setVelocityX(0);
        this.player.body.setImmovable(true);
    }

    update(time) {
        // Keep player at fixed X position
        this.player.x = this.PLAYER_X;
        this.player.body.setVelocityX(0);

        // Handle jump input
        if (this.cursors.up.isDown) {
            this.handleJump();
        }

        // Check for game over
        if (this.player.y > 600) {
            this.loseLife();
            return;
        }

        // Update jump state
        if (this.player.body.touching.down) {
            this.isJumping = false;
            this.hasDoubleJumped = false;
            this.canDoubleJump = false;
            this.player.setFillStyle(0x00aaff);
        }

        // Spawn platforms at regular intervals
        if (time - this.lastPlatformTime >= this.PLATFORM_SPAWN_INTERVAL) {
            this.spawnPlatform(
                850, // Spawn just off screen
                randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y),
                randInt(100, 200)
            );
            this.lastPlatformTime = time;
        }

        // Move platforms and collectibles left
        const moveAmount = this.PLATFORM_SPEED * (1 + (this.level - 1) * 0.1);
        
        this.platforms.children.iterate(platform => {
            platform.x -= moveAmount;
            if (platform.x < -100) {
                this.platformsLanded++;
                this.score += 10;
                this.scoreText.setText(`Score: ${this.score}`);
                
                if (this.platformsLanded >= this.nextLevelAt) {
                    this.levelUp();
                }
                platform.destroy();
            }
        });

        this.collectibles.children.iterate(collectible => {
            collectible.x -= moveAmount;
            if (collectible.x < -50) {
                collectible.destroy();
            }
        });
    }

    handleJump() {
        if (this.player.body.touching.down) {
            // First jump from platform
            this.player.body.setVelocityY(this.JUMP_FORCE);
            this.isJumping = true;
            this.canDoubleJump = true;
            this.player.setFillStyle(0x00ff00);
        } else if (this.canDoubleJump && !this.hasDoubleJumped) {
            // Double jump in air
            this.player.body.setVelocityY(this.JUMP_FORCE);
            this.hasDoubleJumped = true;
            this.canDoubleJump = false;
            this.player.setFillStyle(0xffff00);
        }
    }

    spawnPlatform(x, y, width) {
        const platform = this.add.rectangle(x, y, width, 20, 0x888888);
        this.physics.add.existing(platform, true);
        platform.body.setAllowGravity(false);
        platform.body.setImmovable(true);
        this.platforms.add(platform);

        // 30% chance to spawn a collectible
        if (Math.random() < 0.3) {
            this.spawnCollectible(x, y - 40);
        }
    }

    spawnCollectible(x, y) {
        const types = ['stone', 'ice', 'energy'];
        const type = types[randInt(0, 2)];
        const color = type === 'stone' ? 0xaaaaaa : type === 'ice' ? 0x66ccff : 0xffee00;
        
        const collectible = this.add.rectangle(x, y, 30, 30, color);
        this.physics.add.existing(collectible);
        collectible.body.setAllowGravity(false);
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

    onPlatformCollide() {
        if (!this.player.body.touching.down) return;
        
        this.isJumping = false;
        this.hasDoubleJumped = false;
        this.canDoubleJump = false;
        this.player.setFillStyle(0x00aaff);
    }

    collectItem(player, collectible) {
        this.resources[collectible.type]++;
        this.score += 50;
        this.scoreText.setText(`Score: ${this.score}`);
        this.resText.setText(this.resString());
        
        const particles = this.add.particles(collectible.x, collectible.y, {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500
        });
        particles.createEmitter({
            tint: collectible.fillColor
        });
        setTimeout(() => particles.destroy(), 500);
        
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
        this.platformsLanded = 0;
        this.nextLevelAt += 5;
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