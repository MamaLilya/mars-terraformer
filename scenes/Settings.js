/**
 * Settings Scene
 * Game settings and configuration options
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS } from '../config/game-config.js';

export class Settings extends Phaser.Scene {
    constructor() {
        super({ key: 'Settings' });
        this.assetLoader = null;
        this.uiManager = null;
        this.settings = {
            soundEnabled: true,
            musicEnabled: true,
            difficulty: 'normal',
            autoSave: true
        };
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('Settings');
    }

    create() {
        this.uiManager = new UIManager(this);
        this.setupBackground();
        this.createTitle();
        this.createSettingsOptions();
        this.createNavigation();
    }

    setupBackground() {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(0, 0, width, height, 0x34495e, 0.9)
            .setOrigin(0, 0)
            .setDepth(-1);
    }

    createTitle() {
        const { width, height } = this.scale;
        
        this.add.text(width / 2, height * 0.1, '⚙️ Settings ⚙️', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    createSettingsOptions() {
        const { width, height } = this.scale;
        const startY = height * 0.25;
        const spacing = 60;

        // Sound Settings
        this.createSettingOption(
            width, startY,
            '🔊 Sound Effects',
            this.settings.soundEnabled,
            (value) => { this.settings.soundEnabled = value; }
        );

        // Music Settings
        this.createSettingOption(
            width, startY + spacing,
            '🎵 Background Music',
            this.settings.musicEnabled,
            (value) => { this.settings.musicEnabled = value; }
        );

        // Difficulty Settings
        this.createDifficultySelector(
            width, startY + spacing * 2
        );

        // Auto Save Settings
        this.createSettingOption(
            width, startY + spacing * 3,
            '💾 Auto Save',
            this.settings.autoSave,
            (value) => { this.settings.autoSave = value; }
        );

        // Reset Progress Button
        this.uiManager.createNavButton(
            width / 2, startY + spacing * 4,
            '🔄 Reset Progress', 
            () => this.showResetConfirmation(),
            { fontSize: '18px', backgroundColor: '#e74c3c' }
        );
    }

    createSettingOption(width, y, label, initialValue, onChange) {
        // Label
        this.add.text(width * 0.3, y, label, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // Toggle button
        const button = this.uiManager.createNavButton(
            width * 0.7, y,
            initialValue ? 'ON' : 'OFF',
            () => {
                const newValue = !initialValue;
                button.setText(newValue ? 'ON' : 'OFF');
                button.setBackgroundColor(newValue ? '#2ecc71' : '#e74c3c');
                onChange(newValue);
            },
            {
                fontSize: '16px',
                backgroundColor: initialValue ? '#2ecc71' : '#e74c3c'
            }
        );
    }

    createDifficultySelector(width, y) {
        // Label
        this.add.text(width * 0.3, y, '🎯 Difficulty', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        const difficulties = ['easy', 'normal', 'hard'];
        const currentIndex = difficulties.indexOf(this.settings.difficulty);
        
        // Difficulty buttons
        difficulties.forEach((difficulty, index) => {
            const buttonX = width * 0.5 + (index - 1) * 80;
            const isSelected = index === currentIndex;
            
            this.uiManager.createNavButton(
                buttonX, y,
                difficulty.toUpperCase(),
                () => {
                    this.settings.difficulty = difficulty;
                    this.updateDifficultyButtons();
                },
                {
                    fontSize: '14px',
                    backgroundColor: isSelected ? '#3498db' : '#7f8c8d'
                }
            );
        });
    }

    updateDifficultyButtons() {
        // This would update the difficulty button states
        // Implementation would require storing button references
    }

    showResetConfirmation() {
        this.uiManager.createModal(
            '⚠️ Reset Progress',
            'Are you sure you want to reset all progress? This action cannot be undone.',
            [
                { text: 'Cancel', onClick: () => {} },
                { text: 'Reset', onClick: () => this.resetProgress() }
            ]
        );
    }

    resetProgress() {
        // Reset all game progress
        window.SHARED.resources.stone = 100;
        window.SHARED.resources.ice = 100;
        window.SHARED.resources.energy = 100;
        window.SHARED.progress.level = 1;
        window.SHARED.progress.terraforming = 0;
        window.SHARED.progress.missions_completed = 0;
        window.SHARED.lives = 3;
        
        this.uiManager.createModal(
            '✅ Progress Reset',
            'All progress has been reset successfully.',
            [{ text: 'OK', onClick: () => this.scene.start('MainMenu') }]
        );
    }

    createNavigation() {
        const { width, height } = this.scale;
        const buttonY = height - 50;
        
        // Back button
        this.uiManager.createNavButton(
            width / 2, buttonY,
            '← Back to Main Menu', 
            () => this.scene.start('MainMenu'),
            { fontSize: '18px', backgroundColor: '#7f8c8d' }
        );
    }
} 