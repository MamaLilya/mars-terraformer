const SHARED = {
    resources: { stone: 0, ice: 0, energy: 0 },
    level: 1,
    lives: 3,
    terraforming: 0,
};

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#222',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MainMenu, WorldMap, Station, GameScene, GameOver, Shop, Ranking, Settings, LifeLost],
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 1000 }, debug: false },
    },
};

window.SHARED = SHARED;
window.game = new Phaser.Game(config);