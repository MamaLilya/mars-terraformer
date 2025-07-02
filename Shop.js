class Shop extends Phaser.Scene {
    constructor() { super('Shop'); }
    
    preload() {
        // Load cat-themed shop assets
        this.load.image('icon_catcrete', 'assets/icon_catcrete.png');
    }
    
    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        
        // Title with cat theme
        this.add.text(centerX, 60, '🐱 Cat Colony Boutique 🐱', { 
            fontSize: 36, 
            color: '#fff',
            fontStyle: 'bold',
            stroke: '#8B4513',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(centerX, 100, 'Cosmetic upgrades for your feline astronaut!', { 
            fontSize: 18, 
            color: '#ccc',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Cat-themed cosmetic items
        const items = [
            { name: '🧶 Fancy Space Collar', cost: 100, color: '#ff6666', description: 'A luxurious collar with bells' },
            { name: '🐾 Paw-Print Helmet', cost: 200, color: '#66ccff', description: 'Helmet with cute paw prints' },
            { name: '🎀 Bow Tie Spacesuit', cost: 300, color: '#ff99cc', description: 'Elegant bow tie for formal missions' },
            { name: '🌟 Starry Tail Cover', cost: 500, color: '#ffd700', description: 'Glittery tail protection' }
        ];
        
        items.forEach((item, index) => {
            const yPos = 180 + (index * 60);
            
            // Item name
            this.add.text(centerX - 200, yPos, item.name, { 
                fontSize: 20, 
                color: item.color,
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            
            // Cost
            this.add.text(centerX + 100, yPos, `${item.cost} 🪨`, { 
                fontSize: 18, 
                color: '#FFD700',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
            
            // Description
            this.add.text(centerX - 200, yPos + 20, item.description, { 
                fontSize: 14, 
                color: '#aaa',
                fontStyle: 'italic'
            }).setOrigin(0, 0.5);
        });
        
        // Note about resources
        this.add.text(centerX, height - 120, '💡 Tip: Resources are earned by completing missions!', { 
            fontSize: 16, 
            color: '#ffb366',
            fontStyle: 'italic'
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