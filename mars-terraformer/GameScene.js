function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }
    create() {
        this.level = window.SHARED.level;
        this.lives = window.SHARED.lives;
        this.resources = window.SHARED.resources;
        this.speed = 200 + (this.level - 1) * 40;
        this.score = 0;
        this.platforms = this.physics.add.staticGroup();
        this.collectibles = this.physics.add.group();
        this.player = this.physics.add.sprite(100, 400, null).setDisplaySize(40, 60).setTint(0x00aaff);
        this.player.body.setCollideWorldBounds(true);
        this.player.jumpCount = 0;
        this.add.text(10, 10, `Level: ${this.level}`, { fontSize: 20, color: '#fff' }).setOrigin(0, 0);
        this.livesText = this.add.text(10, 40, `Lives: ${this.lives}`, { fontSize: 20, color: '#fff' }).setOrigin(0, 0);
        this.resText = this.add.text(10, 70, this.resString(), { fontSize: 20, color: '#fff' }).setOrigin(0, 0);
        this.spawnPlatform(100, 500, 300);
        for (let i = 0; i < 5; i++) this.spawnPlatform(400 + i * 200, randInt(350, 550), randInt(120, 200));
        this.physics.add.collider(this.player, this.platforms, () => { this.player.jumpCount = 0; });
        this.physics.add.overlap(this.player, this.collectibles, this.collect, null, this);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', () => this.jump());
        this.nextPlatX = 1400;
        this.gameOver = false;
    }
    update() {
        if (this.gameOver) return;
        this.player.setVelocityX(this.speed);
        if (this.cursors.up.isDown) this.jump();
        this.cameras.main.scrollX = this.player.x - 100;
        this.platforms.children.iterate(plat => {
            if (plat.x + plat.width < this.cameras.main.scrollX) {
                plat.destroy();
                this.spawnPlatform(this.nextPlatX, randInt(350, 550), randInt(120, 200));
                this.nextPlatX += randInt(180, 260);
            }
        });
        this.collectibles.children.iterate(col => {
            if (col.x < this.cameras.main.scrollX - 50) col.destroy();
        });
        if (this.player.y > 650) this.loseLife();
        if (Math.random() < 0.02) this.spawnCollectible(this.nextPlatX - 100, randInt(250, 400));
    }
    jump() {
        if (this.player.body.touching.down || this.player.jumpCount < 1) {
            this.player.setVelocityY(-420);
            this.player.jumpCount++;
        }
    }
    spawnPlatform(x, y, w) {
        const plat = this.platforms.create(x, y, null).setDisplaySize(w, 24).setOrigin(0.5).setTint(0x888888);
        plat.refreshBody();
        plat.width = w;
    }
    spawnCollectible(x, y) {
        const types = ['stone', 'ice', 'energy'];
        const type = types[randInt(0, 2)];
        const color = type === 'stone' ? 0xaaaaaa : type === 'ice' ? 0x66ccff : 0xffee00;
        const col = this.collectibles.create(x, y, null).setDisplaySize(28, 28).setTint(color);
        col.type = type;
    }
    collect(player, col) {
        this.resources[col.type] += 1;
        this.resText.setText(this.resString());
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
            this.scene.restart();
        } else {
            window.SHARED.lives = 3;
            window.SHARED.level = 1;
            this.scene.start('GameOver', { score: this.score });
        }
    }
} 