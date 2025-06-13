class WorldMap extends Phaser.Scene {
    constructor() {
        super('WorldMap');
    }
    create() {
        this.add.text(400, 80, 'World Map', { fontSize: 40, color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 150, `Level: ${window.SHARED.level}`, { fontSize: 28, color: '#fff' }).setOrigin(0.5);
        const res = window.SHARED.resources;
        this.add.text(400, 200, `Stone: ${res.stone}  Ice: ${res.ice}  Energy: ${res.energy}`, { fontSize: 24, color: '#fff' }).setOrigin(0.5);
        const startBtn = this.add.text(400, 300, 'Start Level', { fontSize: 32, color: '#ff0', backgroundColor: '#333' })
            .setOrigin(0.5).setInteractive();
        const backBtn = this.add.text(400, 370, 'Back', { fontSize: 28, color: '#fff', backgroundColor: '#333' })
            .setOrigin(0.5).setInteractive();
        startBtn.on('pointerup', () => this.scene.start('GameScene'));
        backBtn.on('pointerup', () => this.scene.start('MainMenu'));
    }
} 