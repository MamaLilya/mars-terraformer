/**
 * Game Configuration and Constants
 * Centralized configuration for the Cat Colony Mars Terraformation game
 */

// Shared game state
export const SHARED = {
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

// Game configuration
export const GAME_CONFIG = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#222',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 1000 }, 
            debug: false 
        },
    },
};

// Asset paths
export const ASSETS = {
    // UI Icons
    ICONS: {
        CATCRETE: 'assets/icon_catcrete.png',
        FISHICE: 'assets/icon_fishice.png',
        SOLARPURR: 'assets/icon_solarpurr.png',
        ENERGY: 'assets/energy_icon.png',
        ICE: 'assets/ice_icon.png',
        ORE: 'assets/ore_icon.png'
    },
    
    // Resources
    RESOURCES: {
        IRON_ORB: 'assets/resource_iron_orb.png',
        ICE_ORB: 'assets/resource_ice_orb.png',
        SOLAR_ORB: 'assets/resource_solar_orb.png'
    },
    
    // Player
    PLAYER: {
        CAT_COLONIST: 'assets/cat_colonist_animation.png',
        CAT_FRAME1: 'assets/cat_colonist_frame1_fixed.png'
    },
    
    // Buildings
    BUILDINGS: {
        SOLAR_PANEL: 'assets/solar_panel.png',
        SOLAR_PANEL_UNIT: 'assets/solar_panel_unit.png',
        HABITAT: 'assets/habitat.png',
        ROVER: 'assets/rover.png',
        ROVER_UNIT: 'assets/rover_unit.png',
        STATION: 'assets/station_building.png'
    },
    
    // UI
    UI: {
        TITLE: 'assets/title.png',
        PROGRESS_BAR: 'assets/progress_bar.png',
        GAMEOVER_SCREEN: 'assets/gameover_screen.png',
        LIFE_LOST_SCREEN: 'assets/life_lost_screen.png',
        BUILD_MENU_FRAME: 'assets/ui/build_menu_frame.png'
    },
    
    // Backgrounds
    BACKGROUNDS: {
        GAME_BG: 'assets/game_bg.png',
        STATION_BG: 'assets/station_background_wide.png'
    }
};

// Game constants
export const CONSTANTS = {
    // Player
    PLAYER: {
        SCALE: 1.0,
        GRAVITY: 800,
        BOUNCE: 0.1,
        BODY_SIZE: 64,
        DEPTH: 9999
    },
    
    // Resources
    RESOURCES: {
        SCALE: 0.25,
        COLLECTION_SCORE: 10
    },
    
    // Platform
    PLATFORM: {
        MIN_WIDTH: 100,
        MAX_WIDTH: 200,
        WIDTH_DECREASE_PER_LEVEL: 15,
        HEIGHT: 30
    },
    
    // UI
    UI: {
        ICON_SCALE: 0.15,
        TEXT_DEPTH: 10,
        BUTTON_DEPTH: 5
    },
    
    // Station
    STATION: {
        GRID_COLS: 10,
        GRID_ROWS: 14,
        FOOTER_HEIGHT_RATIO: 0.1,
        GRID_HEIGHT_RATIO: 0.4,
        SCENERY_HEIGHT_RATIO: 0.3,
        HEADER_HEIGHT_RATIO: 0.1
    }
};

// Building definitions
export const BUILDINGS = {
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

// Platform patterns
export const PLATFORM_PATTERNS = [
    [450, 350], // Simple ascent - 2 platforms
    [350, 250, 450], // Complex pattern - 3 platforms
    [450, 250, 350], // Mixed pattern - 3 platforms
    [350, 450, 250], // Wave pattern - 3 platforms
    [250, 450, 350], // High-low pattern - 3 platforms
    [450, 350, 250], // Zigzag pattern - 3 platforms
];

// Utility functions
export const UTILS = {
    randInt: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
    
    canAfford: (cost) => {
        return Object.entries(cost).every(([resource, amount]) => 
            window.SHARED.resources[resource] >= amount
        );
    },
    
    spendResources: (cost) => {
        Object.entries(cost).forEach(([resource, amount]) => {
            window.SHARED.resources[resource] -= amount;
        });
    },
    
    addResources: (resources) => {
        Object.entries(resources).forEach(([resource, amount]) => {
            window.SHARED.resources[resource] += amount;
        });
    }
}; 