class LevelComplete extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelComplete' });
    }

    preload() {
        // Load UI assets for level complete screen
        this.load.image('level_complete_bg', 'assets/level_complete_bg.png');
        this.load.image('level_frame', 'assets/level_complete_frame.png');
        this.load.image('ui_frame', 'assets/ui_frame.png');
        this.load.image('button_frame', 'assets/button_frame.png');
        this.load.image('iron', 'assets/resource_iron_orb.png');
        this.load.image('ice', 'assets/resource_ice_orb.png');
        this.load.image('solar', 'assets/resource_solar_orb.png');
        this.load.image('energy_icon', 'assets/energy_icon.png');
    }

    create(data) {
        const { width, height } = this.scale;
        
        // Get data passed from GameScene
        this.levelData = data || {};
        this.resourcesCollected = this.levelData.resourcesCollected || { iron: 0, ice: 0, solar: 0 };
        this.livesRemaining = this.levelData.livesRemaining || 3;
        this.currentLevel = this.levelData.level || 1;
        this.score = this.levelData.score || 0;

        // Create semi-transparent background overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0, 0);

        // Display the level complete frame asset
        this.add.image(width / 2, height / 2, 'level_frame').setOrigin(0.5);

        // Overlay the player's stats inside the frame
        this.add.text(width / 2, height / 2 + 40, `Score: ${this.score}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Display resources collected
        this.createResourceDisplay(height / 2 + 80);
        
        // Display lives remaining
        this.createLivesDisplay(height / 2 + 120);
        
        // Create buttons below the frame
        this.createButtons();
    }

    createResourceDisplay(yPos) {
        const { width } = this.scale;
        const centerX = width / 2;
        
        const resources = [
            { key: 'iron', icon: 'iron', label: 'Iron', count: this.resourcesCollected.iron },
            { key: 'ice', icon: 'ice', label: 'Ice', count: this.resourcesCollected.ice },
            { key: 'solar', icon: 'solar', label: 'Solar', count: this.resourcesCollected.solar }
        ];
        
        resources.forEach((resource, index) => {
            const xPos = centerX - 150 + (index * 150);
            
            // Resource icon
            const icon = this.add.image(xPos - 20, yPos, resource.icon).setScale(0.06);
            
            // Resource label
            const label = this.add.text(xPos + 10, yPos - 10, resource.label, {
                fontSize: '16px',
                fontFamily: 'monospace',
                fill: '#FFFFFF',
                stroke: '#000',
                strokeThickness: 1
            }).setOrigin(0, 0.5);
            
            // Resource count
            const count = this.add.text(xPos + 10, yPos + 10, `x${resource.count}`, {
                fontSize: '20px',
                fontFamily: 'monospace',
                fill: '#FFD700',
                stroke: '#8B4513',
                strokeThickness: 1
            }).setOrigin(0, 0.5);
        });
    }

    createLivesDisplay(yPos) {
        const { width } = this.scale;
        const centerX = width / 2;
        
        // Lives label
        const livesLabel = this.add.text(centerX - 100, yPos, 'Lives Remaining:', {
            fontSize: '18px',
            fontFamily: 'monospace',
            fill: '#FFFFFF',
            stroke: '#000',
            strokeThickness: 1
        }).setOrigin(0, 0.5);
        
        // Lives count
        const livesCount = this.add.text(centerX + 50, yPos, `${this.livesRemaining}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            fill: '#00FF00',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0, 0.5);
        
        // Add heart icons for visual representation
        for (let i = 0; i < this.livesRemaining; i++) {
            const heart = this.add.text(centerX + 100 + (i * 25), yPos, '♥', {
                fontSize: '20px',
                fontFamily: 'monospace',
                fill: '#FF0000',
                stroke: '#000',
                strokeThickness: 1
            }).setOrigin(0, 0.5);
        }
    }

    createButtons() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const buttonY = height / 2 + 180; // Position below the frame
        
        // Next Level button
        this.nextLevelButton = this.createButton(centerX - 150, buttonY, 'NEXT LEVEL', () => {
            this.startNextLevel();
        });
        
        // Build Station button
        this.buildStationButton = this.createButton(centerX + 150, buttonY, 'BUILD STATION', () => {
            this.buildStation();
        });
    }

    createButton(x, y, text, callback) {
        // Button background
        const buttonBg = this.add.rectangle(x, y, 200, 60, 0x8B4513, 0.8);
        buttonBg.setStrokeStyle(2, 0xFFD700);
        
        // Button text
        const buttonText = this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'monospace',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Make interactive
        buttonBg.setInteractive({ useHandCursor: true });
        buttonBg.on('pointerdown', callback);
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0xA0522D, 0.9);
        });
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x8B4513, 0.8);
        });
        
        return { bg: buttonBg, text: buttonText };
    }

    startNextLevel() {
        // Increment level and update game settings
        const nextLevel = this.currentLevel + 1;
        
        // Update shared game state
        window.SHARED.level = nextLevel;
        
        // Increase scroll speed for next level
        window.SHARED.scrollSpeed = Math.min(200 + (nextLevel - 1) * 25, 400); // Cap at 400
        
        // Add one more platform at start for next level
        window.SHARED.extraPlatforms = (nextLevel - 1);
        
        console.log(`[DEBUG] Starting level ${nextLevel} with speed ${window.SHARED.scrollSpeed}`);
        
        // Return to game scene with updated settings
        this.scene.start('GameScene');
    }

    buildStation() {
        // Navigate to station building screen
        console.log('[DEBUG] Building station...');
        
        // For now, just go to the station scene
        // You can implement the station building logic later
        this.scene.start('Station');
    }
} 