# 🐱 Cat Colony: Mars Terraformation 🚀

[![Phaser](https://img.shields.io/badge/Phaser-3.60.0-blue.svg)](https://phaser.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen.svg)](package.json)

A sophisticated cat-themed Mars colonization platformer game built with Phaser 3 and Firebase. Help your feline astronauts collect resources, build a space station, and terraform the red planet through engaging gameplay mechanics and persistent progression systems.

## 🎮 Game Features

### Core Gameplay
- **Platformer Mechanics**: Smooth jumping, double-jump, and physics-based movement
- **Resource Collection**: Gather Catcrete (stone), Fish-Ice (ice), and Energy orbs
- **Progressive Difficulty**: Increasingly challenging levels with dynamic platform generation
- **Lives System**: Three lives with strategic gameplay consequences

### Station Management
- **Interactive Building System**: Click buildings for context menus and management options
- **Persistent State**: All buildings and progress saved to Firebase
- **Resource Management**: Strategic resource allocation for building construction
- **Building Types**: Solar panels, habitats, research labs, and more

### User Experience
- **Authentication System**: Login/register with Firebase Auth
- **Auto-save**: Automatic progress saving to cloud
- **Responsive Design**: Works across different screen sizes
- **Modern UI**: Clean, intuitive interface with hover effects

## 🏗️ Technical Architecture

### Technology Stack
- **Game Engine**: Phaser 3.60.0
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Build System**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with modern features

### Project Structure
```
Terraformation/
├── 📁 config/
│   └── game-config.js          # Centralized game configuration
├── 📁 scenes/
│   ├── GameScene.js            # Main platformer gameplay
│   ├── Station.js              # Station building & management
│   ├── MainMenu.js             # Main menu with auth
│   ├── WorldMap.js             # Navigation hub
│   ├── Login.js                # Authentication system
│   ├── LevelComplete.js        # Level completion
│   ├── GameOver.js             # Game over screen
│   ├── LifeLost.js             # Life lost screen
│   ├── Shop.js                 # In-game shop
│   ├── Ranking.js              # Leaderboards
│   └── Settings.js             # Game settings
├── 📁 utils/
│   ├── asset-loader.js         # Asset management
│   └── ui-manager.js           # UI components
├── 📁 assets/                  # Game assets
├── 📄 index.html               # Main entry point
├── 📄 main.js                  # Game initialization
├── 📄 firebase.js.template     # Firebase configuration template
└── 📄 README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server for development
- Firebase project (for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MamaLilya/mars-terraformer.git
   cd mars-terraformer
   ```

2. **Set up Firebase (Optional but recommended)**
   ```bash
   # Copy the template file
   cp firebase.js.template firebase.js
   
   # Edit firebase.js with your configuration
   # Get your config from: https://console.firebase.google.com/
   ```

3. **Start development server**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

4. **Open in browser**
   Navigate to `http://localhost:8000`

## 🎯 Game Controls

### Platformer Controls
- **← → Arrow Keys**: Move left/right
- **Space**: Jump
- **Double-tap Space**: Double jump
- **Mouse**: Menu navigation and building interface

### Station Management
- **Click Building**: Open context menu
- **Build Menu**: Access construction options
- **Grid Placement**: Click tiles to place buildings

## 🔧 Development Guide

### Code Style & Standards
- **ES6+ Features**: Use modern JavaScript (const, let, arrow functions, classes)
- **JSDoc Comments**: Document all functions and classes
- **Consistent Naming**: Descriptive variable and function names
- **Modular Design**: Single-purpose functions and components

### Performance Optimization
- **Asset Loading**: Scene-specific asset loading
- **Object Pooling**: Reuse frequently created objects
- **Memory Management**: Proper cleanup in scene transitions
- **Rendering**: Optimized sprite and graphics rendering

### Error Handling
- **Asset Validation**: Check for missing assets with fallbacks
- **Try-Catch Blocks**: Critical operation error handling
- **Debug Logging**: Comprehensive console logging for development
- **Graceful Degradation**: Fallback behavior for missing features

## 🎨 Asset Guidelines

### Image Specifications
| Asset Type | Size | Format | Purpose |
|------------|------|--------|---------|
| Player Sprites | 256x256px | PNG | Character animations |
| UI Icons | 64x64px | PNG | Interface elements |
| Resource Orbs | 256x256px | PNG | Collectible items |
| Building Units | 256x256px | PNG | Station structures |
| Backgrounds | Variable | PNG | Scene backgrounds |

### Naming Conventions
- **Player**: `cat_colonist_*`
- **Resources**: `resource_*_orb`
- **Icons**: `icon_*`
- **Buildings**: `*_unit` for station buildings
- **UI Elements**: Descriptive names (e.g., `build_menu_frame`)

## 🔒 Security & Privacy

### Firebase Security
- **Client-side Keys**: Firebase config keys are safe for client-side use
- **Database Rules**: Configure Firebase Realtime Database security rules
- **Authentication**: User data is protected by Firebase Auth
- **Environment Variables**: Use `.env` files for sensitive data in production

### Data Protection
- **User Privacy**: Minimal data collection, user-controlled data
- **Secure Storage**: Firebase provides enterprise-grade security
- **GDPR Compliance**: User data can be deleted on request

## 🐛 Debugging & Troubleshooting

### Common Issues

#### Assets Not Loading
```bash
# Check file paths and server configuration
# Ensure assets are in the correct directory
# Verify file permissions
```

#### Firebase Connection Issues
```bash
# Verify firebase.js configuration
# Check Firebase project settings
# Ensure Realtime Database is enabled
```

#### Performance Problems
```bash
# Monitor asset sizes
# Check browser console for errors
# Verify memory usage
```

### Debug Tools
- **Console Logging**: Comprehensive debug output
- **Browser DevTools**: Performance and network monitoring
- **Firebase Console**: Real-time database monitoring

## 🚀 Deployment

### Production Build
1. **Optimize Assets**: Compress images and audio
2. **Minify Code**: Use build tools for production
3. **Configure Firebase**: Set up production Firebase project
4. **Deploy**: Upload to web server or CDN

### Hosting Options
- **Firebase Hosting**: Integrated with Firebase ecosystem
- **Netlify**: Easy deployment with Git integration
- **Vercel**: Fast deployment for modern web apps
- **Traditional Web Server**: Apache, Nginx, etc.

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Review Process
- All contributions require review
- Ensure code follows style guidelines
- Add tests for new features
- Update documentation as needed

### Issue Reporting
- Use GitHub Issues for bug reports
- Provide detailed reproduction steps
- Include browser and system information
- Attach screenshots when helpful

## 📈 Roadmap

### Version 1.1 (Next Release)
- [ ] Sound effects and background music
- [ ] Additional building types
- [ ] Achievement system
- [ ] Mobile touch controls

### Version 1.2 (Future)
- [ ] Multiplayer features
- [ ] Advanced physics simulation
- [ ] Procedural level generation
- [ ] WebGL shader effects

### Long-term Goals
- [ ] Mobile app version
- [ ] Steam/console releases
- [ ] Modding support
- [ ] Community features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Phaser Team**: For the amazing game engine
- **Firebase Team**: For the robust backend services
- **Cat Community**: For inspiration and feedback
- **Open Source Community**: For tools and libraries

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/MamaLilya/mars-terraformer/issues)
- **Discussions**: [Join the community](https://github.com/MamaLilya/mars-terraformer/discussions)
- **Email**: For private inquiries

---

**Made with ❤️ by the Cat Colony team**

*Happy terraforming, space cats! 🐱🚀* 