class WorldMap extends Phaser.Scene {
    constructor() {
        super('WorldMap');
    }

    preload() {
        this.load.image('planet', 'assets/main_menu_background.png'); // Using this as a placeholder for Mars
        this.load.image('title', 'assets/title.png');
    }

    create() {
        const { width, height } = this.scale;
        this.createBackground(width, height);

        // --- Title ---
        this.add.image(width / 2, height * 0.15, 'title').setScale(0.8);
        this.add.text(width / 2, height * 0.3, 'Select a Landing Zone', {
            fontSize: '28px', color: '#fff',
            shadow: { color: '#000', fill: true, blur: 5, offsetY: 2 }
        }).setOrigin(0.5);

        // --- Central Planet ---
        const planet = this.add.image(width / 2, height * 0.55, 'planet')
            .setScale(0.4)
            .setCircle(400) // Make it a circular interactive area
            .setInteractive();
        
        // Add a pulsing glow effect
        this.tweens.add({
            targets: planet,
            scale: 0.42,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // --- Landing Zone Hotspot ---
        const landingZone = this.add.circle(width / 2, height * 0.55, 30, 0xff0000, 0.5)
            .setStrokeStyle(2, 0xffffff);

        const label = this.add.text(width / 2, height * 0.55 - 40, 'Alpha Site', {
            fontSize: '20px', color: '#fff',
            backgroundColor: '#000a', padding: {x: 5, y: 3}
        }).setOrigin(0.5);

        // Make the zone interactive
        landingZone.setInteractive()
            .on('pointerover', () => landingZone.setFillStyle(0x00ff00, 0.7))
            .on('pointerout', () => landingZone.setFillStyle(0xff0000, 0.5))
            .on('pointerdown', () => {
                window.SHARED.lives = 3;
                this.scene.start('GameScene');
            });

        // --- Bottom Buttons ---
        const menuBtn = this.add.text(width / 2, height - 50, 'Back to Main Menu', {
            fontSize: '24px', color: '#fff',
            shadow: { color: '#000', fill: true, blur: 2, offsetY: 1 }
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setScale(1.1));
        menuBtn.on('pointerout', () => menuBtn.setScale(1.0));
        menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));
    }

    createBackground(width, height) {
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a0501, 0x1a0501, 0x3d140b, 0x3d140b, 1);
        graphics.fillRect(0, 0, width, height);
    }
}