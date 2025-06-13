class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }
    init(data) {
        this.score = data.score || 0;
    }
    create() {
        this.add.text(400, 120, 'Game Over', { fontSize: 48, color: '#ff4444' }).setOrigin(0.5);
        this.add.text(400, 200, `Score: ${this.score}`, { fontSize: 32, color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 250, `Resources: Stone ${window.SHARED.resources.stone}  Ice ${window.SHARED.resources.ice}  Energy ${window.SHARED.resources.energy}`, { fontSize: 22, color: '#fff' }).setOrigin(0.5);
        const tryAgainBtn = this.add.text(400, 340, 'Try Again', { fontSize: 28, color: '#ff0', backgroundColor: '#333' }).setOrigin(0.5).setInteractive();
        const stationBtn = this.add.text(400, 400, 'Back to Station', { fontSize: 24, color: '#0f0', backgroundColor: '#333' }).setOrigin(0.5).setInteractive();
        const menuBtn = this.add.text(400, 450, 'Back to Main Menu', { fontSize: 24, color: '#fff', backgroundColor: '#333' }).setOrigin(0.5).setInteractive();
        tryAgainBtn.on('pointerup', () => this.scene.start('GameScene'));
        stationBtn.on('pointerup', () => this.scene.start('Station'));
        menuBtn.on('pointerup', () => this.scene.start('MainMenu'));
    }
} 