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
    station: {
        baseUpkeep: 6,
        buildings: [],
        buildCapacity: 3
    },
    progress: {
        level: 1,
        terraforming: 0,
        missions_completed: 0
    },
    lives: 3
};

// Building definitions
window.BUILDINGS = {
    'solar_panel': {
        name: 'Solar Panel',
        description: 'Generates passive energy.',
        cost: { stone: 10, ice: 5, energy: 0 },
        upkeep: -2, // Negative upkeep = generation
        unlock: {},
        asset: 'solar_panel_unit'
    },
    'habitat': {
        name: 'Station Hub',
        description: 'The center of your new colony.',
        cost: { stone: 100, ice: 50, energy: 20 },
        upkeep: 2,
        unlock: { missions_completed: 1 },
        asset: 'station'
    },
    'living_quarters': {
        name: 'Living Quarters',
        description: 'Increases station build capacity.',
        cost: { stone: 20, energy: 5 },
        upkeep: 2,
        unlock: { missions_completed: 1 },
        asset: 'habitat'
    },
    'greenhouse': {
        name: 'Greenhouse',
        description: 'Grows food and improves atmosphere.',
        cost: { stone: 10, ice: 5 },
        upkeep: 2,
        unlock: { terraforming: 20 },
        asset: 'habitat'
    },
    'water_module': {
        name: 'Water Module',
        description: 'Extracts and recycles water.',
        cost: { stone: 5, ice: 10 },
        upkeep: 3,
        unlock: { missions_completed: 2 },
        asset: 'habitat'
    },
    'lab': {
        name: 'Research Lab',
        description: 'Unlocks new technologies.',
        cost: { stone: 15, ice: 5, energy: 10 },
        upkeep: 5,
        unlock: { terraforming: 40 },
        asset: 'habitat'
    },
    'rover_bay': {
        name: 'Rover Bay',
        description: 'Required to deploy the Mars Rover.',
        cost: { stone: 50, ice: 20, energy: 15 },
        upkeep: 1,
        unlock: {},
        asset: 'rover_unit'
    }
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
    dom: {
        createContainer: true
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