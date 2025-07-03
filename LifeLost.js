class LifeLost extends Phaser.Scene {
    constructor() {
        super('LifeLost');
    }

    init(data) {
        this.remainingLives = data.lives;
        this.resources = data.resources || { ore: 0, ice: 0, energy: 0 };
        this.restarting = false;
    }

    preload() {
        this.load.image('life_lost_screen', 'assets/life_lost_screen.png?v=' + new Date().getTime());
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

        // Background
        const background = this.add.image(centerX, height / 2, 'life_lost_screen').setOrigin(0.5);
        const scale = Math.min(width / background.width, height / background.height);
        background.setScale(scale);
        this.add.rectangle(centerX, height / 2, width, height, 0x000000, 0.5);

        // --- UI Elements ---

        // Lives Left Text
        const livesText = this.add.text(centerX, height * 0.25, `Lives left: ${this.remainingLives}`, {
            fontSize: '42px', color: '#ffffff', fontStyle: 'bold', stroke: '#8B4513', strokeThickness: 6
        }).setOrigin(0.5).setShadow(2, 2, '#8B4513', 2, true, true);

        // Buttons
        const buttonY = height * 0.45;
        const tryAgainButton = this.createButton(centerX, buttonY - 35, 'Try Again', () => this.transitionToScene('GameScene'));
        const goToStationButton = this.createButton(centerX, buttonY + 35, 'Go to Station', () => this.transitionToScene('Station'));

        // Resource Summary - icons with text directly below
        const resourceY = height * 0.75;
        const resourceContainer = this.add.container(centerX, resourceY);
        const catcreteSummary = this.createResourceDisplay(-150, 0, 'icon_catcrete', `Catcrete: ${this.resources.stone}`);
        const fishiceSummary = this.createResourceDisplay(0, 0, 'icon_fishice', `Fish-Ice: ${this.resources.ice}`);
        const energySummary = this.createResourceDisplay(150, 0, 'icon_solarpurr', `Energy: ${this.resources.energy}`);
        resourceContainer.add([catcreteSummary, fishiceSummary, energySummary]);

        // --- Logic ---
        if (localStorage.getItem('lastLifeLostAt') === null) {
            localStorage.setItem('lastLifeLostAt', Date.now().toString());
        }

        // --- Initial Animation ---
        const uiElements = [livesText, tryAgainButton, goToStationButton, resourceContainer];
        this.tweens.add({
            targets: uiElements,
            alpha: { from: 0, to: 1 },
            duration: 600,
            ease: 'Power2'
        });

        // Add text
        this.add.text(centerX, height * 0.85, 'Lives Lost!', {
            fontSize: '24px', color: '#ff0000', fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setScale(0.15);
    }
    
    createButton(x, y, text, callback) {
        const button = this.add.text(x, y, text, {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#4a2a18',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        button.on('pointerover', () => button.setBackgroundColor('#6b4a38'));
        button.on('pointerout', () => button.setBackgroundColor('#4a2a18'));
        button.on('pointerdown', () => callback());
        
        return button;
    }

    createResourceDisplay(x, y, iconKey, text) {
        const container = this.add.container(x, y);

        // Icon, scaled to match in-game appearance with fallback
        let iconImg;
        try {
            iconImg = this.add.image(0, 0, iconKey)
                .setScale(0.15)
                .setOrigin(0.5);
        } catch (e) {
            // Fallback mapping
            const fallbackIcon = iconKey === 'icon_catcrete' ? 'resource_iron_orb' : 
                               iconKey === 'icon_fishice' ? 'resource_ice_orb' : 'resource_solar_orb';
            iconImg = this.add.image(0, 0, fallbackIcon)
                .setScale(0.15)
                .setOrigin(0.5);
        }

        // Text, styled and positioned below the icon
        const textObj = this.add.text(0, iconImg.displayHeight / 2 + 15, text, {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#8B4513',
            strokeThickness: 4
        }).setOrigin(0.5);

        container.add([iconImg, textObj]);
        return container;
    }

    transitionToScene(sceneKey) {
        if (this.restarting) return;
        this.restarting = true;
        this.game.canvas.style.cursor = 'default';

        this.cameras.main.fadeOut(400, 0, 0, 0, (camera, progress) => {
            if (progress === 1) {
                this.scene.start(sceneKey);
            }
        });
    }
}
