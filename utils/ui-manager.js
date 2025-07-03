/**
 * UI Manager Utility
 * Centralized UI management for the Cat Colony Mars Terraformation game
 */

import { CONSTANTS } from '../config/game-config.js';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.texts = {};
        this.buttons = {};
    }

    /**
     * Create a resource display with icon and text
     */
    createResourceDisplay(x, y, iconKey, value, options = {}) {
        const container = this.scene.add.container(x, y);
        
        // Create icon
        const icon = this.scene.add.image(0, 0, iconKey)
            .setScale(options.iconScale || CONSTANTS.UI.ICON_SCALE)
            .setOrigin(0.5);
        
        // Create text
        const text = this.scene.add.text(
            icon.displayWidth / 2 + (options.textOffset || 10), 
            0, 
            value.toString(), 
            {
                fontSize: options.fontSize || '24px',
                color: options.color || '#ffffff',
                fontStyle: options.fontStyle || 'bold',
                stroke: options.stroke || '#000',
                strokeThickness: options.strokeThickness || 2
            }
        ).setOrigin(0, 0.5);
        
        container.add([icon, text]);
        
        return {
            container,
            icon,
            text,
            updateValue: (newValue) => {
                text.setText(newValue.toString());
            }
        };
    }

    /**
     * Create a navigation button
     */
    createNavButton(x, y, text, onClick, options = {}) {
        const button = this.scene.add.text(x, y, text, {
            fontSize: options.fontSize || '20px',
            color: options.color || '#ffffff',
            backgroundColor: options.backgroundColor || '#333333',
            padding: options.padding || { x: 20, y: 10 },
            fontStyle: options.fontStyle || 'bold',
            stroke: options.stroke || '#000',
            strokeThickness: options.strokeThickness || 2
        })
        .setOrigin(0.5)
        .setDepth(options.depth || CONSTANTS.UI.BUTTON_DEPTH)
        .setInteractive({ useHandCursor: true });

        // Add hover effects
        button.on('pointerover', () => {
            button.setScale(1.1);
            button.setTint(0xffff00);
        });

        button.on('pointerout', () => {
            button.setScale(1.0);
            button.setTint(0xffffff);
        });

        button.on('pointerdown', () => {
            button.setScale(0.95);
        });

        button.on('pointerup', () => {
            button.setScale(1.0);
            if (onClick) onClick();
        });

        return button;
    }

    /**
     * Create a modal dialog
     */
    createModal(title, content, buttons = [], options = {}) {
        const { width, height } = this.scene.scale;
        const modalWidth = options.width || width * 0.8;
        const modalHeight = options.height || height * 0.6;
        const modalX = width / 2;
        const modalY = height / 2;

        // Create modal background
        const background = this.scene.add.rectangle(
            modalX, modalY, modalWidth, modalHeight, 0x000000, 0.8
        ).setDepth(1000);

        // Create modal border
        const border = this.scene.add.rectangle(
            modalX, modalY, modalWidth, modalHeight, 0xffffff, 0.1
        ).setStrokeStyle(2, 0xffffff).setDepth(1001);

        // Create title
        const titleText = this.scene.add.text(
            modalX, modalY - modalHeight / 2 + 30, title,
            {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(1002);

        // Create content
        const contentText = this.scene.add.text(
            modalX, modalY, content,
            {
                fontSize: '18px',
                color: '#ffffff',
                wordWrap: { width: modalWidth - 40 }
            }
        ).setOrigin(0.5).setDepth(1002);

        // Create buttons
        const buttonContainer = this.scene.add.container(modalX, modalY + modalHeight / 2 - 50);
        buttonContainer.setDepth(1002);

        buttons.forEach((buttonConfig, index) => {
            const button = this.createNavButton(
                (index - buttons.length / 2 + 0.5) * 120,
                0,
                buttonConfig.text,
                buttonConfig.onClick,
                { fontSize: '16px' }
            );
            buttonContainer.add(button);
        });

        return {
            background,
            border,
            titleText,
            contentText,
            buttonContainer,
            destroy: () => {
                background.destroy();
                border.destroy();
                titleText.destroy();
                contentText.destroy();
                buttonContainer.destroy();
            }
        };
    }

    /**
     * Create a progress bar
     */
    createProgressBar(x, y, width, height, progress = 0, options = {}) {
        const container = this.scene.add.container(x, y);

        // Background
        const background = this.scene.add.rectangle(
            0, 0, width, height, 
            options.backgroundColor || 0x333333
        );

        // Progress fill
        const fill = this.scene.add.rectangle(
            -width / 2 + (width * progress) / 2, 0,
            width * progress, height,
            options.fillColor || 0x00ff00
        ).setOrigin(0, 0.5);

        // Border
        const border = this.scene.add.rectangle(
            0, 0, width, height, 0xffffff, 0
        ).setStrokeStyle(2, options.borderColor || 0xffffff);

        // Text
        const text = this.scene.add.text(
            0, 0, `${Math.round(progress * 100)}%`,
            {
                fontSize: options.fontSize || '16px',
                color: options.textColor || '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        container.add([background, fill, border, text]);

        return {
            container,
            background,
            fill,
            border,
            text,
            updateProgress: (newProgress) => {
                fill.width = width * newProgress;
                fill.x = -width / 2 + (width * newProgress) / 2;
                text.setText(`${Math.round(newProgress * 100)}%`);
            }
        };
    }

    /**
     * Create animated text with tween
     */
    createAnimatedText(x, y, text, options = {}) {
        const textObject = this.scene.add.text(x, y, text, {
            fontSize: options.fontSize || '20px',
            color: options.color || '#ffffff',
            fontStyle: options.fontStyle || 'bold',
            stroke: options.stroke || '#000',
            strokeThickness: options.strokeThickness || 2
        }).setOrigin(0.5);

        if (options.animate) {
            this.scene.tweens.add({
                targets: textObject,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 200,
                yoyo: true,
                ease: 'Power2'
            });
        }

        return textObject;
    }

    /**
     * Update all resource displays
     */
    updateResourceDisplays() {
        if (this.texts.catcrete) {
            this.texts.catcrete.setText(`Catcrete: ${window.SHARED.resources.stone}`);
        }
        if (this.texts.fishice) {
            this.texts.fishice.setText(`Fish-Ice: ${window.SHARED.resources.ice}`);
        }
        if (this.texts.energy) {
            this.texts.energy.setText(`Energy: ${window.SHARED.resources.energy}`);
        }
    }

    /**
     * Clean up all UI elements
     */
    cleanup() {
        Object.values(this.texts).forEach(text => {
            if (text && text.destroy) text.destroy();
        });
        Object.values(this.buttons).forEach(button => {
            if (button && button.destroy) button.destroy();
        });
        this.texts = {};
        this.buttons = {};
    }
} 