/**
 * Station Scene
 * Station building and management interface
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS, BUILDINGS, UTILS } from '../config/game-config.js';

export class Station extends Phaser.Scene {
    constructor() {
        super({ key: 'Station' });
        this.assetLoader = null;
        this.uiManager = null;
        this.grid = [];
        this.gridContainer = null;
        this.buildingType = null;
        this.buildMenu = null;
        this.cancelButton = null;
        this.buildPromptText = null;
        this.tileWidth = 0;
        this.tileHeight = 0;
        this.resourceTexts = {};
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('Station');
    }

    create() {
        this.uiManager = new UIManager(this);
        this.setupBackground();
        this.createLayout();
        this.createIsometricGrid();
        this.createNavigation();
    }

    setupBackground() {
        const { width, height } = this.scale;
        const bg = this.add.image(0, 0, 'station_background_wide')
            .setOrigin(0, 0)
            .setScrollFactor(0);
        const scaleX = width / bg.width;
        bg.setScale(scaleX);
    }

    createLayout() {
        const { width, height } = this.scale;
        
        // Layout definitions (from bottom up)
        const footerSlice = height * CONSTANTS.STATION.FOOTER_HEIGHT_RATIO;
        const gridSlice = height * CONSTANTS.STATION.GRID_HEIGHT_RATIO;
        const scenerySlice = height * CONSTANTS.STATION.SCENERY_HEIGHT_RATIO;
        const headerSlice = height * CONSTANTS.STATION.HEADER_HEIGHT_RATIO;
        
        this.contentArea = {
            x: 0,
            y: height - footerSlice - gridSlice,
            width: width,
            height: gridSlice
        };

        // Calculate tile dimensions
        let tileWidth = this.contentArea.width / Math.max(CONSTANTS.STATION.GRID_COLS, CONSTANTS.STATION.GRID_ROWS);
        let tileHeight = tileWidth / 2;

        const clippedGridPixelHeight = 6 * tileHeight;

        if (clippedGridPixelHeight > this.contentArea.height) {
            const scaleFactor = this.contentArea.height / clippedGridPixelHeight;
            tileWidth *= scaleFactor;
            tileHeight *= scaleFactor;
        }

        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        
        // Create header bar
        const headerY = height - footerSlice - gridSlice - scenerySlice - (headerSlice / 2);
        this.createHeaderResources(headerY);
    }

    createHeaderResources(headerY) {
        const { width } = this.scale;
        
        this.resourceTexts.stone = this.uiManager.createResourceDisplay(
            width * 0.25, 
            headerY, 
            'resource_iron_orb', 
            window.SHARED.resources.stone
        );
        
        this.resourceTexts.ice = this.uiManager.createResourceDisplay(
            width * 0.5, 
            headerY, 
            'resource_ice_orb', 
            window.SHARED.resources.ice
        );
        
        this.resourceTexts.energy = this.uiManager.createResourceDisplay(
            width * 0.75, 
            headerY, 
            'resource_solar_orb', 
            window.SHARED.resources.energy
        );
    }

    createIsometricGrid() {
        this.grid = [];
        this.gridContainer = this.add.container(0, 0);

        const gridVisualWidth = (CONSTANTS.STATION.GRID_COLS + CONSTANTS.STATION.GRID_ROWS) * (this.tileWidth / 2);
        const originX = this.contentArea.x + (this.contentArea.width - gridVisualWidth) / 2 + (CONSTANTS.STATION.GRID_ROWS * this.tileWidth / 2);
        
        const gridVisualHeight = (CONSTANTS.STATION.GRID_COLS + CONSTANTS.STATION.GRID_ROWS) * (this.tileHeight / 2);
        const originY = this.contentArea.y + (this.contentArea.height - gridVisualHeight) / 2;

        for (let iy = 0; iy < CONSTANTS.STATION.GRID_ROWS; iy++) {
            for (let ix = 0; ix < CONSTANTS.STATION.GRID_COLS; ix++) {
                if ((ix + iy > CONSTANTS.STATION.GRID_COLS + CONSTANTS.STATION.GRID_ROWS - 5) || (ix + iy < 9)) continue;
                
                const sx = originX + (ix - iy) * (this.tileWidth / 2);
                const sy = originY + (ix + iy) * (this.tileHeight / 2);

                const tile = this.add.graphics({ x: sx, y: sy });
                tile.setBlendMode(Phaser.BlendModes.ADD);

                this.drawIsoTile(tile, 0x000000, 0, 0xFFB563, 0.3, 1, this.tileWidth, this.tileHeight);
                
                tile.setInteractive(new Phaser.Geom.Polygon([
                     0, -this.tileHeight / 2,
                    this.tileWidth / 2, 0,
                    0, this.tileHeight / 2,
                    -this.tileWidth / 2, 0
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
            graphics.strokeStyle(strokeColor, strokeAlpha);
            graphics.lineWidth = strokeWidth;
            graphics.strokePath();
        }
    }

    onCellHover(tile, isOver) {
        const cellData = tile.getData('info');
        if (!cellData.built) {
            if (isOver) {
                this.drawIsoTile(tile, 0x00ff00, 0.3, 0x00ff00, 0.8, 2, this.tileWidth, this.tileHeight);
            } else {
                this.drawIsoTile(tile, 0x000000, 0, 0xFFB563, 0.3, 1, this.tileWidth, this.tileHeight);
            }
        }
    }

    placeBuilding(tile) {
        if (this.buildingType) {
            const cellData = tile.getData('info');
            if (!cellData.built) {
                const building = BUILDINGS[this.buildingType];
                if (UTILS.canAfford(building.cost)) {
                    UTILS.spendResources(building.cost);
                    this.placeBuildingOnTile(tile, this.buildingType);
                    this.exitBuildMode();
                    this.updateResourceDisplay();
                } else {
                    this.showInsufficientResources();
                }
            }
        } else {
            this.toggleBuildMenu();
        }
    }

    placeBuildingOnTile(tile, buildingKey) {
        const cellData = tile.getData('info');
        const building = BUILDINGS[buildingKey];
        
        const buildingImage = this.add.image(tile.x, tile.y + 20, building.asset)
            .setScale(0.8)
            .setOrigin(0.5, 1);
        
        cellData.built = true;
        cellData.building = buildingKey;
        cellData.buildingSprite = buildingImage;
        
        this.drawIsoTile(tile, 0x00ff00, 0.1, 0x00ff00, 0.5, 2, this.tileWidth, this.tileHeight);
    }

    toggleBuildMenu() {
        if (this.buildMenu) {
            this.closeBuildMenu();
        } else {
            this.openBuildMenu();
        }
    }

    openBuildMenu() {
        const { width, height } = this.scale;
        
        this.buildMenu = this.uiManager.createModal(
            '🏗️ Build Menu',
            'Select a building to construct:',
            [
                { text: 'Close', onClick: () => this.closeBuildMenu() }
            ],
            { width: width * 0.8, height: height * 0.7 }
        );

        this.createBuildingOptions();
    }

    createBuildingOptions() {
        const { width, height } = this.scale;
        const menuX = width / 2;
        const menuY = height / 2;
        const startY = menuY - 100;
        const spacing = 60;

        Object.entries(BUILDINGS).forEach(([key, building], index) => {
            const y = startY + (index * spacing);
            
            // Check if building is unlocked
            const isUnlocked = this.isBuildingUnlocked(building);
            
            const button = this.uiManager.createNavButton(
                menuX - 200, y, 
                `${building.name} - ${this.formatCost(building.cost)}`, 
                () => this.enterBuildMode(key),
                { 
                    fontSize: '16px',
                    backgroundColor: isUnlocked ? '#2ecc71' : '#95a5a6',
                    color: isUnlocked ? '#ffffff' : '#666666'
                }
            );

            if (!isUnlocked) {
                button.setInteractive(false);
            }

            // Description
            this.add.text(menuX + 50, y, building.description, {
                fontSize: '14px',
                color: '#cccccc'
            }).setOrigin(0, 0.5);
        });
    }

    isBuildingUnlocked(building) {
        return Object.entries(building.unlock).every(([key, value]) => {
            return window.SHARED.progress[key] >= value;
        });
    }

    formatCost(cost) {
        return Object.entries(cost)
            .map(([resource, amount]) => `${amount} ${resource}`)
            .join(', ');
    }

    enterBuildMode(buildingKey) {
        this.buildingType = buildingKey;
        this.closeBuildMenu();
        
        this.buildPromptText = this.add.text(
            this.scale.width / 2, 50, 
            `Click on a tile to place ${BUILDINGS[buildingKey].name}`, 
            {
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5);
    }

    exitBuildMode() {
        this.buildingType = null;
        if (this.buildPromptText) {
            this.buildPromptText.destroy();
            this.buildPromptText = null;
        }
    }

    closeBuildMenu() {
        if (this.buildMenu) {
            this.buildMenu.destroy();
            this.buildMenu = null;
        }
    }

    showInsufficientResources() {
        this.uiManager.createModal(
            '❌ Insufficient Resources',
            'You don\'t have enough resources to build this structure.',
            [{ text: 'OK', onClick: () => {} }]
        );
    }

    updateResourceDisplay() {
        this.resourceTexts.stone.updateValue(window.SHARED.resources.stone);
        this.resourceTexts.ice.updateValue(window.SHARED.resources.ice);
        this.resourceTexts.energy.updateValue(window.SHARED.resources.energy);
    }

    createNavigation() {
        const { width, height } = this.scale;
        const navY = height - (height * CONSTANTS.STATION.FOOTER_HEIGHT_RATIO / 2);
        
        this.uiManager.createNavButton(
            width * 0.2, navY, 
            '< Back', 
            () => this.scene.start('WorldMap')
        );
        
        this.uiManager.createNavButton(
            width * 0.4, navY, 
            'Build 🏗️', 
            () => this.toggleBuildMenu()
        );
        
        this.uiManager.createNavButton(
            width * 0.6, navY, 
            'Explore Mars', 
            () => this.scene.start('GameScene')
        );
        
        this.cancelButton = this.uiManager.createNavButton(
            width * 0.8, navY, 
            'Cancel Build', 
            () => this.exitBuildMode()
        ).setVisible(false);
    }
} 