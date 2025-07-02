/**
 * Main Menu Scene
 * Entry point for the game with navigation options
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS } from '../config/game-config.js';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
        this.assetLoader = null;
        this.uiManager = null;
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('MainMenu');
    }

    create() {
        this.uiManager = new UIManager(this);
        this.setupBackground();
        this.createTitle();
        this.createNavigationButtons();
        this.createVersionInfo();
    }

    setupBackground() {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(0, 0, width, height, 0x1a1a2e)
            .setOrigin(0, 0)
            .setDepth(-1);
    }

    createTitle() {
        const { width, height } = this.scale;
        
        // Main title
        this.add.text(width / 2, height * 0.2, '🐱 Cat Colony 🐱', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height * 0.3, 'Mars Terraformation', {
            fontSize: '24px',
            color: '#cccccc',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    createNavigationButtons() {
        const { width, height } = this.scale;
        const buttonY = height * 0.6;
        const buttonSpacing = 80;

        // Station button
        this.uiManager.createNavButton(
            width / 2, 
            buttonY, 
            '🏗️ Build Station', 
            () => this.scene.start('Station'),
            { fontSize: '24px', backgroundColor: '#4a90e2' }
        );

        // World Map button
        this.uiManager.createNavButton(
            width / 2, 
            buttonY + buttonSpacing, 
            '🗺️ Explore Mars', 
            () => this.scene.start('WorldMap'),
            { fontSize: '24px', backgroundColor: '#e74c3c' }
        );

        // Settings button
        this.uiManager.createNavButton(
            width / 2, 
            buttonY + buttonSpacing * 2, 
            '⚙️ Settings', 
            () => this.scene.start('Settings'),
            { fontSize: '20px', backgroundColor: '#7f8c8d' }
        );
    }

    createVersionInfo() {
        const { width, height } = this.scale;
        
        this.add.text(width / 2, height - 20, 'v1.0.0 - Cat Colony Mars Terraformation', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);
    }
} 