class WorldMap extends Phaser.Scene {
    constructor() {
        super('WorldMap');
    }
    create() {
        this.add.text(400, 80, 'World Map', { fontSize: 40, color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 150, `Level: ${window.SHARED.level}`, { fontSize: 28, color: '#fff' }).setOrigin(0.5);
        
        // Resources overview
        const res = window.SHARED.resources;
        this.add.text(400, 200, 'Resources Collected:', { fontSize: 24, color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 240, `Stone: ${res.stone}`, { fontSize: 24, color: '#aaaaaa' }).setOrigin(0.5);
        this.add.text(400, 280, `Ice: ${res.ice}`, { fontSize: 24, color: '#66ccff' }).setOrigin(0.5);
        this.add.text(400, 320, `Energy: ${res.energy}`, { fontSize: 24, color: '#ffee00' }).setOrigin(0.5);

        // Navigation
        const backBtn = this.add.text(400, 500, 'Back to Menu', { fontSize: 28, color: '#fff', backgroundColor: '#333' })
            .setOrigin(0.5)
            .setInteractive()
            .setPadding(10);
        
        backBtn.on('pointerup', () => this.scene.start('MainMenu'));
    }
} 