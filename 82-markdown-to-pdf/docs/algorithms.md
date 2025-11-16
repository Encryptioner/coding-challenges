# Markdown Parser - Algorithms and Deep Dive

This document provides a deep technical dive into the algorithms and data structures used in the custom markdown parser.

## Table of Contents

1. [Parser Architecture](#parser-architecture)
2. [Lexical Analysis](#lexical-analysis)
3. [Regex Patterns Deep Dive](#regex-patterns-deep-dive)
4. [Block Parsing Algorithms](#block-parsing-algorithms)
5. [Inline Parsing Algorithm](#inline-parsing-algorithm)
6. [HTML Escaping](#html-escaping)
7. [State Machine Analysis](#state-machine-analysis)
8. [Performance Analysis](#performance-analysis)
9. [Edge Cases](#edge-cases)
10. [Comparison with Other Parsers](#comparison-with-other-parsers)

## Parser Architecture

### Two-Pass Approach

The parser uses a two-pass strategy:

**Pass 1: Block-Level Parsing**
```
Input: Lines of text
Process: Identify block elements (headers, lists, code blocks)
Output: Array of HTML block elements
```

**Pass 2: Inline Parsing**
```
Input: Text content within blocks
Process: Identify inline elements (bold, italic, links)
Output: HTML with inline elements
```

**Why Two Passes?**
1. **Separation of Concerns** - Block vs inline logic separated
2. **Correct Nesting** - Ensures inline elements inside blocks
3. **Simpler Logic** - Each pass handles one complexity level
4. **Better Performance** - Avoid backtracking

### Parser State

```javascript
class MarkdownParser {
    constructor() {
        this.html = []  // Output accumulator
    }
}
```

**Stateless Design:**
- No persistent state between parses
- Each `parse()` call is independent
- Thread-safe (if JavaScript had threads)

## Lexical Analysis

### Tokenization Strategy

**Line-Based Tokenization:**

```javascript
const lines = markdown.split('\n');
```

**Why Lines?**
- Markdown is line-oriented
- Most syntax is line-based
- Easy to process sequentially
- Natural for block detection

**Alternative:** Character-by-character streaming (more complex, unnecessary for markdown).

### Line Classification

Each line can be:

1. **Header** - Starts with `#`
2. **List Item** - Starts with `-`, `*`, `+`, or `\d+.`
3. **Code Fence** - Starts with ` ``` `
4. **Blockquote** - Starts with `>`
5. **Horizontal Rule** - `---`, `***`, or `___`
6. **Table Row** - Contains `|`
7. **Blank** - Empty or whitespace only
8. **Paragraph** - Everything else

**Classification Algorithm:**

```
for each line:
    if matches header pattern:
        classify as header
    elif matches list pattern:
        classify as list
    elif matches code pattern:
        classify as code
    ...
    else:
        classify as paragraph
```

## Regex Patterns Deep Dive

### Header Pattern

```javascript
/^(#{1,6})\s+(.+)$/
```

**Breakdown:**
- `^` - Anchor to start of line
- `(#{1,6})` - Capture 1-6 hash symbols
- `\s+` - One or more whitespace characters
- `(.+)` - Capture remaining text (heading content)
- `$` - Anchor to end of line

**Match Examples:**
```
"# Title"           → ['# Title', '#', 'Title']
"## Subtitle"       → ['## Subtitle', '##', 'Subtitle']
"###No Space"       → null (no space after #)
"####### Too Many"  → null (more than 6 #)
```

**Complexity:** O(n) where n = line length

### List Pattern (Unordered)

```javascript
/^([\s]*)[-*+]\s+(.+)$/
```

**Components:**
- `^` - Start of line
- `([\s]*)` - Capture leading whitespace (indentation)
- `[-*+]` - Match any list marker
- `\s+` - Required space after marker
- `(.+)` - List item content

**Indentation Detection:**

```javascript
const indent = match[1].length;

if (indent === 0) {
    // Top-level item
} else if (indent === 2) {
    // Nested item (one level)
}
```

**Match Examples:**
```
"- Item"      → ['- Item', '', 'Item']
"  - Nested"  → ['  - Nested', '  ', 'Nested']
"* Bullet"    → ['* Bullet', '', 'Bullet']
"-No Space"   → null (requires space)
```

### Link Pattern

```javascript
/\[([^\]]+)\]\(([^\)]+)\)/g
```

**Breakdown:**
- `\[` - Literal `[`
- `([^\]]+)` - Capture non-`]` characters (link text)
- `\]` - Literal `]`
- `\(` - Literal `(`
- `([^\)]+)` - Capture non-`)` characters (URL)
- `\)` - Literal `)`
- `g` - Global flag (find all matches)

**Character Classes:**
- `[^\]]` - "Any character except `]`"
- `[^\)]` - "Any character except `)`"

**Why Not `.+`?**
```
[text](url) more [text](url)
```

Using `.+`:
```
Match: [text](url) more [text](url)  // Too greedy!
```

Using `[^\]]+` and `[^\)]+`:
```
Match 1: [text](url)
Match 2: [text](url)  // Correct!
```

### Image Pattern

```javascript
/!\[([^\]]*)\]\(([^\)]+)\)/g
```

**Difference from Link:**
- `!` prefix - Distinguishes image from link
- `([^\]]*)` - Alt text can be empty (*)

**Example:**
```markdown
![](image.png)           → Valid (empty alt)
![Alt Text](image.png)   → Valid (with alt)
```

### Bold Pattern

```javascript
/\*\*(.+?)\*\*/g
```

**Non-Greedy Matching:**
- `.+?` - Match one or more characters (non-greedy)
- `?` makes it non-greedy

**Example:**
```
"**bold** and **more**"

Greedy (.+):
  Match: "**bold** and **more**"  // Wrong!

Non-Greedy (.+?):
  Match 1: "**bold**"   // Correct!
  Match 2: "**more**"
```

**Why Non-Greedy?**

Greedy matches longest possible:
```
**a** text **b**
      └─────────┘  All matched together
```

Non-greedy matches shortest:
```
**a** text **b**
└───┘      └───┘  Matched separately
```

### Code Pattern (Inline)

```javascript
/`([^`]+)`/g
```

**Simple Pattern:**
- `` ` `` - Opening backtick
- `([^`]+)` - Capture non-backtick characters
- `` ` `` - Closing backtick

**Limitation:** Doesn't handle double backticks (`` ``code`` ``).

**Extension:**
```javascript
/`{1,2}([^`]+)`{1,2}/g  // Handles ` and ``
```

## Block Parsing Algorithms

### Header Parsing

```
Algorithm: parseHeader(line)
Input: Single line of text
Output: <h1>, <h2>, etc.

1. Match line against header pattern
2. If match:
   a. Extract level (count of #)
   b. Extract content text
   c. Apply inline parsing to content
   d. Generate <hN>content</hN>
3. Append to output
```

**Time Complexity:** O(n) where n = line length

**Space Complexity:** O(1) (constant temp variables)

### Code Block Parsing

```
Algorithm: parseCodeBlock(lines, start)
Input: Array of lines, starting index
Output: <pre><code>...</code></pre>

1. Extract language from opening line
2. Initialize empty code array
3. Set i = start + 1
4. While i < lines.length:
   a. If line starts with ```:
      - Break (found closing fence)
   b. Else:
      - Add line to code array
      - Increment i
5. Join code lines with newlines
6. Escape HTML in code
7. Generate <pre><code>...</code></pre>
8. Return i + 1 (next line after closing ```)
```

**Time Complexity:** O(m) where m = number of code lines

**Space Complexity:** O(m) for code array

### List Parsing

```
Algorithm: parseUnorderedList(lines, start)
Input: Array of lines, starting index
Output: <ul><li>...</li></ul>

1. Initialize empty items array
2. Set i = start
3. While i < lines.length:
   a. Match line against list pattern
   b. If no match:
      - Break (end of list)
   c. Extract indent level and content
   d. If indented and previous item exists:
      - Append nested <ul> to previous item
   e. Else:
      - Add new <li> to items
   f. Increment i
4. Generate <ul> wrapper with all items
5. Return i
```

**Time Complexity:** O(n × m) where:
- n = number of list items
- m = average item length (for inline parsing)

**Nesting Logic:**

```
Item 1      → <li>Item 1</li>
  Nested    → Previous += <ul><li>Nested</li></ul>
Item 2      → <li>Item 2</li>

Result:
<ul>
  <li>Item 1<ul><li>Nested</li></ul></li>
  <li>Item 2</li>
</ul>
```

### Table Parsing

```
Algorithm: parseTable(lines, start)
Input: Array of lines, starting index
Output: <table>...</table>

1. Collect consecutive lines containing |
2. Extract header cells from line 0
3. Parse alignment from line 1 (separator)
4. Generate <thead> with header cells
5. For each remaining line:
   a. Extract cells
   b. Generate <tr> with <td> elements
   c. Apply alignment styles
6. Wrap in <table> element
7. Return next index
```

**Alignment Parsing:**

```
Separator: |:-----|:-----:|------:|
           └ left └center └ right

Algorithm:
For each cell in separator:
    if starts with : and ends with ::
        alignment = center
    elif ends with ::
        alignment = right
    else:
        alignment = left
```

## Inline Parsing Algorithm

### Multi-Pass Inline Processing

```
Algorithm: parseInline(text)
Input: Plain text
Output: HTML with inline elements

1. Escape HTML entities
2. Process images (![alt](url))
3. Process links ([text](url))
4. Process inline code (`code`)
5. Process ***bold italic***
6. Process **bold**
7. Process *italic*
8. Process ~~strikethrough~~
9. Unescape attributes (href, src)
10. Return processed HTML
```

**Why This Order?**

1. **HTML Escape First** - Prevent injection
2. **Images Before Links** - `!` prefix distinguishes
3. **Code Before Emphasis** - Protects code from bold/italic
4. **Bold+Italic Before Bold** - Longer pattern first
5. **Bold Before Italic** - Longer pattern first
6. **Unescape Last** - Only for URLs

**Example of Order Importance:**

```
Wrong Order (italic before bold):
"***text***"
  → "*<em>*text*</em>*"  // Broken!

Correct Order (bold+italic first):
"***text***"
  → "<strong><em>text</em></strong>"  // Correct!
```

### Greedy vs Non-Greedy

**Greedy Quantifiers:** `*`, `+`, `{n,}`
- Match as much as possible

**Non-Greedy Quantifiers:** `*?`, `+?`, `{n,}?`
- Match as little as possible

**Example:**

```javascript
// Greedy
"**a** **b**".replace(/\*\*(.+)\*\*/g, '<b>$1</b>')
// Result: "<b>a** **b</b>"  // Wrong!

// Non-Greedy
"**a** **b**".replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
// Result: "<b>a</b> <b>b</b>"  // Correct!
```

## HTML Escaping

### Escaping Algorithm

```javascript
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

**How It Works:**

1. Create temporary div element
2. Set `textContent` (safe, auto-escapes)
3. Read `innerHTML` (returns escaped HTML)

**Example:**

```javascript
escapeHtml('<script>alert("XSS")</script>')
// Returns: "&lt;script&gt;alert(\"XSS\")&lt;/script&gt;"
```

**Escaping Table:**

| Character | Escaped As |
|-----------|------------|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `&quot;` |
| `'` | `&#39;` |

### Selective Unescaping

After escaping, URLs in attributes are double-encoded:

```
href="http://example.com?a=1&b=2"
  → href="http://example.com?a=1&amp;b=2"  // Wrong!
```

**Solution:** Selectively unescape attributes:

```javascript
text = text.replace(/href="([^"]*)"/, (match, url) => {
    return `href="${unescapeHtml(url)}"`;
});
```

## State Machine Analysis

### Parser State Diagram

```
START
  ↓
[Read Line]
  ↓
  ├─ Empty Line → Skip
  ├─ # Pattern → Parse Header → OUTPUT
  ├─ ``` Pattern → Enter Code Block State
  │   ↓
  │  [Accumulate Code Lines]
  │   ↓
  │  ``` → Exit Code Block → OUTPUT
  ├─ - Pattern → Enter List State
  │   ↓
  │  [Accumulate List Items]
  │   ↓
  │  Non-List Line → Exit List → OUTPUT
  └─ Default → Parse Paragraph → OUTPUT
```

### List State Machine

```
NOT_IN_LIST ─┬─ Match List Pattern ──→ IN_LIST
             └─ No Match ─────────────→ NOT_IN_LIST

IN_LIST ─────┬─ Match List Pattern ──→ IN_LIST (accumulate)
             └─ No Match ─────────────→ NOT_IN_LIST (output list)
```

**Implementation:**

```javascript
let inList = false;
let listItems = [];

for (line of lines) {
    if (matches list pattern) {
        inList = true;
        listItems.push(line);
    } else if (inList) {
        // End of list
        outputList(listItems);
        inList = false;
        listItems = [];
    }
}
```

## Performance Analysis

### Time Complexity

**Overall:** O(n × m) where:
- n = number of lines
- m = average line length

**Per Component:**

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Split lines | O(n) | n = text length |
| Block detection | O(l) | l = number of lines |
| Header parsing | O(m) | m = line length |
| Code block | O(c) | c = code lines |
| List parsing | O(l × m) | Nested loop |
| Inline parsing | O(m²) | Regex matches |
| HTML escape | O(m) | Linear scan |

**Bottleneck:** Inline parsing with multiple regex passes.

### Space Complexity

**Overall:** O(n) where n = input size

**Components:**
- Lines array: O(n)
- Output array: O(n)
- Temporary strings: O(m)

**Memory Optimization:**

Instead of:
```javascript
let html = '';
html += '<h1>...</h1>';  // Creates new string each time
```

Use:
```javascript
const html = [];
html.push('<h1>...</h1>');  // Mutates array (faster)
return html.join('');
```

### Optimization Opportunities

**1. Compiled Regex:**

```javascript
class MarkdownParser {
    constructor() {
        // Compile regex once
        this.patterns = {
            header: /^(#{1,6})\s+(.+)$/,
            bold: /\*\*(.+?)\*\*/g,
            // ...
        };
    }
}
```

**Benefit:** Avoid recompiling regex each parse.

**2. Early Exit:**

```javascript
if (!text.includes('**')) {
    // Skip bold processing
}
```

**3. Memoization:**

```javascript
const cache = new Map();

function parseInline(text) {
    if (cache.has(text)) {
        return cache.get(text);
    }
    const result = actuallyParseInline(text);
    cache.set(text, result);
    return result;
}
```

**Trade-off:** Memory for speed.

## Edge Cases

### Nested Emphasis

```markdown
**bold *and italic* bold**
```

**Current Behavior:**
```html
<strong>bold <em>and italic</em> bold</strong>
```

**Works Correctly!**

**Why?**
1. Process `**bold *and italic* bold**`
2. Bold regex: `**(.+?)**` matches outer bold
3. Captured: `bold *and italic* bold`
4. Italic regex processes captured text
5. Result: `bold <em>and italic</em> bold`
6. Wrapped in `<strong>`

### Escaping in Code

````markdown
Code: `var x = **not bold**`
````

**Current Behavior:**
```html
<code>var x = **not bold**</code>
```

**Correct!** Code is processed before bold.

### Adjacent Emphasis

```markdown
**bold****more bold**
```

**Current Behavior:**
```html
<strong>bold</strong><strong>more bold</strong>
```

**Works!** Non-greedy matching finds both.

### Incomplete Syntax

```markdown
**no closing bold
[link without closing paren(url
```

**Current Behavior:** Left as-is (no match, no transformation).

**Alternative:** Could show warnings, but keeping original is safer.

## Comparison with Other Parsers

### marked.js

**Approach:** Token-based lexer + parser
**Complexity:** Higher (AST generation)
**Performance:** Faster (optimized C++ under hood for some operations)
**Features:** More complete (GFM, tables, task lists)

### markdown-it

**Approach:** Plugin-based architecture
**Complexity:** Very high (extensible)
**Performance:** Good (optimized)
**Features:** Most complete

### Our Parser

**Approach:** Regex-based line processing
**Complexity:** Low (easy to understand)
**Performance:** Good for typical documents
**Features:** Core markdown only

**Trade-offs:**

| Feature | Our Parser | marked.js |
|---------|------------|-----------|
| Simplicity | ✓ | ✗ |
| Performance | Good | Better |
| Features | Basic | Complete |
| Size | ~300 LOC | ~2000+ LOC |
| Dependencies | 0 | 0 |

## Conclusion

The markdown parser demonstrates several important computer science concepts:

1. **Regular Expressions** - Pattern matching for text processing
2. **State Machines** - Managing parser state across lines
3. **Two-Pass Algorithms** - Block then inline processing
4. **Greedy vs Non-Greedy** - Critical for correct matching
5. **HTML Escaping** - Security considerations
6. **Performance Trade-offs** - Simplicity vs completeness

While not as feature-complete as production parsers, it provides:
- Educational value (understand how parsers work)
- No dependencies (self-contained)
- Sufficient for common use cases
- Foundation for extensions

The algorithms are straightforward enough to modify and extend, making this an excellent learning project for understanding text processing and parsing techniques.
