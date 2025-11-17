# CCSlides - Markdown Presentation Tool

A powerful and elegant tool to create and present beautiful slides from Markdown files. Built as part of the [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-md-to-slides) challenge series.

## Features

- **📝 Write in Markdown** - Create presentations using simple Markdown syntax
- **🔄 Live Reload** - See changes instantly as you edit your slides
- **🎨 Customizable Themes** - Use default themes or create your own
- **📱 Responsive Design** - Looks great on any screen size
- **⌨️ Keyboard Navigation** - Navigate slides with arrow keys and spacebar
- **📄 PDF Export** - Export your presentation to PDF for sharing
- **🎯 Version Control Friendly** - Keep your presentations in git
- **🚀 Fast Setup** - Get started in seconds with the init command

## Installation

### Local Installation

```bash
# Clone or navigate to the project directory
cd 83-markdown-presentation-tool

# Install dependencies
npm install

# Make the CLI available globally (optional)
npm link
```

### Usage Without Installation

You can also run it directly with npx:

```bash
npx . init my-presentation
```

## Quick Start

### 1. Create a New Presentation

```bash
ccslides init my-presentation
cd my-presentation
```

This creates a new presentation with:
- Sample slides in `slides/presentation.md`
- Custom template directory
- Images directory for assets
- Git repository initialized

### 2. Start the Development Server

```bash
ccslides serve
```

Open http://localhost:3000 in your browser to see your presentation.

Changes to your slides will automatically reload in the browser!

### 3. Edit Your Slides

Edit `slides/presentation.md` to create your content. Slides are separated by `---`:

```markdown
---
title: My Awesome Presentation
author: Your Name
date: 2024-11-17
theme: default
---

# Welcome

This is my first slide

---

## Second Slide

- Point one
- Point two
- Point three

---

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

---
```

### 4. Export to PDF

```bash
ccslides export -o presentation.pdf
```

## Command Line Interface

### `ccslides init <project-name>`

Create a new presentation project.

**Options:**
- `--no-git` - Skip git initialization

**Example:**
```bash
ccslides init my-talk
ccslides init workshop --no-git
```

### `ccslides serve`

Start the development server with live reload.

**Options:**
- `-p, --port <port>` - Port to run on (default: 3000)
- `-d, --dir <directory>` - Presentation directory (default: current directory)
- `--raw` - Render raw markdown (Step 2 mode)

**Examples:**
```bash
ccslides serve
ccslides serve -p 8080
ccslides serve -d ./my-presentation
ccslides serve --raw  # See raw markdown
```

### `ccslides export`

Export presentation to PDF.

**Options:**
- `-o, --output <file>` - Output PDF file (default: presentation.pdf)
- `-d, --dir <directory>` - Presentation directory (default: current directory)
- `-p, --port <port>` - Temporary server port (default: 3001)

**Examples:**
```bash
ccslides export
ccslides export -o my-talk.pdf
ccslides export -d ./my-presentation -o output.pdf
```

## Markdown Syntax

### Slide Separator

Slides are separated by three dashes on their own line:

```markdown
# Slide 1

---

# Slide 2

---
```

### Front Matter

Add metadata at the top of your presentation:

```yaml
---
title: My Presentation
author: Your Name
date: 2024-11-17
theme: default
---
```

### Headings

```markdown
# Main Title (H1)
## Section Title (H2)
### Subsection (H3)
```

### Text Formatting

```markdown
**Bold text**
*Italic text*
`Inline code`
```

### Lists

```markdown
- Bullet point
- Another point
  - Nested point

1. Numbered item
2. Another item
```

### Code Blocks

````markdown
```javascript
function example() {
  return "Hello, World!";
}
```
````

### Images

```markdown
![Description](../images/myimage.png)
```

Place images in the `images/` directory.

### Blockquotes

```markdown
> This is a quote
> - Author Name
```

## Customization

### Custom Themes

Edit `template/theme.json` to customize colors and fonts:

```json
{
  "name": "my-theme",
  "colors": {
    "primary": "#2c3e50",
    "secondary": "#3498db",
    "background": "#ffffff",
    "text": "#333333"
  },
  "fonts": {
    "heading": "'Helvetica Neue', Helvetica, Arial, sans-serif",
    "body": "'Helvetica Neue', Helvetica, Arial, sans-serif",
    "code": "'Monaco', 'Courier New', monospace"
  }
}
```

### Custom Styles

Add custom CSS in `template/style.css`:

```css
/* Override default styles */
.slide h1 {
  color: #e74c3c;
  text-transform: uppercase;
}

.slide {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

## Keyboard Shortcuts

- `→` or `Space` - Next slide
- `←` - Previous slide
- `Home` - First slide
- `End` - Last slide

## Project Structure

```
my-presentation/
├── slides/
│   └── presentation.md    # Your slide content
├── template/              # Custom theme (optional)
│   ├── theme.json        # Theme configuration
│   └── style.css         # Custom styles
├── images/               # Image assets
├── .gitignore
└── README.md
```

## Examples

### Simple Presentation

```markdown
---
title: Quick Update
author: John Doe
---

# Project Status

Current progress on the project

---

## Completed

- Feature A ✓
- Feature B ✓
- Bug fixes ✓

---

## In Progress

- Feature C (80%)
- Documentation (60%)

---

## Next Steps

1. Complete Feature C
2. Finish documentation
3. Release v1.0

---
```

### Technical Talk

```markdown
---
title: Introduction to Node.js
author: Jane Developer
---

# Node.js Fundamentals

Building scalable network applications

---

## What is Node.js?

- JavaScript runtime built on Chrome's V8 engine
- Event-driven, non-blocking I/O
- Perfect for real-time applications

---

## Example: Hello Server

\`\`\`javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, World!\\n');
});

server.listen(3000);
\`\`\`

---
```

## Architecture

### Components

1. **CLI (`bin/ccslides.js`)** - Command-line interface
2. **Init Module (`src/init.js`)** - Project scaffolding
3. **Server (`src/server.js`)** - Web server with live reload
4. **Renderer (`src/renderer.js`)** - Markdown to HTML conversion
5. **Export (`src/export.js`)** - PDF generation

### How It Works

1. **Development Mode:**
   - Express server serves the presentation
   - Chokidar watches for file changes
   - Socket.IO triggers browser reload on changes
   - Marked.js converts Markdown to HTML

2. **Export Mode:**
   - Starts temporary server
   - Puppeteer renders presentation
   - Generates PDF with print styles
   - Cleans up temporary server

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
ccslides serve -p 8080
```

### PDF Export Fails

Make sure Puppeteer can install Chromium:

```bash
# Reinstall dependencies
npm install
```

### Live Reload Not Working

Check that your browser allows WebSocket connections and that no firewall is blocking Socket.IO.

## Dependencies

- **express** - Web server
- **marked** - Markdown parser
- **chokidar** - File watcher
- **socket.io** - Live reload
- **puppeteer** - PDF export
- **commander** - CLI framework
- **chalk** - Terminal colors
- **ejs** - Template engine

## Development

### Running Tests

```bash
npm test
```

### Building from Source

```bash
# Install dependencies
npm install

# Run locally
node bin/ccslides.js init test-presentation
```

## Comparison with Other Tools

| Feature | CCSlides | Slidev | reveal.js |
|---------|----------|--------|-----------|
| Markdown-based | ✓ | ✓ | ✓ |
| Live reload | ✓ | ✓ | ✓ |
| PDF export | ✓ | ✓ | ✓ |
| Custom themes | ✓ | ✓ | ✓ |
| Simple setup | ✓ | - | - |
| No build step | ✓ | - | - |

## Contributing

This project is part of the CodingChallenges.fyi challenge series. Feel free to fork and extend it!

## License

MIT License - Educational purposes

## References

- [CodingChallenges.fyi - Markdown Presentation Challenge](https://codingchallenges.fyi/challenges/challenge-md-to-slides)
- [Slidev](https://sli.dev/)
- [Go Present](https://pkg.go.dev/golang.org/x/tools/present)
- [Marked.js](https://marked.js.org/)
- [reveal.js](https://revealjs.com/)

## Author

Built as part of the 94 coding challenges from [CodingChallenges.fyi](https://codingchallenges.fyi/).
