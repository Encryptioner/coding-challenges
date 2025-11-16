# Build Your Own Spell Checker (Bloom Filter)

This challenge is to build a spell checker that suggests corrections for misspelled words using edit distance algorithms and word frequency analysis.

Spell checkers are essential tools in text editors, browsers, and word processors. Understanding how they work involves learning about edit distance, frequency analysis, and data structures like Bloom filters.

## The Challenge - Building a Spell Checker

The goal is to build a tool that can:
- Load a word frequency dictionary
- Detect misspelled words
- Generate possible corrections using edit distance
- Suggest the most likely correction based on frequency
- Track performance metrics

## Background Concepts

### Edit Distance (Levenshtein Distance)

The **Levenshtein distance** between two words is the minimum number of single-character edits (insertions, deletions, substitutions, or transpositions) needed to change one word into another.

**Examples:**
```
"cat" → "hat" = 1 edit (substitution)
"cat" → "cats" = 1 edit (insertion)
"cat" → "at" = 1 edit (deletion)
"cat" → "act" = 1 edit (transposition)
```

### Edit Operations

**Deletion:** Remove one letter
```
"spelling" → "speling" (remove one 'l')
```

**Insertion:** Add one letter
```
"speling" → "spelling" (add 'l')
```

**Replacement:** Change one letter
```
"spelling" → "spalling" (replace 'e' with 'a')
```

**Transposition:** Swap two adjacent letters
```
"spelling" → "sepllling" (swap 'p' and 'e')
```

### Word Frequency

Real-world text follows **Zipf's Law**: a small number of words occur very frequently, while most words occur rarely.

**Example frequencies:**
- "the" - 1,000,000+ occurrences
- "algorithm" - 500 occurrences
- "zebra" - 10 occurrences

When multiple corrections are possible, suggest the most frequent one.

## Step Zero

Set up your development environment:

**Requirements:**
- Programming language of choice (Python, JavaScript, Go, etc.)
- Word frequency data (we'll use a public dataset)
- Text editor/IDE

**Download Word Frequency Data:**

Use Peter Norvig's word frequency list:
```bash
wget https://norvig.com/big.txt
# Or use any word frequency list (format: word frequency)
```

## Step 1 - Load Word Frequency Data

Build a data structure to store words and their frequencies.

**Requirements:**
- Load words and frequencies from file
- Store in efficient data structure (hash map/dictionary)
- Handle missing or malformed data

**Input Format:**
```
the 1000000
of 500000
and 400000
...
```

**Data Structure:**
```python
word_freq = {
    'the': 1000000,
    'of': 500000,
    'and': 400000,
    # ...
}
```

**Implementation:**

```python
def load_word_frequencies(filename):
    """Load word frequency data from file."""
    frequencies = {}

    with open(filename, 'r') as f:
        for line in f:
            # Parse line
            parts = line.strip().split()
            if len(parts) >= 2:
                word = parts[0].lower()
                freq = int(parts[1])
                frequencies[word] = freq

    return frequencies
```

**Alternative - Train from Corpus:**

```python
import re
from collections import Counter

def train_from_corpus(text):
    """Extract word frequencies from text corpus."""
    # Tokenize: extract words
    words = re.findall(r'\w+', text.lower())

    # Count frequencies
    return Counter(words)
```

## Step 2 - Check if Word is Valid

Implement a function to check if a word exists in the dictionary.

**Requirements:**
- Case-insensitive check
- Return True if word exists, False otherwise
- Handle empty strings

**Implementation:**

```python
def is_valid_word(word, word_freq):
    """Check if word exists in dictionary."""
    return word.lower() in word_freq
```

**Usage:**
```python
is_valid_word("hello", word_freq)  # True
is_valid_word("helo", word_freq)   # False
```

## Step 3 - Generate Words with Edit Distance 1

Generate all possible words that are one edit away from the input word.

**Four Types of Edits:**

### Deletions

Remove each letter in turn:
```
"cat" → ["at", "ct", "ca"]
```

**Algorithm:**
```python
def deletions(word):
    """Generate all words with one letter deleted."""
    return [word[:i] + word[i+1:] for i in range(len(word))]
```

### Insertions

Insert each letter of alphabet at each position:
```
"at" → ["aat", "bat", "cat", ..., "aat", "abt", "act", ...]
```

**Algorithm:**
```python
def insertions(word):
    """Generate all words with one letter inserted."""
    letters = 'abcdefghijklmnopqrstuvwxyz'
    return [word[:i] + c + word[i:]
            for i in range(len(word) + 1)
            for c in letters]
```

### Replacements

Replace each letter with every other letter:
```
"cat" → ["aat", "bat", ..., "czt", "caa", "cab", ...]
```

**Algorithm:**
```python
def replacements(word):
    """Generate all words with one letter replaced."""
    letters = 'abcdefghijklmnopqrstuvwxyz'
    return [word[:i] + c + word[i+1:]
            for i in range(len(word))
            for c in letters
            if c != word[i]]
```

### Transpositions

Swap each pair of adjacent letters:
```
"cat" → ["act", "cta"]
```

**Algorithm:**
```python
def transpositions(word):
    """Generate all words with adjacent letters swapped."""
    return [word[:i] + word[i+1] + word[i] + word[i+2:]
            for i in range(len(word) - 1)]
```

### Combined Edit Distance 1

```python
def edits1(word):
    """Generate all words with edit distance 1."""
    deletes = deletions(word)
    inserts = insertions(word)
    replaces = replacements(word)
    transposes = transpositions(word)

    return set(deletes + inserts + replaces + transposes)
```

### Filter Valid Words

```python
def known_edits1(word, word_freq):
    """Return known words with edit distance 1."""
    return {w for w in edits1(word) if w in word_freq}
```

### Big O Analysis (Bonus)

For a word of length **n**:

- **Deletions:** n words
- **Insertions:** 26 × (n + 1) words
- **Replacements:** 25 × n words (26 - 1, excluding same letter)
- **Transpositions:** n - 1 words

**Total:**
```
n + 26(n+1) + 25n + (n-1)
= n + 26n + 26 + 25n + n - 1
= 53n + 25
= O(n)
```

**Answer:** O(n) words generated, where n = word length.

## Step 4 - Edit Distance 2

Generate words that are two edits away.

**Strategy:** Apply edits1 to each result from edits1.

```python
def edits2(word):
    """Generate all words with edit distance 2."""
    # Get all edit distance 1 words
    e1 = edits1(word)

    # Apply edits1 to each of those
    return {e2 for e1_word in e1 for e2 in edits1(e1_word)}
```

**Warning:** This generates a HUGE number of candidates!

**Big O:** O(n²) words (approximately)

### Filter Valid Words (Edit Distance 2)

```python
def known_edits2(word, word_freq):
    """Return known words with edit distance 2."""
    return {w for w in edits2(word) if w in word_freq}
```

### Optimization

Instead of generating all edit2 candidates, filter during generation:

```python
def known_edits2_optimized(word, word_freq):
    """Optimized: only generate edit2 from known edit1."""
    e1_known = known_edits1(word, word_freq)

    return {e2 for e1 in e1_known
            for e2 in edits1(e1)
            if e2 in word_freq}
```

## Step 5 - Suggest Corrections

Suggest the best correction based on edit distance and frequency.

**Algorithm:**
1. Check if word is already correct (edit distance 0)
2. Try edit distance 1, return most frequent
3. Try edit distance 2, return most frequent
4. If no correction found, return original word

**Implementation:**

```python
def correct(word, word_freq):
    """Return most likely spelling correction."""
    # Already correct?
    if word in word_freq:
        return word

    # Edit distance 1
    candidates = known_edits1(word, word_freq)
    if candidates:
        return max(candidates, key=lambda w: word_freq[w])

    # Edit distance 2
    candidates = known_edits2(word, word_freq)
    if candidates:
        return max(candidates, key=lambda w: word_freq[w])

    # No correction found
    return word
```

**Usage:**
```python
correct("speling", word_freq)    # → "spelling"
correct("korrecter", word_freq)  # → "corrector"
```

## Step 6 - Performance Tracking

Add timing and statistics to the spell checker.

**Requirements:**
- Measure time taken
- Calculate words per second
- Report corrections

**Implementation:**

```python
import time

def spell_check_batch(words, word_freq):
    """Check spelling for multiple words and report stats."""
    start_time = time.time()

    corrections = []
    for word in words:
        correction = correct(word, word_freq)
        corrections.append((word, correction))

    end_time = time.time()
    elapsed = end_time - start_time

    # Calculate rate
    wps = len(words) / elapsed if elapsed > 0 else 0

    # Print results
    for original, corrected in corrections:
        print(f"{original} {corrected}")

    print(f"Time: {elapsed*1000:.6f}ms {wps:.1f} words per second")

    return corrections
```

**Example Output:**
```
speiling spelling
misteke mistake
executionw execution
mekanism mechanism
coding coding
chalenges challenges
Time: 20.026833ms 299.6 words per second
```

## Going Further

### Bloom Filter Optimization

Use a **Bloom filter** for fast membership testing.

**Bloom Filter:**
- Probabilistic data structure
- Fast O(1) membership test
- Space-efficient
- Can have false positives, no false negatives

**Implementation:**

```python
from bitarray import bitarray
import mmh3

class BloomFilter:
    def __init__(self, size, hash_count):
        self.size = size
        self.hash_count = hash_count
        self.bit_array = bitarray(size)
        self.bit_array.setall(0)

    def add(self, word):
        for seed in range(self.hash_count):
            index = mmh3.hash(word, seed) % self.size
            self.bit_array[index] = 1

    def contains(self, word):
        for seed in range(self.hash_count):
            index = mmh3.hash(word, seed) % self.size
            if self.bit_array[index] == 0:
                return False
        return True  # Probably in set
```

**Usage:**

```python
# Create Bloom filter
bf = BloomFilter(size=1000000, hash_count=3)

# Add all known words
for word in word_freq:
    bf.add(word)

# Fast membership test
if bf.contains(candidate):
    # Might be valid (check hash map to confirm)
    if candidate in word_freq:
        # Definitely valid
```

### Trigram-Based Correction

Use character n-grams instead of word frequency.

**Trigrams:** Sequences of 3 characters
```
"spell" → ["#sp", "spe", "pel", "ell", "ll#"]
```

**Similarity Metric:** Jaccard similarity of trigrams

```python
def trigrams(word):
    word = f"#{word}#"
    return {word[i:i+3] for i in range(len(word) - 2)}

def similarity(word1, word2):
    tri1 = trigrams(word1)
    tri2 = trigrams(word2)
    return len(tri1 & tri2) / len(tri1 | tri2)
```

### Phonetic Similarity

Use **Soundex** or **Metaphone** algorithms.

```python
import jellyfish

def phonetic_candidates(word, word_list):
    soundex_target = jellyfish.soundex(word)
    return [w for w in word_list
            if jellyfish.soundex(w) == soundex_target]
```

### Context-Based Correction

Use surrounding words for disambiguation.

```
"I live in the capitol" → "I live in the capital"
(vs. "The Capitol building" - proper noun)
```

**N-gram Language Model:**

```python
# Bigram probabilities
P("capital" | "the") > P("capitol" | "the")
```

## Learning Objectives

Through this challenge you'll learn:

1. **Edit Distance Algorithms** - Levenshtein distance and variants
2. **Frequency Analysis** - Zipf's law, word statistics
3. **Algorithm Optimization** - From O(n²) to practical performance
4. **Data Structures** - Hash maps, Bloom filters
5. **Probabilistic Algorithms** - Bloom filters, false positives
6. **Natural Language Processing** - Spelling correction basics
7. **Performance Measurement** - Benchmarking, words per second

## Testing

Test with various inputs:

**Correct Words:**
```
coding → coding (already correct)
```

**Single Typos:**
```
speling → spelling
korrecter → corrector
```

**Double Typos:**
```
speling → spelling
korrector → corrector
```

**No Correction:**
```
asdfghjkl → asdfghjkl (no valid correction)
```

## Resources

### Word Frequency Data
- [Peter Norvig's big.txt](https://norvig.com/big.txt)
- [Google Web Trillion Word Corpus](https://ai.googleblog.com/2006/08/all-our-n-gram-are-belong-to-you.html)
- [COCA (Corpus of Contemporary American English)](https://www.english-corpora.org/coca/)

### Algorithms
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [Bloom Filters](https://en.wikipedia.org/wiki/Bloom_filter)
- [Soundex](https://en.wikipedia.org/wiki/Soundex)

### Papers
- [Peter Norvig: How to Write a Spelling Corrector](https://norvig.com/spell-correct.html)
- ["A Spelling Correction Program Based on a Noisy Channel Model"](http://static.googleusercontent.com/media/research.google.com/en//pubs/archive/36180.pdf)

## Challenge Source

This challenge is from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-spelling-correction)
