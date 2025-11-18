# Build Your Own Tetris

This challenge is to build your own version of Tetris, one of the most iconic video games of all time.

## Challenge Description

For as long as I have been interested in programming, programmers have been learning by building computer games. Many of us started by building our own Pong and over time progress to either copying other more complex games, building our own game from scratch or customising existing games.

Tetris is a computer game that has been around since 1985 and has appeared on many platforms since then. It is one of the best selling computer games of all time.

Fundamentally the game is quite simple: the player completes horizontal lines at the bottom of the screen by fitting in shapes that descend from the top of the screen. Completed lines disappear, earning the player points. The game ends when the uncleared lines reach the top of the screen.

## Steps

### Step Zero - Environment Setup

In this step you decide which programming language and development environment you're going to use. This would be a great project to try a frontend stack if you're a backend developer and if you're a frontend developer perhaps try building a desktop application.

If you're from a data engineering or site-reliability engineering background you could leverage your knowledge of Python with PyGame or Go with Ebitenegine. Rustaceans can check out "are we game yet" for useful crates.

Tetris is a relatively simple game to build and as such, is a great platform for learning a new technology, or programming language.

### Step 1 - Welcome Screen

In this step your goal is to create your welcome screen. This screen should give the player the option to start a game or access some basic instructions on how to play the game - i.e. the controls and perhaps an introduction to the gameplay.

You should render the help screen as part of this step. You could even include some high scores.

**Features:**
- Welcome/title screen
- "Play" button to start game
- "Help" button to show instructions
- Optional: High scores display
- Game controls documentation

### Step 2 - Game Board

In this step your goal is to allow the player to start a game (by clicking on Play) and, when they do so render a playing screen.

The board is on the left and the score and a Quit button on the right. The initial board in Tetris is **10 blocks wide and 20 blocks high**. It's often rendered with a block based border.

**Features:**
- 10x20 game board
- Border around the playing field
- Score display area
- Next piece preview (optional but recommended)
- Quit/Pause button

### Step 3 - Tetrominoes

In this step your goal is to add the pieces, known as 'tetrominoes', to the game and have them appear at the top of the screen and 'fall' to the bottom.

There are **seven tetrominoes**:

1. **I** - Straight line (4 blocks) - Cyan
2. **O** - Square (2x2) - Yellow
3. **T** - T-shape - Purple
4. **S** - S-shape - Green
5. **Z** - Z-shape - Red
6. **J** - J-shape - Blue
7. **L** - L-shape - Orange

**Features:**
- All seven tetromino shapes
- Random tetromino generation
- Pieces spawn at the top center of the board
- Pieces fall at a constant rate
- Pieces stop when they reach the bottom or another piece

**Standard Colors:**
- I-piece: Cyan
- O-piece: Yellow
- T-piece: Purple
- S-piece: Green
- Z-piece: Red
- J-piece: Blue
- L-piece: Orange

Alternately you can go fully retro and render the game in black and white/black and green.

### Step 4 - Player Controls

In this step your goal is to allow the player to control the tetrominoes as they fall.

**Player Actions:**
- **Move Left/Right** - Arrow keys or A/D
- **Rotate Clockwise** - Up arrow or W
- **Rotate Counter-Clockwise** - Optional (Z/X keys)
- **Soft Drop** - Accelerate downward (Down arrow or S)
- **Hard Drop** - Instantly drop to bottom (Space bar)
- **Pause** - P or Escape

**Implementation Requirements:**
- Collision detection (pieces can't move through walls or other pieces)
- Rotation system with wall kicks (handle rotation near edges)
- Movement restrictions based on board state
- Smooth controls with proper key handling

### Step 5 - Line Clearing and Game Over

In this step your goal is to remove completed rows from the bottom of the screen and update the scoreboard.

**Scoring:**
- Usually removing multiple lines in a single action scores more than removing single rows separately
- Example scoring:
  - 1 line: 100 points
  - 2 lines: 300 points
  - 3 lines: 500 points
  - 4 lines (Tetris): 800 points

**Game Over:**
- The game ends when the board is 'full' - no more pieces can be added at the top
- Display "Game Over" message
- Show final score
- Allow player to restart the game

**Additional Features (Optional):**
- Level system (increase speed as score increases)
- Next piece preview
- Hold piece functionality
- Ghost piece (shows where piece will land)
- Sound effects
- Background music
- Leaderboard/high scores

## Testing

Your Tetris game should:

1. Display a welcome screen with options to play or view help
2. Start a game with a 10x20 playing field
3. Spawn random tetrominoes at the top
4. Allow pieces to fall automatically
5. Accept player input to move and rotate pieces
6. Detect collisions correctly
7. Lock pieces in place when they land
8. Clear completed lines
9. Update score based on lines cleared
10. End game when board is full
11. Allow restarting the game

## Bonus Challenges

Once you have a working Tetris game, consider adding:

- **Ghost Piece**: Semi-transparent piece showing where the current piece will land
- **Hold Function**: Allow player to hold current piece and swap with held piece
- **T-Spin Detection**: Award bonus points for T-spin moves
- **Combo System**: Award bonus points for consecutive line clears
- **Different Game Modes**: Marathon, Sprint (40 lines), Ultra (2 minutes)
- **Wall Kick System**: Super Rotation System (SRS) for better rotation behavior
- **DAS/ARR**: Delayed Auto Shift and Auto Repeat Rate for better controls
- **Mobile Support**: Touch controls for mobile devices
- **Multiplayer**: Two-player competitive mode

## Resources

- [Tetris Wiki](https://tetris.fandom.com/wiki/Tetris_Wiki) - Comprehensive Tetris documentation
- [Tetris Guideline](https://tetris.fandom.com/wiki/Tetris_Guideline) - Official game specifications
- [Super Rotation System](https://tetris.fandom.com/wiki/SRS) - Modern rotation system
- [Scoring Systems](https://tetris.fandom.com/wiki/Scoring) - Various scoring methods

## Success Criteria

Your Tetris implementation should:

✅ Have a functional welcome/menu screen
✅ Display a 10x20 game board
✅ Generate and display all 7 tetromino shapes
✅ Move pieces automatically downward
✅ Accept player input for movement and rotation
✅ Detect collisions accurately
✅ Clear completed lines
✅ Track and display score
✅ Detect and handle game over state
✅ Allow game restart

Congratulations! You've built your own Tetris! 🎮

## Notes

- The original Tetris was created by Alexey Pajitnov in 1985
- The name "Tetris" comes from "tetra" (Greek for four) + "tennis" (Pajitnov's favorite sport)
- Tetrominoes are geometric shapes composed of four squares
- Modern Tetris implementations often use the Super Rotation System (SRS) for piece rotation
- The game becomes progressively faster as the player's level increases

## Original Challenge

This challenge is from [CodingChallenges.fyi - Tetris](https://codingchallenges.fyi/challenges/challenge-tetris)
