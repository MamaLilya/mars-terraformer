class Settings extends Phaser.Scene {
    constructor() { super('Settings'); }
    create() {
        this.add.text(400, 60, 'Settings', { fontSize: 36, color: '#fff' }).setOrigin(0.5);
        const resetBtn = this.add.text(400, 200, 'Reset Progress', { fontSize: 28, color: '#ff0', backgroundColor: '#444' })
            .setOrigin(0.5).setInteractive();
        resetBtn.on('pointerup', () => {
            window.SHARED.resources = { stone: 0, ice: 0, energy: 0 };
            window.SHARED.level = 1;
            window.SHARED.lives = 3;
            window.SHARED.terraforming = 0;
            alert('Progress reset!');
        });
        const backBtn = this.add.text(400, 500, 'Back to Menu', { fontSize: 28, color: '#fff', backgroundColor: '#333' })
            .setOrigin(0.5).setInteractive();
        backBtn.on('pointerup', () => this.scene.start('MainMenu'));
    }
}