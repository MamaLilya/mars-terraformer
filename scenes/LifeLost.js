/**
 * Life Lost Scene
 * Displays when player loses a life but game continues
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS } from '../config/game-config.js';

export class LifeLost extends Phaser.Scene {
    constructor() {
        super({ key: 'LifeLost' });
        this.assetLoader = null;
        this.uiManager = null;
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('LifeLost');
    }

    create() {
        this.uiManager = new UIManager(this);
        this.setupBackground();
        this.createTitle();
        this.createLivesDisplay();
        this.createNavigation();
    }

    setupBackground() {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(0, 0, width, height, 0xff6600, 0.8)
            .setOrigin(0, 0)
            .setDepth(-1);
    }

    createTitle() {
        const { width, height } = this.scale;
        
        this.add.text(width / 2, height * 0.3, '💔 Life Lost! 💔', {
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    createLivesDisplay() {
        const { width, height } = this.scale;
        const centerY = height * 0.5;
        
        // Lives remaining
        this.add.text(width / 2, centerY, `Lives Remaining: ${window.SHARED.lives}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Heart icons
        const heartSpacing = 40;
        const startX = width / 2 - (heartSpacing * (window.SHARED.lives - 1)) / 2;
        
        for (let i = 0; i < window.SHARED.lives; i++) {
            this.add.text(startX + i * heartSpacing, centerY + 50, '❤️', {
                fontSize: '32px'
            }).setOrigin(0.5);
        }

        // Encouragement message
        this.add.text(width / 2, centerY + 100, 'Don\'t give up, space cat!', {
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    createNavigation() {
        const { width, height } = this.scale;
        const buttonY = height * 0.8;
        const buttonSpacing = 120;

        // Continue button
        this.uiManager.createNavButton(
            width / 2 - buttonSpacing, buttonY,
            'Continue', 
            () => this.scene.start('GameScene'),
            { fontSize: '20px', backgroundColor: '#2ecc71' }
        );

        // Main menu button
        this.uiManager.createNavButton(
            width / 2 + buttonSpacing, buttonY,
            'Main Menu', 
            () => this.scene.start('MainMenu'),
            { fontSize: '20px', backgroundColor: '#7f8c8d' }
        );
    }
} 