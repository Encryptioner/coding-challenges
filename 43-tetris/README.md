# Tetris - Classic Block Puzzle Game

A fully functional web-based implementation of the classic Tetris game with all 7 tetrominoes, scoring system, levels, and smooth gameplay.

![Tetris Banner](https://img.shields.io/badge/Game-Tetris-purple?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## 🎮 Play Now

Open `index.html` in any modern web browser to start playing!

```bash
# Clone the repository
cd 43-tetris

# Open in browser
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

Or use a local server:
```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

## ✨ Features

### Core Gameplay
- ✅ All 7 classic tetrominoes (I, O, T, S, Z, J, L)
- ✅ Standard 10x20 game board
- ✅ Smooth piece movement and rotation
- ✅ Ghost piece (shows landing position)
- ✅ Soft drop and hard drop
- ✅ Line clearing with animations
- ✅ Progressive difficulty (speed increases with level)
- ✅ Game over detection

### Game Modes & Screens
- ✅ Welcome screen with menu
- ✅ How to Play screen with controls
- ✅ Main game screen with stats
- ✅ Game over screen with final score
- ✅ Pause functionality

### Scoring System
- **1 Line**: 100 points × level
- **2 Lines**: 300 points × level
- **3 Lines**: 500 points × level
- **4 Lines (Tetris)**: 800 points × level
- **Soft Drop**: +1 point per row
- **Hard Drop**: +2 points per row

### Visual Features
- 🎨 Color-coded tetrominoes
- 🎨 3D block rendering with highlights
- 🎨 Grid overlay for precision
- 🎨 Ghost piece preview
- 🎨 Next piece preview
- 🎨 Gradient backgrounds
- 🎨 Smooth animations

### Controls
- **← →**: Move left/right
- **↑**: Rotate piece
- **↓**: Soft drop (move down faster)
- **SPACE**: Hard drop (instant drop)
- **P**: Pause/Resume
- **ESC**: Quit game

## 🏗️ Implementation Details

### Technologies Used
- **HTML5** - Page structure and canvas elements
- **CSS3** - Styling, gradients, animations
- **JavaScript (ES6)** - Game logic and rendering

### Architecture

```
43-tetris/
├── index.html          # Main game interface
├── tetris.js           # Game logic and rendering
├── challenge.md        # Challenge description
├── README.md           # This file
└── docs/
    ├── implementation.md   # Implementation guide
    ├── game-mechanics.md   # Game mechanics explained
    └── algorithms.md       # Algorithms and data structures
```

### Key Components

#### 1. Tetromino System
- 7 unique pieces with 4 rotation states each (except O-piece)
- Rotation matrices for each state
- Wall kick system for edge rotations

#### 2. Game Board
- 2D array representation (10×20)
- Cell states: empty (0) or color value
- Efficient collision detection

#### 3. Rendering Engine
- Canvas-based rendering
- Double buffering for smooth graphics
- Grid overlay system
- Block drawing with 3D effects

#### 4. Game Loop
- RequestAnimationFrame for smooth 60 FPS
- Time-based piece dropping
- Level-based speed adjustment

#### 5. Input System
- Keyboard event handling
- Action debouncing
- Pause state management

## 🎯 Challenge Steps Completed

### ✅ Step 0: Environment Setup
- Web-based implementation using HTML5/CSS3/JavaScript
- No external dependencies required
- Works in all modern browsers

### ✅ Step 1: Welcome Screen
- Clean, attractive welcome screen
- Play button to start game
- Help screen with controls and rules
- Scoring information

### ✅ Step 2: Game Board
- 10×20 playing field
- Border rendering
- Score, level, and lines display
- Next piece preview panel
- Pause and Quit buttons

### ✅ Step 3: Tetrominoes
- All 7 classic pieces implemented
- Standard color scheme
- Random piece generation
- Pieces spawn at top center
- Automatic falling with gravity

### ✅ Step 4: Player Controls
- Full movement controls (left, right, down)
- Rotation with wall kick system
- Soft drop for faster descent
- Hard drop for instant placement
- Collision detection for all movements

### ✅ Step 5: Line Clearing & Game Over
- Complete line detection
- Line clearing animation
- Multi-line bonus scoring
- Progressive speed increase
- Game over when board is full
- Restart and menu options

## 🎨 Color Scheme

| Piece | Color | Hex Code |
|-------|-------|----------|
| I (Line) | Cyan | #00f0f0 |
| O (Square) | Yellow | #f0f000 |
| T (T-shape) | Purple | #a000f0 |
| S (S-shape) | Green | #00f000 |
| Z (Z-shape) | Red | #f00000 |
| J (J-shape) | Blue | #0000f0 |
| L (L-shape) | Orange | #f0a000 |

## 🎮 Gameplay Tips

1. **Plan Ahead**: Use the next piece preview to plan your moves
2. **Create Tetrises**: Try to clear 4 lines at once for maximum points
3. **Use Hard Drop**: Space bar instantly places pieces - use it strategically
4. **Watch the Ghost**: The ghost piece shows exactly where your piece will land
5. **Keep It Flat**: Try to keep the board surface relatively flat
6. **Leave Space for I-pieces**: Don't fill the board edges too quickly

## 🧮 Scoring Strategy

- **Tetrises are King**: 800 points × level for 4 lines
- **Multiply by Level**: Higher levels multiply your score
- **Hard Drop Bonus**: Use hard drop for extra points
- **Level Up Fast**: Clear lines quickly to reach higher levels
- **Current Score = Base Points × Level**

## 📱 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 60+ | ✅ Full Support |
| Firefox 55+ | ✅ Full Support |
| Safari 11+ | ✅ Full Support |
| Edge 79+ | ✅ Full Support |
| Opera 47+ | ✅ Full Support |

**Requirements:**
- HTML5 Canvas support
- ES6 JavaScript support
- RequestAnimationFrame API

## 🔧 Customization

### Adjust Game Speed
Edit `INITIAL_SPEED` in `tetris.js`:
```javascript
const INITIAL_SPEED = 1000; // milliseconds per drop
```

### Change Board Size
Modify `COLS` and `ROWS`:
```javascript
const COLS = 10;  // Board width
const ROWS = 20;  // Board height
```

### Customize Colors
Edit the `SHAPES` object colors:
```javascript
I: {
    // ...
    color: '#00f0f0'  // Change to any hex color
}
```

### Adjust Scoring
Modify the points array in `clearLines()`:
```javascript
const points = [0, 100, 300, 500, 800];  // [0, 1 line, 2 lines, 3 lines, 4 lines]
```

## 📚 Learning Resources

### Tetris Mechanics
- [Tetris Wiki](https://tetris.fandom.com/wiki/Tetris_Wiki)
- [Tetris Guideline](https://tetris.fandom.com/wiki/Tetris_Guideline)
- [Super Rotation System](https://tetris.fandom.com/wiki/SRS)

### Game Development
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [RequestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Game Loop Patterns](https://gameprogrammingpatterns.com/game-loop.html)

## 🐛 Known Issues & Limitations

- No touch controls for mobile (keyboard only)
- No sound effects or music
- No save/load functionality
- No online leaderboards
- No T-spin detection (future enhancement)

## 🚀 Future Enhancements

### Planned Features
- [ ] Touch controls for mobile devices
- [ ] Sound effects and background music
- [ ] Hold piece functionality
- [ ] Local storage for high scores
- [ ] T-spin bonus detection
- [ ] Combo multiplier system
- [ ] Multiple difficulty modes
- [ ] Customizable themes
- [ ] Multiplayer mode

## 🏆 High Score Challenge

Can you beat these scores?

- **Beginner**: 5,000 points
- **Intermediate**: 10,000 points
- **Advanced**: 20,000 points
- **Expert**: 50,000+ points

## 📝 Code Quality

### Features
- ✅ Clean, readable code
- ✅ Comprehensive comments
- ✅ Modular function design
- ✅ Efficient algorithms
- ✅ No external dependencies
- ✅ Cross-browser compatible

### Performance
- 60 FPS gameplay
- Optimized rendering
- Minimal memory footprint
- No memory leaks

## 🤝 Contributing

Feel free to fork this implementation and add your own features! Some ideas:

1. Add different game modes (Sprint, Ultra, Marathon)
2. Implement T-spin detection
3. Add particle effects
4. Create different visual themes
5. Add sound effects
6. Implement touch controls

## 📄 License

This implementation is part of the [CodingChallenges.fyi](https://codingchallenges.fyi) project series.

## 🎓 Educational Value

This project demonstrates:
- **Canvas API** - 2D graphics rendering
- **Game Loops** - Time-based animation
- **Collision Detection** - Spatial algorithms
- **State Management** - Game state handling
- **Event Handling** - Keyboard input
- **Data Structures** - 2D arrays, shape rotation
- **Algorithm Design** - Line clearing, piece placement
- **UI/UX Design** - Game interface design

## 🙏 Acknowledgments

- Original Tetris created by Alexey Pajitnov (1985)
- Challenge from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-tetris)
- Tetromino colors follow the Tetris Guideline standard

---

**Enjoy playing Tetris!** 🎮

*Built with ❤️ as part of the CodingChallenges.fyi series*
