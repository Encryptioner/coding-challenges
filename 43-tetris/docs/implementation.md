# Tetris Implementation Guide

This document provides a comprehensive guide to the technical implementation of the Tetris game, covering architecture, design decisions, and code organization.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Game Constants and Configuration](#game-constants-and-configuration)
3. [Tetromino System](#tetromino-system)
4. [Game Board](#game-board)
5. [Rendering System](#rendering-system)
6. [Game Loop](#game-loop)
7. [Input Handling](#input-handling)
8. [Collision Detection](#collision-detection)
9. [Line Clearing](#line-clearing)
10. [Scoring System](#scoring-system)
11. [UI Management](#ui-management)

---

## Architecture Overview

The Tetris implementation follows a modular, functional architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│           User Interface Layer          │
│   (HTML/CSS - Screens, Controls, UI)    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          Game State Management          │
│   (board, currentPiece, score, level)   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           Core Game Logic               │
│  (movement, rotation, collision, etc.)  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          Rendering Engine               │
│     (Canvas API - drawing blocks)       │
└─────────────────────────────────────────┘
```

### Technology Stack

- **HTML5**: Structure and Canvas elements
- **CSS3**: Styling, layouts, animations
- **Vanilla JavaScript (ES6)**: Game logic
- **Canvas API**: 2D rendering
- **RequestAnimationFrame**: Game loop

### Key Design Decisions

1. **No External Dependencies**: Pure vanilla JavaScript for maximum portability
2. **Canvas-Based Rendering**: Hardware-accelerated 2D graphics
3. **Functional Approach**: Pure functions where possible for easier testing
4. **State Management**: Single game state object for consistency
5. **Modular Functions**: Each function has a single responsibility

---

## Game Constants and Configuration

### Board Dimensions

```javascript
const COLS = 10;      // Standard Tetris width
const ROWS = 20;      // Standard Tetris height
const BLOCK_SIZE = 30; // Pixels per block
```

**Why these values?**
- 10×20 is the classic Tetris board size
- 30px blocks provide good visibility and performance
- Results in 300×600px canvas (comfortable size)

### Game Speed

```javascript
const INITIAL_SPEED = 1000; // 1 second per drop
```

**Speed Calculation:**
```javascript
gameSpeed = INITIAL_SPEED - ((level - 1) * 100);
gameSpeed = Math.max(gameSpeed, 100); // Minimum 100ms
```

**Level Progression:**
- Level 1: 1000ms (1.0 seconds per drop)
- Level 2: 900ms (0.9 seconds)
- Level 5: 600ms (0.6 seconds)
- Level 10+: 100ms (0.1 seconds - maximum speed)

---

## Tetromino System

### Shape Definition

Each tetromino is defined by:
1. **Rotation States**: Array of 2D matrices
2. **Color**: Hex color code
3. **Name**: Single letter identifier (I, O, T, S, Z, J, L)

```javascript
const SHAPES = {
    I: {
        shape: [
            [[0, 0, 0, 0],
             [1, 1, 1, 1],
             [0, 0, 0, 0],
             [0, 0, 0, 0]],
            // ... 3 more rotations
        ],
        color: '#00f0f0'
    },
    // ... other pieces
};
```

### Rotation Matrix System

**Why 4×4 matrices for I-piece?**
- I-piece needs 4×4 to rotate properly
- Vertical I-piece: requires 4 rows
- Horizontal I-piece: requires 4 columns

**Why 3×3 for most pieces?**
- Sufficient space for T, S, Z, J, L pieces
- Minimizes empty space
- Simplifies rotation calculations

**Why 2×2 for O-piece?**
- O-piece doesn't rotate
- Only needs one state
- Most efficient representation

### Piece Object Structure

```javascript
{
    shape: [[...]],           // Current rotation state
    color: '#00f0f0',        // Piece color
    x: 3,                     // Board position X
    y: 0,                     // Board position Y
    rotationIndex: 0,         // Current rotation (0-3)
    allRotations: [[[...]]]   // All rotation states
}
```

### Random Piece Generation

```javascript
function getRandomPiece() {
    const pieces = Object.keys(SHAPES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const pieceData = SHAPES[randomPiece];

    return {
        shape: pieceData.shape[0],
        color: pieceData.color,
        x: Math.floor(COLS / 2) - Math.floor(pieceData.shape[0][0].length / 2),
        y: 0,
        rotationIndex: 0,
        allRotations: pieceData.shape
    };
}
```

**Spawn Position:**
- X: Centered horizontally
- Y: Top of board (0)
- Initial rotation: 0 (default orientation)

---

## Game Board

### Data Structure

```javascript
// 2D array: board[row][col]
board = [
    [0, 0, 0, '#f00000', 0, 0, 0, 0, 0, 0],  // Row 0 (top)
    [0, 0, 0, '#f00000', 0, 0, 0, 0, 0, 0],  // Row 1
    // ... 18 more rows
];
```

**Cell States:**
- `0`: Empty cell
- Color string (e.g., `'#f00000'`): Locked block with that color

### Board Initialization

```javascript
function createBoard() {
    const board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
    return board;
}
```

**Why 2D Array?**
- Natural representation of grid
- Direct [row][col] access: O(1)
- Easy to visualize mentally
- Matches visual representation

### Coordinate System

```
(0,0)  →  X increases
  ↓
  Y increases

Board Coordinates:
  0 1 2 3 4 5 6 7 8 9  (X/columns)
0 □ □ □ □ □ □ □ □ □ □
1 □ □ □ □ □ □ □ □ □ □
2 □ □ □ □ ■ ■ □ □ □ □
3 □ □ □ □ ■ ■ □ □ □ □
...
(Y/rows)
```

---

## Rendering System

### Canvas Setup

```javascript
canvas = document.getElementById('tetris-canvas');
ctx = canvas.getContext('2d');
canvas.width = COLS * BLOCK_SIZE;   // 300px
canvas.height = ROWS * BLOCK_SIZE;  // 600px
```

### Block Rendering

```javascript
function drawBlock(ctx, x, y, color) {
    // Main block
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // Border for definition
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // Highlight for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(
        x * BLOCK_SIZE + 2,
        y * BLOCK_SIZE + 2,
        BLOCK_SIZE - 4,
        BLOCK_SIZE / 3
    );
}
```

**3D Effect Technique:**
1. Draw main color block
2. Add black border (2px)
3. Add white highlight on top 1/3 (20% opacity)
4. Creates illusion of light source from above

### Board Rendering

```javascript
function drawBoard() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw locked blocks
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }

    // Draw grid lines
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    // ... grid drawing code
}
```

**Rendering Order:**
1. Clear canvas (black background)
2. Draw locked blocks from board array
3. Draw grid lines (subtle, dark gray)
4. Draw current piece
5. Draw ghost piece

### Ghost Piece Implementation

```javascript
function drawGhostPiece(piece) {
    // Calculate landing position
    let ghostY = piece.y;
    while (isValidMove(piece.x, ghostY + 1, piece.shape)) {
        ghostY++;
    }

    // Draw semi-transparent version
    ctx.globalAlpha = 0.3;
    // ... draw piece at ghostY position
    ctx.globalAlpha = 1.0;
}
```

**Why Ghost Piece?**
- Shows where piece will land
- Improves player planning
- Reduces mistakes
- Standard in modern Tetris

---

## Game Loop

### RequestAnimationFrame Pattern

```javascript
function update(time = 0) {
    if (!isGameOver && !isPaused) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;

        if (dropCounter > gameSpeed) {
            if (!movePiece(0, 1)) {
                lockPiece();
            }
            dropCounter = 0;
        }

        drawBoard();
        drawPiece(currentPiece);

        gameLoop = requestAnimationFrame(update);
    }
}
```

**Why RequestAnimationFrame?**
- Syncs with display refresh rate (60 FPS)
- Pauses when tab is inactive (saves CPU)
- Provides high-resolution timestamps
- Browser-optimized performance

### Time-Based Movement

```javascript
dropCounter += deltaTime;    // Accumulate time
if (dropCounter > gameSpeed) {
    // Move piece down
    dropCounter = 0;
}
```

**Benefits:**
- Consistent speed across devices
- Independent of frame rate
- Smooth gameplay
- Easy to adjust speed

### Game State Management

```javascript
// Global state variables
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let isPaused = false;
let isGameOver = false;
```

**Why Global State?**
- Simple for single-player game
- Easy to access from any function
- No need for complex state management
- Sufficient for this scale

---

## Input Handling

### Keyboard Event System

```javascript
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;

    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            break;
        // ... other keys
    }

    // Redraw after input
    if (!isPaused && !isGameOver) {
        drawBoard();
        drawPiece(currentPiece);
    }
});
```

**Input Handling Features:**
- Immediate response (no delay)
- Prevent default browser behavior
- Redraw after each input
- Ignore input when paused/game over

### Key Mappings

| Key | Action | Function |
|-----|--------|----------|
| ← → | Move horizontal | `movePiece(±1, 0)` |
| ↑ | Rotate | `rotatePiece()` |
| ↓ | Soft drop | `movePiece(0, 1)` |
| SPACE | Hard drop | `hardDrop()` |
| P | Pause | `togglePause()` |
| ESC | Quit | `quitGame()` |

---

## Collision Detection

### Validation Algorithm

```javascript
function isValidMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;

                // Check boundaries
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }

                // Check collision with board
                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}
```

**Checks Performed:**
1. **Left boundary**: `newX < 0`
2. **Right boundary**: `newX >= COLS`
3. **Bottom boundary**: `newY >= ROWS`
4. **Block collision**: `board[newY][newX] !== 0`

**Special Case:** `newY >= 0` check
- Allows pieces to spawn above visible board
- Prevents false collisions during spawn
- Necessary for piece entry

### Wall Kick System

```javascript
function rotatePiece() {
    const nextRotation = (currentPiece.rotationIndex + 1) % currentPiece.allRotations.length;
    const rotatedShape = currentPiece.allRotations[nextRotation];

    // Try rotation with kicks
    const kicks = [
        [0, 0],   // No kick
        [-1, 0],  // Left
        [1, 0],   // Right
        [0, -1],  // Up
        [-1, -1], // Up-left
        [1, -1]   // Up-right
    ];

    for (const [kickX, kickY] of kicks) {
        if (isValidMove(
            currentPiece.x + kickX,
            currentPiece.y + kickY,
            rotatedShape
        )) {
            currentPiece.shape = rotatedShape;
            currentPiece.rotationIndex = nextRotation;
            currentPiece.x += kickX;
            currentPiece.y += kickY;
            return;
        }
    }
}
```

**Wall Kick Priorities:**
1. Try rotation without moving
2. Try moving left
3. Try moving right
4. Try moving up
5. Try diagonal kicks

---

## Line Clearing

### Detection Algorithm

```javascript
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        let isComplete = true;

        // Check if line is complete
        for (let col = 0; col < COLS; col++) {
            if (!board[row][col]) {
                isComplete = false;
                break;
            }
        }

        if (isComplete) {
            // Remove line
            board.splice(row, 1);
            // Add empty line at top
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Re-check same row
        }
    }

    // Update game state
    if (linesCleared > 0) {
        updateScoreAndLevel(linesCleared);
    }
}
```

**Why Bottom-Up?**
- Lines clear from bottom in Tetris
- Simpler to visualize
- Matches player expectation

**Array Manipulation:**
1. `splice(row, 1)`: Remove completed row
2. `unshift(empty)`: Add empty row at top
3. `row++`: Re-check same index (rows shifted down)

---

## Scoring System

### Score Calculation

```javascript
const points = [0, 100, 300, 500, 800];
score += points[linesCleared] * level;
```

| Lines | Base Points | Level 1 | Level 5 | Level 10 |
|-------|-------------|---------|---------|----------|
| 1 | 100 | 100 | 500 | 1,000 |
| 2 | 300 | 300 | 1,500 | 3,000 |
| 3 | 500 | 500 | 2,500 | 5,000 |
| 4 | 800 | 800 | 4,000 | 8,000 |

**Additional Scoring:**
- Soft drop: +1 point per row
- Hard drop: +2 points per row

### Level Progression

```javascript
level = Math.floor(lines / 10) + 1;
```

**Leveling System:**
- Every 10 lines = 1 level increase
- 0-9 lines: Level 1
- 10-19 lines: Level 2
- 20-29 lines: Level 3
- etc.

---

## UI Management

### Screen Management

```javascript
// Three main screens
function showWelcome() { /* ... */ }
function showHelp() { /* ... */ }
function startGame() { /* ... */ }
```

**Screen Flow:**
```
Welcome Screen
    ↓ (How to Play)
Help Screen
    ↓ (Start Game)
Game Screen
    ↓ (Game Over)
Game Over Overlay
    ↓ (Play Again / Main Menu)
```

### Dynamic UI Updates

```javascript
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}
```

**Updated Elements:**
- Score display
- Level counter
- Lines cleared counter
- Next piece preview

---

## Performance Considerations

### Optimization Techniques

1. **Efficient Rendering**
   - Only redraw when necessary
   - Use Canvas double buffering
   - Minimize draw calls

2. **Collision Detection**
   - Early exit when collision found
   - Check boundaries before board
   - O(n²) worst case, typically O(n)

3. **Memory Management**
   - Reuse piece objects
   - No memory leaks in game loop
   - Clean up event listeners

4. **Time Complexity**
   - Board iteration: O(rows × cols) = O(200)
   - Piece validation: O(piece size) ≈ O(16)
   - Line clearing: O(rows) = O(20)

### Frame Rate

- Target: 60 FPS
- Actual: Consistent 60 FPS on modern hardware
- Piece drop independent of frame rate
- Smooth animations and transitions

---

## Testing Considerations

### Manual Testing Checklist

- [ ] All pieces spawn correctly
- [ ] Movement works in all directions
- [ ] Rotation works at edges (wall kicks)
- [ ] Collision detection accurate
- [ ] Lines clear properly
- [ ] Score updates correctly
- [ ] Level progression works
- [ ] Game over triggers appropriately
- [ ] Pause/resume functions
- [ ] Keyboard shortcuts work

### Edge Cases

1. **Piece Spawn Collision**
   - Board full → Game over
   - Piece can't fit → Game over

2. **Rotation at Edges**
   - Wall kicks active
   - Can't rotate → No action

3. **Multiple Line Clears**
   - Tetris (4 lines) works
   - Score calculated correctly

4. **Maximum Speed**
   - Minimum speed cap (100ms)
   - Game still playable

---

## Code Style and Best Practices

### Naming Conventions

- **Functions**: camelCase (`movePiece`, `drawBlock`)
- **Constants**: UPPER_SNAKE_CASE (`BLOCK_SIZE`, `COLS`)
- **Variables**: camelCase (`currentPiece`, `gameLoop`)

### Function Organization

```javascript
// Pure functions (no side effects)
function createBoard() { /* ... */ }
function isValidMove(x, y, shape) { /* ... */ }

// State-modifying functions
function movePiece(dx, dy) { /* ... */ }
function lockPiece() { /* ... */ }

// UI functions
function showWelcome() { /* ... */ }
function updateUI() { /* ... */ }
```

### Comments

```javascript
// What: Describe what the code does
// Why: Explain non-obvious decisions
// How: For complex algorithms only
```

---

## Conclusion

This implementation provides a solid foundation for a Tetris game with:

- ✅ Clean, maintainable code
- ✅ Efficient algorithms
- ✅ Smooth gameplay
- ✅ Standard Tetris mechanics
- ✅ Room for future enhancements

The modular design makes it easy to add features like:
- Hold piece functionality
- T-spin detection
- Sound effects
- Multiplayer mode
- Different game modes

---

**Next Steps:**
- Review [game-mechanics.md](./game-mechanics.md) for gameplay details
- Check [algorithms.md](./algorithms.md) for algorithm deep-dives
- Explore customization options in README.md
