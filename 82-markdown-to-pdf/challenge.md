# Build Your Own Markdown to PDF Converter

This challenge is to build a Markdown to PDF converter that allows users to edit markdown, preview the rendered output, customize the styling, and export to PDF.

Markdown is one of the most popular lightweight markup languages for formatting text. Being able to convert markdown documents to professional-looking PDFs is incredibly useful for documentation, reports, and publishing.

## The Challenge - Building a Markdown to PDF Tool

The goal is to build a tool that can:
- Provide an editor for writing markdown
- Render a live preview of the markdown
- Allow customization of fonts, colors, and styles
- Export the rendered document as a PDF
- Match the preview exactly in the exported PDF

You can build this as a web application, desktop GUI, mobile app, or command-line tool.

## Markdown Syntax Reference

**Headers:**
```markdown
# H1
## H2
### H3
```

**Emphasis:**
```markdown
*italic* or _italic_
**bold** or __bold__
***bold italic***
```

**Lists:**
```markdown
- Unordered item
- Another item
  - Nested item

1. Ordered item
2. Another item
```

**Links and Images:**
```markdown
[Link text](URL)
![Alt text](Image URL)
```

**Code:**
```markdown
Inline: `code`
Block: ```language
code
```
```

**Other Elements:**
```markdown
> Blockquote

---
Horizontal rule

| Table | Header |
|-------|--------|
| Cell  | Cell   |
```

## Step Zero

Set up your IDE/editor and programming language of choice.

**Requirements:**
- Create a VCS repository (GitHub, GitLab, etc.)
- Add a README.md with project overview
- Choose your implementation approach:
  - Web app (HTML/CSS/JavaScript + backend)
  - Desktop GUI (Electron, Qt, GTK, etc.)
  - Mobile app (React Native, Flutter, etc.)
  - CLI tool (with browser preview or terminal rendering)

**Technology Considerations:**

For this challenge, build the core functionality from scratch:
- **Markdown Parser**: Write your own (don't use existing markdown libraries)
- **PDF Generator**: Implement basic PDF creation or use browser printing
- **Rendering**: Custom HTML/CSS generation from parsed markdown

This is a great opportunity to learn about:
- Parsing and lexical analysis
- Abstract Syntax Trees (AST)
- Document rendering
- PDF file format

## Step 1 - Markdown Editor

Create a window where users can edit markdown text.

**Requirements:**
- Text input area for markdown content
- Support basic keyboard shortcuts (Ctrl+B for bold, etc.)
- Line numbers (optional but nice)
- Syntax highlighting (optional)

**Implementation Options:**

**Web Application:**
```html
<textarea id="markdown-editor" rows="20" cols="80"></textarea>
```

**Desktop GUI:**
- Qt: QTextEdit
- GTK: GtkTextView
- Electron: Web-based textarea
- Tkinter: Text widget

**CLI Tool:**
- Accept markdown file path as input
- Or build your own terminal editor (advanced)
- Or launch system editor and watch file for changes

**Features to Consider:**
- Auto-save functionality
- Undo/redo
- Word count
- Character count
- Markdown toolbar with formatting buttons

**Example Output:**
```
┌─ Markdown Editor ─────────────────────┐
│                                        │
│ # My Document                          │
│                                        │
│ This is **bold** and this is *italic* │
│                                        │
│ ## Section 1                           │
│                                        │
│ Some content here...                   │
│                                        │
└────────────────────────────────────────┘
```

## Step 2 - Live Preview

Allow users to see rendered markdown in a separate window/pane.

**Requirements:**
- Parse markdown and convert to HTML
- Display rendered HTML with proper styling
- Update preview in real-time as user types
- Side-by-side or split view layout

**Markdown Parsing:**

Build your own parser that handles:

1. **Headers** (`#`, `##`, `###`)
2. **Emphasis** (`*italic*`, `**bold**`)
3. **Lists** (ordered and unordered)
4. **Links** (`[text](url)`)
5. **Images** (`![alt](url)`)
6. **Code** (inline and blocks)
7. **Blockquotes** (`>`)
8. **Horizontal rules** (`---`)
9. **Tables** (optional)

**Parsing Approach:**

**Option 1: Regex-based**
```python
import re

def parse_headers(text):
    # Match: # Header, ## Header, etc.
    return re.sub(r'^(#{1,6})\s+(.+)$',
                  lambda m: f'<h{len(m.group(1))}>{m.group(2)}</h{len(m.group(1))}>',
                  text, flags=re.MULTILINE)
```

**Option 2: Line-by-line parser**
```python
def parse_markdown(text):
    lines = text.split('\n')
    html = []

    for line in lines:
        if line.startswith('# '):
            html.append(f'<h1>{line[2:]}</h1>')
        elif line.startswith('## '):
            html.append(f'<h2>{line[3:]}</h2>')
        # ... more patterns
        else:
            html.append(f'<p>{line}</p>')

    return '\n'.join(html)
```

**Option 3: Token-based parser (more robust)**
```python
class MarkdownParser:
    def tokenize(self, text):
        # Split into tokens (headers, paragraphs, lists, etc.)
        pass

    def parse(self, tokens):
        # Build AST from tokens
        pass

    def render(self, ast):
        # Convert AST to HTML
        pass
```

**Preview Display:**

**Web:**
```html
<div id="preview" class="markdown-preview">
    <!-- Rendered HTML goes here -->
</div>
```

**Desktop:**
- Embed web view (WebKit, Chromium)
- Or use native rich text widget

**CLI:**
- Generate HTML and open in browser
- Or use terminal markdown renderer (like glow)

**Layout Example:**

```
┌────────────────────────────────────────────────────┐
│                  Markdown to PDF                   │
├─────────────────────┬──────────────────────────────┤
│  Markdown Editor    │      Preview                 │
├─────────────────────┼──────────────────────────────┤
│                     │                              │
│ # My Document       │  My Document                 │
│                     │  ═══════════                 │
│ This is **bold**    │  This is bold and italic     │
│ and *italic*        │                              │
│                     │  Section 1                   │
│ ## Section 1        │  ─────────                   │
│                     │                              │
│ Content here...     │  Content here...             │
│                     │                              │
└─────────────────────┴──────────────────────────────┘
```

## Step 3 - Customization

Allow users to customize the document rendering.

**Requirements:**
- Font selection (serif, sans-serif, monospace)
- Font size for headings (H1-H6)
- Font size for body text
- Background color
- Text color
- Heading colors
- Code block styling
- Link colors

**UI Design:**

**Settings Panel:**
```
┌─ Document Settings ─────────────────┐
│                                      │
│ Font Family:    [Serif        ▼]    │
│                                      │
│ H1 Size:        [32px         ▼]    │
│ H2 Size:        [24px         ▼]    │
│ H3 Size:        [20px         ▼]    │
│ Body Size:      [14px         ▼]    │
│                                      │
│ Background:     [#ffffff] [  ]       │
│ Text Color:     [#000000] [  ]       │
│ Heading Color:  [#2c3e50] [  ]       │
│ Link Color:     [#3498db] [  ]       │
│                                      │
│ Code Theme:     [Github       ▼]    │
│                                      │
│         [Apply]  [Reset to Default]  │
└──────────────────────────────────────┘
```

**Implementation:**

**CSS Generation:**
```python
def generate_css(settings):
    return f"""
    body {{
        font-family: {settings['font_family']};
        font-size: {settings['body_size']};
        background-color: {settings['bg_color']};
        color: {settings['text_color']};
        line-height: 1.6;
        max-width: 800px;
        margin: 40px auto;
        padding: 20px;
    }}

    h1 {{
        font-size: {settings['h1_size']};
        color: {settings['heading_color']};
        border-bottom: 2px solid {settings['heading_color']};
    }}

    h2 {{
        font-size: {settings['h2_size']};
        color: {settings['heading_color']};
    }}

    a {{
        color: {settings['link_color']};
        text-decoration: none;
    }}

    code {{
        background-color: #f4f4f4;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
    }}
    """
```

**Preset Themes:**

```python
THEMES = {
    'default': {
        'font_family': 'Georgia, serif',
        'h1_size': '32px',
        'h2_size': '24px',
        'body_size': '14px',
        'bg_color': '#ffffff',
        'text_color': '#000000',
        'heading_color': '#2c3e50',
        'link_color': '#3498db'
    },
    'dark': {
        'font_family': 'Arial, sans-serif',
        'bg_color': '#2c3e50',
        'text_color': '#ecf0f1',
        'heading_color': '#3498db',
        'link_color': '#1abc9c'
    },
    'minimal': {
        'font_family': 'Helvetica, sans-serif',
        'h1_size': '28px',
        'h2_size': '20px',
        'body_size': '12px',
        'bg_color': '#fafafa',
        'text_color': '#333333'
    }
}
```

**Live Preview Update:**

Update CSS dynamically as user changes settings, so they see results immediately.

## Step 4 - PDF Export

Export the rendered markdown as a PDF that matches the preview exactly.

**Requirements:**
- Generate PDF from rendered HTML
- Apply custom styling to PDF
- Maintain formatting (headings, lists, code blocks)
- Handle page breaks appropriately
- Include images if present

**Implementation Approaches:**

### Approach 1: Browser Print-to-PDF (Easiest)

**Web Application:**
```javascript
function exportToPDF() {
    // Use browser's print functionality
    window.print();
}
```

With CSS:
```css
@media print {
    /* Optimize for printing */
    body {
        max-width: none;
        margin: 0;
        padding: 20px;
    }

    /* Page break control */
    h1, h2, h3 {
        page-break-after: avoid;
    }

    pre, blockquote {
        page-break-inside: avoid;
    }
}
```

### Approach 2: HTML to PDF Conversion

**Using Headless Browser:**
```python
import subprocess

def export_pdf(html_content, output_path):
    # Save HTML to temp file
    with open('temp.html', 'w') as f:
        f.write(html_content)

    # Use headless Chrome/Chromium
    subprocess.run([
        'chromium', '--headless', '--disable-gpu',
        '--print-to-pdf=' + output_path,
        'temp.html'
    ])
```

### Approach 3: Custom PDF Generation

**Build basic PDF from scratch** (advanced):

```python
class SimplePDFGenerator:
    def __init__(self):
        self.pages = []
        self.current_y = 50

    def add_text(self, text, size=12, bold=False):
        # Add text object to PDF
        pass

    def add_heading(self, text, level=1):
        # Add heading with larger font
        pass

    def new_page(self):
        # Start new page
        pass

    def save(self, filename):
        # Write PDF file format
        # PDF header: %PDF-1.4
        # Objects, pages, fonts
        # Cross-reference table
        # Trailer
        pass
```

**PDF File Structure (simplified):**
```
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj
xref
0 5
trailer
<< /Size 5 /Root 1 0 R >>
%%EOF
```

### Approach 4: Minimal Dependencies

Use Python's built-in capabilities:

```python
def html_to_pdf_simple(html, css, output):
    # 1. Parse HTML to extract text and structure
    # 2. Calculate layout (line breaks, pages)
    # 3. Write PDF with basic text positioning

    # This is complex but educational!
    pass
```

**Page Size Options:**

```python
PAGE_SIZES = {
    'A4': (595, 842),      # points (72 per inch)
    'Letter': (612, 792),
    'Legal': (612, 1008),
    'A3': (842, 1191)
}
```

## Going Further

### Export Formats

**1. HTML Export**
```python
def export_html(markdown, css, output_path):
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>{css}</style>
    </head>
    <body>
        {render_markdown(markdown)}
    </body>
    </html>
    """
    with open(output_path, 'w') as f:
        f.write(html)
```

**2. MS Word Export (.docx)**
- Generate Office Open XML format
- Or use simple RTF format

**3. LaTeX Export**
```python
def markdown_to_latex(markdown):
    # Convert markdown syntax to LaTeX
    # # Header -> \section{Header}
    # **bold** -> \textbf{bold}
    # *italic* -> \textit{italic}
    pass
```

### Advanced Features

1. **Templates**: Pre-designed document templates
2. **Table of Contents**: Auto-generate from headers
3. **Footnotes**: Support for footnote references
4. **Math Equations**: LaTeX-style equations
5. **Diagrams**: Mermaid, PlantUML support
6. **Collaborative Editing**: Real-time multi-user editing
7. **Version History**: Track document changes
8. **Export Presets**: Save custom styling as presets

### Page Configuration

```python
class PageSettings:
    def __init__(self):
        self.size = 'A4'
        self.orientation = 'portrait'  # or 'landscape'
        self.margins = {
            'top': 1.0,     # inches
            'bottom': 1.0,
            'left': 1.0,
            'right': 1.0
        }
        self.header = ''
        self.footer = 'Page {page}'
```

## Learning Objectives

Through this challenge you'll learn:

1. **Parsing**: Building lexers and parsers from scratch
2. **Text Processing**: Regex, string manipulation, pattern matching
3. **Document Rendering**: HTML/CSS generation, layout algorithms
4. **PDF Format**: Understanding document formats
5. **UI/UX Design**: Creating intuitive editing interfaces
6. **Real-time Updates**: Live preview implementation
7. **Styling Systems**: CSS generation, theme management
8. **File I/O**: Reading, writing, format conversion

## Testing

Test your converter with various markdown features:

**Basic Formatting:**
```markdown
# Header 1
## Header 2

**Bold**, *italic*, ***bold italic***

Paragraph with [link](http://example.com)
```

**Lists:**
```markdown
- Item 1
  - Nested item
- Item 2

1. First
2. Second
```

**Code:**
```markdown
Inline `code` and:

```python
def hello():
    print("Hello, World!")
```
```

**Complex Document:**
- Multiple sections
- Mixed content types
- Images
- Tables
- Long content (multi-page)

## Resources

### Markdown Specs
- [CommonMark](https://commonmark.org/) - Standard markdown specification
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### PDF Resources
- [PDF Reference](https://www.adobe.com/devnet/pdf/pdf_reference.html)
- PDF file structure tutorials

### Parsing Tutorials
- Recursive descent parsing
- Regular expressions
- Abstract Syntax Trees

### Tools for Inspiration
- [Typora](https://typora.io/) - Markdown editor
- [Pandoc](https://pandoc.org/) - Document converter
- [Marked](https://marked2app.com/) - Markdown previewer

## Implementation Tips

1. **Start Simple**: Handle basic markdown first (headers, paragraphs, emphasis)
2. **Test Incrementally**: Add one feature at a time
3. **Use Test Files**: Create markdown files to test each feature
4. **Profile Performance**: Optimize parsing for large documents
5. **Handle Edge Cases**: Empty lines, special characters, nested elements
6. **Cross-Platform**: Test on different OS/browsers
7. **Error Handling**: Gracefully handle invalid markdown

## Challenge Source

This challenge is from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-md-to-pdf)

## Constraints

**Build from scratch:**
- Don't use existing markdown parsing libraries
- Implement your own parser using regex or tokenization
- For PDF generation, use minimal dependencies or build basic PDF writer
- Focus on learning the internals rather than using off-the-shelf solutions

This constraint makes the challenge more educational - you'll understand how markdown parsers and PDF generators work under the hood!
