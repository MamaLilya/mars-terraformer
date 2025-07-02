/**
 * Level Complete Scene
 * Displays level completion results and earned resources
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS } from '../config/game-config.js';

export class LevelComplete extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelComplete' });
        this.assetLoader = null;
        this.uiManager = null;
        this.score = 0;
        this.resourcesEarned = {};
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('LevelComplete');
    }

    create(data) {
        this.uiManager = new UIManager(this);
        this.score = data.score || 0;
        this.resourcesEarned = data.resourcesEarned || {};
        
        this.setupBackground();
        this.createTitle();
        this.createResults();
        this.createNavigation();
    }

    setupBackground() {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(0, 0, width, height, 0x2c3e50, 0.9)
            .setOrigin(0, 0)
            .setDepth(-1);
    }

    createTitle() {
        const { width, height } = this.scale;
        
        this.add.text(width / 2, height * 0.2, '🎉 Level Complete! 🎉', {
            fontSize: '36px',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createResults() {
        const { width, height } = this.scale;
        const startY = height * 0.4;
        const spacing = 50;

        // Score
        this.add.text(width / 2, startY, `Final Score: ${this.score}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Resources earned
        this.add.text(width / 2, startY + spacing, 'Resources Earned:', {
            fontSize: '20px',
            color: '#cccccc'
        }).setOrigin(0.5);

        let resourceY = startY + spacing * 2;
        
        if (this.resourcesEarned.stone) {
            this.uiManager.createResourceDisplay(
                width * 0.3, resourceY,
                'icon_catcrete', this.resourcesEarned.stone,
                { fontSize: '18px' }
            );
        }
        
        if (this.resourcesEarned.ice) {
            this.uiManager.createResourceDisplay(
                width * 0.5, resourceY,
                'icon_fishice', this.resourcesEarned.ice,
                { fontSize: '18px' }
            );
        }
        
        if (this.resourcesEarned.terraforming) {
            this.add.text(width * 0.7, resourceY, `+${this.resourcesEarned.terraforming}% Terraforming`, {
                fontSize: '18px',
                color: '#00ff00'
            }).setOrigin(0.5);
        }

        // Level progress
        this.add.text(width / 2, resourceY + spacing, 
            `Level ${window.SHARED.progress.level} Complete!`, {
            fontSize: '20px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    createNavigation() {
        const { width, height } = this.scale;
        const buttonY = height * 0.8;
        const buttonSpacing = 100;

        // Continue button
        this.uiManager.createNavButton(
            width / 2 - buttonSpacing, buttonY,
            'Continue', 
            () => this.scene.start('WorldMap'),
            { fontSize: '20px', backgroundColor: '#2ecc71' }
        );

        // Play again button
        this.uiManager.createNavButton(
            width / 2 + buttonSpacing, buttonY,
            'Play Again', 
            () => this.scene.start('GameScene'),
            { fontSize: '20px', backgroundColor: '#3498db' }
        );
    }
} 