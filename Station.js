class Station extends Phaser.Scene {
    constructor() {
        super('Station');
        this.grid = [];
        this.gridContainer = null;
        this.buildingType = null;
        this.buildMenu = null;
        this.cancelButton = null;
        this.buildPromptText = null;
        this.tileWidth = 0;
        this.tileHeight = 0;

        this.buildable = {
            'solar_panel': {
                name: 'Solar Panel',
                description: 'Generates passive energy.',
                cost: { stone: 10, ice: 5, energy: 0 },
                upkeep: -2, // Negative upkeep = generation
                unlock: {},
                asset: 'solar_panel_unit'
            },
            'habitat': {
                name: 'Station Hub',
                description: 'The center of your new colony.',
                cost: { stone: 100, ice: 50, energy: 20 },
                upkeep: 2,
                unlock: { missions_completed: 1 },
                asset: 'station'
            },
            'living_quarters': {
                name: 'Living Quarters',
                description: 'Increases station build capacity.',
                cost: { stone: 20, energy: 5 },
                upkeep: 2,
                unlock: { missions_completed: 1 },
                asset: 'habitat' // Placeholder
            },
            'greenhouse': {
                name: 'Greenhouse',
                description: 'Grows food and improves atmosphere.',
                cost: { stone: 10, ice: 5 },
                upkeep: 2,
                unlock: { terraforming: 20 },
                asset: 'habitat' // Placeholder
            },
            'water_module': {
                name: 'Water Module',
                description: 'Extracts and recycles water.',
                cost: { stone: 5, ice: 10 },
                upkeep: 3,
                unlock: { missions_completed: 2 },
                asset: 'habitat' // Placeholder
            },
            'lab': {
                name: 'Research Lab',
                description: 'Unlocks new technologies.',
                cost: { stone: 15, ice: 5, energy: 10 },
                upkeep: 5,
                unlock: { terraforming: 40 },
                asset: 'habitat' // Placeholder
            },
            'rover_bay': {
                name: 'Rover Bay',
                description: 'Required to deploy the Mars Rover.',
                cost: { stone: 50, ice: 20, energy: 15 },
                upkeep: 1,
                unlock: {},
                asset: 'rover_unit'
            }
        };

        this.resourceTexts = {};
    }

    preload() {
        this.load.image('station_background_wide', 'assets/station_background_wide.png');
        this.load.image('station', 'assets/station_building.png');
        this.load.image('rover_unit', 'assets/rover_unit.png');
        this.load.image('solar_panel_unit', 'assets/solar_panel_unit.png');
        this.load.image('resource_iron_orb', 'assets/resource_iron_orb.png');
        this.load.image('resource_ice_orb', 'assets/resource_ice_orb.png');
        this.load.image('resource_solar_orb', 'assets/resource_solar_orb.png');
        this.load.image('icon_catcrete', 'assets/icon_catcrete.png');
        this.load.image('icon_fishice', 'assets/icon_fishice.png');
        this.load.image('icon_solarpurr', 'assets/icon_solarpurr.png');
        this.load.image('ui/build_menu_frame', 'assets/ui/build_menu_frame.png');
        this.load.image('cat_white', 'assets/cat_white.png');
        this.load.image('cat_tuxedo', 'assets/cat_tuxedo.png');
        this.load.spritesheet('tuxedo_cat_sprite', 'assets/tuxedo_cat_sprite.png', {
            frameWidth: 60,
            frameHeight: 60
        });
    }

    create() {
        const { width, height } = this.scale;

        const bg = this.add.image(0, 0, 'station_background_wide').setOrigin(0, 0).setScrollFactor(0);
        const scaleX = width / bg.width;
        bg.setScale(scaleX);

        // --- Layout Definitions (from bottom up) ---
        const footerSlice = height * 0.1;
        const gridSlice = height * 0.4;
        const scenerySlice = height * 0.3;
        const headerSlice = height * 0.1;
        
        const contentArea = {
            x: 0,
            y: height - footerSlice - gridSlice,
            width: width,
            height: gridSlice
        };

        const GRID_COLS = 10;
        const GRID_ROWS = 14;

        let tileWidth = contentArea.width / Math.max(GRID_COLS, GRID_ROWS);
        let tileHeight = tileWidth / 2;

        const clippedGridPixelHeight = 6 * tileHeight;

        if (clippedGridPixelHeight > contentArea.height) {
            const scaleFactor = contentArea.height / clippedGridPixelHeight;
            tileWidth *= scaleFactor;
            tileHeight *= scaleFactor;
        }

        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        
        // --- Header Bar ---
        const headerY = height - footerSlice - gridSlice - scenerySlice - (headerSlice / 2);
        this.resourceTexts.stone = this.createResourceDisplay(width * 0.25, headerY, 'resource_iron_orb', window.SHARED.resources.stone);
        this.resourceTexts.ice = this.createResourceDisplay(width * 0.5, headerY, 'resource_ice_orb', window.SHARED.resources.ice);
        this.resourceTexts.energy = this.createResourceDisplay(width * 0.75, headerY, 'resource_solar_orb', window.SHARED.resources.energy);
        
        // --- Isometric Grid ---
        this.createIsometricGrid(contentArea, GRID_ROWS, GRID_COLS, this.tileWidth, this.tileHeight);

        // --- Navigation ---
        const navY = height - (footerSlice / 2);
        this.createNavButton(width * 0.2, navY, '< Back', () => this.scene.start('WorldMap'));
        this.createNavButton(width * 0.4, navY, 'Build 🏗️', () => this.toggleBuildMenu());
        this.createNavButton(width * 0.6, navY, 'Explore Mars', () => this.showCatSelectWindow());
        this.cancelButton = this.createNavButton(width * 0.8, navY, 'Cancel Build', () => {
            this.exitBuildMode();
        }).setVisible(false);
    }

    createIsometricGrid(area, gridRows, gridCols, tileWidth, tileHeight) {
        this.grid = [];
        this.gridContainer = this.add.container(0, 0);

        const gridVisualWidth = (gridCols + gridRows) * (tileWidth / 2);
        const originX = area.x + (area.width - gridVisualWidth) / 2 + (gridRows * tileWidth / 2);
        
        const gridVisualHeight = (gridCols + gridRows) * (tileHeight / 2);
        const originY = area.y + (area.height - gridVisualHeight) / 2;

        for (let iy = 0; iy < gridRows; iy++) {
            for (let ix = 0; ix < gridCols; ix++) {
                if ((ix + iy > gridCols + gridRows - 5) || (ix + iy < 9)) continue;
                
                const sx = originX + (ix - iy) * (tileWidth / 2);
                const sy = originY + (ix + iy) * (tileHeight / 2);

                const tile = this.add.graphics({ x: sx, y: sy });
                tile.setBlendMode(Phaser.BlendModes.ADD);

                this.drawIsoTile(tile, 0x000000, 0, 0xFFB563, 0.3, 1, tileWidth, tileHeight);
                
                tile.setInteractive(new Phaser.Geom.Polygon([
                     0, -tileHeight / 2,
                    tileWidth / 2, 0,
                    0, tileHeight / 2,
                    -tileWidth / 2, 0
                ]), Phaser.Geom.Polygon.Contains);

                const cellData = { x: ix, y: iy, built: false, graphics: tile };
                tile.setData('info', cellData);
                tile.on('pointerover', () => this.onCellHover(tile, true));
                tile.on('pointerout', () => this.onCellHover(tile, false));
                tile.on('pointerup', () => this.placeBuilding(tile));
                
                this.grid.push(tile);
                this.gridContainer.add(tile);
            }
        }
    }
    
    drawIsoTile(graphics, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth = 1, tileWidth, tileHeight) {
        graphics.clear();
        graphics.beginPath();
        graphics.moveTo(0, -tileHeight / 2);
        graphics.lineTo(tileWidth / 2, 0);
        graphics.lineTo(0, tileHeight / 2);
        graphics.lineTo(-tileWidth / 2, 0);
        graphics.closePath();
    
        if (fillAlpha > 0) {
            graphics.fillStyle(fillColor, fillAlpha);
            graphics.fillPath();
        }
        if (strokeAlpha > 0) {
            graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
            graphics.strokePath();
        }
    }

    onCellHover(tile, isOver) {
        const info = tile.getData('info');
        if (!info.built && this.buildingType) {
            if (isOver) {
                this.drawIsoTile(info.graphics, 0x00FF00, 0.25, 0xFFFFFF, 0.5, 1, this.tileWidth, this.tileHeight);
            } else {
                this.drawIsoTile(info.graphics, 0x000000, 0, 0xFFB563, 0.3, 1, this.tileWidth, this.tileHeight);
            }
        }
    }

    placeBuilding(tile) {
        const info = tile.getData('info');
        if (info.built || !this.buildingType) return;

        info.built = true;
        info.graphics.clear();
        tile.disableInteractive();
        
        const buildingAsset = this.buildable[this.buildingType].asset || 'habitat';
        const yOffset = this.tileHeight / 2;
        const buildingImage = this.add.image(tile.x, tile.y + yOffset, buildingAsset).setScale(0).setOrigin(0.5, 1);
        
        this.tweens.add({
            targets: buildingImage,
            scale: (this.tileWidth / 100) * 0.8 / 1.5,
            duration: 500,
            ease: 'Back.Out'
        });

        window.SHARED.station.buildings.push(this.buildingType);
        this.exitBuildMode();
    }

    toggleBuildMenu() {
        if (this.buildMenu && this.buildMenu.active) {
            return;
        } else {
            this.openBuildMenu();
        }
    }

    openBuildMenu() {
        if (this.buildMenu && this.buildMenu.active) {
            return;
        }
    
        const { width, height } = this.scale;
    
        const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive();
    
        const menuWidth = Math.min(width * 0.8, 700);
        const menuHeight = Math.min(height * 0.8, 550);
        const menuX = width / 2;
        const menuY = height / 2;
    
        const frame = this.add.image(menuX, menuY, 'ui/build_menu_frame').setOrigin(0.5);
        frame.setScale(Math.min(menuWidth / frame.width, menuHeight / frame.height));
    
        const titleY = menuY - menuHeight / 2 + 45;
        const title = this.add.text(menuX, titleY, 'Construction', {
            fontSize: '32px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);
    
        const closeButton = this.add.text(menuX + menuWidth / 2 - 50, titleY, 'X', {
            fontSize: '32px', color: '#ff6b6b', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
        const listTopY = menuY - menuHeight / 2 + 85;
        const listHeight = menuHeight - 125;
        
        const maskShape = this.make.graphics().fillRect(menuX - menuWidth / 2 + 5, listTopY, menuWidth - 10, listHeight);
        const itemsContainer = this.add.container(0, 0).setMask(maskShape.createGeometryMask());
    
        let currentY = listTopY + 10;
        const itemHeight = 110;
        
        Object.entries(this.buildable).forEach(([key, building]) => {
            const itemX = menuX;
            const itemWidth = menuWidth - 60;
            const itemGroup = this.add.container(itemX, currentY);
    
            itemGroup.add(this.add.graphics().fillStyle(0x000000, 0.4).fillRoundedRect(-itemWidth/2, 0, itemWidth, 100, 8));
            itemGroup.add(this.add.text(-itemWidth/2 + 20, 15, building.name, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }));
            itemGroup.add(this.add.text(-itemWidth/2 + 20, 42, building.description, { fontSize: '14px', color: '#cccccc' }));
            
            const costText = `Build Cost: 🪨 ${building.cost.stone || 0}  ❄️ ${building.cost.ice || 0}  ⚡ ${building.cost.energy || 0}`;
            const upkeepText = `Upkeep: ${building.upkeep}⚡/day`;
            itemGroup.add(this.add.text(-itemWidth/2 + 20, 65, costText, { fontSize: '16px', color: '#FFD700'}));
            itemGroup.add(this.add.text(-itemWidth/2 + 20, 85, upkeepText, { fontSize: '14px', color: '#ffb366' }));
            
            const progress = window.SHARED.progress;
            const conditions = building.unlock;
            const isUnlocked = Object.keys(conditions).every(condKey => progress[condKey] >= conditions[condKey]);
            const canAfford = isUnlocked && Object.keys(building.cost).every(res => window.SHARED.resources[res] >= (building.cost[res] || 0));
    
            let statusText, buttonColor, buttonEnabled, reasonText = '';
            if (!isUnlocked) {
                statusText = 'Locked';
                buttonColor = '#555555';
                buttonEnabled = false;
                if (conditions.terraforming) reasonText = `Requires ${conditions.terraforming}% Terraforming`;
                else if (conditions.missions_completed) reasonText = `Requires ${conditions.missions_completed} Missions`;
            } else if (!canAfford) {
                statusText = 'Insufficient';
                buttonColor = '#8c1f1f';
                buttonEnabled = false;
                reasonText = 'Not enough resources';
            } else {
                statusText = 'Build';
                buttonColor = '#1f8c3a';
                buttonEnabled = true;
            }
            
            const buildButton = this.add.text(itemWidth/2 - 85, 50, statusText, { fontSize: '18px', color: '#ffffff', backgroundColor: buttonColor, padding: {x: 15, y: 10}, align: 'center' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            if (reasonText) {
                itemGroup.add(this.add.text(itemWidth/2 - 85, 80, reasonText, { fontSize: '10px', color: '#cccccc' }).setOrigin(0.5));
            }
    
            if (buttonEnabled) {
                this.addTweensForButton(buildButton, () => {
                    Object.keys(building.cost).forEach(res => {
                        window.SHARED.resources[res] -= (building.cost[res] || 0);
                    });
                    this.updateResourceDisplay();
                    this.enterBuildMode(key);
                });
            }
    
            itemGroup.add(buildButton);
            itemsContainer.add(itemGroup);
            currentY += itemHeight;
        });
    
        const scrollBounds = { top: listTopY, bottom: listTopY + listHeight };
        const contentHeight = Object.keys(this.buildable).length * itemHeight;
        if (contentHeight > listHeight) {
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                const newY = itemsContainer.y - deltaY * 0.8;
                const minY = listHeight - contentHeight - 10;
                itemsContainer.y = Phaser.Math.Clamp(newY, minY, 0);
            });
        }
    
        const closeMenu = () => {
            this.input.off('wheel');
            if (this.buildMenu) {
                this.buildMenu.destroy();
                this.buildMenu = null;
            }
        };
        
        this.addTweensForButton(closeButton, closeMenu);
        this.buildMenu = this.add.container(0, 0, [ blocker, frame, title, closeButton, itemsContainer ]).setDepth(30);
    }

    enterBuildMode(buildingKey) {
        this.buildingType = buildingKey;
        this.closeBuildMenu();
        this.cancelButton.setVisible(true);
    
        if (!this.buildPromptText) {
            const { width, height } = this.scale;
            const gridAreaTop = height * 0.5 - 100;
            this.buildPromptText = this.add.text(width / 2, gridAreaTop, 'Select a location on the grid to build', {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5).setDepth(40);
        }
        this.buildPromptText.setVisible(true);
    }

    exitBuildMode() {
        this.buildingType = null;
        this.cancelButton.setVisible(false);
        if (this.buildPromptText) {
            this.buildPromptText.setVisible(false);
        }
    }

    closeBuildMenu() {
        if (this.buildMenu) {
            this.input.off('wheel');
            this.buildMenu.destroy();
            this.buildMenu = null;
        }
    }
    
    updateResourceDisplay() {
        this.resourceTexts.stone.setText(window.SHARED.resources.stone);
        this.resourceTexts.ice.setText(window.SHARED.resources.ice);
        this.resourceTexts.energy.setText(window.SHARED.resources.energy);
    }

    createResourceDisplay(x, y, iconKey, value) {
        const container = this.add.container(x, y);
        const icon = this.add.image(0, 0, iconKey).setScale(0.15).setOrigin(0.5);
        const text = this.add.text(icon.x + icon.displayWidth / 2 + 10, 0, value, {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        container.add([icon, text]);
        return text;
    }

    createNavButton(x, y, text, onClick) {
        const button = this.add.text(x, y, text, {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#3a2a18',
            padding: { x: 15, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.addTweensForButton(button, onClick);
        return button;
    }

    addTweensForButton(button, onClick) {
        const originalColor = button.style.backgroundColor;
        let hoverColor;

        if (originalColor) {
            hoverColor = Phaser.Display.Color.ValueToColor(originalColor).lighten(20).rgba;
        }

        button.on('pointerover', () => {
            if (hoverColor) {
                button.setBackgroundColor(hoverColor);
            }
            this.tweens.add({ targets: button, scale: 1.05, ease: 'Power1', duration: 100 });
        });

        button.on('pointerout', () => {
            if (originalColor) {
                button.setBackgroundColor(originalColor);
            }
            this.tweens.add({ targets: button, scale: 1, ease: 'Power1', duration: 100 });
        });

        button.on('pointerdown', () => {
            this.tweens.add({ targets: button, scale: 0.95, ease: 'Power1', duration: 50 });
        });
        
        button.on('pointerup', () => {
            this.tweens.add({ targets: button, scale: 1.05, ease: 'Power1', duration: 50, onComplete: () => {
                if (onClick) {
                    onClick();
                }
            }});
        });
    }

    showCatSelectWindow() {
        const { width, height } = this.scale;
        // Overlay
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7).setDepth(100).setScrollFactor(0);
        // Window
        const windowWidth = Math.min(600, width * 0.9);
        const windowHeight = Math.min(350, height * 0.6);
        const windowBg = this.add.rectangle(width/2, height/2, windowWidth, windowHeight, 0x222222, 0.98)
            .setStrokeStyle(4, 0xffffff)
            .setDepth(101).setScrollFactor(0);
        // Title
        const title = this.add.text(width/2, height/2 - windowHeight/2 + 40, 'Select a Cat', {
            fontSize: '32px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);
        // Card positions
        const cardY = height/2 + 20;
        const cardSpacing = 180;
        const cardX1 = width/2 - cardSpacing;
        const cardX2 = width/2 + cardSpacing;
        // White Cat Card
        const whiteCard = this.add.container(cardX1, cardY).setDepth(102);
        const whiteImg = this.add.image(0, -30, 'cat_white').setScale(2).setOrigin(0.5);
        const whiteLabel = this.add.text(0, 40, 'White Cat', { fontSize: '20px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        const whiteBtn = this.add.text(0, 80, 'Select', { fontSize: '18px', color: '#222', backgroundColor: '#fff', padding: { x: 24, y: 8 }, fontStyle: 'bold', stroke: '#000', strokeThickness: 2 })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        whiteBtn.on('pointerdown', () => this.selectCat('cat_white', [overlay, windowBg, title, whiteCard, tuxedoCard]));
        whiteCard.add([whiteImg, whiteLabel, whiteBtn]);
        // Tuxedo Cat Card
        const tuxedoCard = this.add.container(cardX2, cardY).setDepth(102);
        // Use the tuxedo_cat_sprite as a spritesheet preview (first frame)
        const tuxedoPreview = this.add.sprite(0, -30, 'tuxedo_cat_sprite', 0).setScale(2).setOrigin(0.5);
        const tuxedoLabel = this.add.text(0, 40, 'Tuxedo Cat', { fontSize: '20px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        const tuxedoBtn = this.add.text(0, 80, 'Select', { fontSize: '18px', color: '#222', backgroundColor: '#fff', padding: { x: 24, y: 8 }, fontStyle: 'bold', stroke: '#000', strokeThickness: 2 })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        tuxedoBtn.on('pointerdown', () => this.selectCat('cat_tuxedo', [overlay, windowBg, title, whiteCard, tuxedoCard]));
        tuxedoCard.add([tuxedoPreview, tuxedoLabel, tuxedoBtn]);
    }

    selectCat(catKey, uiElements) {
        // Remove the UI
        uiElements.forEach(el => el.destroy());
        // Start the game and pass the selected cat
        this.scene.start('GameScene', { selectedCat: catKey });
    }
} 