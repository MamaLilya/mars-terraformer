function isoToScreen(ix, iy) {
    const tileW = 64, tileH = 32;
    return [400 + (ix - iy) * tileW / 2, 180 + (ix + iy) * tileH / 2];
}

class Station extends Phaser.Scene {
    constructor() {
        super('Station');
        this.grid = [];
        // TILE_WIDTH will be calculated dynamically in create()
    }

    preload() {
        this.load.image('solar', 'assets/solar_panel.png');
        this.load.image('habitat', 'assets/habitat.png');
        this.load.image('ore_icon', 'assets/ore_icon.png');
        this.load.image('ice_icon', 'assets/ice_icon.png');
        this.load.image('energy_icon', 'assets/energy_icon.png');
        this.load.image('progress_bar', 'assets/progress_bar.png');
        this.load.image('station_background_largegrid', 'assets/station_background_largegrid.png');
    }

    create() {
        const { width, height } = this.scale;

        // --- Layout Definitions ---
        const headerHeight = 80;
        this.contentArea = {
            x: 0,
            y: headerHeight,
            width: width,
            height: height - headerHeight // No footer
        };

        // --- Dynamic Sizing ---
        const maxTileWidth = this.contentArea.width / 10; // 9 tiles wide + padding
        const maxTileHeight = this.contentArea.height / 7; // 6 tiles high + padding
        this.TILE_WIDTH = Math.min(maxTileWidth, maxTileHeight * 2) * 0.75; // Make 25% smaller
        this.TILE_HEIGHT = this.TILE_WIDTH / 2;

        this.createBackground(width, height);
        this.createHeader(width, headerHeight);
        this.createIsometricGrid(this.contentArea);
    }

    createBackground(width, height) {
        this.add.image(width / 2, height / 2, 'station_background_largegrid')
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(-1);
    }

    createHeader(width, headerHeight) {
        // Initialize resourceTexts array if it doesn't exist
        if (!this.resourceTexts) this.resourceTexts = [];
        
        const header = this.add.graphics().setDepth(5);
        header.fillStyle(0x000000, 0.4);
        header.fillRect(0, 0, width, headerHeight);

        // --- Buttons in Header ---
        const buttonStyle = { 
            fontSize: '22px', color: '#fff',
            backgroundColor: '#111a', padding: { x: 12, y: 8 },
        };
        
        const menuBtn = this.add.text(width * 0.1, headerHeight / 2, 'Menu', buttonStyle)
            .setOrigin(0.5).setInteractive().setDepth(10);
        this.addHoverEffect(menuBtn, () => this.scene.start('MainMenu'));

        const exploreBtn = this.add.text(width * 0.9, headerHeight / 2, 'Explore Mars 🚀', buttonStyle)
            .setOrigin(0.5).setInteractive().setDepth(10);
        this.addHoverEffect(exploreBtn, () => this.scene.start('GameScene'));

        // --- Resources and Progress in Header ---
        const res = window.SHARED.resources;
        const resStyle = { fontSize: '18px', color: '#fff' };
        
        // Group resources in the center
        this.add.image(width * 0.45, headerHeight/2, 'ore_icon').setScale(0.4).setDepth(10);
        this.resourceTexts.push(this.add.text(width * 0.45 + 20, headerHeight/2, res.stone, resStyle).setOrigin(0, 0.5).setDepth(10));

        this.add.image(width * 0.5, headerHeight/2, 'ice_icon').setScale(0.4).setDepth(10);
        this.resourceTexts.push(this.add.text(width * 0.5 + 20, headerHeight/2, res.ice, resStyle).setOrigin(0, 0.5).setDepth(10));

        this.add.image(width * 0.55, headerHeight/2, 'energy_icon').setScale(0.4).setDepth(10);
        this.resourceTexts.push(this.add.text(width * 0.55 + 20, headerHeight/2, res.energy, resStyle).setOrigin(0, 0.5).setDepth(10));
        
        // Add Progress Bar to header
        this.add.image(width / 2, headerHeight - 15, 'progress_bar').setScale(0.5).setDepth(10);
        const barWidth = 270 * 0.5;
        const fillWidth = barWidth * (window.SHARED.terraforming / 100);
        const progressFill = this.add.graphics({ depth: 11 });
        progressFill.fillStyle(0x00ff00, 1);
        progressFill.fillRect((width / 2) - (barWidth / 2), headerHeight - 20, fillWidth, 10);
    }

    updateHeader() {
        const res = window.SHARED.resources;
        if(this.resourceTexts && this.resourceTexts.length === 3) {
            this.resourceTexts[0].setText(res.stone);
            this.resourceTexts[1].setText(res.ice);
            this.resourceTexts[2].setText(res.energy);
        }
    }

    isoToScreen(ix, iy, area, rows, cols) {
        const gridScreenX = (ix - iy) * (this.TILE_WIDTH / 2);
        const gridScreenY = (ix + iy) * (this.TILE_HEIGHT / 2);

        // Find the screen coordinates of the grid's center tile
        const centerTileX = (cols - 1) / 2;
        const centerTileY = (rows - 1) / 2;
        const centerScreenX = (centerTileX - centerTileY) * (this.TILE_WIDTH / 2);
        const centerScreenY = (centerTileX + centerTileY) * (this.TILE_HEIGHT / 2);

        // Find the center of the designated content area
        const areaCenterX = area.x + area.width / 2;
        const areaCenterY = area.y + area.height / 2;

        // Position the current tile relative to the centered grid
        return [
            areaCenterX + gridScreenX - centerScreenX,
            areaCenterY + gridScreenY - centerScreenY
        ];
    }
    
    createIsometricGrid(area) {
        this.grid = [];
        const rows = 6;
        const cols = 9;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const [sx, sy] = this.isoToScreen(x, y, area, rows, cols);
                
                const tile = this.add.graphics({ x: sx, y: sy });
                // Tiles are invisible by default
                
                tile.setInteractive(new Phaser.Geom.Polygon([
                    0, -this.TILE_HEIGHT / 2,
                    this.TILE_WIDTH / 2, 0,
                    0, this.TILE_HEIGHT / 2,
                    -this.TILE_WIDTH / 2, 0,
                ]), Phaser.Geom.Polygon.Contains);

                const cellData = { x, y, built: false, graphics: tile };
                tile.setData('info', cellData);
                tile.on('pointerover', () => this.onCellHover(tile, true));
                tile.on('pointerout', () => this.onCellHover(tile, false));
                tile.on('pointerup', () => this.buildFarm(tile));
                this.grid.push(tile);
            }
        }
    }
    
    drawIsoTile(graphics, color, alpha = 1.0) {
        graphics.clear();
        if (alpha === 0) {
            return; // Exit if fully transparent
        }

        // For hover feedback, we only need a flat, semi-transparent overlay
        graphics.fillStyle(color, alpha);
        graphics.beginPath();
        graphics.moveTo(0, -this.TILE_HEIGHT / 2);
        graphics.lineTo(this.TILE_WIDTH / 2, 0);
        graphics.lineTo(0, this.TILE_HEIGHT / 2);
        graphics.lineTo(-this.TILE_WIDTH / 2, 0);
        graphics.closePath();
        graphics.fillPath();
    }

    onCellHover(tile, isOver) {
        const info = tile.getData('info');
        if (!info.built) {
            if (isOver) {
                const canBuild = window.SHARED.resources.stone >= 2 && window.SHARED.resources.ice >= 1;
                const color = canBuild ? 0x00ff00 : 0xff0000;
                this.drawIsoTile(info.graphics, color, 0.4); // Semi-transparent green/red
            } else {
                this.drawIsoTile(info.graphics, 0, 0); // Make it transparent again
            }
        }
    }

    buildFarm(tile) {
        const info = tile.getData('info');
        if (info.built) return;
        const res = window.SHARED.resources;
        if (res.stone >= 2 && res.ice >= 1) {
            res.stone -= 2;
            res.ice -= 1;
            info.built = true;
            this.drawIsoTile(info.graphics, 0, 0); // Make permanently transparent
            tile.disableInteractive();
            
            const [sx, sy] = this.isoToScreen(info.x, info.y, this.contentArea, 6, 9);
            const biodome = this.add.image(sx, sy, 'habitat').setScale(0);
            
            this.tweens.add({
                targets: biodome,
                scale: this.TILE_WIDTH / 150,
                duration: 500,
                ease: 'Back.Out'
            });
            this.updateHeader();
        } else {
            this.tweens.add({
                targets: tile,
                alpha: 0.5,
                duration: 150,
                yoyo: true
            });
        }
    }

    shutdown() {
        if (this.grid) {
            this.grid.forEach(cell => {
                if (cell) {
                    cell.destroy();
                }
            });
            this.grid = [];
        }
    }

    addHoverEffect(button, onClick) {
        button.on('pointerover', () => {
            this.tweens.add({ targets: button, scale: 1.05, duration: 100 });
        });
        button.on('pointerout', () => {
            this.tweens.add({ targets: button, scale: 1.0, duration: 100 });
        });
        button.on('pointerdown', onClick);
    }
}