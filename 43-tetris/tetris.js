/**
 * Tetris Game Implementation
 * Classic block puzzle game with all 7 tetrominoes
 */

// Game Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const INITIAL_SPEED = 1000; // milliseconds per drop

// Tetromino Shapes (using rotation states)
const SHAPES = {
    I: {
        shape: [
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
            [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
            [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
        ],
        color: '#00f0f0'
    },
    O: {
        shape: [
            [[1, 1], [1, 1]]
        ],
        color: '#f0f000'
    },
    T: {
        shape: [
            [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
            [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
            [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
            [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
            [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
            [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
        ],
        color: '#f00000'
    },
    J: {
        shape: [
            [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
            [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
        ],
        color: '#0000f0'
    },
    L: {
        shape: [
            [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
            [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
            [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
        ],
        color: '#f0a000'
    }
};

// Game State
let canvas, ctx, nextCanvas, nextCtx;
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let gameSpeed = INITIAL_SPEED;
let isPaused = false;
let isGameOver = false;
let lastTime = 0;
let dropCounter = 0;

// Initialize game board
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

// Get random tetromino
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

// Draw a block
function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // Draw highlight for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE / 3);
}

// Draw the game board
function drawBoard() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board cells
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
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
}

// Draw current piece
function drawPiece(piece) {
    if (!piece) return;

    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                drawBlock(ctx, piece.x + col, piece.y + row, piece.color);
            }
        }
    }

    // Draw ghost piece (shows where piece will land)
    drawGhostPiece(piece);
}

// Draw ghost piece (preview of where piece will land)
function drawGhostPiece(piece) {
    let ghostY = piece.y;
    while (isValidMove(piece.x, ghostY + 1, piece.shape)) {
        ghostY++;
    }

    ctx.globalAlpha = 0.3;
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                ctx.fillStyle = piece.color;
                ctx.fillRect(
                    (piece.x + col) * BLOCK_SIZE,
                    (ghostY + row) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    (piece.x + col) * BLOCK_SIZE,
                    (ghostY + row) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
            }
        }
    }
    ctx.globalAlpha = 1.0;
}

// Draw next piece
function drawNextPiece() {
    if (!nextPiece) return;

    // Clear next canvas
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    // Calculate centering offset
    const pieceWidth = nextPiece.shape[0].length;
    const pieceHeight = nextPiece.shape.length;
    const offsetX = (4 - pieceWidth) / 2;
    const offsetY = (4 - pieceHeight) / 2;

    // Draw piece
    for (let row = 0; row < nextPiece.shape.length; row++) {
        for (let col = 0; col < nextPiece.shape[row].length; col++) {
            if (nextPiece.shape[row][col]) {
                drawBlock(nextCtx, offsetX + col, offsetY + row, nextPiece.color);
            }
        }
    }
}

// Check if move is valid
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

                // Check collision with board (but allow movement above board)
                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Move piece
function movePiece(dx, dy) {
    if (!currentPiece || isPaused || isGameOver) return false;

    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;

    if (isValidMove(newX, newY, currentPiece.shape)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        return true;
    }
    return false;
}

// Rotate piece
function rotatePiece() {
    if (!currentPiece || isPaused || isGameOver) return;

    const nextRotation = (currentPiece.rotationIndex + 1) % currentPiece.allRotations.length;
    const rotatedShape = currentPiece.allRotations[nextRotation];

    // Try rotation with wall kicks
    const kicks = [
        [0, 0],  // No kick
        [-1, 0], // Left kick
        [1, 0],  // Right kick
        [0, -1], // Up kick
        [-1, -1], // Up-left kick
        [1, -1]  // Up-right kick
    ];

    for (const [kickX, kickY] of kicks) {
        if (isValidMove(currentPiece.x + kickX, currentPiece.y + kickY, rotatedShape)) {
            currentPiece.shape = rotatedShape;
            currentPiece.rotationIndex = nextRotation;
            currentPiece.x += kickX;
            currentPiece.y += kickY;
            return;
        }
    }
}

// Hard drop
function hardDrop() {
    if (!currentPiece || isPaused || isGameOver) return;

    while (movePiece(0, 1)) {
        score += 2; // Award points for hard drop
    }
    lockPiece();
}

// Lock piece in place
function lockPiece() {
    if (!currentPiece) return;

    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;

                // Check if piece is above the board
                if (boardY < 0) {
                    gameOver();
                    return;
                }

                board[boardY][boardX] = currentPiece.color;
            }
        }
    }

    clearLines();
    spawnPiece();
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        let isComplete = true;
        for (let col = 0; col < COLS; col++) {
            if (!board[row][col]) {
                isComplete = false;
                break;
            }
        }

        if (isComplete) {
            // Remove the line
            board.splice(row, 1);
            // Add empty line at top
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check the same row again
        }
    }

    if (linesCleared > 0) {
        lines += linesCleared;

        // Update score based on lines cleared
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;

        // Update level
        level = Math.floor(lines / 10) + 1;
        gameSpeed = INITIAL_SPEED - ((level - 1) * 100);
        gameSpeed = Math.max(gameSpeed, 100); // Minimum speed

        updateUI();
    }
}

// Spawn new piece
function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();

    if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver();
    }

    drawNextPiece();
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// Game loop
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

// Game over
function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoop);

    document.getElementById('final-score').textContent = score;
    document.getElementById('final-lines').textContent = lines;
    document.getElementById('final-level').textContent = level;
    document.getElementById('game-over').style.display = 'flex';
}

// Keyboard controls
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
        case 'ArrowDown':
            e.preventDefault();
            if (movePiece(0, 1)) {
                score += 1;
                updateUI();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
        case 'Escape':
            e.preventDefault();
            quitGame();
            break;
    }

    if (!isPaused && !isGameOver) {
        drawBoard();
        drawPiece(currentPiece);
    }
});

// UI Functions
function showWelcome() {
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('help-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
}

function showHelp() {
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('help-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
}

function startGame() {
    // Hide other screens
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('help-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-over').style.display = 'none';

    // Initialize canvases
    canvas = document.getElementById('tetris-canvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('next-canvas');
    nextCtx = nextCanvas.getContext('2d');

    // Reset game state
    board = createBoard();
    score = 0;
    level = 1;
    lines = 0;
    gameSpeed = INITIAL_SPEED;
    isPaused = false;
    isGameOver = false;
    dropCounter = 0;
    lastTime = 0;

    // Spawn initial pieces
    nextPiece = getRandomPiece();
    spawnPiece();

    // Update UI
    updateUI();

    // Start game loop
    gameLoop = requestAnimationFrame(update);
}

function togglePause() {
    if (isGameOver) return;

    isPaused = !isPaused;

    if (!isPaused) {
        lastTime = performance.now();
        gameLoop = requestAnimationFrame(update);
    } else {
        cancelAnimationFrame(gameLoop);
    }

    // Update button text
    const pauseBtn = document.querySelector('.game-buttons button:first-child');
    pauseBtn.textContent = isPaused ? 'Resume (P)' : 'Pause (P)';
}

function quitGame() {
    if (confirm('Are you sure you want to quit?')) {
        isGameOver = true;
        cancelAnimationFrame(gameLoop);
        showWelcome();
    }
}

function restartGame() {
    startGame();
}

function returnToMenu() {
    document.getElementById('game-over').style.display = 'none';
    showWelcome();
}
