# Spell Checker Implementation Guide

This document provides a comprehensive walkthrough of the spell checker implementation, covering architecture, algorithms, design decisions, and code structure.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Edit Distance Implementation](#edit-distance-implementation)
4. [Correction Algorithm](#correction-algorithm)
5. [Performance Optimization](#performance-optimization)
6. [Data Structures](#data-structures)
7. [Training Methods](#training-methods)
8. [Command-Line Interface](#command-line-interface)
9. [Design Decisions](#design-decisions)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### High-Level Design

The spell checker follows a classic **generate-filter-rank** architecture:

```
Input Word
    ↓
┌─────────────────────────────┐
│ 1. Check Dictionary (O(1)) │
│    Already correct?         │
└─────────────────────────────┘
    ↓ Not found
┌─────────────────────────────┐
│ 2. Generate Edit-1 (O(n))  │
│    - Deletions              │
│    - Insertions             │
│    - Replacements           │
│    - Transpositions         │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ 3. Filter Known Words       │
│    Check each in dictionary │
└─────────────────────────────┘
    ↓ Found candidates
┌─────────────────────────────┐
│ 4. Rank by Frequency        │
│    Select most common       │
└─────────────────────────────┘
    ↓ No candidates
┌─────────────────────────────┐
│ 5. Try Edit-2 (O(n²))      │
│    Apply edits to edit-1    │
└─────────────────────────────┘
    ↓
Return Correction
```

### Design Principles

1. **Simplicity First:** Start with dictionary lookup, only generate candidates if needed
2. **Lazy Evaluation:** Don't generate edit-2 unless edit-1 fails
3. **Frequency Matters:** Use corpus statistics to select most likely correction
4. **No External Libraries:** Implement all algorithms from scratch for learning
5. **Performance Awareness:** Track and report timing metrics

### Components Diagram

```
┌──────────────────────────────────────────────────────┐
│                  SpellChecker                        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │         Word Frequency Dictionary            │    │
│  │         word_freq = {word: count}            │    │
│  └─────────────────────────────────────────────┘    │
│                         ↑                             │
│         ┌───────────────┼───────────────┐            │
│         │               │               │            │
│  ┌──────▼─────┐  ┌─────▼──────┐ ┌─────▼──────┐     │
│  │  Training  │  │    Edit    │ │ Correction │     │
│  │  Methods   │  │ Generators │ │  Methods   │     │
│  └────────────┘  └────────────┘ └────────────┘     │
│         │               │               │            │
│    train_from_text   edits1()      correct()        │
│    train_from_file   edits2()      batch_correct()  │
│    load_from_file    known_edits1()                 │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. SpellChecker Class

The main class that encapsulates all spell-checking functionality.

```python
class SpellChecker:
    """
    A spelling corrector that suggests corrections based on:
    - Edit distance (Levenshtein distance)
    - Word frequency in a training corpus
    """

    def __init__(self, word_freq=None):
        """
        Initialize spell checker.

        Args:
            word_freq: Dictionary of {word: frequency}
        """
        self.word_freq = word_freq or {}
        self.alphabet = 'abcdefghijklmnopqrstuvwxyz'
```

**Key Attributes:**
- `word_freq`: Hash map storing word frequencies (dict[str, int])
- `alphabet`: Characters to use for insertions and replacements

**Design Choice:** Store alphabet as an attribute to allow customization for non-English languages.

### 2. Word Frequency Dictionary

The core data structure is a Python dictionary (hash map):

```python
word_freq = {
    'the': 1061396,
    'of': 593677,
    'and': 416629,
    'to': 385997,
    'spelling': 342,
    'algorithm': 156,
    # ... 32,000+ words from big.txt
}
```

**Properties:**
- **Time Complexity:** O(1) average case for lookup, insert
- **Space Complexity:** O(n) where n = vocabulary size
- **Collision Handling:** Python's dict uses open addressing with random probing

**Why Dictionary?**
- Fast membership testing (`word in word_freq`)
- Direct frequency access (`word_freq[word]`)
- Simple to implement
- Memory efficient for ~100k words

**Alternative Considered:** Bloom filter for membership testing (see Going Further section)

---

## Edit Distance Implementation

### Levenshtein Distance Concept

The **Levenshtein distance** between two words is the minimum number of single-character edits required to change one word into another.

**Example:**
```
"cat" → "hat"     Distance: 1 (replace 'c' with 'h')
"cat" → "cats"    Distance: 1 (insert 's')
"cat" → "at"      Distance: 1 (delete 'c')
"cat" → "act"     Distance: 1 (transpose 'c' and 'a')
```

### Four Edit Operations

#### 1. Deletions

Remove each character in turn:

```python
def deletions(self, word):
    """Generate all words with one letter deleted."""
    return [word[:i] + word[i+1:] for i in range(len(word))]
```

**Example:**
```python
deletions("cat")
# Returns: ["at", "ct", "ca"]

deletions("spelling")
# Returns: ["pelling", "selling", "speling", "spellng", "spellig", ...]
```

**Algorithm:**
1. For each position `i` from 0 to len(word)-1:
   - Take substring before position: `word[:i]`
   - Take substring after position: `word[i+1:]`
   - Concatenate them (skipping character at position i)

**Complexity:**
- **Time:** O(n²) - n iterations, each creating string of length n-1
- **Space:** O(n²) - n strings of length n-1
- **Count:** n deletions for word of length n

#### 2. Insertions

Insert each letter of the alphabet at each position:

```python
def insertions(self, word):
    """Generate all words with one letter inserted."""
    return [word[:i] + c + word[i:]
            for i in range(len(word) + 1)
            for c in self.alphabet]
```

**Example:**
```python
insertions("at")
# Returns: [
#   "aat", "bat", "cat", ..., "zat",   # Insert at position 0
#   "aat", "abt", "act", ..., "azt",   # Insert at position 1
#   "ata", "atb", "atc", ..., "atz"    # Insert at position 2
# ]
# Total: 26 × 3 = 78 candidates
```

**Algorithm:**
1. For each position `i` from 0 to len(word) (note: includes end):
   - For each letter `c` in alphabet:
     - Create word[:i] + c + word[i:]

**Complexity:**
- **Time:** O(26n²) = O(n²)
- **Space:** O(26n²) = O(n²)
- **Count:** 26(n+1) insertions for word of length n

**Why n+1 positions?** Can insert at start, between any two characters, or at end.

#### 3. Replacements

Replace each character with every other letter:

```python
def replacements(self, word):
    """Generate all words with one letter replaced."""
    return [word[:i] + c + word[i+1:]
            for i in range(len(word))
            for c in self.alphabet
            if c != word[i]]
```

**Example:**
```python
replacements("cat")
# Returns: [
#   "aat", "bat", "dat", ..., "zat",   # Replace 'c'
#   "cbt", "cct", "cdt", ..., "czt",   # Replace 'a'
#   "caa", "cab", "cac", ..., "caz"    # Replace 't'
# ]
# Total: 25 × 3 = 75 candidates (excluding same letter)
```

**Algorithm:**
1. For each position `i` from 0 to len(word)-1:
   - For each letter `c` in alphabet:
     - If c is different from word[i]:
       - Create word[:i] + c + word[i+1:]

**Optimization:** Skip if `c == word[i]` (not a replacement)

**Complexity:**
- **Time:** O(25n²) = O(n²)
- **Space:** O(25n²) = O(n²)
- **Count:** 25n replacements (26 letters - 1 for same letter)

#### 4. Transpositions

Swap each pair of adjacent characters:

```python
def transpositions(self, word):
    """Generate all words with adjacent letters swapped."""
    return [word[:i] + word[i+1] + word[i] + word[i+2:]
            for i in range(len(word) - 1)]
```

**Example:**
```python
transpositions("cat")
# Returns: ["act", "cta"]

transpositions("spelling")
# Returns: ["pselling", "seplling", "spleling", "spellnig", "spelilng", "spellign"]
```

**Algorithm:**
1. For each position `i` from 0 to len(word)-2:
   - Swap characters at positions i and i+1
   - Create word[:i] + word[i+1] + word[i] + word[i+2:]

**Why len(word)-1?** Need two characters to swap, so can't start at last character.

**Complexity:**
- **Time:** O(n²)
- **Space:** O(n²)
- **Count:** n-1 transpositions

### Combined Edit Distance 1

```python
def edits1(self, word):
    """
    Generate all words with edit distance 1.

    Returns: Set of words
    """
    deletes = self.deletions(word)
    inserts = self.insertions(word)
    replaces = self.replacements(word)
    transposes = self.transpositions(word)

    return set(deletes + inserts + replaces + transposes)
```

**Total Candidates:**
```
n + 26(n+1) + 25n + (n-1)
= n + 26n + 26 + 25n + n - 1
= 53n + 25
```

**For "cat" (n=3):**
- Deletions: 3
- Insertions: 26 × 4 = 104
- Replacements: 25 × 3 = 75
- Transpositions: 2
- **Total:** 184 candidates

**For "spelling" (n=8):**
- Deletions: 8
- Insertions: 26 × 9 = 234
- Replacements: 25 × 8 = 200
- Transpositions: 7
- **Total:** 449 candidates

**Why Use Set?**
- Removes duplicates (e.g., "cat" → delete 't' → insert 't' = "cat")
- Unordered collection (don't care about order)
- Fast membership testing for filtering

### Filtering Known Words

```python
def known_edits1(self, word):
    """Return known words with edit distance 1."""
    return {w for w in self.edits1(word) if w in self.word_freq}
```

**Process:**
1. Generate all edit-1 candidates (~53n candidates)
2. Check each against dictionary (O(1) per lookup)
3. Return only valid words

**Example:**
```python
edits1("speling") → {
    "apeling", "bpeling", "cpeling", ...,  # Many invalid
    "spelling",  # ← Valid! In dictionary
    "spellings",  # ← Valid! In dictionary
    ...
}

known_edits1("speling") → {
    "spelling",
    "spellings"
}
```

**Complexity:**
- **Time:** O(n) to generate × O(1) to check = O(n)
- **Space:** O(k) where k = number of valid candidates (typically 1-10)

### Edit Distance 2

Apply edit operations twice:

```python
def edits2(self, word):
    """
    Generate all words with edit distance 2.

    Warning: This can generate a huge number of candidates!
    """
    return {e2 for e1 in self.edits1(word) for e2 in self.edits1(e1)}
```

**Process:**
1. Generate all edit-1 words: ~53n candidates
2. For each edit-1 word, generate its edit-1 words: ~53n × 53n

**Total Candidates:**
```
(53n)² ≈ 2809n²
```

**For "cat" (n=3):**
- Edit-1: ~184 candidates
- Edit-2: ~184 × 53 × 3 ≈ 29,000+ candidates

**For "spelling" (n=8):**
- Edit-1: ~449 candidates
- Edit-2: ~449 × 53 × 8 ≈ 190,000+ candidates!

**Problem:** This is computationally expensive and generates many invalid words.

### Optimized Edit Distance 2

Only generate edit-2 from known edit-1 words:

```python
def known_edits2(self, word):
    """Return known words with edit distance 2."""
    # Optimization: only generate edit2 from known edit1
    e1_known = self.known_edits1(word)

    if not e1_known:
        # No known edit1 words, try all edit2 (expensive!)
        return {w for w in self.edits2(word) if w in self.word_freq}

    # Generate edit2 from known edit1
    return {e2 for e1 in e1_known
            for e2 in self.edits1(e1)
            if e2 in self.word_freq}
```

**Optimization Strategy:**

**Case 1: Known edit-1 words exist**
```
"speiling" → known_edits1() → {"spelling"}
           → Apply edits1 to "spelling"
           → Filter for known words
```

This drastically reduces candidates because we only expand from valid words.

**Case 2: No known edit-1 words**
```
"xpeling" → known_edits1() → {} (empty)
          → Fall back to full edit2 generation
```

**Performance Comparison:**

| Word      | Edit-1 Known | Edit-2 Candidates (Optimized) | Edit-2 Candidates (Naive) |
|-----------|--------------|-------------------------------|---------------------------|
| speiling  | 1 ("spelling") | ~400                        | ~190,000                  |
| korrecter | 0            | ~190,000 (fallback)          | ~190,000                  |

**Design Decision:** Use optimized version by default, fall back to expensive search only when necessary.

---

## Correction Algorithm

### Three-Tier Strategy

```python
def correct(self, word):
    """
    Return the most likely spelling correction.

    Strategy:
    1. If word is known, return it (edit distance 0)
    2. Try edit distance 1, return most frequent
    3. Try edit distance 2, return most frequent
    4. If no correction found, return original word

    Returns: Corrected word
    """
    word_lower = word.lower()

    # Already correct?
    if word_lower in self.word_freq:
        return word

    # Edit distance 1
    candidates = self.known_edits1(word_lower)
    if candidates:
        return max(candidates, key=lambda w: self.word_freq[w])

    # Edit distance 2
    candidates = self.known_edits2(word_lower)
    if candidates:
        return max(candidates, key=lambda w: self.word_freq[w])

    # No correction found
    return word
```

### Step-by-Step Walkthrough

**Example 1: Already Correct**
```python
correct("spelling")

# Step 1: Check dictionary
"spelling" in word_freq → True
# Return immediately: "spelling"

# Time: O(1)
```

**Example 2: Edit Distance 1**
```python
correct("speling")

# Step 1: Check dictionary
"speling" in word_freq → False

# Step 2: Generate edit-1 candidates
known_edits1("speling") → {
    "spelling": 342,
    "spelings": 12
}

# Step 3: Select most frequent
max([342, 12]) → "spelling"
# Return: "spelling"

# Time: O(n)
```

**Example 3: Edit Distance 2**
```python
correct("spelingz")

# Step 1: Check dictionary
"spelingz" in word_freq → False

# Step 2: Generate edit-1 candidates
known_edits1("spelingz") → {} (empty)

# Step 3: Generate edit-2 candidates
known_edits2("spelingz") → {
    "spelling": 342,
    "spellings": 89,
    "sealings": 23
}

# Step 4: Select most frequent
max([342, 89, 23]) → "spelling"
# Return: "spelling"

# Time: O(n²)
```

**Example 4: No Correction**
```python
correct("asdfghjkl")

# Step 1: Check dictionary
"asdfghjkl" in word_freq → False

# Step 2: Generate edit-1 candidates
known_edits1("asdfghjkl") → {} (empty)

# Step 3: Generate edit-2 candidates
known_edits2("asdfghjkl") → {} (empty)

# Step 4: No correction found
# Return original: "asdfghjkl"

# Time: O(n²) (tried expensive search)
```

### Frequency-Based Ranking

When multiple corrections are possible, select the most frequent:

```python
max(candidates, key=lambda w: self.word_freq[w])
```

**Example:**
```python
candidates = {
    "spelling": 342,
    "spellings": 89,
    "spieling": 12
}

# Select "spelling" (frequency = 342)
```

**Why Frequency Matters:**

In natural language, common words appear far more frequently than rare words (**Zipf's Law**):

```
Rank 1:  "the"       → 1,061,396 occurrences
Rank 10: "to"        → 385,997 occurrences
Rank 100: "us"       → 26,068 occurrences
Rank 1000: "former"  → 2,820 occurrences
```

If a user types "teh", it's far more likely they meant "the" (rank 1) than "tea" (rank 300+).

### Case Handling

The spell checker is case-insensitive but preserves original case:

```python
def correct(self, word):
    word_lower = word.lower()  # Convert to lowercase

    if word_lower in self.word_freq:
        return word  # Return original case
```

**Example:**
```python
correct("SPEILING") → "SPEILING"  # Not "spelling"
correct("Speiling") → "Speiling"  # Not "spelling"
```

**Design Decision:** Users expect spell checkers to preserve their capitalization style.

---

## Performance Optimization

### 1. Early Exit Strategy

Don't generate candidates if word is already correct:

```python
# Fast path: O(1)
if word_lower in self.word_freq:
    return word

# Slow path: O(n) or O(n²)
# Only reached if word is not in dictionary
```

**Impact:** ~90% of words in typical text are spelled correctly, so this optimization applies frequently.

### 2. Lazy Edit Distance 2

Don't try edit-2 unless edit-1 fails:

```python
# Try edit-1 first (O(n))
candidates = self.known_edits1(word_lower)
if candidates:
    return max(candidates, key=lambda w: self.word_freq[w])

# Only try edit-2 if edit-1 failed (O(n²))
candidates = self.known_edits2(word_lower)
```

**Impact:** Most typos are single-character errors, so edit-2 is rarely needed.

### 3. Set Operations

Use sets instead of lists to eliminate duplicates:

```python
return set(deletes + inserts + replaces + transposes)
```

**Before (list):**
```python
["cat", "at", "cat", "bat", ...]  # Duplicates possible
# Length: 184 candidates
```

**After (set):**
```python
{"cat", "at", "bat", ...}  # No duplicates
# Length: ~150 candidates (eliminates ~20% duplicates)
```

### 4. Generator Expressions

Use generator expressions for memory efficiency:

```python
# Memory efficient (iterator)
return {w for w in self.edits1(word) if w in self.word_freq}

# Less efficient (creates full list first)
# return [w for w in self.edits1(word) if w in self.word_freq]
```

### 5. Dictionary Membership Testing

Python's `in` operator is O(1) average case for dictionaries:

```python
if w in self.word_freq:  # O(1) hash lookup
    candidates.add(w)
```

**Alternative (slower):**
```python
if w in word_list:  # O(n) linear search in list
    candidates.append(w)
```

---

## Data Structures

### Word Frequency Dictionary

**Structure:**
```python
word_freq = {
    str: int,  # word → frequency
    ...
}
```

**Operations:**

| Operation | Time | Example |
|-----------|------|---------|
| Insert | O(1) | `word_freq['spelling'] = 342` |
| Lookup | O(1) | `if 'spelling' in word_freq` |
| Access | O(1) | `freq = word_freq['spelling']` |
| Delete | O(1) | `del word_freq['spelling']` |

**Memory Usage:**

For 32,192 words (big.txt):
```
Memory = (avg_word_length + int_size) × word_count
       = (8 bytes + 8 bytes) × 32,192
       ≈ 512 KB
```

Plus Python's dict overhead (~3× for hash table):
```
Total ≈ 1.5 MB
```

**Hash Function:**

Python uses SipHash (secure hash) with random seed:
```python
hash("spelling") → 1234567890123456  # Example hash value
index = hash % table_size
```

**Collision Resolution:**

Python uses **open addressing** with **random probing**:
```
1. Compute hash(key)
2. If slot occupied and key doesn't match:
   - Try next slot using probing sequence
3. Continue until empty slot or matching key found
```

### Candidate Sets

**Structure:**
```python
candidates = {str, str, ...}  # Set of words
```

**Why Set Instead of List?**

| Feature | Set | List |
|---------|-----|------|
| Duplicates | No | Yes |
| Order | No | Yes |
| Membership test | O(1) | O(n) |
| Add element | O(1) | O(1) |
| Memory | Higher | Lower |

**Decision:** Sets are better because:
1. No need for order
2. Duplicates waste time in ranking phase
3. Fast membership testing (though not used here)

---

## Training Methods

### 1. Train from Text Corpus

Extract word frequencies from raw text:

```python
def train_from_text(self, text):
    """
    Train from a text corpus by extracting word frequencies.

    Args:
        text: String containing training text

    Returns:
        Number of unique words
    """
    # Tokenize: extract words (alphanumeric sequences)
    words = re.findall(r'\w+', text.lower())

    # Count frequencies
    self.word_freq = Counter(words)

    return len(self.word_freq)
```

**Tokenization:**
```python
re.findall(r'\w+', text.lower())
```

**Pattern `\w+` matches:**
- One or more word characters (a-z, A-Z, 0-9, _)
- Splits on spaces, punctuation, etc.

**Example:**
```python
text = "Hello, world! This is a test. This is only a test."
words = re.findall(r'\w+', text.lower())
# Returns: ['hello', 'world', 'this', 'is', 'a', 'test', 'this', 'is', 'only', 'a', 'test']

Counter(words)
# Returns: {
#     'this': 2,
#     'is': 2,
#     'a': 2,
#     'test': 2,
#     'hello': 1,
#     'world': 1,
#     'only': 1
# }
```

**Design Decision:** Use regex instead of `split()` to handle complex punctuation:

```python
# split() approach (problematic)
"don't".split()  # → ["don't"] (keeps apostrophe)
"hello-world".split()  # → ["hello-world"] (keeps hyphen)

# regex approach (better)
re.findall(r'\w+', "don't")  # → ["don", "t"]
re.findall(r'\w+', "hello-world")  # → ["hello", "world"]
```

### 2. Train from File

```python
def train_from_file(self, filename):
    """Train from a text file."""
    with open(filename, 'r', encoding='utf-8') as f:
        text = f.read()

    return self.train_from_text(text)
```

**Usage:**
```python
checker = SpellChecker()
word_count = checker.train_from_file('big.txt')
# Loads ~6 million characters
# Extracts ~32,192 unique words
```

### 3. Load Pre-computed Frequencies

Load word→frequency mappings directly:

```python
def load_from_file(self, filename):
    """
    Load word frequencies from a file.

    Expected format: one word per line OR "word frequency" per line
    """
    self.word_freq = {}

    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if not parts:
                continue

            if len(parts) == 1:
                # Just words, assign frequency 1
                word = parts[0].lower()
                self.word_freq[word] = self.word_freq.get(word, 0) + 1
            else:
                # Word and frequency
                word = parts[0].lower()
                try:
                    freq = int(parts[1])
                    self.word_freq[word] = freq
                except ValueError:
                    # If second part isn't a number, treat as word
                    self.word_freq[word] = self.word_freq.get(word, 0) + 1

    return len(self.word_freq)
```

**Supported Formats:**

**Format 1: Word only**
```
the
of
and
to
```

**Format 2: Word + Frequency**
```
the 1061396
of 593677
and 416629
to 385997
```

**Error Handling:**
```python
try:
    freq = int(parts[1])
except ValueError:
    # Not a number, treat as word
    word_freq[word] = word_freq.get(word, 0) + 1
```

This gracefully handles malformed lines.

---

## Command-Line Interface

### Argument Parsing

```python
def main():
    """Command-line interface for spell checker."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Spelling Corrector using Edit Distance',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train from text file and correct words
  %(prog)s -t big.txt spelling misteke executionw

  # Load word frequency file
  %(prog)s -f word_freq.txt spelling misteke

  # Batch mode with performance stats
  %(prog)s -t big.txt speiling misteke executionw mekanism coding chalenges
        """
    )

    parser.add_argument('-t', '--train', metavar='FILE',
                       help='Train from text corpus file')
    parser.add_argument('-f', '--freq', metavar='FILE',
                       help='Load word frequency file')
    parser.add_argument('-d', '--detailed', action='store_true',
                       help='Show detailed correction information')
    parser.add_argument('-q', '--quiet', action='store_true',
                       help='Suppress performance stats')
    parser.add_argument('words', nargs='*',
                       help='Words to check/correct')

    args = parser.parse_args()
```

**Arguments:**

| Argument | Type | Description |
|----------|------|-------------|
| `-t, --train` | File path | Train from text corpus |
| `-f, --freq` | File path | Load word frequency file |
| `-d, --detailed` | Flag | Show detailed correction info |
| `-q, --quiet` | Flag | Suppress performance stats |
| `words` | List | Words to correct (positional) |

### Detailed Mode Output

```python
if args.detailed:
    # Show detailed information
    for word in args.words:
        details = checker.correct_with_details(word)
        print(f"\nWord: {details['original']}")
        print(f"  Correction: {details['correction']}")
        print(f"  Edit Distance: {details['edit_distance']}")
        print(f"  Candidates: {details['candidates']}")
        print(f"  Frequency: {details['frequency']}")
```

**Example Output:**
```
Word: speiling
  Correction: spelling
  Edit Distance: 1
  Candidates: 2
  Frequency: 342
```

### Batch Mode Output

```python
else:
    # Simple batch correction
    corrections, elapsed, wps = checker.batch_correct(
        args.words,
        verbose=not args.quiet
    )

    if not args.quiet:
        # Already printed by batch_correct
        pass
    else:
        # Just print corrections
        for original, corrected in corrections:
            print(f"{original} {corrected}")
```

**Example Output (verbose):**
```
speiling spelling
misteke mistake
executionw execution
Time: 45.234567ms 66.3 words per second
```

**Example Output (quiet):**
```
speiling spelling
misteke mistake
executionw execution
```

---

## Design Decisions

### 1. Dictionary vs. Bloom Filter

**Decision:** Use dictionary for primary storage, consider Bloom filter as optimization.

**Rationale:**
- Dictionary provides O(1) lookups with 100% accuracy
- Bloom filter has false positives (says word exists when it doesn't)
- For 32k words, dictionary uses only ~1.5 MB (acceptable)
- Bloom filter would save memory but add complexity

**When to Use Bloom Filter:**
- Very large dictionaries (1M+ words)
- Memory-constrained environments
- Can tolerate false positives

### 2. Edit Distance 1 vs. 2

**Decision:** Support both, but try edit-1 first.

**Rationale:**
- 80%+ of typos are edit distance 1
- Edit-2 is O(n²) and often unnecessary
- Lazy evaluation saves time on common cases

**Statistics from Research:**
- 80% of typos: edit distance 1
- 15% of typos: edit distance 2
- 5% of typos: edit distance 3+

### 3. Frequency-Based vs. Edit-Distance-Based Ranking

**Decision:** Use frequency-based ranking.

**Rationale:**
- User likely meant common word over rare word
- Frequency data is readily available from corpus
- Alternative (pure edit distance) doesn't discriminate between candidates

**Example:**
```
Input: "teh"
Edit-1 candidates: "the", "tea", "ten", "ted"

Frequency-based: Select "the" (most common)
Edit-distance-based: All have distance 1 (tie - can't decide)
```

### 4. Case Sensitivity

**Decision:** Case-insensitive comparison, preserve original case.

**Rationale:**
- Users expect "HELLO" to correct to "HELLO", not "hello"
- Internal comparison should be case-insensitive ("Hello" = "hello")
- Preserving case is standard spell checker behavior

### 5. Return Original vs. None on Failure

**Decision:** Return original word if no correction found.

**Rationale:**
- User's input might be correct (proper noun, technical term)
- Returning None requires caller to handle None case
- Preserving input is safer default

**Example:**
```python
correct("GitHub")  # Not in dictionary
# Returns: "GitHub" (preserve original)
# NOT: None (would require None handling)
```

---

## Testing Strategy

### Unit Tests

**Test Edit Operations:**

```python
def test_deletions():
    checker = SpellChecker()
    result = checker.deletions("cat")
    assert result == ["at", "ct", "ca"]

def test_insertions():
    checker = SpellChecker()
    result = checker.insertions("at")
    assert len(result) == 26 * 3  # 26 letters × 3 positions

def test_replacements():
    checker = SpellChecker()
    result = checker.replacements("cat")
    assert len(result) == 25 * 3  # 25 letters × 3 positions

def test_transpositions():
    checker = SpellChecker()
    result = checker.transpositions("cat")
    assert result == ["act", "cta"]
```

**Test Edit Distance 1:**

```python
def test_edits1_count():
    checker = SpellChecker()
    result = checker.edits1("cat")
    # Should generate ~53n + 25 candidates
    assert 150 <= len(result) <= 200
```

**Test Correction:**

```python
def test_correct_single_edit():
    checker = SpellChecker()
    checker.word_freq = {
        "spelling": 342,
        "spellings": 89
    }
    assert checker.correct("speling") == "spelling"

def test_correct_already_correct():
    checker = SpellChecker()
    checker.word_freq = {"spelling": 342}
    assert checker.correct("spelling") == "spelling"

def test_correct_no_correction():
    checker = SpellChecker()
    checker.word_freq = {}
    assert checker.correct("asdfgh") == "asdfgh"
```

### Integration Tests

**Test with Real Corpus:**

```python
def test_with_big_txt():
    checker = SpellChecker()
    checker.train_from_file('big.txt')

    # Test common typos
    assert checker.correct("speling") == "spelling"
    assert checker.correct("korrecter") == "corrector"
    assert checker.correct("teh") == "the"
```

### Performance Tests

**Benchmark Correction Speed:**

```python
def benchmark_correction():
    checker = SpellChecker()
    checker.train_from_file('big.txt')

    words = ["speiling", "misteke", "executionw"] * 100
    corrections, elapsed, wps = checker.batch_correct(words, verbose=False)

    print(f"Words per second: {wps:.1f}")
    assert wps > 10  # Should process at least 10 words/second
```

---

## Summary

This spell checker implementation demonstrates:

1. **Edit Distance Algorithms** - Four edit operations with O(n) complexity
2. **Frequency-Based Ranking** - Using corpus statistics for better corrections
3. **Performance Optimization** - Early exit, lazy evaluation, optimized edit-2
4. **Clean Architecture** - Separation of concerns, modular design
5. **Comprehensive Testing** - Unit, integration, and performance tests

The implementation balances **simplicity** (easy to understand) with **performance** (fast enough for real use) while remaining **extensible** (easy to add Bloom filters, phonetic matching, etc.).
