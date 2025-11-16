#!/usr/bin/env python3
"""
Custom Markdown Parser
Built from scratch without using external markdown libraries.
"""

import re
import html


class MarkdownParser:
    """
    A custom markdown parser that converts markdown text to HTML.
    Implements core markdown features without external dependencies.
    """

    def __init__(self):
        self.html_output = []

    def parse(self, markdown_text):
        """
        Parse markdown text and return HTML.

        Args:
            markdown_text (str): The markdown content to parse

        Returns:
            str: The generated HTML
        """
        if not markdown_text:
            return ""

        # Reset output
        self.html_output = []

        # Split into lines
        lines = markdown_text.split('\n')

        # Process lines
        i = 0
        while i < len(lines):
            line = lines[i]

            # Skip empty lines (they'll be handled as paragraph separators)
            if not line.strip():
                i += 1
                continue

            # Check for code blocks (```)
            if line.strip().startswith('```'):
                i = self._parse_code_block(lines, i)
                continue

            # Check for headers
            if line.startswith('#'):
                self._parse_header(line)
                i += 1
                continue

            # Check for horizontal rule
            if re.match(r'^(\*\*\*+|---+|___+)\s*$', line.strip()):
                self.html_output.append('<hr>')
                i += 1
                continue

            # Check for blockquote
            if line.strip().startswith('>'):
                i = self._parse_blockquote(lines, i)
                continue

            # Check for unordered list
            if re.match(r'^[\s]*[-*+]\s+', line):
                i = self._parse_unordered_list(lines, i)
                continue

            # Check for ordered list
            if re.match(r'^[\s]*\d+\.\s+', line):
                i = self._parse_ordered_list(lines, i)
                continue

            # Check for table
            if '|' in line and i + 1 < len(lines) and '|' in lines[i + 1]:
                if re.match(r'^\|?[\s]*[-:]+[\s]*\|', lines[i + 1]):
                    i = self._parse_table(lines, i)
                    continue

            # Default: paragraph
            i = self._parse_paragraph(lines, i)

        return '\n'.join(self.html_output)

    def _parse_header(self, line):
        """Parse header (# H1, ## H2, etc.)"""
        match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if match:
            level = len(match.group(1))
            content = self._parse_inline(match.group(2).strip())
            self.html_output.append(f'<h{level}>{content}</h{level}>')

    def _parse_code_block(self, lines, start_index):
        """Parse code block (``` ... ```)"""
        line = lines[start_index].strip()

        # Extract language if specified
        lang_match = re.match(r'^```(\w+)?', line)
        language = lang_match.group(1) if lang_match and lang_match.group(1) else ''

        # Find closing ```
        code_lines = []
        i = start_index + 1
        while i < len(lines):
            if lines[i].strip().startswith('```'):
                break
            code_lines.append(lines[i])
            i += 1

        # Generate HTML
        code_content = html.escape('\n'.join(code_lines))
        lang_class = f' class="language-{language}"' if language else ''

        self.html_output.append(f'<pre><code{lang_class}>{code_content}</code></pre>')

        return i + 1  # Return next line after closing ```

    def _parse_blockquote(self, lines, start_index):
        """Parse blockquote (> text)"""
        quote_lines = []
        i = start_index

        while i < len(lines) and lines[i].strip().startswith('>'):
            # Remove > and leading space
            content = re.sub(r'^>\s?', '', lines[i].strip())
            quote_lines.append(content)
            i += 1

        # Process the blockquote content as markdown
        quote_text = '\n'.join(quote_lines)
        quote_html = self._parse_inline(quote_text)

        self.html_output.append(f'<blockquote>{quote_html}</blockquote>')

        return i

    def _parse_unordered_list(self, lines, start_index):
        """Parse unordered list (-, *, +)"""
        list_items = []
        i = start_index

        while i < len(lines):
            line = lines[i]

            # Check for list item
            match = re.match(r'^([\s]*)[-*+]\s+(.+)$', line)
            if not match:
                break

            indent = len(match.group(1))
            content = self._parse_inline(match.group(2))

            # Handle nested lists (simplified - only one level)
            if indent > 0:
                # Nested item
                if list_items:
                    list_items[-1] += f'<ul><li>{content}</li></ul>'
            else:
                list_items.append(f'<li>{content}</li>')

            i += 1

        self.html_output.append('<ul>')
        self.html_output.extend(list_items)
        self.html_output.append('</ul>')

        return i

    def _parse_ordered_list(self, lines, start_index):
        """Parse ordered list (1. 2. 3.)"""
        list_items = []
        i = start_index

        while i < len(lines):
            line = lines[i]

            # Check for list item
            match = re.match(r'^([\s]*)\d+\.\s+(.+)$', line)
            if not match:
                break

            indent = len(match.group(1))
            content = self._parse_inline(match.group(2))

            # Handle nested lists (simplified)
            if indent > 0:
                if list_items:
                    list_items[-1] += f'<ol><li>{content}</li></ol>'
            else:
                list_items.append(f'<li>{content}</li>')

            i += 1

        self.html_output.append('<ol>')
        self.html_output.extend(list_items)
        self.html_output.append('</ol>')

        return i

    def _parse_table(self, lines, start_index):
        """Parse markdown table"""
        table_lines = []
        i = start_index

        # Collect all table lines
        while i < len(lines) and '|' in lines[i]:
            table_lines.append(lines[i])
            i += 1

        if len(table_lines) < 2:
            return i

        # Parse header
        header_cells = [cell.strip() for cell in table_lines[0].split('|') if cell.strip()]

        # Parse alignment from separator line
        separator = table_lines[1]
        alignments = []
        for cell in separator.split('|'):
            cell = cell.strip()
            if cell.startswith(':') and cell.endswith(':'):
                alignments.append('center')
            elif cell.endswith(':'):
                alignments.append('right')
            else:
                alignments.append('left')

        # Build table HTML
        self.html_output.append('<table>')

        # Header
        self.html_output.append('<thead><tr>')
        for idx, cell in enumerate(header_cells):
            align = alignments[idx] if idx < len(alignments) else 'left'
            content = self._parse_inline(cell)
            self.html_output.append(f'<th style="text-align: {align}">{content}</th>')
        self.html_output.append('</tr></thead>')

        # Body rows
        self.html_output.append('<tbody>')
        for row_line in table_lines[2:]:
            cells = [cell.strip() for cell in row_line.split('|') if cell.strip()]
            self.html_output.append('<tr>')
            for idx, cell in enumerate(cells):
                align = alignments[idx] if idx < len(alignments) else 'left'
                content = self._parse_inline(cell)
                self.html_output.append(f'<td style="text-align: {align}">{content}</td>')
            self.html_output.append('</tr>')
        self.html_output.append('</tbody>')

        self.html_output.append('</table>')

        return i

    def _parse_paragraph(self, lines, start_index):
        """Parse paragraph (regular text)"""
        para_lines = []
        i = start_index

        # Collect consecutive non-empty lines
        while i < len(lines):
            line = lines[i].strip()

            # Stop at empty line or special syntax
            if not line:
                break
            if line.startswith('#') or line.startswith('>'):
                break
            if line.startswith('```'):
                break
            if re.match(r'^[\s]*[-*+]\s+', line):
                break
            if re.match(r'^[\s]*\d+\.\s+', line):
                break
            if re.match(r'^(\*\*\*+|---+|___+)\s*$', line):
                break

            para_lines.append(line)
            i += 1

        if para_lines:
            para_text = ' '.join(para_lines)
            para_html = self._parse_inline(para_text)
            self.html_output.append(f'<p>{para_html}</p>')

        return i

    def _parse_inline(self, text):
        """
        Parse inline markdown elements (bold, italic, links, code, images).

        Order of processing matters to avoid conflicts.
        """
        # Escape HTML to prevent injection
        text = html.escape(text)

        # Images: ![alt](url)
        text = re.sub(
            r'!\[([^\]]*)\]\(([^\)]+)\)',
            r'<img src="\2" alt="\1">',
            text
        )

        # Links: [text](url)
        text = re.sub(
            r'\[([^\]]+)\]\(([^\)]+)\)',
            r'<a href="\2">\1</a>',
            text
        )

        # Inline code: `code`
        text = re.sub(
            r'`([^`]+)`',
            r'<code>\1</code>',
            text
        )

        # Bold and italic: ***text***
        text = re.sub(
            r'\*\*\*(.+?)\*\*\*',
            r'<strong><em>\1</em></strong>',
            text
        )

        # Bold: **text** or __text__
        text = re.sub(
            r'\*\*(.+?)\*\*',
            r'<strong>\1</strong>',
            text
        )
        text = re.sub(
            r'__(.+?)__',
            r'<strong>\1</strong>',
            text
        )

        # Italic: *text* or _text_
        text = re.sub(
            r'\*(.+?)\*',
            r'<em>\1</em>',
            text
        )
        text = re.sub(
            r'_(.+?)_',
            r'<em>\1</em>',
            text
        )

        # Strikethrough: ~~text~~
        text = re.sub(
            r'~~(.+?)~~',
            r'<del>\1</del>',
            text
        )

        # Unescape HTML entities in href and src (they were escaped earlier)
        text = text.replace('&lt;', '<').replace('&gt;', '>')
        text = re.sub(r'href="([^"]*)"', lambda m: f'href="{html.unescape(m.group(1))}"', text)
        text = re.sub(r'src="([^"]*)"', lambda m: f'src="{html.unescape(m.group(1))}"', text)

        return text


def markdown_to_html(markdown_text, custom_css=''):
    """
    Convert markdown to a complete HTML document.

    Args:
        markdown_text (str): Markdown content
        custom_css (str): Optional custom CSS

    Returns:
        str: Complete HTML document
    """
    parser = MarkdownParser()
    body_html = parser.parse(markdown_text)

    # Default CSS
    default_css = """
    body {
        font-family: Georgia, serif;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 40px auto;
        padding: 20px;
        background-color: #fff;
    }

    h1, h2, h3, h4, h5, h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
        color: #2c3e50;
    }

    h1 {
        font-size: 2em;
        border-bottom: 2px solid #eaecef;
        padding-bottom: 0.3em;
    }

    h2 {
        font-size: 1.5em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
    }

    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    h5 { font-size: 0.875em; }
    h6 { font-size: 0.85em; color: #6a737d; }

    p {
        margin-top: 0;
        margin-bottom: 16px;
    }

    a {
        color: #0366d6;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }

    code {
        background-color: rgba(27,31,35,0.05);
        border-radius: 3px;
        font-size: 85%;
        margin: 0;
        padding: 0.2em 0.4em;
        font-family: 'Courier New', Courier, monospace;
    }

    pre {
        background-color: #f6f8fa;
        border-radius: 3px;
        font-size: 85%;
        line-height: 1.45;
        overflow: auto;
        padding: 16px;
    }

    pre code {
        background-color: transparent;
        border: 0;
        display: inline;
        line-height: inherit;
        margin: 0;
        overflow: visible;
        padding: 0;
        word-wrap: normal;
    }

    blockquote {
        border-left: 4px solid #dfe2e5;
        color: #6a737d;
        padding: 0 15px;
        margin: 0 0 16px 0;
    }

    ul, ol {
        margin-top: 0;
        margin-bottom: 16px;
        padding-left: 2em;
    }

    li {
        margin-bottom: 0.25em;
    }

    li + li {
        margin-top: 0.25em;
    }

    table {
        border-collapse: collapse;
        border-spacing: 0;
        width: 100%;
        margin-bottom: 16px;
    }

    table th,
    table td {
        border: 1px solid #dfe2e5;
        padding: 6px 13px;
    }

    table th {
        background-color: #f6f8fa;
        font-weight: 600;
    }

    table tr:nth-child(2n) {
        background-color: #f6f8fa;
    }

    hr {
        border: 0;
        border-top: 2px solid #eaecef;
        margin: 24px 0;
    }

    img {
        max-width: 100%;
        height: auto;
    }

    /* Print styles */
    @media print {
        body {
            max-width: none;
            margin: 0;
            padding: 20px;
        }

        h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
        }

        pre, blockquote, table {
            page-break-inside: avoid;
        }

        img {
            page-break-inside: avoid;
        }
    }
    """

    # Combine CSS
    final_css = default_css
    if custom_css:
        final_css += '\n' + custom_css

    # Build complete HTML document
    html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Preview</title>
    <style>
{final_css}
    </style>
</head>
<body>
{body_html}
</body>
</html>"""

    return html_doc


if __name__ == '__main__':
    # Test the parser
    test_markdown = """# Test Document

This is a **bold** and *italic* test.

## Features

- Unordered list
- Another item
  - Nested item

1. Ordered list
2. Second item

### Code

Inline `code` and:

```python
def hello():
    print("Hello, World!")
```

> This is a blockquote

[Link](https://example.com) and ![Image](https://via.placeholder.com/150)

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

---

**Bold**, *italic*, ***both***, ~~strikethrough~~
"""

    parser = MarkdownParser()
    html_result = parser.parse(test_markdown)
    print(html_result)
