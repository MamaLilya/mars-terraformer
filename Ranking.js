class Ranking extends Phaser.Scene {
    constructor() { super('Ranking'); }
    
    preload() {
        // Load cat-themed assets
        this.load.image('icon_catcrete', 'assets/icon_catcrete.png');
    }
    
    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        
        // Title with cat theme
        this.add.text(centerX, 60, '🏆 Top Feline Explorers 🏆', { 
            fontSize: 36, 
            color: '#fff',
            fontStyle: 'bold',
            stroke: '#FFD700',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(centerX, 100, 'The most successful cat colonists on Mars!', { 
            fontSize: 18, 
            color: '#ccc',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Cat-themed rankings
        const rankings = [
            { name: 'Whiskers the Brave', score: 3200, achievement: '🐱 First to reach the summit!' },
            { name: 'Luna the Explorer', score: 2400, achievement: '🌙 Night mission specialist' },
            { name: 'Shadow the Stealth', score: 1800, achievement: '👻 Master of stealth' },
            { name: 'Mittens the Builder', score: 900, achievement: '🏗️ Station construction expert' },
            { name: 'Fluffy the Pioneer', score: 500, achievement: '🚀 First landing party' }
        ];
        
        rankings.forEach((player, i) => {
            const yPos = 160 + (i * 50);
            
            // Rank number
            this.add.text(centerX - 300, yPos, `${i + 1}.`, { 
                fontSize: 24, 
                color: i < 3 ? '#FFD700' : '#ccc',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            
            // Player name
            this.add.text(centerX - 250, yPos, player.name, { 
                fontSize: 20, 
                color: '#fff',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            
            // Score
            this.add.text(centerX + 50, yPos, `${player.score} pts`, { 
                fontSize: 18, 
                color: '#ffb366',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            
            // Achievement
            this.add.text(centerX - 250, yPos + 20, player.achievement, { 
                fontSize: 14, 
                color: '#aaa',
                fontStyle: 'italic'
            }).setOrigin(0, 0.5);
        });
        
        // Encouragement message
        this.add.text(centerX, height - 120, '🐾 Can you become the top feline explorer?', { 
            fontSize: 18, 
            color: '#ffb366',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Back button
        const backBtn = this.add.text(centerX, height - 60, '🐱 Back to Menu', { 
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