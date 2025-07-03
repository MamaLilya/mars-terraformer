/**
 * Game Scene - Main platformer gameplay
 * Handles player movement, resource collection, and level progression
 */

// This file is deprecated. Use the root GameScene.js instead.

import { AssetLoader } from '../utils/asset-loader.js';
import { UIManager } from '../utils/ui-manager.js';
import { CONSTANTS, UTILS, PLATFORM_PATTERNS } from '../config/game-config.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.assetLoader = null;
        this.uiManager = null;
        this.player = null;
        this.platforms = null;
        this.resources = null;
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.levelCompleted = false;
        this.nextResourceType = 'iron';
    }

    preload() {
        this.assetLoader = new AssetLoader(this);
        this.assetLoader.loadSceneAssets('GameScene');
    }

    create() {
        this.uiManager = new UIManager(this);
        this.setupBackground();
        this.initializeGameState();
        this.createPlatforms();
        this.createPlayer();
        this.createUI();
        this.setupPhysics();
        this.setupInput();
        this.setupCamera();
        this.createAnimations();
    }

    setupBackground() {
        const { width, height } = this.scale;
        const bg = this.add.image(0, 0, 'game_bg')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-1);
        bg.setDisplaySize(width, height);
    }

    initializeGameState() {
        this.score = 0;
        this.lives = window.SHARED.lives;
        this.gameOver = false;
        this.levelCompleted = false;
        this.platformsPlaced = 0;
        this.levelEndPlatformCreated = false;
        this.levelEndPlatform = null;
        this.levelEndText = null;
        this.autoSpeed = 150 + (window.SHARED.progress.level - 1) * 20;
        
        this.platforms = this.physics.add.staticGroup();
        this.resources = this.physics.add.group();
        this.nextResourceType = 'iron';
    }

    createPlatforms() {
        // Create initial platform
        const firstPlatform = this.createPlatform(250, 450);
        this.addResourceToPlatform(firstPlatform);
        
        // Create second platform for better gameplay
        const secondPlatform = this.createPlatform(570, 350);
        this.addResourceToPlatform(secondPlatform);
        
        // Create lava
        this.lava = this.add.rectangle(0, 580, 4000, 40, 0xff0000, 0.5)
            .setOrigin(0, 0);
    }

    createPlatform(x, y) {
        const platformWidth = this.getPlatformWidth();
        const platform = this.add.rectangle(x, y, platformWidth, CONSTANTS.PLATFORM.HEIGHT, 0x8B4513);
        this.platforms.add(platform);
        
        this.physics.add.existing(platform, true);
        platform.body.setSize(platformWidth, CONSTANTS.PLATFORM.HEIGHT);
        platform.body.setOffset(0, 0);
        platform.body.immovable = true;
        platform.body.allowGravity = false;

        return platform;
    }

    getPlatformWidth() {
        return Math.max(
            CONSTANTS.PLATFORM.MIN_WIDTH, 
            CONSTANTS.PLATFORM.MAX_WIDTH - (window.SHARED.progress.level - 1) * CONSTANTS.PLATFORM.WIDTH_DECREASE_PER_LEVEL
        );
    }

    createPlayer() {
        // Determine player texture
        let playerTexture = 'cat_colonist_frame1';
        if (!this.textures.exists('cat_colonist_frame1')) {
            playerTexture = 'cat_colonist';
        }
        
        // Create player sprite
        this.player = this.physics.add.sprite(250, 410, playerTexture);
        
        // Setup physics
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(CONSTANTS.PLAYER.GRAVITY);
        this.player.setBounce(CONSTANTS.PLAYER.BOUNCE);
        this.player.setScale(CONSTANTS.PLAYER.SCALE);
        this.player.body.setSize(CONSTANTS.PLAYER.BODY_SIZE, CONSTANTS.PLAYER.BODY_SIZE);
        this.player.body.setOffset(0, 0);
        
        // Setup visibility
        this.player.setVisible(true);
        this.player.setDepth(CONSTANTS.PLAYER.DEPTH);
        
        // Setup player state
        this.player.setData('onPlatform', true);
        this.player.setData('jumping', false);
        this.player.setData('doubleJumpAvailable', true);
        this.player.setData('currentState', 'idle');
        this.player.setData('lastState', 'idle');
    }

    createUI() {
        const { width, height } = this.scale;
        
        // Resource displays
        this.resourceDisplays = {
            catcrete: this.uiManager.createResourceDisplay(16, 80, 'icon_catcrete', window.SHARED.resources.stone),
            fishice: this.uiManager.createResourceDisplay(16, 110, 'icon_fishice', window.SHARED.resources.ice),
            energy: this.uiManager.createResourceDisplay(16, 140, 'icon_solarpurr', window.SHARED.resources.energy)
        };
        
        // Score and lives
        this.scoreText = this.uiManager.createAnimatedText(16, 16, `Score: ${this.score}`, {
            fontSize: '24px',
            strokeThickness: 3
        });
        
        this.livesText = this.uiManager.createAnimatedText(16, 50, `Lives: ${this.lives}`, {
            fontSize: '20px'
        });
        
        // Terraforming progress
        this.terraformingText = this.uiManager.createAnimatedText(width - 16, 16, 
            `Terraforming: ${window.SHARED.progress.terraforming || 0}%`, {
            fontSize: '20px'
        }).setOrigin(1, 0);
    }

    setupPhysics() {
        // Player-platform collisions
        this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, null, this);
        
        // Player-resource overlaps
        this.physics.add.overlap(this.player, this.resources, this.collectResource, null, this);
        
        // Player-lava overlaps
        this.physics.add.overlap(this.player, this.lava, () => {
            if (!this.levelCompleted) {
                this.loseLife();
            }
        }, null, this);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceWasDown = false;
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, 4000, 600);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.0);
        this.cameras.main.setBackgroundColor(0x87CEEB);
        this.physics.world.setBounds(0, 0, 4000, 600, false, false, false, false);
    }

    createAnimations() {
        // Idle animation
        this.anims.create({
            key: 'cat_idle',
            frames: [{ key: 'cat_colonist_frame1' }],
            frameRate: 1,
            repeat: -1
        });

        // Walk animation
        this.anims.create({
            key: 'cat_walk',
            frames: this.anims.generateFrameNumbers('cat_colonist', { start: 1, end: 2 }),
            frameRate: 8,
            repeat: -1
        });

        // Jump animation
        this.anims.create({
            key: 'cat_jump',
            frames: this.anims.generateFrameNumbers('cat_colonist', { start: 3, end: 3 }),
            frameRate: 10,
            repeat: 1
        });
        
        // Start with idle animation
        this.player.play('cat_idle');
    }

    update() {
        if (this.gameOver || this.levelCompleted) return;
        
        this.handlePlayerInput();
        this.updatePlayerAnimation();
        this.checkLevelCompletion();
        this.generatePlatforms();
    }

    handlePlayerInput() {
        const playerOnGround = this.player.getData('onPlatform');
        
        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }
        
        // Jumping
        if (this.spaceKey.isDown && !this.spaceWasDown) {
            if (playerOnGround) {
                this.player.setVelocityY(-400);
                this.player.setData('jumping', true);
                this.player.setData('onPlatform', false);
            } else if (this.player.getData('doubleJumpAvailable')) {
                this.player.setVelocityY(-350);
                this.player.setData('doubleJumpAvailable', false);
            }
        }
        this.spaceWasDown = this.spaceKey.isDown;
    }

    updatePlayerAnimation() {
        const playerOnGround = this.player.getData('onPlatform');
        let currentState = 'idle';
        
        if (playerOnGround) {
            if (Math.abs(this.player.body.velocity.x) > 10) {
                currentState = 'walk';
                if (this.player.anims.currentAnim?.key !== 'cat_walk') {
                    this.player.play('cat_walk', true);
                }
            } else {
                currentState = 'idle';
                if (this.player.anims.currentAnim?.key !== 'cat_idle') {
                    this.player.play('cat_idle', true);
                }
            }
        } else {
            currentState = 'jump';
            if (this.player.anims.currentAnim?.key !== 'cat_jump') {
                this.player.play('cat_jump', true);
            }
        }
        
        this.player.setData('currentState', currentState);
    }

    handlePlatformCollision(player, platform) {
        if (player.body.velocity.y > 0) {
            player.setData('onPlatform', true);
            player.setData('jumping', false);
            player.setData('doubleJumpAvailable', true);
        }
    }

    addResourceToPlatform(platform) {
        const resourceXOffset = platform.width / 4;
        const resourceX = platform.x + UTILS.randInt(-resourceXOffset, resourceXOffset);
        const resourceY = platform.y - 30;
        
        let resource;
        if (this.nextResourceType === 'ice') {
            resource = this.resources.create(resourceX, resourceY, 'resource_ice_orb');
        } else if (this.nextResourceType === 'energy') {
            resource = this.resources.create(resourceX, resourceY, 'icon_solarpurr');
        } else {
            resource = this.resources.create(resourceX, resourceY, 'resource_iron_orb');
        }
        
        resource.setScale(CONSTANTS.RESOURCES.SCALE);
        resource.body.setSize(resource.width * CONSTANTS.RESOURCES.SCALE, resource.height * CONSTANTS.RESOURCES.SCALE);
        resource.setData('type', this.nextResourceType);
        resource.setImmovable(true);
        resource.body.allowGravity = false;
        
        // Cycle resource types
        if (this.nextResourceType === 'iron') {
            this.nextResourceType = 'ice';
        } else if (this.nextResourceType === 'ice') {
            this.nextResourceType = 'energy';
        } else {
            this.nextResourceType = 'iron';
        }
    }

    collectResource(player, resource) {
        const resourceType = resource.getData('type');
        resource.destroy();
        
        // Update score
        this.score += CONSTANTS.RESOURCES.COLLECTION_SCORE;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Update resources
        if (resourceType === 'iron') {
            window.SHARED.resources.stone += 1;
            this.resourceDisplays.catcrete.updateValue(window.SHARED.resources.stone);
        } else if (resourceType === 'ice') {
            window.SHARED.resources.ice += 1;
            this.resourceDisplays.fishice.updateValue(window.SHARED.resources.ice);
        } else if (resourceType === 'energy') {
            window.SHARED.resources.energy += 1;
            this.resourceDisplays.energy.updateValue(window.SHARED.resources.energy);
        }
    }

    generatePlatforms() {
        if (this.platformsPlaced >= 10) return;
        
        const rightmostPlatform = this.getRightmostPlatform();
        if (!rightmostPlatform) return;
        
        const MIN_GAP = 120;
        const MAX_GAP = 180;
        const Y_LEVELS = [250, 350, 450];
        
        let gap = UTILS.randInt(MIN_GAP, MAX_GAP);
        if (this.platformsPlaced % 5 === 0 && this.platformsPlaced > 5) {
            gap = UTILS.randInt(160, 200);
        }
        
        const newX = rightmostPlatform.x + gap;
        const targetY = Y_LEVELS[UTILS.randInt(0, Y_LEVELS.length - 1)];
        
        // Check if jump is too difficult
        const dx = newX - rightmostPlatform.x;
        const dy = Math.abs(targetY - rightmostPlatform.y);
        
        if (dx > 150 && dy > 150) {
            const adjustedY = targetY + 100;
            const platform = this.createPlatform(newX, adjustedY);
            this.addResourceToPlatform(platform);
            this.platformsPlaced++;
        } else {
            const platform = this.createPlatform(newX, targetY);
            this.addResourceToPlatform(platform);
            this.platformsPlaced++;
        }
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

    checkLevelCompletion() {
        if (this.levelCompleted || this.levelEndPlatformCreated) return;
        
        if (this.platformsPlaced >= 8) {
            this.createLevelEndPlatform();
        }
    }

    createLevelEndPlatform() {
        const rightmostPlatform = this.getRightmostPlatform();
        if (!rightmostPlatform) return;
        
        this.levelEndPlatform = this.createPlatform(rightmostPlatform.x + 200, 300);
        this.levelEndPlatformCreated = true;
        
        this.levelEndText = this.add.text(this.levelEndPlatform.x, this.levelEndPlatform.y - 50, 'LEVEL COMPLETE!', {
            fontSize: '24px',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    completeLevel() {
        this.levelCompleted = true;
        this.player.setVelocityX(0);
        
        // Calculate earned resources
        const earned = Math.floor(this.score / 10);
        window.SHARED.resources.stone += earned;
        window.SHARED.resources.ice += Math.floor(earned / 2);
        window.SHARED.progress.terraforming = Math.min(100, window.SHARED.progress.terraforming + 10);
        window.SHARED.progress.level++;
        
        // Increment missions completed for building unlocks
        window.SHARED.progress.missions_completed++;
        
        this.scene.start('LevelComplete', { 
            score: this.score,
            resourcesEarned: {
                stone: earned,
                ice: Math.floor(earned / 2),
                terraforming: 10
            }
        });
    }

    loseLife() {
        this.lives--;
        this.livesText.setText(`Lives: ${this.lives}`);
        
        if (this.lives <= 0) {
            this.endGame();
        } else {
            this.scene.start('LifeLost');
        }
    }

    resetPlayer() {
        this.player.setPosition(250, 410);
        this.player.setVelocity(0, 0);
        this.player.setData('onPlatform', true);
        this.player.setData('jumping', false);
        this.player.setData('doubleJumpAvailable', true);
    }

    endGame() {
        this.gameOver = true;
        this.scene.start('GameOver', { score: this.score });
    }
} 