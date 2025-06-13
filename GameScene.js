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
        this.nextLevelAt = 10; // Level up every 10 platforms

        // Game settings
        this.baseSpeed = 300;
        this.speed = this.baseSpeed + (this.level - 1) * 50;
        
        // Background
        this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0, 0);
        
        // Groups
        this.platforms = this.physics.add.group();
        this.collectibles = this.physics.add.group();
        
        // Player setup - FIXED at x=100
        this.player = this.add.rectangle(100, 300, 40, 60, 0x00aaff);
        this.physics.add.existing(this.player);
        this.player.body.setGravityY(1200);
        this.player.body.setCollideWorldBounds(true);
        this.player.jumpCount = 0;
        
        // Initial platform
        this.spawnPlatform(100, 500, 300);
        
        // Spawn initial platforms
        let lastX = 400;
        for (let i = 0; i < 4; i++) {
            lastX += randInt(200, 300); // Space platforms for comfortable jumping
            this.spawnPlatform(lastX, randInt(250, 450), randInt(100, 200));
        }
        
        // Collisions
        this.physics.add.collider(this.player, this.platforms, this.onPlatformCollide, null, this);
        this.physics.add.overlap(this.player, this.collectibles, this.collectItem, null, this);
        
        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', () => this.jump());
        
        // UI
        this.setupUI();
    }

    update() {
        if (this.player.y > 600) {
            this.loseLife();
            return;
        }

        // Keep player fixed at x=100
        this.player.x = 100;
        this.player.body.setVelocityX(0);

        // Handle jump input
        if (this.cursors.up.isDown) {
            this.jump();
        }

        // Move platforms and collectibles left
        this.platforms.children.iterate(platform => {
            platform.x -= this.speed * (this.game.loop.delta / 1000);
            if (platform.x < -100) {
                // When platform moves off screen, spawn a new one on the right
                const rightmostX = this.getRightmostPlatformX();
                platform.destroy();
                this.spawnPlatform(
                    rightmostX + randInt(200, 300),
                    randInt(250, 450),
                    randInt(100, 200)
                );
                this.platformsLanded++;
                this.score += 10;
                this.scoreText.setText(`Score: ${this.score}`);
                
                // Check for level up
                if (this.platformsLanded >= this.nextLevelAt) {
                    this.levelUp();
                }
            }
        });

        // Move collectibles with their platforms
        this.collectibles.children.iterate(collectible => {
            collectible.x -= this.speed * (this.game.loop.delta / 1000);
            if (collectible.x < -50) {
                collectible.destroy();
            }
        });
    }

    getRightmostPlatformX() {
        let rightmost = 0;
        this.platforms.children.iterate(platform => {
            if (platform.x > rightmost) {
                rightmost = platform.x;
            }
        });
        return rightmost;
    }

    spawnPlatform(x, y, width) {
        const platform = this.add.rectangle(x, y, width, 20, 0x888888);
        this.physics.add.existing(platform, true);
        this.platforms.add(platform);

        // 30% chance to spawn a collectible on the platform
        if (Math.random() < 0.3) {
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
        
        // Floating animation
        this.tweens.add({
            targets: collectible,
            y: y - 20,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    jump() {
        if (this.player.body.touching.down || this.player.jumpCount < 1) {
            this.player.body.setVelocityY(-600);
            this.player.jumpCount++;
            
            // Visual feedback
            if (this.player.jumpCount === 1) {
                this.player.setFillStyle(0x00ff00);
            }
        }
    }

    onPlatformCollide() {
        this.player.jumpCount = 0;
        this.player.setFillStyle(0x00aaff);
    }

    collectItem(player, collectible) {
        this.resources[collectible.type]++;
        this.score += 50;
        this.scoreText.setText(`Score: ${this.score}`);
        this.resText.setText(this.resString());
        
        // Particle effect
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
        this.speed = this.baseSpeed + (this.level - 1) * 50;
        this.platformsLanded = 0;
        this.nextLevelAt += 5; // Need more platforms for next level
        this.levelText.setText(`Level: ${this.level}`);
        
        // Level up animation
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