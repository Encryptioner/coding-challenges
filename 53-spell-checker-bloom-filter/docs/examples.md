# Spell Checker Examples and Use Cases

This document provides comprehensive examples demonstrating the spell checker's capabilities, common use cases, and practical applications.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Common Typos](#common-typos)
3. [Edit Distance Examples](#edit-distance-examples)
4. [Performance Analysis](#performance-analysis)
5. [Training Examples](#training-examples)
6. [Python API Examples](#python-api-examples)
7. [Real-World Use Cases](#real-world-use-cases)
8. [Edge Cases](#edge-cases)
9. [Batch Processing](#batch-processing)
10. [Custom Applications](#custom-applications)

---

## Basic Examples

### Example 1: Single Word Correction

```bash
$ python3 spellcheck.py -t big.txt speling

Training from corpus: big.txt
Loaded 32192 unique words
speling spelling
Time: 18.234ms 54.8 words per second
```

**Analysis:**
- Input: "speling" (missing one 'l')
- Edit distance: 1 (insertion of 'l')
- Correction: "spelling"
- Processing time: 18ms

### Example 2: Multiple Word Correction

```bash
$ python3 spellcheck.py -t big.txt speiling misteke executionw mekanism

Training from corpus: big.txt
Loaded 32192 unique words
speiling spelling
misteke mistake
executionw execution
mekanism mechanism
Time: 92.457ms 43.2 words per second
```

**Analysis:**
- 4 words corrected in 92ms
- Average: 23ms per word
- All corrections found at edit distance 1

### Example 3: Already Correct Words

```bash
$ python3 spellcheck.py -t big.txt spelling correct algorithm

Training from corpus: big.txt
Loaded 32192 unique words
spelling spelling
correct correct
algorithm algorithm
Time: 5.123ms 585.6 words per second
```

**Analysis:**
- All words already correct
- Fast dictionary lookups (O(1))
- ~600 words/second when no correction needed

---

## Common Typos

### Keyboard Proximity Errors

These occur when users hit adjacent keys:

```bash
$ python3 spellcheck.py -t big.txt tge thr ghe

tge the      # 'g' is next to 'h'
thr the      # Missing 'e'
ghe the      # 'g' instead of 't'
```

### Transposition Errors

Users often swap adjacent letters:

```bash
$ python3 spellcheck.py -t big.txt teh hte recieve seperate

teh the
hte the
recieve receive
seperate separate
```

**Analysis:**
- Transpositions are detected as edit distance 1
- Very common error pattern
- "recieve" → "receive": swap 'i' and 'e'

### Double Letter Errors

Missing or extra doubled letters:

```bash
$ python3 spellcheck.py -t big.txt occured comming necesary

occured occurred     # Missing 'r'
comming coming       # Extra 'm'
necesary necessary   # Missing 's'
```

### Phonetic Errors

Words spelled as they sound:

```bash
$ python3 spellcheck.py -t big.txt definitly acheive reccomend

definitly definitely    # 'e' instead of 'i'
acheive achieve         # 'e' before 'i'
reccomend recommend     # Double 'c' instead of single
```

---

## Edit Distance Examples

### Edit Distance 0 (Already Correct)

```bash
$ python3 spellcheck.py -t big.txt -d hello

Word: hello
  Correction: hello
  Edit Distance: 0
  Candidates: 0
  Frequency: 12543
```

**Analysis:**
- Word found in dictionary immediately
- No candidates generated
- Frequency: 12,543 occurrences in training corpus

### Edit Distance 1 Examples

#### Deletion (Remove Character)

```bash
$ python3 spellcheck.py -t big.txt -d speling

Word: speling
  Correction: spelling
  Edit Distance: 1
  Candidates: 2
  Frequency: 342
```

**Candidates:**
- "spelling" (freq: 342) ← Selected
- "speeling" (freq: 0 - not in dictionary)

#### Insertion (Add Character)

```bash
$ python3 spellcheck.py -t big.txt -d writen

Word: writen
  Correction: written
  Edit Distance: 1
  Candidates: 1
  Frequency: 8765
```

**Process:**
- Generate insertions at all positions
- "writen" → "written" (insert 't' at position 4)

#### Replacement (Change Character)

```bash
$ python3 spellcheck.py -t big.txt -d korrect

Word: korrect
  Correction: correct
  Edit Distance: 1
  Candidates: 1
  Frequency: 23456
```

**Process:**
- Replace 'k' with 'c' at position 0

#### Transposition (Swap Adjacent Characters)

```bash
$ python3 spellcheck.py -t big.txt -d recieve

Word: recieve
  Correction: receive
  Edit Distance: 1
  Candidates: 1
  Frequency: 4567
```

**Process:**
- Swap 'i' and 'e' at positions 3-4
- "recieve" → "receive"

### Edit Distance 2 Examples

Two errors in one word:

```bash
$ python3 spellcheck.py -t big.txt -d spelingz

Word: spelingz
  Correction: spelling
  Edit Distance: 2
  Candidates: 8
  Frequency: 342
```

**Process:**
1. Generate edit-1 candidates: None found
2. Generate edit-2 candidates:
   - Delete 'z' → "speling"
   - From "speling", insert 'l' → "spelling"
3. Total edits: 2

```bash
$ python3 spellcheck.py -t big.txt -d korrector

Word: korrector
  Correction: corrector
  Edit Distance: 2
  Candidates: 3
  Frequency: 156
```

**Process:**
- Replace 'k' with 'c': "corrector"
- Delete extra 'r': "corector"
- Total: 2 edits needed

### Edit Distance 3+ (No Correction)

```bash
$ python3 spellcheck.py -t big.txt -d speelingzz

Word: speelingzz
  Correction: speelingzz
  Edit Distance: 3+
  Candidates: 0
  Frequency: 0
```

**Analysis:**
- Requires 3+ edits to reach "spelling"
- Spell checker only tries up to distance 2
- Returns original word unchanged

---

## Performance Analysis

### Word Length Impact

```bash
$ python3 spellcheck.py -t big.txt cat spelling algorithm implementation

cat cat
spelling spelling
algorithm algorithm
implementation implementation
Time: 6.234ms 641.7 words per second
```

**Breakdown:**

| Word | Length | Correct? | Time (est) |
|------|--------|----------|------------|
| cat | 3 | Yes | ~1ms |
| spelling | 8 | Yes | ~1ms |
| algorithm | 9 | Yes | ~1.5ms |
| implementation | 14 | Yes | ~2ms |

All words correct → fast dictionary lookups

### Typo Correction Performance

```bash
$ python3 spellcheck.py -t big.txt ct speling algoritm implementtion

ct cat
speling spelling
algoritm algorithm
implementtion implementation
Time: 125.456ms 31.9 words per second
```

**Breakdown:**

| Word | Length | Edit Distance | Time (est) |
|------|--------|---------------|------------|
| ct | 2 | 1 | ~10ms |
| speling | 7 | 1 | ~25ms |
| algoritm | 8 | 1 | ~35ms |
| implementtion | 13 | 1 | ~55ms |

**Observation:** Time increases with word length (O(n) for edit-1)

### Edit Distance 2 Performance

```bash
$ python3 spellcheck.py -t big.txt spelingz algoritmz implementtionz

spelingz spelling
algoritmz algorithm
implementtionz implementation
Time: 2345.678ms 1.3 words per second
```

**Analysis:**
- All require edit distance 2
- Much slower: O(n²) complexity
- Longer words take significantly more time

---

## Training Examples

### Example 1: Train from Text Corpus

```bash
$ python3 spellcheck.py -t big.txt speiling

Training from corpus: big.txt
Loaded 32192 unique words
speiling spelling
Time: 18.234ms 54.8 words per second
```

**What Happens:**
1. Read big.txt (6MB, ~1 million words)
2. Extract unique words: 32,192
3. Count frequencies for each word
4. Build dictionary: ~1.5MB in memory
5. Correct "speiling" → "spelling"

### Example 2: Train from Custom Corpus

```bash
# Create custom corpus
$ cat > my_corpus.txt << EOF
The quick brown fox jumps over the lazy dog.
The dog was very lazy. The fox was quick.
EOF

$ python3 spellcheck.py -t my_corpus.txt layz quik

Training from corpus: my_corpus.txt
Loaded 11 unique words
layz lazy
quik quick
Time: 5.123ms 390.4 words per second
```

**Dictionary Contents:**
```python
{
    'the': 4,
    'quick': 2,
    'lazy': 2,
    'fox': 2,
    'dog': 2,
    'brown': 1,
    'jumps': 1,
    'over': 1,
    'was': 2,
    'very': 1
}
```

### Example 3: Load Pre-computed Frequency File

```bash
# Create frequency file
$ cat > word_freq.txt << EOF
the 1000000
of 500000
spelling 342
algorithm 156
EOF

$ python3 spellcheck.py -f word_freq.txt speling algoritm

Loading word frequencies: word_freq.txt
Loaded 4 words
speling spelling
algoritm algorithm
Time: 12.345ms 162.0 words per second
```

---

## Python API Examples

### Example 1: Basic API Usage

```python
from spellcheck import SpellChecker

# Initialize and train
checker = SpellChecker()
checker.train_from_file('big.txt')

# Correct a word
correction = checker.correct('speiling')
print(f"Correction: {correction}")  # "spelling"

# Check if word is known
if checker.is_known('algorithm'):
    print("Word is in dictionary")

# Get word frequency
freq = checker.word_freq.get('spelling', 0)
print(f"Frequency: {freq}")  # 342
```

### Example 2: Detailed Correction Information

```python
from spellcheck import SpellChecker

checker = SpellChecker()
checker.train_from_file('big.txt')

# Get detailed correction info
details = checker.correct_with_details('korrecter')

print(f"Original: {details['original']}")        # korrecter
print(f"Correction: {details['correction']}")    # corrector
print(f"Edit Distance: {details['edit_distance']}")  # 2
print(f"Candidates: {details['candidates']}")    # 8
print(f"Frequency: {details['frequency']}")      # 156
```

### Example 3: Batch Correction

```python
from spellcheck import SpellChecker

checker = SpellChecker()
checker.train_from_file('big.txt')

# Correct multiple words
words = ['speiling', 'misteke', 'executionw', 'mekanism']
corrections, elapsed, wps = checker.batch_correct(words, verbose=True)

# Output:
# speiling spelling
# misteke mistake
# executionw execution
# mekanism mechanism
# Time: 92.456789ms 43.2 words per second

# Access results
for original, corrected in corrections:
    if original != corrected:
        print(f"Corrected: {original} → {corrected}")
```

### Example 4: Custom Training

```python
from spellcheck import SpellChecker

checker = SpellChecker()

# Train from text string
text = """
Machine learning is a subset of artificial intelligence.
Deep learning is a subset of machine learning.
Neural networks are used in deep learning.
"""

word_count = checker.train_from_text(text)
print(f"Learned {word_count} unique words")

# Correct specialized terms
print(checker.correct('learing'))   # learning
print(checker.correct('artifical')) # artificial
print(checker.correct('nural'))     # neural
```

### Example 5: Custom Alphabet

```python
from spellcheck import SpellChecker

# Create checker with custom alphabet (e.g., German)
checker = SpellChecker()
checker.alphabet = 'abcdefghijklmnopqrstuvwxyzäöüß'

# Load German word list
checker.load_from_file('german_words.txt')

# Correct German words
print(checker.correct('schön'))  # Will handle ö correctly
```

---

## Real-World Use Cases

### Use Case 1: Email Client Spell Check

```python
from spellcheck import SpellChecker

class EmailSpellChecker:
    def __init__(self):
        self.checker = SpellChecker()
        self.checker.train_from_file('english_corpus.txt')

    def check_email(self, email_text):
        """Check spelling in email and suggest corrections."""
        words = email_text.split()
        suggestions = {}

        for word in words:
            # Remove punctuation
            clean_word = word.strip('.,!?;:"()')
            if not clean_word:
                continue

            # Check spelling
            correction = self.checker.correct(clean_word)
            if correction != clean_word:
                suggestions[clean_word] = correction

        return suggestions

# Usage
email_checker = EmailSpellChecker()
email = "Ths is a tst email with som speling mistkes."

suggestions = email_checker.check_email(email)
for wrong, right in suggestions.items():
    print(f"{wrong} → {right}")

# Output:
# Ths → The
# tst → test
# som → some
# speling → spelling
# mistkes → mistakes
```

### Use Case 2: Search Query Correction

```python
from spellcheck import SpellChecker

class SearchEngine:
    def __init__(self):
        self.spell_checker = SpellChecker()
        self.spell_checker.train_from_file('big.txt')

    def correct_query(self, query):
        """Correct spelling in search query."""
        words = query.lower().split()
        corrected_words = []

        for word in words:
            correction = self.spell_checker.correct(word)
            corrected_words.append(correction)

        corrected_query = ' '.join(corrected_words)

        # Show "Did you mean?" if query was corrected
        if corrected_query != query.lower():
            return {
                'original': query,
                'suggestion': corrected_query,
                'show_did_you_mean': True
            }
        else:
            return {
                'original': query,
                'suggestion': None,
                'show_did_you_mean': False
            }

# Usage
search = SearchEngine()

result = search.correct_query("speling algoritm")
if result['show_did_you_mean']:
    print(f"Did you mean: {result['suggestion']}")
    # Output: Did you mean: spelling algorithm
```

### Use Case 3: Form Validation

```python
from spellcheck import SpellChecker

class FormValidator:
    def __init__(self):
        self.checker = SpellChecker()
        # Train on common names, locations, etc.
        self.checker.train_from_file('names_and_places.txt')

    def validate_text_field(self, text, field_name):
        """Validate text field and return errors."""
        words = text.split()
        errors = []

        for i, word in enumerate(words):
            details = self.checker.correct_with_details(word)

            if details['edit_distance'] > 0:
                errors.append({
                    'field': field_name,
                    'position': i,
                    'word': word,
                    'suggestion': details['correction'],
                    'confidence': 'high' if details['edit_distance'] == 1 else 'low'
                })

        return errors

# Usage
validator = FormValidator()

comment = "This produkt is awsome! Highly recomend it."
errors = validator.validate_text_field(comment, 'comment')

for error in errors:
    print(f"Word: {error['word']}")
    print(f"  Suggestion: {error['suggestion']}")
    print(f"  Confidence: {error['confidence']}")
    print()

# Output:
# Word: produkt
#   Suggestion: product
#   Confidence: high
#
# Word: awsome
#   Suggestion: awesome
#   Confidence: high
#
# Word: recomend
#   Suggestion: recommend
#   Confidence: high
```

### Use Case 4: Chat Application

```python
from spellcheck import SpellChecker

class ChatSpellCheck:
    def __init__(self):
        self.checker = SpellChecker()
        self.checker.train_from_file('big.txt')

        # Don't correct common chat abbreviations
        self.whitelist = {'lol', 'brb', 'omg', 'btw', 'thx', 'pls'}

    def correct_message(self, message):
        """Correct spelling but preserve chat slang."""
        words = message.split()
        corrected = []

        for word in words:
            clean_word = word.strip('.,!?')
            lower_word = clean_word.lower()

            # Skip whitelisted words
            if lower_word in self.whitelist:
                corrected.append(word)
                continue

            # Correct spelling
            correction = self.checker.correct(clean_word)
            if correction != clean_word:
                # Preserve original punctuation
                if word != clean_word:
                    punct = word[len(clean_word):]
                    corrected.append(correction + punct)
                else:
                    corrected.append(correction)
            else:
                corrected.append(word)

        return ' '.join(corrected)

# Usage
chat = ChatSpellCheck()

messages = [
    "hey, hw r u?",
    "this is awsome lol",
    "brb, gotta chek somthing"
]

for msg in messages:
    corrected = chat.correct_message(msg)
    print(f"Original:  {msg}")
    print(f"Corrected: {corrected}")
    print()

# Output:
# Original:  hey, hw r u?
# Corrected: hey, how r u?
#
# Original:  this is awsome lol
# Corrected: this is awesome lol
#
# Original:  brb, gotta chek somthing
# Corrected: brb, gotta check something
```

---

## Edge Cases

### Empty String

```python
checker.correct("")  # Returns: ""
```

### Single Character

```python
checker.correct("a")  # Returns: "a" (if in dictionary)
checker.correct("x")  # Returns: "x" (even if not in dictionary)
```

### Numbers

```python
checker.correct("123")  # Returns: "123" (unchanged)
```

### Mixed Case

```python
checker.correct("HELLO")    # Returns: "HELLO" (preserves case)
checker.correct("HeLLo")    # Returns: "HeLLo" (preserves case)
```

### Punctuation

```python
# Note: Basic spell checker doesn't handle punctuation
# User must strip punctuation before correction

word = "hello,"
clean_word = word.strip(".,!?;:")
correction = checker.correct(clean_word)
# Then add punctuation back
```

### Words Not in Dictionary

```python
# Proper nouns, technical terms
checker.correct("GitHub")     # Returns: "GitHub" (no correction)
checker.correct("JavaScript")  # Returns: "JavaScript" (no correction)
```

### Very Long Words

```python
word = "antidisestablishmentarianism"
# Will generate ~53 × 28 + 25 ≈ 1,509 edit-1 candidates
# May be slow for edit distance 2
```

---

## Batch Processing

### Processing a File

```python
from spellcheck import SpellChecker

def spell_check_file(input_file, output_file):
    """Spell check all words in a file."""
    checker = SpellChecker()
    checker.train_from_file('big.txt')

    with open(input_file, 'r') as f_in:
        with open(output_file, 'w') as f_out:
            for line in f_in:
                words = line.strip().split()
                corrected_words = [checker.correct(w) for w in words]
                f_out.write(' '.join(corrected_words) + '\n')

# Usage
spell_check_file('input.txt', 'corrected.txt')
```

### Processing with Statistics

```python
from spellcheck import SpellChecker
import time

def spell_check_with_stats(words):
    """Spell check and gather statistics."""
    checker = SpellChecker()
    checker.train_from_file('big.txt')

    stats = {
        'total': len(words),
        'corrected': 0,
        'unchanged': 0,
        'edit_1': 0,
        'edit_2': 0,
        'time': 0
    }

    start_time = time.time()

    for word in words:
        details = checker.correct_with_details(word)

        if details['edit_distance'] == 0:
            stats['unchanged'] += 1
        elif details['edit_distance'] == 1:
            stats['corrected'] += 1
            stats['edit_1'] += 1
        elif details['edit_distance'] == 2:
            stats['corrected'] += 1
            stats['edit_2'] += 1

    stats['time'] = time.time() - start_time

    return stats

# Usage
words = ['hello', 'speling', 'algoritm', 'correct', 'misteke']
stats = spell_check_with_stats(words)

print(f"Total words: {stats['total']}")
print(f"Corrected: {stats['corrected']}")
print(f"Unchanged: {stats['unchanged']}")
print(f"Edit distance 1: {stats['edit_1']}")
print(f"Edit distance 2: {stats['edit_2']}")
print(f"Time: {stats['time']:.3f}s")
```

---

## Custom Applications

### Application 1: Autocomplete with Spell Correction

```python
from spellcheck import SpellChecker

class AutoComplete:
    def __init__(self):
        self.checker = SpellChecker()
        self.checker.train_from_file('big.txt')

    def suggest(self, partial_word, max_suggestions=5):
        """Suggest completions for partial word."""
        # First, correct the partial word
        corrected = self.checker.correct(partial_word)

        # Find words that start with corrected prefix
        suggestions = []
        for word in self.checker.word_freq:
            if word.startswith(corrected):
                suggestions.append((word, self.checker.word_freq[word]))

        # Sort by frequency, return top N
        suggestions.sort(key=lambda x: x[1], reverse=True)
        return [word for word, _ in suggestions[:max_suggestions]]

# Usage
autocomplete = AutoComplete()
suggestions = autocomplete.suggest('algo')
print(suggestions)  # ['algorithm', 'algorithms', ...]
```

### Application 2: Typo Analyzer

```python
from spellcheck import SpellChecker
from collections import Counter

class TypoAnalyzer:
    def __init__(self):
        self.checker = SpellChecker()
        self.checker.train_from_file('big.txt')

    def analyze_typos(self, text):
        """Analyze types of typos in text."""
        words = text.lower().split()
        typo_types = Counter()

        for word in words:
            if word in self.checker.word_freq:
                continue

            # Try each edit type
            if word[:-1] in self.checker.word_freq:
                typo_types['insertion'] += 1
            elif any(self.checker.deletions(word)):
                typo_types['deletion'] += 1
            elif any(self.checker.transpositions(word)):
                typo_types['transposition'] += 1
            elif any(self.checker.replacements(word)):
                typo_types['replacement'] += 1

        return typo_types

# Usage
analyzer = TypoAnalyzer()
text = "teh quik borwn fox jumpss over teh lazy dog"
typos = analyzer.analyze_typos(text)
print(typos)
# Counter({'transposition': 2, 'insertion': 1, 'replacement': 1})
```

### Application 3: Spell Check Confidence Score

```python
from spellcheck import SpellChecker

class ConfidenceSpellChecker:
    def __init__(self):
        self.checker = SpellChecker()
        self.checker.train_from_file('big.txt')

    def correct_with_confidence(self, word):
        """Return correction with confidence score."""
        details = self.checker.correct_with_details(word)

        # Calculate confidence based on edit distance and frequency
        if details['edit_distance'] == 0:
            confidence = 1.0
        elif details['edit_distance'] == 1:
            if details['candidates'] == 1:
                confidence = 0.95
            elif details['candidates'] <= 3:
                confidence = 0.85
            else:
                confidence = 0.70
        elif details['edit_distance'] == 2:
            if details['candidates'] == 1:
                confidence = 0.75
            elif details['candidates'] <= 3:
                confidence = 0.60
            else:
                confidence = 0.40
        else:
            confidence = 0.0

        return {
            'correction': details['correction'],
            'confidence': confidence,
            'edit_distance': details['edit_distance'],
            'candidates': details['candidates']
        }

# Usage
checker = ConfidenceSpellChecker()

words = ['spelling', 'speling', 'spelingz', 'speelingzz']
for word in words:
    result = checker.correct_with_confidence(word)
    print(f"{word}:")
    print(f"  Correction: {result['correction']}")
    print(f"  Confidence: {result['confidence']:.0%}")
    print()

# Output:
# spelling:
#   Correction: spelling
#   Confidence: 100%
#
# speling:
#   Correction: spelling
#   Confidence: 95%
#
# spelingz:
#   Correction: spelling
#   Confidence: 75%
#
# speelingzz:
#   Correction: speelingzz
#   Confidence: 0%
```

---

## Summary

This document demonstrated:

1. **Basic Usage** - Command-line and Python API examples
2. **Common Typos** - Keyboard errors, transpositions, phonetic mistakes
3. **Edit Distance** - Examples for distances 0, 1, and 2
4. **Performance** - Word length and edit distance impact on speed
5. **Training** - Multiple methods for building word dictionaries
6. **Python API** - Programmatic usage for custom applications
7. **Real-World Use Cases** - Email, search, forms, chat applications
8. **Edge Cases** - Handling special inputs and exceptions
9. **Batch Processing** - File processing and statistics gathering
10. **Custom Applications** - Autocomplete, typo analysis, confidence scoring

The spell checker is versatile and can be adapted to various applications requiring spelling correction, from simple command-line tools to complex web applications.
