// Custom Markdown Parser - Client-side JavaScript Implementation
// Built from scratch without external libraries

class MarkdownParser {
    constructor() {
        this.html = [];
    }

    parse(markdown) {
        if (!markdown) return '';

        this.html = [];
        const lines = markdown.split('\n');

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            // Skip empty lines
            if (!line.trim()) {
                i++;
                continue;
            }

            // Code block
            if (line.trim().startsWith('```')) {
                i = this.parseCodeBlock(lines, i);
                continue;
            }

            // Headers
            if (line.startsWith('#')) {
                this.parseHeader(line);
                i++;
                continue;
            }

            // Horizontal rule
            if (/^(\*\*\*+|---+|___+)\s*$/.test(line.trim())) {
                this.html.push('<hr>');
                i++;
                continue;
            }

            // Blockquote
            if (line.trim().startsWith('>')) {
                i = this.parseBlockquote(lines, i);
                continue;
            }

            // Unordered list
            if (/^[\s]*[-*+]\s+/.test(line)) {
                i = this.parseUnorderedList(lines, i);
                continue;
            }

            // Ordered list
            if (/^[\s]*\d+\.\s+/.test(line)) {
                i = this.parseOrderedList(lines, i);
                continue;
            }

            // Table
            if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|')) {
                if (/^\|?[\s]*[-:]+[\s]*\|/.test(lines[i + 1])) {
                    i = this.parseTable(lines, i);
                    continue;
                }
            }

            // Paragraph
            i = this.parseParagraph(lines, i);
        }

        return this.html.join('\n');
    }

    parseHeader(line) {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
            const level = match[1].length;
            const content = this.parseInline(match[2].trim());
            this.html.push(`<h${level}>${content}</h${level}>`);
        }
    }

    parseCodeBlock(lines, startIndex) {
        const line = lines[startIndex].trim();
        const langMatch = line.match(/^```(\w+)?/);
        const language = langMatch && langMatch[1] ? langMatch[1] : '';

        const codeLines = [];
        let i = startIndex + 1;

        while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeLines.push(lines[i]);
            i++;
        }

        const codeContent = this.escapeHtml(codeLines.join('\n'));
        const langClass = language ? ` class="language-${language}"` : '';

        this.html.push(`<pre><code${langClass}>${codeContent}</code></pre>`);

        return i + 1;
    }

    parseBlockquote(lines, startIndex) {
        const quoteLines = [];
        let i = startIndex;

        while (i < lines.length && lines[i].trim().startsWith('>')) {
            const content = lines[i].trim().replace(/^>\s?/, '');
            quoteLines.push(content);
            i++;
        }

        const quoteText = quoteLines.join('\n');
        const quoteHtml = this.parseInline(quoteText);

        this.html.push(`<blockquote>${quoteHtml}</blockquote>`);

        return i;
    }

    parseUnorderedList(lines, startIndex) {
        const listItems = [];
        let i = startIndex;

        while (i < lines.length) {
            const line = lines[i];
            const match = line.match(/^([\s]*)[-*+]\s+(.+)$/);

            if (!match) break;

            const indent = match[1].length;
            const content = this.parseInline(match[2]);

            if (indent > 0 && listItems.length > 0) {
                listItems[listItems.length - 1] += `<ul><li>${content}</li></ul>`;
            } else {
                listItems.push(`<li>${content}</li>`);
            }

            i++;
        }

        this.html.push('<ul>');
        this.html.push(...listItems);
        this.html.push('</ul>');

        return i;
    }

    parseOrderedList(lines, startIndex) {
        const listItems = [];
        let i = startIndex;

        while (i < lines.length) {
            const line = lines[i];
            const match = line.match(/^([\s]*)\d+\.\s+(.+)$/);

            if (!match) break;

            const indent = match[1].length;
            const content = this.parseInline(match[2]);

            if (indent > 0 && listItems.length > 0) {
                listItems[listItems.length - 1] += `<ol><li>${content}</li></ol>`;
            } else {
                listItems.push(`<li>${content}</li>`);
            }

            i++;
        }

        this.html.push('<ol>');
        this.html.push(...listItems);
        this.html.push('</ol>');

        return i;
    }

    parseTable(lines, startIndex) {
        const tableLines = [];
        let i = startIndex;

        while (i < lines.length && lines[i].includes('|')) {
            tableLines.push(lines[i]);
            i++;
        }

        if (tableLines.length < 2) return i;

        // Parse header
        const headerCells = tableLines[0].split('|')
            .map(cell => cell.trim())
            .filter(cell => cell);

        // Parse alignments
        const separator = tableLines[1];
        const alignments = separator.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell)
            .map(cell => {
                if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
                if (cell.endsWith(':')) return 'right';
                return 'left';
            });

        // Build table
        this.html.push('<table>');

        // Header
        this.html.push('<thead><tr>');
        headerCells.forEach((cell, idx) => {
            const align = alignments[idx] || 'left';
            const content = this.parseInline(cell);
            this.html.push(`<th style="text-align: ${align}">${content}</th>`);
        });
        this.html.push('</tr></thead>');

        // Body
        this.html.push('<tbody>');
        for (let j = 2; j < tableLines.length; j++) {
            const cells = tableLines[j].split('|')
                .map(cell => cell.trim())
                .filter(cell => cell);

            this.html.push('<tr>');
            cells.forEach((cell, idx) => {
                const align = alignments[idx] || 'left';
                const content = this.parseInline(cell);
                this.html.push(`<td style="text-align: ${align}">${content}</td>`);
            });
            this.html.push('</tr>');
        }
        this.html.push('</tbody>');

        this.html.push('</table>');

        return i;
    }

    parseParagraph(lines, startIndex) {
        const paraLines = [];
        let i = startIndex;

        while (i < lines.length) {
            const line = lines[i].trim();

            if (!line) break;
            if (line.startsWith('#') || line.startsWith('>')) break;
            if (line.startsWith('```')) break;
            if (/^[\s]*[-*+]\s+/.test(line)) break;
            if (/^[\s]*\d+\.\s+/.test(line)) break;
            if (/^(\*\*\*+|---+|___+)\s*$/.test(line)) break;

            paraLines.push(line);
            i++;
        }

        if (paraLines.length > 0) {
            const paraText = paraLines.join(' ');
            const paraHtml = this.parseInline(paraText);
            this.html.push(`<p>${paraHtml}</p>`);
        }

        return i;
    }

    parseInline(text) {
        // Escape HTML first
        text = this.escapeHtml(text);

        // Images: ![alt](url)
        text = text.replace(
            /!\[([^\]]*)\]\(([^\)]+)\)/g,
            '<img src="$2" alt="$1">'
        );

        // Links: [text](url)
        text = text.replace(
            /\[([^\]]+)\]\(([^\)]+)\)/g,
            '<a href="$2">$1</a>'
        );

        // Inline code: `code`
        text = text.replace(
            /`([^`]+)`/g,
            '<code>$1</code>'
        );

        // Bold and italic: ***text***
        text = text.replace(
            /\*\*\*(.+?)\*\*\*/g,
            '<strong><em>$1</em></strong>'
        );

        // Bold: **text** or __text__
        text = text.replace(
            /\*\*(.+?)\*\*/g,
            '<strong>$1</strong>'
        );
        text = text.replace(
            /__(.+?)__/g,
            '<strong>$1</strong>'
        );

        // Italic: *text* or _text_
        text = text.replace(
            /\*(.+?)\*/g,
            '<em>$1</em>'
        );
        text = text.replace(
            /_(.+?)_/g,
            '<em>$1</em>'
        );

        // Strikethrough: ~~text~~
        text = text.replace(
            /~~(.+?)~~/g,
            '<del>$1</del>'
        );

        // Unescape for attributes
        text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        text = text.replace(/href="([^"]*)"/, (match, url) => {
            return `href="${this.unescapeHtml(url)}"`;
        });
        text = text.replace(/src="([^"]*)"/, (match, url) => {
            return `src="${this.unescapeHtml(url)}"`;
        });

        return text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    unescapeHtml(text) {
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || '';
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownParser;
}
