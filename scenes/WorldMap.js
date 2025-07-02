/**
 * World Map Scene
 * Navigation hub for different game areas
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS } from '../config/game-config.js';

export class WorldMap extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldMap' });
        this.assetLoader = null;
        this.uiManager = null;
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('WorldMap');
    }

    create() {
        this.uiManager = new UIManager(this);
        this.setupBackground();
        this.createTitle();
        this.createNavigationButtons();
        this.createResourceDisplay();
    }

    setupBackground() {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(0, 0, width, height, 0x2c3e50)
            .setOrigin(0, 0)
            .setDepth(-1);
    }

    createTitle() {
        const { width, height } = this.scale;
        
        this.add.text(width / 2, height * 0.15, '🗺️ Mars World Map', {
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    createNavigationButtons() {
        const { width, height } = this.scale;
        const buttonY = height * 0.5;
        const buttonSpacing = 70;

        // Station button
        this.uiManager.createNavButton(
            width * 0.3, 
            buttonY, 
            '🏗️ Station', 
            () => this.scene.start('Station'),
            { fontSize: '20px', backgroundColor: '#3498db' }
        );

        // Game Scene button
        this.uiManager.createNavButton(
            width * 0.7, 
            buttonY, 
            '🚀 Explore Mars', 
            () => this.scene.start('GameScene'),
            { fontSize: '20px', backgroundColor: '#e74c3c' }
        );

        // Shop button
        this.uiManager.createNavButton(
            width * 0.3, 
            buttonY + buttonSpacing, 
            '🛒 Shop', 
            () => this.scene.start('Shop'),
            { fontSize: '20px', backgroundColor: '#f39c12' }
        );

        // Ranking button
        this.uiManager.createNavButton(
            width * 0.7, 
            buttonY + buttonSpacing, 
            '🏆 Rankings', 
            () => this.scene.start('Ranking'),
            { fontSize: '20px', backgroundColor: '#9b59b6' }
        );

        // Back to menu button
        this.uiManager.createNavButton(
            width / 2, 
            height - 50, 
            '← Back to Menu', 
            () => this.scene.start('MainMenu'),
            { fontSize: '18px', backgroundColor: '#7f8c8d' }
        );
    }

    createResourceDisplay() {
        const { width, height } = this.scale;
        const resourceY = height * 0.8;
        
        // Resource displays
        this.uiManager.createResourceDisplay(
            width * 0.25, 
            resourceY, 
            'icon_catcrete', 
            window.SHARED.resources.stone,
            { fontSize: '18px' }
        );
        
        this.uiManager.createResourceDisplay(
            width * 0.5, 
            resourceY, 
            'icon_fishice', 
            window.SHARED.resources.ice,
            { fontSize: '18px' }
        );
        
        this.uiManager.createResourceDisplay(
            width * 0.75, 
            resourceY, 
            'icon_solarpurr', 
            window.SHARED.resources.energy,
            { fontSize: '18px' }
        );
    }
} 