// Game configuration and shared state
const SHARED = {
    resources: { stone: 0, ice: 0, energy: 0 },
    level: 1,
    lives: 3,
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MainMenu, WorldMap, Station, GameScene, GameOver],
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 1000 }, debug: false },
    },
};

window.SHARED = SHARED;
window.game = new Phaser.Game(config); 