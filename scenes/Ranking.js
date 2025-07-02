/**
 * Ranking Scene
 * Displays leaderboard and player achievements
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS } from '../config/game-config.js';

export class Ranking extends Phaser.Scene {
    constructor() {
        super({ key: 'Ranking' });
        this.assetLoader = null;
        this.uiManager = null;
        this.leaderboard = [
            { name: 'Space Cat #1', score: 1500, level: 5 },
            { name: 'Mars Explorer', score: 1200, level: 4 },
            { name: 'Terraformer Pro', score: 900, level: 3 },
            { name: 'Cat Astronaut', score: 600, level: 2 },
            { name: 'Newcomer', score: 300, level: 1 }
        ];
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('Ranking');
    }

    create() {
        this.uiManager = new UIManager(this);
        this.setupBackground();
        this.createTitle();
        this.createLeaderboard();
        this.createPlayerStats();
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
        
        this.add.text(width / 2, height * 0.1, '🏆 Cat Colony Rankings 🏆', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    createLeaderboard() {
        const { width, height } = this.scale;
        const startY = height * 0.25;
        const spacing = 50;

        // Header
        this.add.text(width * 0.2, startY, 'Rank', {
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.add.text(width * 0.4, startY, 'Player', {
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.add.text(width * 0.6, startY, 'Score', {
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.add.text(width * 0.8, startY, 'Level', {
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // Leaderboard entries
        this.leaderboard.forEach((entry, index) => {
            const y = startY + spacing + (index * 40);
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
            
            // Rank
            this.add.text(width * 0.2, y, `#${index + 1}`, {
                fontSize: '16px',
                color: rankColor,
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            // Player name
            this.add.text(width * 0.4, y, entry.name, {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0, 0.5);

            // Score
            this.add.text(width * 0.6, y, entry.score.toString(), {
                fontSize: '16px',
                color: '#00ff00'
            }).setOrigin(0, 0.5);

            // Level
            this.add.text(width * 0.8, y, entry.level.toString(), {
                fontSize: '16px',
                color: '#00ffff'
            }).setOrigin(0, 0.5);
        });
    }

    createPlayerStats() {
        const { width, height } = this.scale;
        const statsY = height * 0.7;
        
        // Player stats section
        this.add.text(width / 2, statsY, 'Your Stats', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const statsSpacing = 30;
        let currentY = statsY + 40;

        // Current level
        this.add.text(width * 0.3, currentY, `Level: ${window.SHARED.progress.level}`, {
            fontSize: '18px',
            color: '#00ffff'
        }).setOrigin(0, 0.5);

        // Terraforming progress
        this.add.text(width * 0.7, currentY, `Terraforming: ${window.SHARED.progress.terraforming}%`, {
            fontSize: '18px',
            color: '#00ff00'
        }).setOrigin(0, 0.5);

        currentY += statsSpacing;

        // Missions completed
        this.add.text(width * 0.3, currentY, `Missions: ${window.SHARED.progress.missions_completed}`, {
            fontSize: '18px',
            color: '#ffff00'
        }).setOrigin(0, 0.5);

        // Lives remaining
        this.add.text(width * 0.7, currentY, `Lives: ${window.SHARED.lives}`, {
            fontSize: '18px',
            color: '#ff69b4'
        }).setOrigin(0, 0.5);
    }

    createNavigation() {
        const { width, height } = this.scale;
        const buttonY = height - 50;
        
        // Back button
        this.uiManager.createNavButton(
            width / 2, buttonY,
            '← Back to World Map', 
            () => this.scene.start('WorldMap'),
            { fontSize: '18px', backgroundColor: '#7f8c8d' }
        );
    }
} 