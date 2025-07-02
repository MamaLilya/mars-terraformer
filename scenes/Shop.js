/**
 * Shop Scene
 * Purchase upgrades and items with collected resources
 */

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS, UTILS } from '../config/game-config.js';

export class Shop extends Phaser.Scene {
    constructor() {
        super({ key: 'Shop' });
        this.assetLoader = null;
        this.uiManager = null;
        this.shopItems = [
            {
                name: 'Extra Life',
                description: 'Gain an additional life',
                cost: { stone: 50, ice: 25, energy: 10 },
                effect: () => { window.SHARED.lives++; }
            },
            {
                name: 'Speed Boost',
                description: 'Increase movement speed',
                cost: { stone: 30, ice: 15, energy: 5 },
                effect: () => { /* Implement speed boost */ }
            },
            {
                name: 'Double Jump Upgrade',
                description: 'Enhanced double jump ability',
                cost: { stone: 40, ice: 20, energy: 15 },
                effect: () => { /* Implement double jump upgrade */ }
            }
        ];
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('Shop');
    }

    create() {
        this.uiManager = new UIManager(this);
        this.setupBackground();
        this.createTitle();
        this.createShopItems();
        this.createResourceDisplay();
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
        
        this.add.text(width / 2, height * 0.1, '🛒 Cat Colony Shop 🛒', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    createShopItems() {
        const { width, height } = this.scale;
        const startY = height * 0.25;
        const spacing = 80;

        this.shopItems.forEach((item, index) => {
            const y = startY + (index * spacing);
            
            // Item name
            this.add.text(width * 0.2, y, item.name, {
                fontSize: '20px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            // Item description
            this.add.text(width * 0.2, y + 20, item.description, {
                fontSize: '14px',
                color: '#cccccc'
            }).setOrigin(0, 0.5);

            // Cost display
            const costText = this.formatCost(item.cost);
            this.add.text(width * 0.6, y, costText, {
                fontSize: '16px',
                color: '#ffff00'
            }).setOrigin(0, 0.5);

            // Buy button
            const canAfford = UTILS.canAfford(item.cost);
            this.uiManager.createNavButton(
                width * 0.8, y,
                canAfford ? 'Buy' : 'Too Expensive',
                () => this.purchaseItem(item),
                {
                    fontSize: '16px',
                    backgroundColor: canAfford ? '#2ecc71' : '#95a5a6',
                    color: canAfford ? '#ffffff' : '#666666'
                }
            );
        });
    }

    formatCost(cost) {
        return Object.entries(cost)
            .map(([resource, amount]) => `${amount} ${resource}`)
            .join(', ');
    }

    purchaseItem(item) {
        if (UTILS.canAfford(item.cost)) {
            UTILS.spendResources(item.cost);
            item.effect();
            this.showPurchaseSuccess(item.name);
            this.updateResourceDisplay();
        } else {
            this.showInsufficientResources();
        }
    }

    showPurchaseSuccess(itemName) {
        this.uiManager.createModal(
            '✅ Purchase Successful!',
            `You have successfully purchased ${itemName}!`,
            [{ text: 'OK', onClick: () => {} }]
        );
    }

    showInsufficientResources() {
        this.uiManager.createModal(
            '❌ Insufficient Resources',
            'You don\'t have enough resources to make this purchase.',
            [{ text: 'OK', onClick: () => {} }]
        );
    }

    createResourceDisplay() {
        const { width, height } = this.scale;
        const resourceY = height * 0.85;
        
        // Resource displays
        this.uiManager.createResourceDisplay(
            width * 0.25, resourceY,
            'icon_catcrete', window.SHARED.resources.stone,
            { fontSize: '18px' }
        );
        
        this.uiManager.createResourceDisplay(
            width * 0.5, resourceY,
            'icon_fishice', window.SHARED.resources.ice,
            { fontSize: '18px' }
        );
        
        this.uiManager.createResourceDisplay(
            width * 0.75, resourceY,
            'icon_solarpurr', window.SHARED.resources.energy,
            { fontSize: '18px' }
        );
    }

    updateResourceDisplay() {
        // This would update the resource displays if they were stored as references
        // For now, the displays are recreated each time
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