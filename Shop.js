class Shop extends Phaser.Scene {
    constructor() { super('Shop'); }
    create() {
        this.add.text(400, 60, 'Shop (Cosmetics Only)', { fontSize: 36, color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 150, 'Red Spacesuit - 100 🪙', { fontSize: 24, color: '#ff6666' }).setOrigin(0.5);
        this.add.text(400, 200, 'Blue Spacesuit - 200 🪙', { fontSize: 24, color: '#66ccff' }).setOrigin(0.5);
        const backBtn = this.add.text(400, 500, 'Back to Menu', { fontSize: 28, color: '#fff', backgroundColor: '#333' })
            .setOrigin(0.5).setInteractive();
        backBtn.on('pointerup', () => this.scene.start('MainMenu'));
    }
}