class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }
    create() {
        this.add.text(400, 120, 'Terraformation', { fontSize: 48, color: '#fff' }).setOrigin(0.5);
        const worldMapBtn = this.add.text(400, 250, 'World Map', { fontSize: 32, color: '#0ff', backgroundColor: '#333' })
            .setOrigin(0.5).setInteractive();
        const stationBtn = this.add.text(400, 320, 'Station', { fontSize: 32, color: '#0f0', backgroundColor: '#333' })
            .setOrigin(0.5).setInteractive();
        worldMapBtn.on('pointerup', () => this.scene.start('WorldMap'));
        stationBtn.on('pointerup', () => this.scene.start('Station'));
    }
} 