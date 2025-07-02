/**
 * Main Game Entry Point
 * Cat Colony: Mars Terraformation
 */

// Initialize shared state
window.SHARED = {
    resources: {
        stone: 100,
        ice: 100,
        energy: 100
    },
    progress: {
        level: 1,
        terraforming: 0,
        missions_completed: 0
    },
    lives: 3
};

// Game configuration
const GAME_CONFIG = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [
        MainMenu, WorldMap, Station, GameScene, LevelComplete,
        GameOver, LifeLost, Shop, Ranking, Settings
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create and start the game
const game = new Phaser.Game(GAME_CONFIG);

// Hide loading screen when game is ready
game.events.once('ready', () => {
    document.getElementById('loading').style.display = 'none';
});