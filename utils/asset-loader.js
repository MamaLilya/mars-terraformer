/**
 * Asset Loader Utility
 * Centralized asset loading for the Cat Colony Mars Terraformation game
 */

import { ASSETS } from '../config/game-config.js';

export class AssetLoader {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Load all UI icons
     */
    loadIcons() {
        Object.values(ASSETS.ICONS).forEach(path => {
            const key = this.getAssetKey(path);
            this.scene.load.image(key, path);
        });
    }

    /**
     * Load all resource assets
     */
    loadResources() {
        Object.values(ASSETS.RESOURCES).forEach(path => {
            const key = this.getAssetKey(path);
            this.scene.load.image(key, path);
        });
    }

    /**
     * Load player assets
     */
    loadPlayer() {
        // No player asset loading here; handled in GameScene.js
    }

    /**
     * Load building assets
     */
    loadBuildings() {
        Object.values(ASSETS.BUILDINGS).forEach(path => {
            const key = this.getAssetKey(path);
            this.scene.load.image(key, path);
        });
    }

    /**
     * Load UI assets
     */
    loadUI() {
        Object.values(ASSETS.UI).forEach(path => {
            const key = this.getAssetKey(path);
            this.scene.load.image(key, path);
        });
    }

    /**
     * Load background assets
     */
    loadBackgrounds() {
        Object.values(ASSETS.BACKGROUNDS).forEach(path => {
            const key = this.getAssetKey(path);
            this.scene.load.image(key, path);
        });
    }

    /**
     * Load all assets for a specific scene
     */
    loadSceneAssets(sceneName) {
        switch (sceneName) {
            case 'GameScene':
                this.loadGameSceneAssets();
                break;
            case 'Station':
                this.loadStationAssets();
                break;
            case 'MainMenu':
                this.loadMainMenuAssets();
                break;
            case 'WorldMap':
                this.loadWorldMapAssets();
                break;
            case 'LevelComplete':
                this.loadLevelCompleteAssets();
                break;
            case 'GameOver':
                this.loadGameOverAssets();
                break;
            case 'LifeLost':
                this.loadLifeLostAssets();
                break;
            case 'Shop':
                this.loadShopAssets();
                break;
            case 'Ranking':
                this.loadRankingAssets();
                break;
            case 'Settings':
                this.loadSettingsAssets();
                break;
            default:
                this.loadCommonAssets();
        }
    }

    /**
     * Load assets specific to the game scene
     */
    loadGameSceneAssets() {
        this.loadCommonAssets();
        this.loadPlayer();
        this.loadResources();
        this.loadBackgrounds();
        
        // Additional game-specific assets
        this.scene.load.image('iron', 'assets/resource_iron_orb.png');
        this.scene.load.image('ice', 'assets/ice_icon.png');
        this.scene.load.image('progress_bar', 'assets/progress_bar.png');
    }

    /**
     * Load assets specific to the station scene
     */
    loadStationAssets() {
        this.loadCommonAssets();
        this.loadBuildings();
        this.loadBackgrounds();
        this.scene.load.image('ui/build_menu_frame', 'assets/ui/build_menu_frame.png');
    }

    /**
     * Load assets specific to the main menu
     */
    loadMainMenuAssets() {
        this.loadCommonAssets();
        this.scene.load.image('btn_station', 'assets/btn_station.png');
        this.scene.load.image('btn_worldmap', 'assets/btn_worldmap.png');
    }

    /**
     * Load assets specific to the world map
     */
    loadWorldMapAssets() {
        this.loadCommonAssets();
        this.scene.load.image('btn_station', 'assets/btn_station.png');
        this.scene.load.image('btn_worldmap', 'assets/btn_worldmap.png');
    }

    /**
     * Load assets specific to level complete
     */
    loadLevelCompleteAssets() {
        this.loadCommonAssets();
        this.scene.load.image('level_complete_frame', 'assets/level_complete_frame.png');
    }

    /**
     * Load assets specific to game over
     */
    loadGameOverAssets() {
        this.loadCommonAssets();
        this.scene.load.image('gameover_screen', ASSETS.UI.GAMEOVER_SCREEN);
    }

    /**
     * Load assets specific to life lost
     */
    loadLifeLostAssets() {
        this.loadCommonAssets();
        this.scene.load.image('life_lost_screen', ASSETS.UI.LIFE_LOST_SCREEN);
    }

    /**
     * Load assets specific to shop
     */
    loadShopAssets() {
        this.loadCommonAssets();
        // Shop-specific assets would go here
    }

    /**
     * Load assets specific to ranking
     */
    loadRankingAssets() {
        this.loadCommonAssets();
        // Ranking-specific assets would go here
    }

    /**
     * Load assets specific to settings
     */
    loadSettingsAssets() {
        this.loadCommonAssets();
        // Settings-specific assets would go here
    }

    /**
     * Load assets common to all scenes
     */
    loadCommonAssets() {
        this.loadIcons();
        this.loadUI();
    }

    /**
     * Extract asset key from path
     */
    getAssetKey(path) {
        const filename = path.split('/').pop();
        return filename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
    }

    /**
     * Check if an asset exists
     */
    assetExists(key) {
        return this.scene.textures.exists(key);
    }

    /**
     * Get asset dimensions
     */
    getAssetDimensions(key) {
        if (this.assetExists(key)) {
            const texture = this.scene.textures.get(key);
            return {
                width: texture.source[0].width,
                height: texture.source[0].height
            };
        }
        return null;
    }
} 