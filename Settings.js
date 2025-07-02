class Settings extends Phaser.Scene {
    constructor() { super('Settings'); }
    
    preload() {
        // Load cat-themed assets
        this.load.image('icon_catcrete', 'assets/icon_catcrete.png');
    }
    
    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        
        // Title with cat theme
        this.add.text(centerX, 60, '⚙️ Cat Colony Settings ⚙️', { 
            fontSize: 36, 
            color: '#fff',
            fontStyle: 'bold',
            stroke: '#8B4513',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(centerX, 100, 'Configure your feline space adventure!', { 
            fontSize: 18, 
            color: '#ccc',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Reset progress button with cat theme
        const resetBtn = this.add.text(centerX, 200, '🔄 Reset Colony Progress', { 
            fontSize: 28, 
            color: '#ff0', 
            backgroundColor: '#444',
            padding: { x: 20, y: 10 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        resetBtn.on('pointerover', () => resetBtn.setBackgroundColor('#666'));
        resetBtn.on('pointerout', () => resetBtn.setBackgroundColor('#444'));
        resetBtn.on('pointerup', () => {
            window.SHARED.resources = { stone: 0, ice: 0, energy: 0 };
            window.SHARED.level = 1;
            window.SHARED.lives = 3;
            window.SHARED.terraforming = 0;
            alert('🐱 Colony progress reset! Time to start fresh!');
        });
        
        // Warning message
        this.add.text(centerX, 250, '⚠️ This will reset all your progress and resources!', { 
            fontSize: 16, 
            color: '#ff6666',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Current progress display
        this.add.text(centerX, 320, '📊 Current Progress:', { 
            fontSize: 24, 
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const progressText = `Level: ${window.SHARED.level || 1} | Lives: ${window.SHARED.lives || 3} | Terraforming: ${window.SHARED.terraforming || 0}%`;
        this.add.text(centerX, 350, progressText, { 
            fontSize: 18, 
            color: '#ffb366',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Resource display
        const resourceText = `Catcrete: ${window.SHARED.resources?.stone || 0} | Fish-Ice: ${window.SHARED.resources?.ice || 0} | Solar Purr: ${window.SHARED.resources?.energy || 0}`;
        this.add.text(centerX, 380, resourceText, { 
            fontSize: 16, 
            color: '#ccc'
        }).setOrigin(0.5);
        
        // Back button
        const backBtn = this.add.text(centerX, height - 60, '🐾 Back to Menu', { 
            fontSize: 28, 
            color: '#fff', 
            backgroundColor: '#333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        backBtn.on('pointerover', () => backBtn.setBackgroundColor('#555'));
        backBtn.on('pointerout', () => backBtn.setBackgroundColor('#333'));
        backBtn.on('pointerup', () => this.scene.start('MainMenu'));
    }
}