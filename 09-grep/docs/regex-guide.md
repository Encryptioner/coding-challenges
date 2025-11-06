# Regular Expression Guide

## Overview

Regular expressions (regex) are patterns used to match character combinations in strings. They're one of the most powerful tools for text processing and are fundamental to understanding how grep works.

## What is a Regular Expression?

A regular expression is a sequence of characters that defines a search pattern. When you search for a pattern in text, the regex engine tries to match the pattern against the text.

**Example:**
- Pattern: `hello`
- Text: `"hello world"`
- Result: **Match** (the text contains "hello")

## Why Regular Expressions?

**Before regex:**
```c
// Find "cat" in text
bool found = false;
for (int i = 0; i < len - 2; i++) {
    if (text[i] == 'c' && text[i+1] == 'a' && text[i+2] == 't') {
        found = true;
        break;
    }
}
```

**With regex:**
```c
regex_t regex;
regcomp(&regex, "cat", 0);
found = (regexec(&regex, text, 0, NULL, 0) == 0);
```

Much simpler, and can handle complex patterns!

## Basic Patterns

### Literal Characters

The simplest regex is just plain text:

```bash
grep "hello" file.txt
```

Matches any line containing the exact string "hello".

### The Dot (.) - Any Character

`.` matches any single character (except newline):

```bash
grep "h.t" file.txt
```

Matches:
- `hat`
- `hit`
- `hot`
- `hut`
- `h@t`
- `h5t`

**Example:**
```
Text: "the cat sat on the mat"
Pattern: "c.t"
Matches: "cat"

Pattern: ".at"
Matches: "cat", "sat", "mat"
```

### Anchors

**Start of line (^):**
```bash
grep "^hello" file.txt
```
Only matches lines that START with "hello".

```
"hello world"    ✓ matches
"say hello"      ✗ doesn't match
```

**End of line ($):**
```bash
grep "world$" file.txt
```
Only matches lines that END with "world".

```
"hello world"    ✓ matches
"world peace"    ✗ doesn't match
```

**Both:**
```bash
grep "^hello$" file.txt
```
Only matches lines that contain EXACTLY "hello" and nothing else.

### Character Classes

**Basic class [abc]:**

Matches any ONE character inside the brackets:

```bash
grep "[aeiou]" file.txt
```
Matches any line with a vowel.

```
"hello"    ✓ matches (has 'e' and 'o')
"xyz"      ✗ doesn't match
```

**Range [a-z]:**

```bash
grep "[a-z]" file.txt      # Any lowercase letter
grep "[A-Z]" file.txt      # Any uppercase letter
grep "[0-9]" file.txt      # Any digit
grep "[a-zA-Z]" file.txt   # Any letter
```

**Negated class [^abc]:**

Matches anything EXCEPT the characters inside:

```bash
grep "[^0-9]" file.txt
```
Matches any line with a non-digit character.

```
"abc"      ✓ matches
"123"      ✗ doesn't match
"abc123"   ✓ matches (has non-digits)
```

## Quantifiers

Quantifiers specify how many times a pattern should match.

### Zero or More (*)

`*` means "zero or more of the previous character":

```bash
grep "ab*c" file.txt
```

Matches:
- `ac` (zero b's)
- `abc` (one b)
- `abbc` (two b's)
- `abbbc` (three b's)
- etc.

**Example:**
```
Pattern: "go*gle"
Matches: "ggle", "gogle", "google", "gooogle", ...
```

### One or More (+)

`+` means "one or more of the previous character":

```bash
grep "ab+c" file.txt
```

Matches:
- `abc` (one b)
- `abbc` (two b's)
- `abbbc` (three b's)

Does NOT match:
- `ac` (zero b's)

### Zero or One (?)

`?` means "zero or one of the previous character":

```bash
grep "colou?r" file.txt
```

Matches:
- `color` (zero u)
- `colour` (one u)

Does NOT match:
- `colouur` (more than one u)

**Use case:** Optional characters

```bash
grep "https?" file.txt
```
Matches both "http" and "https".

### Exact Count {n}

`{n}` means "exactly n occurrences":

```bash
grep "[0-9]{3}" file.txt
```
Matches exactly 3 digits in a row.

```
"12"       ✗ doesn't match (only 2 digits)
"123"      ✓ matches
"1234"     ✓ matches (contains "123")
```

### Range {n,m}

`{n,m}` means "between n and m occurrences":

```bash
grep "[0-9]{3,5}" file.txt
```
Matches 3, 4, or 5 digits in a row.

```
"12"       ✗ doesn't match
"123"      ✓ matches
"1234"     ✓ matches
"12345"    ✓ matches
"123456"   ✓ matches (contains "12345")
```

**At least n: {n,}**

```bash
grep "[0-9]{3,}" file.txt
```
Matches 3 or more digits.

## Special Character Classes

### Word Character (\w)

`\w` matches any "word" character: `[a-zA-Z0-9_]`

```bash
grep "\w+" file.txt
```
Matches words.

### Digit (\d)

`\d` matches any digit: `[0-9]`

```bash
grep "\d+" file.txt
```
Matches numbers.

### Whitespace (\s)

`\s` matches any whitespace: space, tab, newline

```bash
grep "\s+" file.txt
```
Matches sequences of whitespace.

### Negated Classes

- `\W` - Non-word character
- `\D` - Non-digit
- `\S` - Non-whitespace

## Grouping and Alternation

### Grouping ()

Parentheses group patterns together:

```bash
grep "(ab)+" file.txt
```
Matches one or more occurrences of "ab":
- `ab`
- `abab`
- `ababab`

### Alternation |

`|` means "or":

```bash
grep "cat|dog" file.txt
```
Matches either "cat" or "dog".

```bash
grep "^(http|https|ftp)://" file.txt
```
Matches lines starting with "http://", "https://", or "ftp://".

## Escaping Special Characters

Special characters need to be escaped with `\` to match literally:

**Special characters:** `. * + ? ^ $ { } [ ] ( ) | \`

```bash
# Match literal dot
grep "\." file.txt

# Match literal asterisk
grep "\*" file.txt

# Match literal question mark
grep "\?" file.txt

# Match literal dollar sign
grep "\$" file.txt
```

**Example:**
```bash
# Match "example.com" literally
grep "example\.com" file.txt

# Without escape, . matches any character
grep "example.com" file.txt  # Also matches "exampleXcom"
```

## Practical Examples

### Email Addresses

```bash
grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" emails.txt
```

Breakdown:
- `[a-zA-Z0-9._%+-]+` - Username part
- `@` - Literal @
- `[a-zA-Z0-9.-]+` - Domain name
- `\.` - Literal dot
- `[a-zA-Z]{2,}` - TLD (at least 2 letters)

Matches:
- `user@example.com`
- `john.doe@company.co.uk`
- `test+tag@domain.org`

### Phone Numbers

**US Format (123-456-7890):**
```bash
grep -E "\d{3}-\d{3}-\d{4}" contacts.txt
```

**Alternative format:**
```bash
grep -E "\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}" contacts.txt
```

Matches:
- `123-456-7890`
- `(123) 456-7890`
- `123.456.7890`
- `1234567890`

### IP Addresses

```bash
grep -E "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b" file.txt
```

Matches:
- `192.168.1.1`
- `10.0.0.1`
- `255.255.255.0`

**More accurate (validates range):**
```bash
grep -E "\b([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b" file.txt
```

### URLs

```bash
grep -E "https?://[^\s]+" file.txt
```

Matches:
- `http://example.com`
- `https://www.example.com/path?query=value`

**More complete:**
```bash
grep -E "(https?|ftp)://[^\s/$.?#].[^\s]*" file.txt
```

### Credit Card Numbers

**Visa:**
```bash
grep -E "^4[0-9]{12}([0-9]{3})?$" file.txt
```

**Mastercard:**
```bash
grep -E "^5[1-5][0-9]{14}$" file.txt
```

**American Express:**
```bash
grep -E "^3[47][0-9]{13}$" file.txt
```

### Date Formats

**MM/DD/YYYY:**
```bash
grep -E "[0-9]{2}/[0-9]{2}/[0-9]{4}" file.txt
```

**YYYY-MM-DD (ISO):**
```bash
grep -E "[0-9]{4}-[0-9]{2}-[0-9]{2}" file.txt
```

**Month DD, YYYY:**
```bash
grep -E "(January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{1,2}, [0-9]{4}" file.txt
```

## Common Patterns Cheat Sheet

```bash
# Digits
[0-9]           # Single digit
[0-9]+          # One or more digits
[0-9]{3}        # Exactly 3 digits

# Letters
[a-z]           # Lowercase letter
[A-Z]           # Uppercase letter
[a-zA-Z]        # Any letter

# Words
\w+             # Word (letters, digits, underscore)
\b\w+\b         # Whole word

# Whitespace
\s              # Any whitespace
\s+             # One or more whitespace

# Lines
^               # Start of line
$               # End of line
^$              # Empty line
^.+$            # Non-empty line

# Common formats
\d{3}-\d{2}-\d{4}                    # SSN
[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.   # Email
https?://                             # URL start
\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}  # IP address
```

## Testing Regular Expressions

### Online Tools

- [regex101.com](https://regex101.com) - Interactive regex tester
- [regexr.com](https://regexr.com) - Another great tester
- [debuggex.com](https://www.debuggex.com) - Visual regex

### Testing with grep

```bash
# Create test file
cat > test.txt <<EOF
hello world
HELLO WORLD
123 test
test@email.com
192.168.1.1
EOF

# Test patterns
grep "hello" test.txt           # Literal match
grep -i "hello" test.txt        # Case insensitive
grep "[0-9]" test.txt           # Contains digit
grep "@" test.txt               # Contains @
grep "\." test.txt              # Contains dot
```

## Performance Tips

### Anchors Make Regex Faster

```bash
# Slow - checks every position
grep "pattern" file.txt

# Faster - only checks line start
grep "^pattern" file.txt
```

### Use Fixed Strings When Possible

```bash
# Slow - regex engine
grep "simple" file.txt

# Faster - string matching
grep -F "simple" file.txt
```

### Avoid Catastrophic Backtracking

**Bad:** `(a+)+b`
```
For input "aaaaaaaaaaaaaaac" this takes exponential time!
```

**Good:** `a+b`
```
Much faster, same result
```

## Common Mistakes

### 1. Forgetting to Escape Special Characters

❌ Wrong:
```bash
grep "192.168.1.1" file.txt  # Matches "192X168X1X1"
```

✓ Correct:
```bash
grep "192\.168\.1\.1" file.txt
```

### 2. Not Using Raw Strings

❌ Wrong:
```bash
grep "\d+" file.txt  # Shell might interpret \d
```

✓ Correct:
```bash
grep '\\d+' file.txt  # Single quotes prevent interpretation
```

### 3. Greedy vs Non-Greedy

`*` and `+` are **greedy** (match as much as possible):

```
Text: "<div>Hello</div><div>World</div>"
Pattern: "<div>.*</div>"
Matches: "<div>Hello</div><div>World</div>"  (the whole string!)
```

Some regex engines support non-greedy `*?` and `+?`:

```
Pattern: "<div>.*?</div>"
Matches: "<div>Hello</div>" (stops at first </div>)
```

### 4. Forgetting Word Boundaries

❌ Wrong:
```bash
grep "cat" file.txt  # Also matches "category", "concatenate"
```

✓ Correct:
```bash
grep "\bcat\b" file.txt  # Only matches "cat" as whole word
```

## Advanced Topics

### Lookahead and Lookbehind

Some regex engines (like PCRE) support assertions:

**Positive Lookahead (?=...):**
```
Pattern: "hello(?= world)"
Matches: "hello" only if followed by " world"
```

**Negative Lookahead (?!...):**
```
Pattern: "hello(?! world)"
Matches: "hello" only if NOT followed by " world"
```

**Positive Lookbehind (?<=...):**
```
Pattern: "(?<=hello )world"
Matches: "world" only if preceded by "hello "
```

**Note:** POSIX regex (used in our grep) doesn't support these.

### Backreferences

Match the same text again:

```bash
# Find repeated words
grep -E "\b(\w+)\s+\1\b" file.txt
```

Matches:
- `"the the"` (repeated "the")
- `"hello hello"` (repeated "hello")

## Summary

Regular expressions are powerful but can be complex. Key takeaways:

1. **Start simple** - Literal strings, then add special characters
2. **Test often** - Use tools like regex101.com
3. **Escape special characters** - When you want them literally
4. **Use anchors** - ^ and $ for performance
5. **Know your engine** - POSIX, PCRE, etc. have differences
6. **Practice** - The more you use regex, the better you get

## Further Reading

- [Regular-Expressions.info](https://www.regular-expressions.info/) - Comprehensive tutorial
- [MDN Regex Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) - Good for web developers
- [Mastering Regular Expressions](http://shop.oreilly.com/product/9780596528126.do) - The definitive book
- [POSIX Regex Standard](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap09.html) - Official spec
