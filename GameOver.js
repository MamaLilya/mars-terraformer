class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.resources = data.resources || { stone: 0, ice: 0, energy: 0 };
    }

    preload() {
        this.load.image('gameover_background', 'assets/gameover_background.png');
        // Load cat-themed resource icons
        this.load.image('icon_catcrete', 'assets/icon_catcrete.png');
        this.load.image('icon_fishice', 'assets/icon_fishice.png');
        this.load.image('icon_solarpurr', 'assets/icon_solarpurr_original.png');
        // Fallback to old icons if new ones don't exist
        this.load.image('resource_iron_orb', 'assets/resource_iron_orb.png');
        this.load.image('resource_ice_orb', 'assets/resource_ice_orb.png');
        this.load.image('resource_solar_orb', 'assets/icon_solarpurr_original.png');
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;

        // Background and Overlay
        const background = this.add.image(centerX, height / 2, 'gameover_background').setOrigin(0.5);
        const scale = Math.min(width / background.width, height / background.height);
        background.setScale(scale);
        this.add.rectangle(centerX, height / 2, width, height, 0x000000, 0.6);

        // "Game Over" Title
        this.add.text(centerX, height * 0.25, 'Game Over', {
            fontSize: '64px',
            color: '#ff4d4d', // Red color for game over
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { color: '#000000', fill: true, blur: 5, offsetY: 5 }
        }).setOrigin(0.5);

        // Final Resource Summary
        const resourceY = height * 0.5;
        this.add.text(centerX, resourceY - 50, 'Final Resources', {
            fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const resourceContainer = this.add.container(centerX, resourceY + 20);
        const catcreteSummary = this.createResourceDisplay(-150, 0, 'icon_catcrete', `Catcrete: ${this.resources.stone}`);
        const fishiceSummary = this.createResourceDisplay(0, 0, 'icon_fishice', `Fish-Ice: ${this.resources.ice}`);
        const energySummary = this.createResourceDisplay(150, 0, 'icon_solarpurr', `Energy: ${this.resources.energy}`);
        resourceContainer.add([catcreteSummary, fishiceSummary, energySummary]);
        
        // "Main Menu" Button
        const menuButton = this.add.text(centerX, height * 0.75, 'Return to Main Menu', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#4a2a18',
            padding: { x: 20, y: 10 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuButton.on('pointerover', () => menuButton.setBackgroundColor('#6b4a38'));
        menuButton.on('pointerout', () => menuButton.setBackgroundColor('#4a2a18'));
        menuButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0, (camera, progress) => {
                if (progress === 1) {
                    this.scene.start('MainMenu');
                }
            });
        });

        // Fade in UI
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    createResourceDisplay(x, y, iconKey, text) {
        const container = this.add.container(x, y);
        let iconImg;
        
        // Try to use new icon, fallback to old one if needed
        try {
            iconImg = this.add.image(0, 0, iconKey).setScale(0.15).setOrigin(0.5);
        } catch (e) {
            // Fallback mapping
            const fallbackIcon = iconKey === 'icon_catcrete' ? 'resource_iron_orb' : 
                               iconKey === 'icon_fishice' ? 'resource_ice_orb' : 'resource_solar_orb';
            iconImg = this.add.image(0, 0, fallbackIcon).setScale(0.15).setOrigin(0.5);
        }
        
        const textObj = this.add.text(0, iconImg.displayHeight / 2 + 25, text, {
            fontSize: '20px', color: '#ffffff', stroke: '#8B4513', strokeThickness: 4
        }).setOrigin(0.5);
        container.add([iconImg, textObj]);
        return container;
    }
}