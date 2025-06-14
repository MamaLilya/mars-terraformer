function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Create simple graphics for player and platform
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00aaff);
        playerGraphics.fillRect(0, 0, 40, 60);
        playerGraphics.generateTexture('player', 40, 60);
        playerGraphics.destroy();

        const platformGraphics = this.add.graphics();
        platformGraphics.fillStyle(0x888888);
        platformGraphics.fillRect(0, 0, 200, 20);
        platformGraphics.generateTexture('platform', 200, 20);
        platformGraphics.destroy();
    }

    create() {
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;

        // Create background
        this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x111111)
            .setOrigin(0, 0);

        // Create platforms group
        this.platforms = this.physics.add.staticGroup();

        // Create starting platform
        const startPlatform = this.platforms.create(100, 300, 'platform');
        startPlatform.setImmovable(true);
        startPlatform.body.allowGravity = false;
        startPlatform.setData('isMoving', true);

        // Create player
        this.player = this.physics.add.sprite(100, 260, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(800);

        // Set up collisions
        this.physics.add.collider(this.player, this.platforms, (player, platform) => {
            if (player.body.velocity.y > 0) { // Only trigger when falling
                player.setVelocityY(0);
                player.setPosition(player.x, platform.y - player.height / 2);
                player.setData('onPlatform', true);
                player.setData('jumping', false);
                player.setData('doubleJumpAvailable', true);
            }
        });

        // Create lava effect
        this.lava = this.add.rectangle(400, 580, 800, 40, 0xff0000, 0.5);
        this.physics.add.existing(this.lava, true);

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

        // Game over text (initially hidden)
        this.gameOverText = this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'Game Over!', {
            fontSize: '64px',
            fill: '#ff0000'
        });
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setScrollFactor(0);
        this.gameOverText.setVisible(false);

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

        console.log('Game initialized:', {
            playerPosition: { x: this.player.x, y: this.player.y },
            startPlatform: { x: startPlatform.x, y: startPlatform.y }
        });
    }

    spawnPlatform() {
        const lastPlatform = this.getRightmostPlatform();
        if (!lastPlatform) return;

        const x = lastPlatform.x + Phaser.Math.Between(200, 400);
        const y = Phaser.Math.Between(100, 250);

        const platform = this.platforms.create(x, y, 'platform');
        platform.setScale(1, 1).refreshBody();

        console.log('Spawned new platform:', { x, y });
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
        if (this.gameOver) {
            // Show game over text
            this.gameOverText.setVisible(true);
            
            // Reset game when space is pressed
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.scene.restart();
            }
            return;
        }

        // Move platforms
        this.platforms.getChildren().forEach(platform => {
            if (platform.getData('isMoving')) {
                platform.x -= 2;
                if (platform.x < -platform.width) {
                    platform.destroy();
                }
            }
        });

        // Check for game over
        if (this.player.y > 550) {
            this.gameOver();
            return;
        }

        // Handle jumping
        if (this.cursors.up.isDown) {
            if (this.player.getData('onPlatform')) {
                this.player.setVelocityY(-500);
                this.player.setData('jumping', true);
                this.player.setData('onPlatform', false);
            } else if (this.player.getData('doubleJumpAvailable') && this.player.getData('jumping')) {
                this.player.setVelocityY(-450);
                this.player.setData('doubleJumpAvailable', false);
            }
        }

        // Debug logging
        console.log('Update frame →', {
            playerY: this.player.y,
            velocityY: this.player.body.velocity.y,
            onPlatform: this.player.getData('onPlatform'),
            jumping: this.player.getData('jumping'),
            doubleJumpAvailable: this.player.getData('doubleJumpAvailable')
        });

        // Update score based on height
        const newScore = Math.floor(this.player.y / 10);
        if (newScore > this.score) {
            this.score = newScore;
            this.scoreText.setText(`Score: ${this.score}`);
        }
    }

    gameOver() {
        this.gameOver = true;
        this.lives--;
        this.livesText.setText(`Lives: ${this.lives}`);

        if (this.lives <= 0) {
            this.gameOver = true;
        } else {
            // Reset player position
            this.player.setPosition(100, 300 - 40);
            this.player.setVelocity(0, 0);
            this.player.setData('onPlatform', true);
            this.player.setData('jumping', false);
            this.player.setData('doubleJumpAvailable', true);
        }
    }
}