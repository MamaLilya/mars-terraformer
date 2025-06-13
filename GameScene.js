function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Create a simple circle texture for particles
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('particle', 8, 8);
        graphics.destroy();
    }

    create() {
        // Game state
        this.level = window.SHARED.level;
        this.lives = window.SHARED.lives;
        this.resources = window.SHARED.resources;
        this.score = 0;
        this.platformsLanded = 0;
        this.nextLevelAt = 30; // Level up every 30 platforms

        // Input setup - bind SPACE and other controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', () => {
            this.handleJump();
        }, this);
        this.input.on('pointerdown', () => {
            this.handleJump();
        });

        // Constants matching Pygame values
        this.PLAYER_X = 100;
        this.GRAVITY = 60;       // ~0.8 per frame in Phaser terms
        this.JUMP_FORCE = -15;   // Direct Pygame value
        this.BASE_PLATFORM_SPEED = 2 * 60; // Platform speed still needs fps scaling
        this.platformSpeed = this.BASE_PLATFORM_SPEED;
        
        // Jump state flags
        this.jumping = false;           // True when in any jump (first or double)
        this.onPlatform = false;        // True only when standing on platform
        this.doubleJumpAvailable = false; // True after first jump, false after using double jump
        
        // Platform generation constants
        this.MIN_PLATFORM_Y = 300;
        this.MAX_PLATFORM_Y = 500;
        this.MIN_PLATFORM_GAP = 200;
        this.MAX_PLATFORM_GAP = 400;
        this.lastPlatformX = 0;
     
        // Background
        this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0, 0);
        
        // Configure physics
        this.physics.world.gravity.y = this.GRAVITY;
        
        // Create static platforms group
        this.platforms = this.physics.add.staticGroup();
        this.collectibles = this.physics.add.staticGroup();
        
        // Create starting platform
        const startPlatform = this.spawnPlatform(100, 450, 300);
        
        // Create player sprite and enable physics
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00aaff);
        graphics.fillRect(0, 0, 40, 60);
        graphics.generateTexture('player', 40, 60);
        graphics.destroy();
     
        this.player = this.physics.add.sprite(this.PLAYER_X, 400, 'player');
        this.player.body.setGravityY(this.GRAVITY);
        this.player.body.setCollideWorldBounds(false);
        
        // Spawn second platform
        this.lastPlatformX = 500;
        this.spawnPlatform(this.lastPlatformX, randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y), 200);
        
        // Set up collisions
        this.physics.add.collider(
            this.player, 
            this.platforms,
            this.onPlayerLanding,
            null,
            this
        );
        
        this.physics.add.overlap(
            this.player,
            this.collectibles,
            this.collectItem,
            null,
            this
        );

        // Set up UI
        this.setupUI();
    }

    handleJump() {
        // Debug logging to check state
        console.log('Jump attempted:', {
            playerExists: !!this.player,
            bodyExists: !!(this.player && this.player.body),
            onPlatform: this.onPlatform,
            jumping: this.jumping,
            doubleJumpAvailable: this.doubleJumpAvailable,
            velocity: this.player?.body?.velocity?.y
        });

        if (!this.player?.body) return;
        
        // First jump: only when on platform and not already jumping
        if (!this.jumping && this.onPlatform) {
            console.log('First jump triggered');
            this.player.body.velocity.y = this.JUMP_FORCE;
            this.jumping = true;
            this.onPlatform = false;
            this.doubleJumpAvailable = true;
            this.player.setTint(0x00ff00);
        }
        // Double jump: only once while in the air after first jump
        else if (this.jumping && this.doubleJumpAvailable) {
            console.log('Double jump triggered');
            this.player.body.velocity.y = this.JUMP_FORCE;
            this.doubleJumpAvailable = false;
            this.player.setTint(0xffff00);
        }
    }

    update() {
        if (!this.player?.body) return;

        // Keep player at fixed X position
        this.player.x = this.PLAYER_X;
        this.player.body.setVelocityX(0);

        // Handle jump input from up arrow
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.handleJump();
        }

        // Check for game over
        if (this.player.y > 600) {
            this.loseLife();
            return;
        }

        // Move platforms and collectibles left
        const moveAmount = (this.platformSpeed * this.game.loop.delta) / 1000;
        
        // Use getChildren() to safely iterate and filter active game objects
        const platforms = this.platforms.getChildren();
        for (let i = platforms.length - 1; i >= 0; i--) {
            const platform = platforms[i];
            platform.x -= moveAmount;
            if (platform.x < -100) {
                platform.destroy();
            }
        }

        const collectibles = this.collectibles.getChildren();
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            collectible.x -= moveAmount;
            if (collectible.x < -50) {
                collectible.destroy();
            }
        }

        // Spawn new platform if needed
        if (this.lastPlatformX < 900) {
            this.spawnNextPlatform();
        }
    }

    onPlayerLanding(player, platform) {
        // Only handle collision if player is falling onto platform
        if (player.body.velocity.y > 0) {
            console.log('Platform collision:', {
                playerVelocity: player.body.velocity.y,
                onPlatform: this.onPlatform,
                jumping: this.jumping
            });
            
            // Reset all jump states on landing
            player.body.velocity.y = 0;
            this.jumping = false;
            this.onPlatform = true;
            this.doubleJumpAvailable = false;
            player.setTint(0x00aaff);
            
            // Count landing for score if it's a new platform
            if (platform.x > this.PLAYER_X - 50) {
                this.platformsLanded++;
                this.score += 10;
                this.scoreText.setText(`Score: ${this.score}`);
                
                if (this.platformsLanded >= this.nextLevelAt) {
                    this.levelUp();
                }
            }
        } else {
            // If we hit a platform from below or the side while jumping,
            // ensure we're marked as not on platform
            this.onPlatform = false;
        }
    }

    spawnPlatform(x, y, width) {
        // Create platform texture if it doesn't exist
        if (!this.textures.exists('platform_' + width)) {
            const graphics = this.add.graphics();
            graphics.fillStyle(0x888888);
            graphics.fillRect(0, 0, width, 20);
            graphics.generateTexture('platform_' + width, width, 20);
            graphics.destroy();
        }
        
        // Create static platform sprite
        const platform = this.platforms.create(x, y, 'platform_' + width);
        
        // 70% chance to spawn a collectible
        if (Math.random() < 0.7) {
            this.spawnCollectible(x, y - 40);
        }

        return platform;
    }

    spawnCollectible(x, y) {
        const types = ['stone', 'ice', 'energy'];
        const type = types[randInt(0, 2)];
        const color = type === 'stone' ? 0xaaaaaa : type === 'ice' ? 0x66ccff : 0xffee00;
        
        // Create collectible texture if it doesn't exist
        if (!this.textures.exists('collectible_' + type)) {
            const graphics = this.add.graphics();
            graphics.fillStyle(color);
            graphics.fillRect(0, 0, 30, 30);
            graphics.generateTexture('collectible_' + type, 30, 30);
            graphics.destroy();
        }
        
        const collectible = this.collectibles.create(x, y, 'collectible_' + type);
        collectible.type = type;
        
        this.tweens.add({
            targets: collectible,
            y: y - 20,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    collectItem(player, collectible) {
        this.resources[collectible.type]++;
        this.score += 50;
        this.scoreText.setText(`Score: ${this.score}`);
        this.resText.setText(this.resString());
        
        // Create a one-time particle burst effect
        const particles = this.add.particles(0, 0, 'particle', {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            gravityY: 0,
            quantity: 1,
            frequency: 50,
            emitting: false
        });
        
        particles.setPosition(collectible.x, collectible.y);
        particles.start();
        
        // Clean up particles after animation
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
        
        collectible.destroy();
    }

    spawnNextPlatform() {
        const gap = randInt(this.MIN_PLATFORM_GAP, this.MAX_PLATFORM_GAP);
        this.lastPlatformX = Math.max(850, this.lastPlatformX + gap);
        this.spawnPlatform(
            this.lastPlatformX,
            randInt(this.MIN_PLATFORM_Y, this.MAX_PLATFORM_Y),
            200
        );
    }

    levelUp() {
        this.level++;
        window.SHARED.level = this.level;
        this.levelText.setText(`Level: ${this.level}`);
        this.platformSpeed = this.BASE_PLATFORM_SPEED * (1 + this.level * 0.1);
        this.nextLevelAt += 30;
        
        // Visual feedback
        this.cameras.main.flash(500, 0, 255, 0);
        this.tweens.add({
            targets: this.levelText,
            scale: 1.5,
            duration: 200,
            yoyo: true
        });
    }

    loseLife() {
        this.lives--;
        window.SHARED.lives = this.lives;
        window.SHARED.resources = this.resources;
        
        if (this.lives <= 0) {
            this.scene.start('GameOver', { score: this.score });
        } else {
            this.scene.restart();
        }
    }

    setupUI() {
        const textStyle = { fontSize: '24px', color: '#fff' };
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, textStyle);
        this.levelText = this.add.text(20, 50, `Level: ${this.level}`, textStyle);
        this.livesText = this.add.text(20, 80, `Lives: ${this.lives}`, textStyle);
        this.resText = this.add.text(20, 110, this.resString(), textStyle);
    }

    resString() {
        return `Resources: Stone ${this.resources.stone}  Ice ${this.resources.ice}  Energy ${this.resources.energy}`;
    }
} 