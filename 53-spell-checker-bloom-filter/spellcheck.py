#!/usr/bin/env python3
"""
Spelling Corrector using Edit Distance and Word Frequency
Built from scratch without external spell-checking libraries.
"""

import re
import time
import sys
from collections import Counter
from pathlib import Path


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

    def train_from_text(self, text):
        """
        Train from a text corpus by extracting word frequencies.

        Args:
            text: String containing training text
        """
        # Tokenize: extract words (alphanumeric sequences)
        words = re.findall(r'\w+', text.lower())

        # Count frequencies
        self.word_freq = Counter(words)

        return len(self.word_freq)

    def train_from_file(self, filename):
        """Train from a text file."""
        with open(filename, 'r', encoding='utf-8') as f:
            text = f.read()

        return self.train_from_text(text)

    def is_known(self, word):
        """Check if word exists in dictionary."""
        return word.lower() in self.word_freq

    def deletions(self, word):
        """Generate all words with one letter deleted."""
        return [word[:i] + word[i+1:] for i in range(len(word))]

    def insertions(self, word):
        """Generate all words with one letter inserted."""
        return [word[:i] + c + word[i:]
                for i in range(len(word) + 1)
                for c in self.alphabet]

    def replacements(self, word):
        """Generate all words with one letter replaced."""
        return [word[:i] + c + word[i+1:]
                for i in range(len(word))
                for c in self.alphabet
                if c != word[i]]

    def transpositions(self, word):
        """Generate all words with adjacent letters swapped."""
        return [word[:i] + word[i+1] + word[i] + word[i+2:]
                for i in range(len(word) - 1)]

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

    def known_edits1(self, word):
        """Return known words with edit distance 1."""
        return {w for w in self.edits1(word) if w in self.word_freq}

    def edits2(self, word):
        """
        Generate all words with edit distance 2.

        Warning: This can generate a huge number of candidates!
        """
        return {e2 for e1 in self.edits1(word) for e2 in self.edits1(e1)}

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

    def correct_with_details(self, word):
        """
        Return correction with details about the process.

        Returns: Dictionary with correction details
        """
        word_lower = word.lower()
        result = {
            'original': word,
            'correction': word,
            'edit_distance': 0,
            'candidates': 0,
            'frequency': 0
        }

        # Already correct?
        if word_lower in self.word_freq:
            result['correction'] = word
            result['edit_distance'] = 0
            result['frequency'] = self.word_freq[word_lower]
            return result

        # Edit distance 1
        candidates = self.known_edits1(word_lower)
        if candidates:
            result['candidates'] = len(candidates)
            result['edit_distance'] = 1
            best = max(candidates, key=lambda w: self.word_freq[w])
            result['correction'] = best
            result['frequency'] = self.word_freq[best]
            return result

        # Edit distance 2
        candidates = self.known_edits2(word_lower)
        if candidates:
            result['candidates'] = len(candidates)
            result['edit_distance'] = 2
            best = max(candidates, key=lambda w: self.word_freq[w])
            result['correction'] = best
            result['frequency'] = self.word_freq[best]
            return result

        # No correction
        result['correction'] = word
        return result

    def batch_correct(self, words, verbose=False):
        """
        Correct multiple words and track performance.

        Args:
            words: List of words to correct
            verbose: If True, print detailed results

        Returns: List of (original, corrected) tuples
        """
        start_time = time.time()

        corrections = []
        for word in words:
            corrected = self.correct(word)
            corrections.append((word, corrected))

            if verbose:
                print(f"{word} {corrected}")

        end_time = time.time()
        elapsed = end_time - start_time

        # Calculate rate
        wps = len(words) / elapsed if elapsed > 0 else 0

        if verbose:
            print(f"Time: {elapsed*1000:.6f}ms {wps:.1f} words per second")

        return corrections, elapsed, wps


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

    # Initialize spell checker
    checker = SpellChecker()

    # Load data
    if args.train:
        print(f"Training from corpus: {args.train}")
        word_count = checker.train_from_file(args.train)
        print(f"Loaded {word_count} unique words")
    elif args.freq:
        print(f"Loading word frequencies: {args.freq}")
        word_count = checker.load_from_file(args.freq)
        print(f"Loaded {word_count} words")
    else:
        print("Error: Must specify -t (train) or -f (freq) to load word data")
        print("Download sample: wget https://norvig.com/big.txt")
        sys.exit(1)

    # Check words
    if not args.words:
        print("No words to check. Use -h for help.")
        sys.exit(0)

    # Correct words
    if args.detailed:
        # Show detailed information
        for word in args.words:
            details = checker.correct_with_details(word)
            print(f"\nWord: {details['original']}")
            print(f"  Correction: {details['correction']}")
            print(f"  Edit Distance: {details['edit_distance']}")
            print(f"  Candidates: {details['candidates']}")
            print(f"  Frequency: {details['frequency']}")
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


if __name__ == '__main__':
    main()
