function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }
    create() {
        this.level = window.SHARED.level;
        this.lives = window.SHARED.lives;
        this.resources = window.SHARED.resources;
        this.baseSpeed = 200;
        this.speed = this.baseSpeed + (this.level - 1) * 40;
        this.score = 0;
        this.distanceTraveled = 0;
        this.nextLevelDistance = 2000;
        this.platforms = this.physics.add.staticGroup();
        this.collectibles = this.physics.add.group();
        this.player = this.add.rectangle(100, 400, 40, 60, 0x00aaff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(1500);
        this.player.jumpCount = 0;
        this.setupUI();
        this.spawnPlatform(100, 500, 300);
        for (let i = 0; i < 5; i++) this.spawnPlatform(400 + i * 200, randInt(350, 550), randInt(120, 200));
        this.physics.add.collider(this.player, this.platforms, this.onPlatformCollide, null, this);
        this.physics.add.overlap(this.player, this.collectibles, this.collect, null, this);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', () => this.jump());
        this.nextPlatX = 1400;
        this.gameOver = false;
        this.lastCollectibleX = 0;
        this.add.rectangle(400, 300, 800, 600, 0x111111).setScrollFactor(0);
        this.cameras.main.startFollow(this.player, true, 1, 0);
        this.cameras.main.setFollowOffset(-300, 0);
    }
    setupUI() {
        const uiGroup = this.add.container(0, 0).setScrollFactor(0);
        this.levelText = this.add.text(10, 10, `Level: ${this.level}`, { fontSize: 20, color: '#fff' }).setOrigin(0, 0);
        this.livesText = this.add.text(10, 40, `Lives: ${this.lives}`, { fontSize: 20, color: '#fff' }).setOrigin(0, 0);
        this.resText = this.add.text(10, 70, this.resString(), { fontSize: 20, color: '#fff' }).setOrigin(0, 0);
        this.scoreText = this.add.text(10, 100, `Score: ${this.score}`, { fontSize: 20, color: '#fff' }).setOrigin(0, 0);
        uiGroup.add([this.levelText, this.livesText, this.resText, this.scoreText]);
    }
    update() {
        if (this.gameOver) return;
        this.player.body.setVelocityX(this.speed);
        if (this.cursors.up.isDown) this.jump();
        this.distanceTraveled = Math.max(0, this.player.x - 100);
        if (this.distanceTraveled >= this.nextLevelDistance) {
            this.levelUp();
        }
        this.platforms.children.iterate(plat => {
            if (plat.x + plat.width < this.cameras.main.scrollX - 100) {
                plat.destroy();
                this.spawnPlatform(this.nextPlatX, randInt(350, 550), randInt(120, 200));
                this.nextPlatX += randInt(180, 260);
                this.score += 10;
                this.scoreText.setText(`Score: ${this.score}`);
            }
        });
        this.collectibles.children.iterate(col => {
            if (col.x < this.cameras.main.scrollX - 100) col.destroy();
        });
        if (this.nextPlatX - this.lastCollectibleX > 300) {
            this.spawnCollectible(this.nextPlatX - 150, randInt(250, 400));
            this.lastCollectibleX = this.nextPlatX;
        }
        if (this.player.y > 650) this.loseLife();
    }
    levelUp() {
        this.level++;
        window.SHARED.level = this.level;
        this.speed = this.baseSpeed + (this.level - 1) * 40;
        this.nextLevelDistance += 2000;
        this.levelText.setText(`Level: ${this.level}`);
        
        const levelText = this.add.text(this.player.x, 300, `Level ${this.level}!`, {
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
    onPlatformCollide() {
        this.player.jumpCount = 0;
        this.player.setFillStyle(0x00aaff);
    }
    jump() {
        if (this.player.body.touching.down || this.player.jumpCount < 1) {
            this.player.body.setVelocityY(-500);
            this.player.jumpCount++;
            if (this.player.jumpCount === 1) {
                this.player.setFillStyle(0x00ff00);
            }
        }
    }
    spawnPlatform(x, y, w) {
        const plat = this.add.rectangle(x, y, w, 24, 0x888888);
        this.physics.add.existing(plat, true);
        plat.width = w;
        this.platforms.add(plat);
        return plat;
    }
    spawnCollectible(x, y) {
        const types = ['stone', 'ice', 'energy'];
        const type = types[randInt(0, 2)];
        const color = type === 'stone' ? 0xaaaaaa : type === 'ice' ? 0x66ccff : 0xffee00;
        
        const col = this.add.rectangle(x, y, 28, 28, color);
        this.physics.add.existing(col);
        col.type = type;
        this.collectibles.add(col);
        
        this.tweens.add({
            targets: col,
            y: y - 20,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        return col;
    }
    collect(player, col) {
        this.resources[col.type] += 1;
        this.resText.setText(this.resString());
        this.score += 50;
        this.scoreText.setText(`Score: ${this.score}`);
        
        const particles = this.add.particles(col.x, col.y, {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500
        });
        particles.createEmitter({
            tint: col.fillColor
        });
        setTimeout(() => particles.destroy(), 500);
        col.destroy();
    }
    resString() {
        const r = this.resources;
        return `Stone: ${r.stone}  Ice: ${r.ice}  Energy: ${r.energy}`;
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