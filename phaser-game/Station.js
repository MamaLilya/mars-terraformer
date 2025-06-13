function isoToScreen(ix, iy) {
    const tileW = 64, tileH = 32;
    return [400 + (ix - iy) * tileW / 2, 180 + (ix + iy) * tileH / 2];
}

class Station extends Phaser.Scene {
    constructor() {
        super('Station');
        this.grid = [];
    }

    create() {
        // Title and instructions
        this.add.text(400, 40, 'Station', { fontSize: 40, color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 90, 'Build farms to generate resources', { fontSize: 20, color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 110, 'Cost: 2 stone, 1 ice', { fontSize: 16, color: '#888' }).setOrigin(0.5);

        // Resources display
        const res = window.SHARED.resources;
        this.resourcesText = this.add.text(400, 420, '', { fontSize: 22, color: '#fff' }).setOrigin(0.5);
        this.updateResourcesText();

        // Grid setup
        this.grid = [];
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const [sx, sy] = isoToScreen(x, y);
                const cell = this.add.rectangle(sx, sy, 64, 32, 0x444444)
                    .setStrokeStyle(2, 0x888888)
                    .setInteractive();
                
                // Store data as a separate object
                const cellData = { x, y, built: false };
                cell.setData('info', cellData);
                
                cell.on('pointerover', () => this.onCellHover(cell, true));
                cell.on('pointerout', () => this.onCellHover(cell, false));
                cell.on('pointerup', () => this.buildFarm(cell));
                this.grid.push(cell);
            }
        }

        // Navigation buttons with better styling
        const buttonStyle = { fontSize: 28, color: '#fff', backgroundColor: '#333' };
        const startBtn = this.add.text(400, 500, '► Start Level', { ...buttonStyle, color: '#ff0' })
            .setOrigin(0.5)
            .setInteractive()
            .setPadding(12, 8);
        
        const backBtn = this.add.text(400, 550, 'Back to Menu', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .setPadding(12, 8);

        // Button interactions
        startBtn.on('pointerup', () => {
            // Reset game state for new level
            window.SHARED.lives = 3;
            // Keep resources and level, but start the game scene
            this.scene.start('GameScene');
        });
        backBtn.on('pointerup', () => this.scene.start('MainMenu'));

        // Visual feedback for buttons
        [startBtn, backBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#555' }));
            btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#333' }));
        });
    }

    onCellHover(cell, isOver) {
        const info = cell.getData('info');
        if (!info.built) {
            const res = window.SHARED.resources;
            const canBuild = res.stone >= 2 && res.ice >= 1;
            cell.setStrokeStyle(2, isOver ? (canBuild ? 0x00ff00 : 0xff0000) : 0x888888);
        }
    }

    buildFarm(cell) {
        const info = cell.getData('info');
        if (info.built) return;
        
        const res = window.SHARED.resources;
        if (res.stone >= 2 && res.ice >= 1) {
            // Visual feedback for building
            this.add.tween({
                targets: cell,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    res.stone -= 2;
                    res.ice -= 1;
                    cell.setFillStyle(0x22bb22);
                    info.built = true;
                    
                    // Add farm icon and animation
                    const [sx, sy] = isoToScreen(info.x, info.y);
                    const farmText = this.add.text(sx, sy - 10, '🌾', { fontSize: 20 }).setOrigin(0.5);
                    this.add.tween({
                        targets: farmText,
                        y: sy,
                        duration: 500,
                        ease: 'Bounce'
                    });
                    
                    this.updateResourcesText();
                }
            });
        } else {
            // Visual feedback for insufficient resources
            this.add.tween({
                targets: cell,
                alpha: 0.3,
                duration: 100,
                yoyo: true
            });
        }
    }

    updateResourcesText() {
        const res = window.SHARED.resources;
        this.resourcesText.setText(
            `Resources: Stone ${res.stone} 🪨  Ice ${res.ice} ❄️  Energy ${res.energy} ⚡`
        );
    }

    shutdown() {
        // Clean up grid
        if (this.grid) {
            this.grid.forEach(cell => {
                if (cell && cell.removeAllListeners) {
                    cell.removeAllListeners();
                }
            });
            this.grid = [];
        }
    }
} 