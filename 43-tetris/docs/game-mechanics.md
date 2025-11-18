# Tetris Game Mechanics

This document explains the game mechanics, rules, and behaviors of Tetris from both a player's and developer's perspective.

## Table of Contents

1. [Basic Gameplay](#basic-gameplay)
2. [Tetrominoes](#tetrominoes)
3. [Movement and Controls](#movement-and-controls)
4. [Rotation System](#rotation-system)
5. [Piece Locking](#piece-locking)
6. [Line Clearing](#line-clearing)
7. [Scoring System](#scoring-system)
8. [Level Progression](#level-progression)
9. [Game Over Conditions](#game-over-conditions)
10. [Advanced Mechanics](#advanced-mechanics)

---

## Basic Gameplay

### Objective

**Goal**: Clear as many lines as possible to achieve the highest score before the board fills up.

**How to Clear Lines**: Complete horizontal lines by filling all 10 columns with blocks. When a line is complete, it disappears, and blocks above fall down.

### Game Flow

```
1. New piece spawns at top center of board
        ↓
2. Piece falls automatically (gravity)
        ↓
3. Player controls piece (move, rotate)
        ↓
4. Piece locks when it touches bottom or another piece
        ↓
5. Check for completed lines → Clear them
        ↓
6. Update score and level
        ↓
7. Spawn next piece
        ↓
8. Repeat until game over
```

### Board Layout

```
┌────────────────────────┐
│  10 Columns × 20 Rows  │
│                        │
│    Next Piece  ┌──────┤
│      ┌───┐     │Score │
│      │ I │     │  0   │
│      └───┘     ├──────┤
│                │Level │
│  Playing       │  1   │
│  Area          ├──────┤
│  ┌──────────┐  │Lines │
│  │          │  │  0   │
│  │          │  └──────┘
│  │          │
│  │    O     │  Controls:
│  │   OO     │  ← → ↑ ↓
│  │    O     │  SPACE
│  │■■■■■□□□■■│
│  │■■■□□□■■■■│
│  └──────────┘
└────────────────────────┘
```

---

## Tetrominoes

### The Seven Pieces

Tetris uses seven geometric shapes called "tetrominoes," each made of four blocks.

#### 1. I-Piece (Cyan)

```
Horizontal:     Vertical:
□□□□            □
■■■■            ■
□□□□            ■
□□□□            ■
```

**Properties:**
- Only piece that can clear 4 lines at once (Tetris)
- Fits in narrow spaces
- Requires 4-column wide space
- Most valuable for scoring

#### 2. O-Piece (Yellow)

```
■■
■■
```

**Properties:**
- Only piece that doesn't rotate
- Always 2×2 shape
- Good for filling corners
- Easy to place

#### 3. T-Piece (Purple)

```
Rotations:
  ■      □      □      ■
■■■    ■■    ■■■    ■■
□□□    ■      ■      □
```

**Properties:**
- Most versatile piece
- Can fit in many spots
- Used for T-spin techniques
- Good for complex shapes

#### 4. S-Piece (Green)

```
Horizontal:    Vertical:
□■■            ■
■■□            ■■
□□□            □■
```

**Properties:**
- Creates "S" shape
- Hard to fit
- Often creates gaps
- Use carefully

#### 5. Z-Piece (Red)

```
Horizontal:    Vertical:
■■□            □■
□■■            ■■
□□□            ■□
```

**Properties:**
- Mirror of S-piece
- Creates "Z" shape
- Similar challenges to S
- Plan placement carefully

#### 6. J-Piece (Blue)

```
Rotations:
■□□    ■■    □□■    ■
■■■    ■     ■■■    ■
□□□    ■     □□□    ■■
```

**Properties:**
- "J" or hook shape
- Good for edges
- Versatile placement
- Right-side hook

#### 7. L-Piece (Orange)

```
Rotations:
□□■    ■      ■■■    ■■
■■■    ■      ■□□    □■
□□□    ■■     □□□    □■
```

**Properties:**
- Mirror of J-piece
- "L" shape
- Left-side hook
- Good for edges

### Piece Colors (Standard)

| Piece | Color | Hex Code | RGB |
|-------|-------|----------|-----|
| I | Cyan | #00f0f0 | (0, 240, 240) |
| O | Yellow | #f0f000 | (240, 240, 0) |
| T | Purple | #a000f0 | (160, 0, 240) |
| S | Green | #00f000 | (0, 240, 0) |
| Z | Red | #f00000 | (240, 0, 0) |
| J | Blue | #0000f0 | (0, 0, 240) |
| L | Orange | #f0a000 | (240, 160, 0) |

---

## Movement and Controls

### Basic Controls

| Control | Key | Action | Speed |
|---------|-----|--------|-------|
| Move Left | ← | Shift piece left | Instant |
| Move Right | → | Shift piece right | Instant |
| Soft Drop | ↓ | Move down faster | Faster than gravity |
| Hard Drop | SPACE | Drop instantly | Instant lock |
| Rotate | ↑ | Rotate clockwise | Instant |

### Movement Rules

#### Horizontal Movement

```
Before:         After (→):
□□□□□□□□□□     □□□□□□□□□□
□□■□□□□□□□     □□□■□□□□□□
□■■■□□□□□□     □□■■■□□□□□
□□□□□□□□□□     □□□□□□□□□□
```

**Rules:**
- Can move left/right if space is empty
- Stops at walls
- Stops when touching other pieces
- No delay between moves

#### Vertical Movement (Gravity)

```
Time: 0s       Time: 1s      Time: 2s
□□□□           □□□□          □□□□
■■□□           □□□□          □□□□
■■□□           ■■□□          □□□□
□□□□           ■■□□          ■■□□
                             ■■□□
```

**Rules:**
- Automatic downward movement
- Speed increases with level
- Player can accelerate (soft drop)
- Player can instant drop (hard drop)

### Soft Drop

**Behavior:**
- Hold ↓ to move piece down faster
- Grants 1 point per row dropped
- Piece can still be moved horizontally
- Releases control when piece locks

**Use Cases:**
- Speed up placement
- Gain extra points
- Keep control during descent

### Hard Drop

**Behavior:**
- Press SPACE to instantly drop
- Piece moves to lowest valid position
- Piece locks immediately
- Grants 2 points per row dropped

**Use Cases:**
- Quick placement
- Maximum points
- No time wasted
- Efficient gameplay

---

## Rotation System

### Clockwise Rotation

```
Before:        After (↑):
  □              ■
■■■            □■
□□□            □■
```

**Rotation Rules:**
1. Rotate 90° clockwise
2. Check if new position is valid
3. If blocked, try wall kicks
4. If all kicks fail, rotation fails

### Wall Kick System

When rotation is blocked, try these offsets in order:

```
1. (0, 0)   - No offset (standard rotation)
2. (-1, 0)  - Move left 1 space
3. (1, 0)   - Move right 1 space
4. (0, -1)  - Move up 1 space
5. (-1, -1) - Move left-up diagonal
6. (1, -1)  - Move right-up diagonal
```

**Example: Rotation at Right Wall**

```
Step 1: Try standard rotation (fails)
□□□□□□□□□■     □□□□□□□□□□
□□□□□□□□□■     □□□□□□□□□■
□□□□□□□□■■     □□□□□□□□■■
                         ■ (blocked!)

Step 2: Try left kick (succeeds)
□□□□□□□□□■     □□□□□□□□□□
□□□□□□□□□■     □□□□□□□□■□
□□□□□□□□■■     □□□□□□□■■□
                       ■□
```

### Piece-Specific Rotation

#### I-Piece

```
State 0:    State 1:    State 2:    State 3:
□□□□        □□■□        □□□□        □■□□
■■■■        □□■□        □□□□        □■□□
□□□□        □□■□        ■■■■        □■□□
□□□□        □□■□        □□□□        □■□□
```

**Special Case**: I-piece uses 4×4 matrix for rotation

#### O-Piece

```
■■
■■
```

**No Rotation**: O-piece is symmetric, rotation changes nothing

#### T, S, Z, J, L Pieces

```
Example (T-piece):
State 0:    State 1:    State 2:    State 3:
□■□         □■□         □□□         □■□
■■■         ■■□         ■■■         □■■
□□□         □■□         □■□         □■□
```

**Standard 3×3 Rotation**: All use similar rotation patterns

---

## Piece Locking

### Lock Delay

```
Time: 0ms      Time: 500ms    Time: 1000ms (LOCK)
  ■              ■              ■
■■■            ■■■            ■■■
□□□            □□□            □□□
■■■■■■■■■■     ■■■■■■■■■■     ■■■■■■■■■■
                             (piece locks)
```

**Locking Mechanism:**
1. Piece touches bottom or another piece
2. Cannot move down further
3. Lock immediately (no delay in this implementation)
4. Piece becomes part of board

### Lock Behavior

**What Happens When Piece Locks:**
1. ✅ Piece color added to board array
2. ✅ Check for completed lines
3. ✅ Clear any completed lines
4. ✅ Update score
5. ✅ Spawn next piece
6. ✅ Check for game over

---

## Line Clearing

### Detection

A line is complete when all 10 columns contain blocks:

```
Before Clear:           After Clear:
Row 0: □□□□□□□□□□      Row 0: □□□□□□□□□□
Row 1: □□■□□□■□□□      Row 1: □□■□□□■□□□
Row 2: ■■■■■■■■■■      Row 2: ■■□□□■□■□□
Row 3: ■■□□□■□■□□
Row 4: ■■■■■■■■■■      (Rows 2 and 4 cleared,
Row 5: □□□□□□□□□□      rows above shifted down)
```

### Clearing Animation

```
Frame 1:     Frame 2:     Frame 3:     Complete:
■■■■■■■■■■   ░░░░░░░░░░   - - - - -    □□□□□□□□□□
■■□□□■□■□□   ■■□□□■□■□□   ■■□□□■□■□□   ■■□□□■□■□□
■■■■■■■■■■   ░░░░░░░░░░   - - - - -    □□□□□□□□□□
□□□□□□□□□□   □□□□□□□□□□   □□□□□□□□□□   □□□□□□□□□□
```

*Note: Current implementation clears lines instantly*

### Multiple Line Clears

**Single (1 line)**
```
Before:         After:
■■■■■■■■■■  →  (cleared)
□□■□□□■□□□     □□■□□□■□□□
```

**Double (2 lines)**
```
Before:         After:
■■■■■■■■■■  →  (cleared)
□□■□□□■□□□     □□■□□□■□□□
■■■■■■■■■■  →  (cleared)
```

**Triple (3 lines)**
```
Before:         After:
■■■■■■■■■■  →  (cleared)
■■■■■■■■■■  →  (cleared)
□□■□□□■□□□     □□■□□□■□□□
■■■■■■■■■■  →  (cleared)
```

**Tetris (4 lines)**
```
Before:         After:
■■■■■■■■■■  →  (cleared)
■■■■■■■■■■  →  (cleared)
■■■■■■■■■■  →  (cleared)
■■■■■■■■■■  →  (cleared)
```

---

## Scoring System

### Base Points

| Lines Cleared | Base Points | Name |
|---------------|-------------|------|
| 1 | 100 | Single |
| 2 | 300 | Double |
| 3 | 500 | Triple |
| 4 | 800 | Tetris |

### Level Multiplier

```
Final Score = Base Points × Current Level

Examples:
- 1 line at Level 1: 100 × 1 = 100 points
- 1 line at Level 5: 100 × 5 = 500 points
- 4 lines at Level 10: 800 × 10 = 8,000 points
```

### Drop Bonuses

**Soft Drop (↓):**
- +1 point per row descended
- Example: Soft drop 5 rows = +5 points

**Hard Drop (SPACE):**
- +2 points per row descended
- Example: Hard drop 10 rows = +20 points

### Scoring Strategy

**Maximum Points:**
1. ✅ Clear 4 lines at once (Tetris)
2. ✅ Play at higher levels
3. ✅ Use hard drop for bonus
4. ✅ Clear lines quickly to level up

**Score Comparison:**

| Action | Level 1 | Level 5 | Level 10 |
|--------|---------|---------|----------|
| 1 Line | 100 | 500 | 1,000 |
| 2 Lines | 300 | 1,500 | 3,000 |
| 3 Lines | 500 | 2,500 | 5,000 |
| 4 Lines | 800 | 4,000 | 8,000 |

---

## Level Progression

### Level Calculation

```javascript
level = Math.floor(totalLinesCleared / 10) + 1
```

**Level Progression Table:**

| Lines Cleared | Level | Speed (ms/drop) |
|---------------|-------|-----------------|
| 0-9 | 1 | 1000 |
| 10-19 | 2 | 900 |
| 20-29 | 3 | 800 |
| 30-39 | 4 | 700 |
| 40-49 | 5 | 600 |
| 50-59 | 6 | 500 |
| 60-69 | 7 | 400 |
| 70-79 | 8 | 300 |
| 80-89 | 9 | 200 |
| 90+ | 10+ | 100 (max) |

### Speed Changes

```
Level 1:  1.0 second per drop  (very slow)
Level 5:  0.6 seconds per drop (moderate)
Level 10: 0.1 seconds per drop (very fast)
```

**Visual Progression:**

```
Level 1: ■ . . . . . . . . . (1 second)
Level 5: ■ . . . . . (0.6 seconds)
Level 10: ■ . (0.1 seconds)
```

---

## Game Over Conditions

### Condition 1: Spawn Collision

```
New piece spawns but space is occupied:

□□□□■■□□□□  ← Spawn point blocked
□□□■■■□□□□
■■■■■■■■■□
■■■■■■■■■□
```

**Result**: GAME OVER

### Condition 2: Lock Above Board

```
Piece locks with blocks above visible board:

(Above board)
■ ← This block is above row 0
■■■ ← These blocks visible
```

**Result**: GAME OVER

### Game Over Screen

```
┌─────────────────────────┐
│      GAME OVER!         │
│                         │
│  Final Score: 12,500    │
│  Lines Cleared: 45      │
│  Level Reached: 5       │
│                         │
│  [ Play Again ]         │
│  [ Main Menu ]          │
└─────────────────────────┘
```

---

## Advanced Mechanics

### Ghost Piece

**Visual Preview:**

```
Current piece (solid):
  ■
■■■

Ghost piece (transparent):
□□□□□□□□□□
□□□□□□□□□□
  ░
░░░  ← Shows landing position
■■■■■■□□□□
```

**Benefits:**
- See exactly where piece will land
- Plan next move
- Reduce mistakes
- Faster gameplay

### Next Piece Preview

```
┌──────────┐
│   Next   │
│  ┌────┐  │
│  │ ■■ │  │
│  │ ■■ │  │
│  └────┘  │
└──────────┘
```

**Strategy:**
- Plan two moves ahead
- Prepare for next piece
- Optimize placement
- Higher scores

### Pause Functionality

**Pause Effects:**
- ⏸️ Piece stops falling
- ⏸️ Timer stops
- ⏸️ Input disabled (except unpause)
- ⏸️ Screen remains visible

**Unpause:**
- ▶️ Resume game immediately
- ▶️ No countdown
- ▶️ Full control restored

---

## Gameplay Tips

### Beginner Tips

1. **Keep It Flat**
   ```
   Good:            Bad:
   □□□□□□□□□□      □□■□□□□□□□
   □□□□□□□□□□      □□■■□□■□□□
   ■■■□□□■■■■      ■■■■□■■□■■
   ```

2. **Save Space for I-Pieces**
   - Leave 4-column spaces
   - I-pieces clear 4 lines
   - Most valuable piece

3. **Use Next Piece Preview**
   - Plan ahead
   - Optimize placement
   - Reduce mistakes

### Intermediate Tips

1. **Create Tetris Opportunities**
   ```
   ■■■■■■■■■□
   ■■■■■■■■■□
   ■■■■■■■■■□
   ■■■■■■■■■□
   (Ready for I-piece Tetris!)
   ```

2. **Manage S and Z Pieces**
   - Hardest to place
   - Create gaps if not careful
   - Plan placement carefully

3. **Use Hard Drop Strategically**
   - Bonus points
   - Faster gameplay
   - But less control

### Advanced Tips

1. **Maximize Score**
   - Focus on Tetrises (4 lines)
   - Level up quickly
   - Use hard drop bonuses

2. **Speed Management**
   - Practice at higher speeds
   - Muscle memory for placement
   - Stay calm under pressure

3. **Recovery Techniques**
   - Fix mistakes quickly
   - Adapt to bad pieces
   - Keep board manageable

---

## Common Mistakes

### 1. Creating Gaps

```
Bad:
□■□□□□□□□□
■■□□□■□□□□
■■■■■■■■■■
  ↑ Gap difficult to fill
```

**Solution**: Plan piece placement to avoid gaps

### 2. Building Too High

```
Bad:
■■■□□□■■■■  ← Row 2
■■■■□■■■■■  ← Row 3
■■■■■■■■■□  ← Row 4
■■■■■■■■■■  ← Row 5
  ↑ Too high, risky
```

**Solution**: Clear lines regularly, keep board low

### 3. Ignoring Next Piece

```
Current: O-piece
Next: I-piece

Bad placement:
■■■■■■■■□□  ← O-piece here
■■■■■■■■□□  ← leaves no space for I
```

**Solution**: Always consider next piece

### 4. Panic Dropping

```
Rushed placement:
□□■□■□□■□□  ← Messy
■□■■■□■■■□  ← Unplanned
```

**Solution**: Stay calm, plan moves

---

## Game Physics

### Gravity

- **Definition**: Automatic downward movement of pieces
- **Speed**: Determined by current level
- **Formula**: `dropInterval = 1000 - ((level - 1) × 100)` milliseconds

### Friction

- **Definition**: Pieces stop when touching bottom/other pieces
- **Implementation**: Lock immediately on contact (no slide)

### Momentum

- **Definition**: N/A (pieces don't retain momentum)
- **Behavior**: Instant stop when movement blocked

---

## Conclusion

Understanding these mechanics will help you:
- ✅ Play more effectively
- ✅ Achieve higher scores
- ✅ Understand game behavior
- ✅ Implement similar games
- ✅ Modify and enhance gameplay

**Practice Makes Perfect!** The more you play, the better you'll understand piece placement, timing, and strategy.

---

**Related Documentation:**
- [Implementation Guide](./implementation.md) - Technical details
- [Algorithms](./algorithms.md) - Data structures and algorithms
- [README](../README.md) - Getting started
