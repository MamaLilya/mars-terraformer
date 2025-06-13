# Terraformation Platformer Game

This repository contains two versions of a platformer game:
- **A browser-based version using Phaser.js** (JavaScript)
- **A desktop version using Pygame** (Python)

---

## Phaser Version (JavaScript)

A browser-based platformer game ported from Pygame to Phaser.js. This game features a main menu, world map, station (with an isometric grid for building farms), and an endless runner gameplay loop with collectibles, level progression, and a lives system.

### Features
- Main Menu with options for World Map and Station
- World Map screen with a Start Level button and resource display
- Station screen with an isometric grid for building farms using resources
- Endless runner gameplay with player movement, jump/double jump, platform generation, collectibles, resource collection, level progression, and a 3-lives system
- Game Over screen with stats, lives left, and buttons for Try Again, Back to Station, and Back to Main Menu

### Running the Game Locally
1. Clone the repository or download the ZIP file.
2. Navigate to the project directory in your terminal.
3. Run `npm install` to install dependencies (if you have Node.js installed).
4. Run `npm start` to start a local server.
5. Open your browser and go to `http://localhost:5000` to play the game.

### Technologies Used
- Phaser 3.60.0
- HTML5
- CSS
- JavaScript

---

## Pygame Version (Python)

A basic platformer game created with Python and Pygame.

### Requirements
- Python 3.x
- Pygame

### Installation
1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

### How to Play
Run the game:
```bash
python main.py
```

#### Controls
- Left Arrow: Move left
- Right Arrow: Move right
- Space: Jump

### Features
- Basic platformer mechanics
- Player movement and jumping
- Platform collision detection
- Simple physics (gravity)

### Future Improvements
- Add graphics and animations
- Include enemies and obstacles
- Add collectibles and scoring
- Implement multiple levels
- Add sound effects and music

## License
MIT 
