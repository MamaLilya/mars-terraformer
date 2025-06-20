class LifeLost extends Phaser.Scene {
    constructor() {
        super('LifeLost');
    }

    init(data) {
        this.remainingLives = data.lives;
    }

    preload() {
        this.load.image('gameover_screen', 'assets/gameover_screen.png');
    }

    create() {
        this.add.image(400, 300, 'gameover_screen').setOrigin(0.5).setScale(0.75);

        this.add.text(400, 150, '💔 Life Lost!', { fontSize: 48, color: '#ff4444' }).setOrigin(0.5);
        this.add.text(400, 230, `Lives left: ${this.remainingLives}`, { fontSize: 28, color: '#fff' }).setOrigin(0.5);

        // Add visible Try Again button
        this.tryAgainButton = this.add.text(400, 350, 'Try Again', { 
            fontSize: 32, 
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        // Add hover effects
        this.tryAgainButton.on('pointerover', () => {
            this.tryAgainButton.setStyle({ backgroundColor: '#666666' });
        });

        this.tryAgainButton.on('pointerout', () => {
            this.tryAgainButton.setStyle({ backgroundColor: '#444444' });
        });

        // Add click handler
        this.tryAgainButton.on('pointerdown', () => {
            this.restartGame();
        });

        // Add space key input for restart
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Add click/touch support for restart
        this.input.on('pointerdown', () => {
            this.restartGame();
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.restartGame();
        }
    }

    restartGame() {
        this.scene.start('GameScene');
    }
}
