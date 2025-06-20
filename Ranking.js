class Ranking extends Phaser.Scene {
    constructor() { super('Ranking'); }
    create() {
        this.add.text(400, 60, 'Top Players', { fontSize: 36, color: '#fff' }).setOrigin(0.5);
        const rankings = [
            '1. AstronautA - 3200 pts',
            '2. ExplorerB - 2400 pts',
            '3. BotC - 1800 pts',
            '4. RoverD - 900 pts',
            '5. MartianE - 500 pts'
        ];
        rankings.forEach((text, i) => {
            this.add.text(400, 140 + i * 40, text, { fontSize: 24, color: '#ccc' }).setOrigin(0.5);
        });
        const backBtn = this.add.text(400, 500, 'Back to Menu', { fontSize: 28, color: '#fff', backgroundColor: '#333' })
            .setOrigin(0.5).setInteractive();
        backBtn.on('pointerup', () => this.scene.start('MainMenu'));
    }
}