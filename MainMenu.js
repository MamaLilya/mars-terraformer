class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        this.load.image('btn_station', 'assets/btn_station.png');
        this.load.image('main_menu_fg', 'assets/main_menu_foreground.png');
    }

    create() {
        const { width, height } = this.scale;
        
        // --- New Background System ---
        this.cameras.main.setBackgroundColor('#220804');
        this.add.image(width / 2, height / 2, 'main_menu_fg')
            .setOrigin(0.5)
            .setDisplaySize(width, height)
            .setScrollFactor(0);

        // --- Primary Station Button (Centered Image) ---
        const stationBtn = this.add.image(width / 2, height * 0.5, 'btn_station')
            .setScale(0.2) // A balanced scale for the primary button
            .setOrigin(0.5)
            .setInteractive();
        this.addHoverEffect(stationBtn, () => this.scene.start('Station'));

        // --- Secondary Buttons (Horizontal Text Row) ---
        const secondaryButtons = [
            { label: 'World Map', scene: 'WorldMap' },
            { label: 'Shop', scene: 'Shop' },
            { label: 'Ranking', scene: 'Ranking' },
            { label: 'Settings', scene: 'Settings' }
        ];

        const secondaryButtonStyle = {
            fontSize: '24px',
            color: '#ffffff',
            shadow: { color: '#000000', fill: true, blur: 5, offsetY: 2 }
        };

        const totalWidth = width * 0.7;
        const startX = (width / 2) - (totalWidth / 2);
        const yPos = height * 0.75;
        const spacing = secondaryButtons.length > 1 ? totalWidth / (secondaryButtons.length - 1) : 0;

        secondaryButtons.forEach((btnInfo, i) => {
            const button = this.add.text(startX + i * spacing, yPos, btnInfo.label, secondaryButtonStyle)
                .setOrigin(0.5)
                .setInteractive();
            this.addHoverEffect(button, () => this.scene.start(btnInfo.scene));
        });
    }

    addHoverEffect(button, onClick) {
        const baseScale = button.scale;
        button.on('pointerover', () => {
            this.tweens.add({ targets: button, scale: baseScale * 1.1, duration: 100 });
        });
        button.on('pointerout', () => {
            this.tweens.add({ targets: button, scale: baseScale, duration: 100 });
        });
        button.on('pointerdown', onClick);
    }
}