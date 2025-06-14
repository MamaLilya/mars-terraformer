function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load assets
        this.load.image('player', 'assets/player.png');
        this.load.image('platform', 'assets/platform.png');
    }

    create() {
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;

        // Create background
        this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x111111)
            .setOrigin(0, 0);

        // Create lava at bottom
        this.lava = this.add.rectangle(0, this.game.config.height - 20, this.game.config.width, 20, 0xff0000)
            .setOrigin(0, 0);

        // Create player
        this.player = this.physics.add.sprite(100, 300, 'player');
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(800);
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);

        // Player state
        this.onPlatform = true;
        this.jumping = false;
        this.doubleJumpAvailable = true;

        // Create platforms group
        this.platforms = this.physics.add.staticGroup();

        // Create starting platform
        const startPlatform = this.platforms.create(100, 300, 'platform');
        startPlatform.setScale(2, 1).refreshBody();

        // Create second platform
        const secondPlatform = this.platforms.create(500, 250, 'platform');
        secondPlatform.setScale(2, 1).refreshBody();

        // Add collision between player and platforms
        this.physics.add.collider(this.player, this.platforms, (player, platform) => {
            if (player.body.velocity.y > 0) {
                const playerBottom = player.y + player.height / 2;
                const platformTop = platform.y - platform.height / 2;
                
                if (Math.abs(playerBottom - platformTop) < 10) {
                    player.setVelocityY(0);
                    player.y = platformTop - player.height / 2;
                    this.onPlatform = true;
                    this.jumping = false;
                    this.doubleJumpAvailable = true;
                }
            }
        });

        // Create UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#fff'
        });
        this.scoreText.setScrollFactor(0);

        this.livesText = this.add.text(16, 56, `Lives: ${this.lives}`, {
            fontSize: '32px',
            fill: '#fff'
        });
        this.livesText.setScrollFactor(0);

        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Set up camera
        this.cameras.main.setBounds(0, 0, 2000, this.game.config.height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(100, 50);

        // Set up world bounds
        this.physics.world.setBounds(0, 0, 2000, this.game.config.height);

        // Start spawning platforms
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnPlatform,
            callbackScope: this,
            loop: true
        });
    }

    spawnPlatform() {
        const lastPlatform = this.getRightmostPlatform();
        if (!lastPlatform) return;

        const x = lastPlatform.x + Phaser.Math.Between(200, 400);
        const y = Phaser.Math.Between(100, 250);

        const platform = this.platforms.create(x, y, 'platform');
        platform.setScale(2, 1).refreshBody();
    }

    getRightmostPlatform() {
        let rightmost = null;
        let maxX = -Infinity;

        this.platforms.getChildren().forEach(platform => {
            if (platform.x > maxX) {
                maxX = platform.x;
                rightmost = platform;
            }
        });

        return rightmost;
    }

    update() {
        if (this.gameOver) return;

        // Handle jumping
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (this.onPlatform) {
                // Regular jump
                this.player.setVelocityY(-500);
                this.jumping = true;
                this.onPlatform = false;
            } else if (this.doubleJumpAvailable && this.jumping) {
                // Double jump
                this.player.setVelocityY(-450);
                this.doubleJumpAvailable = false;
            }
        }

        // Move platforms
        this.platforms.getChildren().forEach(platform => {
            platform.x -= 2;
            if (platform.x < -platform.width) {
                platform.destroy();
            }
        });

        // Update score based on height
        const newScore = Math.floor(this.player.y / 10);
        if (newScore > this.score) {
            this.score = newScore;
            this.scoreText.setText(`Score: ${this.score}`);
        }

        // Check for game over
        if (this.player.y > this.game.config.height - 100) {
            this.lives--;
            this.livesText.setText(`Lives: ${this.lives}`);

            if (this.lives <= 0) {
                this.gameOver = true;
                this.scene.start('GameOverScene', { score: this.score });
            } else {
                // Reset player position
                this.player.setPosition(100, 300);
                this.player.setVelocity(0, 0);
                this.onPlatform = true;
                this.jumping = false;
                this.doubleJumpAvailable = true;
            }
        }
    }
}