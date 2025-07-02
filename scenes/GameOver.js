/**
 * Game Over Scene
 * Displays game over screen with final score and options
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS } from '../config/game-config.js';

export class GameOver extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOver' });
        this.assetLoader = null;
        this.uiManager = null;
        this.score = 0;
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('GameOver');
    }

    create(data) {
        this.uiManager = new UIManager(this);
        this.score = data.score || 0;
        
        this.setupBackground();
        this.createTitle();
        this.createResults();
        this.createNavigation();
    }

    setupBackground() {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(0, 0, width, height, 0x8b0000, 0.9)
            .setOrigin(0, 0)
            .setDepth(-1);
    }

    createTitle() {
        const { width, height } = this.scale;
        
        this.add.text(width / 2, height * 0.2, '💀 Game Over 💀', {
            fontSize: '36px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createResults() {
        const { width, height } = this.scale;
        const startY = height * 0.4;
        const spacing = 50;

        // Final score
        this.add.text(width / 2, startY, `Final Score: ${this.score}`, {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Resources summary
        this.add.text(width / 2, startY + spacing, 'Final Resources:', {
            fontSize: '20px',
            color: '#cccccc'
        }).setOrigin(0.5);

        let resourceY = startY + spacing * 2;
        
        // Display final resource counts
        this.uiManager.createResourceDisplay(
            width * 0.3, resourceY,
            'icon_catcrete', window.SHARED.resources.stone,
            { fontSize: '18px' }
        );
        
        this.uiManager.createResourceDisplay(
            width * 0.5, resourceY,
            'icon_fishice', window.SHARED.resources.ice,
            { fontSize: '18px' }
        );
        
        this.uiManager.createResourceDisplay(
            width * 0.7, resourceY,
            'icon_solarpurr', window.SHARED.resources.energy,
            { fontSize: '18px' }
        );

        // Progress summary
        this.add.text(width / 2, resourceY + spacing, 
            `Terraforming Progress: ${window.SHARED.progress.terraforming}%`, {
            fontSize: '18px',
            color: '#00ff00'
        }).setOrigin(0.5);
    }

    createNavigation() {
        const { width, height } = this.scale;
        const buttonY = height * 0.8;
        const buttonSpacing = 120;

        // Restart button
        this.uiManager.createNavButton(
            width / 2 - buttonSpacing, buttonY,
            'Restart Game', 
            () => this.restartGame(),
            { fontSize: '20px', backgroundColor: '#e74c3c' }
        );

        // Main menu button
        this.uiManager.createNavButton(
            width / 2 + buttonSpacing, buttonY,
            'Main Menu', 
            () => this.scene.start('MainMenu'),
            { fontSize: '20px', backgroundColor: '#7f8c8d' }
        );
    }

    restartGame() {
        // Reset game state
        window.SHARED.resources.stone = 100;
        window.SHARED.resources.ice = 100;
        window.SHARED.resources.energy = 100;
        window.SHARED.progress.level = 1;
        window.SHARED.progress.terraforming = 0;
        window.SHARED.progress.missions_completed = 0;
        window.SHARED.lives = 3;
        
        this.scene.start('GameScene');
    }
} 