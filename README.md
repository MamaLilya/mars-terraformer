# 🐱 Cat Colony: Mars Terraformation 🐱

A cat-themed Mars colonization platformer game built with Phaser 3. Help your feline astronauts collect resources, build a space station, and terraform the red planet!

## 🎮 Game Overview

- **Platformer Gameplay**: Jump between platforms, collect resources, and avoid lava
- **Resource Management**: Gather Catcrete (stone), Fish-Ice (ice), and Solar Purr (energy)
- **Station Building**: Construct and manage your Mars colony with various buildings
- **Progressive Difficulty**: Levels get harder as you advance
- **Cat-Themed**: Everything is cat-themed, from the astronaut to the resources!

## 🏗️ Project Structure

```
Terraformation/
├── config/
│   └── game-config.js          # Centralized configuration and constants
├── utils/
│   ├── asset-loader.js         # Asset loading utilities
│   └── ui-manager.js           # UI management utilities
├── scenes/
│   ├── GameScene.js            # Main platformer gameplay
│   ├── Station.js              # Station building scene
│   ├── MainMenu.js             # Main menu
│   ├── WorldMap.js             # World map navigation
│   ├── LevelComplete.js        # Level completion screen
│   ├── GameOver.js             # Game over screen
│   ├── LifeLost.js             # Life lost screen
│   ├── Shop.js                 # Shop interface
│   ├── Ranking.js              # Leaderboard
│   └── Settings.js             # Settings menu
├── assets/                     # Game assets (images, sounds)
├── index.html                  # Main HTML file
├── main.js                     # Game entry point
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser
- A local web server (for development)

### Installation
1. Clone or download the project
2. Start a local web server in the project directory:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
3. Open your browser and navigate to `http://localhost:8000`

## 🎯 Game Controls

- **Arrow Keys**: Move left/right
- **Space**: Jump (double-tap for double jump)
- **Mouse**: Navigate menus and build interface

## 🏗️ Architecture

### Configuration Management
- **`config/game-config.js`**: Centralized configuration for all game settings, constants, and shared data
- **Asset paths**: Organized by category (UI, resources, buildings, etc.)
- **Game constants**: Player physics, UI scaling, platform dimensions, etc.
- **Building definitions**: All buildable structures with costs, descriptions, and unlock conditions

### Asset Management
- **`utils/asset-loader.js`**: Centralized asset loading with scene-specific loading strategies
- **Automatic asset key generation**: Converts file paths to texture keys
- **Asset validation**: Checks for missing assets and provides fallbacks
- **Scene-specific loading**: Only loads assets needed for each scene

### UI Management
- **`utils/ui-manager.js`**: Reusable UI components and utilities
- **Resource displays**: Standardized resource counters with icons
- **Navigation buttons**: Interactive buttons with hover effects
- **Modal dialogs**: Reusable modal system for menus and confirmations
- **Progress bars**: Animated progress indicators
- **Animated text**: Text with optional animation effects

### Scene Architecture
Each scene follows a consistent pattern:
1. **Constructor**: Initialize scene properties
2. **preload()**: Load required assets using AssetLoader
3. **create()**: Setup scene elements, UI, and game logic
4. **update()**: Handle game loop updates
5. **Cleanup**: Proper resource management

## 🎨 Asset Guidelines

### Image Assets
- **Player sprites**: 256x256 pixels for animation frames
- **UI icons**: 64x64 pixels for interface elements
- **Resource orbs**: 256x256 pixels for collectibles
- **Building units**: 256x256 pixels for station buildings
- **Backgrounds**: Full resolution, will be scaled automatically

### Naming Conventions
- **Player**: `cat_colonist_*`
- **Resources**: `resource_*_orb`
- **Icons**: `icon_*`
- **Buildings**: `*_unit` for station buildings
- **UI**: Descriptive names like `build_menu_frame`

## 🔧 Development Guidelines

### Code Style
- Use ES6+ features (const, let, arrow functions, classes)
- Follow JSDoc commenting for functions and classes
- Use descriptive variable and function names
- Keep functions focused and single-purpose

### Performance
- Load only necessary assets per scene
- Use object pooling for frequently created/destroyed objects
- Minimize DOM manipulation
- Use Phaser's built-in optimization features

### Error Handling
- Always check for asset existence before use
- Provide fallbacks for missing assets
- Use try-catch blocks for critical operations
- Log errors for debugging

### Memory Management
- Properly destroy objects when scenes change
- Clear event listeners and timers
- Use scene cleanup methods
- Monitor memory usage in development

## 🐛 Debugging

### Console Logging
The game includes comprehensive debug logging:
- Asset loading status
- Player state changes
- Resource collection events
- Platform generation
- Scene transitions

### Common Issues
1. **Assets not loading**: Check file paths and server configuration
2. **Player not visible**: Verify texture loading and scaling
3. **Physics issues**: Check collision group setup
4. **Performance problems**: Monitor asset sizes and loading

## 🚀 Future Enhancements

### Planned Features
- [ ] Sound effects and background music
- [ ] More building types and upgrades
- [ ] Achievement system
- [ ] Save/load game state
- [ ] Mobile touch controls
- [ ] Multiplayer features
- [ ] More cat animations and effects

### Technical Improvements
- [ ] WebGL shader effects
- [ ] Particle systems for visual effects
- [ ] Advanced physics simulation
- [ ] Procedural level generation
- [ ] Performance optimization
- [ ] Accessibility features

## 📝 License

This project is open source. Feel free to use, modify, and distribute according to your needs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐱 Credits

- **Game Concept**: Cat-themed Mars colonization
- **Engine**: Phaser 3
- **Assets**: Custom cat-themed pixel art
- **Development**: Built with modern JavaScript and web technologies

---

**Happy terraforming, space cats! 🐱🚀** 