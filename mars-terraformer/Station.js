function isoToScreen(ix, iy) {
    const tileW = 64, tileH = 32;
    return [400 + (ix - iy) * tileW / 2, 180 + (ix + iy) * tileH / 2];
}

export default class Station extends Phaser.Scene {
    constructor() {
        super('Station');
    }
    create() {
        this.add.text(400, 60, 'Station', { fontSize: 40, color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 110, 'Tap a cell to build a farm (cost: 2 stone, 1 ice)', { fontSize: 20, color: '#fff' }).setOrigin(0.5);
        this.grid = [];
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const [sx, sy] = isoToScreen(x, y);
                const cell = this.add.rectangle(sx, sy, 64, 32, 0x444444).setStrokeStyle(2, 0x888888).setInteractive();
                cell.data = { x, y, built: false };
                cell.on('pointerup', () => this.buildFarm(cell));
                this.grid.push(cell);
            }
        }
        this.add.text(400, 420, `Stone: ${window.SHARED.resources.stone}  Ice: ${window.SHARED.resources.ice}`, { fontSize: 22, color: '#fff' }).setOrigin(0.5);
        const backBtn = this.add.text(400, 500, 'Back', { fontSize: 28, color: '#fff', backgroundColor: '#333' })
            .setOrigin(0.5).setInteractive();
        backBtn.on('pointerup', () => this.scene.start('MainMenu'));
    }
    buildFarm(cell) {
        if (cell.data.built) return;
        const res = window.SHARED.resources;
        if (res.stone >= 2 && res.ice >= 1) {
            res.stone -= 2; res.ice -= 1;
            cell.setFillStyle(0x22bb22);
            cell.data.built = true;
            this.add.text(cell.x, cell.y, 'Farm', { fontSize: 14, color: '#fff' }).setOrigin(0.5);
        }
    }
} 