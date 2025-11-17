# Implementation Guide

This document provides an in-depth look at the implementation of CCSlides, the Markdown presentation tool.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Details](#component-details)
3. [Rendering Pipeline](#rendering-pipeline)
4. [Live Reload System](#live-reload-system)
5. [PDF Export System](#pdf-export-system)
6. [Theme System](#theme-system)

## Architecture Overview

CCSlides follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                   CLI Interface                      │
│              (bin/ccslides.js)                       │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┼─────────┬──────────────┐
        │         │         │              │
        v         v         v              v
   ┌────────┐ ┌────────┐ ┌────────┐  ┌─────────┐
   │  Init  │ │ Server │ │Renderer│  │ Export  │
   └────────┘ └────┬───┘ └────┬───┘  └─────────┘
                   │          │
                   v          v
            ┌──────────────────────┐
            │   Live Reload         │
            │   (Socket.IO)         │
            └──────────────────────┘
```

### Key Components

1. **CLI Layer** - Command-line interface using Commander.js
2. **Init Module** - Project scaffolding and file generation
3. **Server Module** - Express server with live reload
4. **Renderer Module** - Markdown parsing and HTML generation
5. **Export Module** - PDF generation using Puppeteer

## Component Details

### CLI Interface (`bin/ccslides.js`)

The CLI is the entry point for all user interactions:

```javascript
const program = new Command();

program
  .command('init <project-name>')
  .description('Create a new presentation project')
  .option('-g, --no-git', 'Skip git initialization')
  .action((projectName, options) => {
    // Scaffold project
  });
```

**Responsibilities:**
- Parse command-line arguments
- Route commands to appropriate modules
- Handle errors and display user-friendly messages
- Provide help text and usage examples

**Design Decisions:**
- Used Commander.js for robust argument parsing
- Color-coded output using Chalk for better UX
- Graceful error handling with informative messages

### Init Module (`src/init.js`)

Creates new presentation projects with a complete structure:

```javascript
function initProject(projectName, options) {
  const projectPath = path.resolve(process.cwd(), projectName);

  // Create directory structure
  fs.mkdirSync(projectPath);
  fs.mkdirSync(path.join(projectPath, 'slides'));
  fs.mkdirSync(path.join(projectPath, 'template'));
  fs.mkdirSync(path.join(projectPath, 'images'));

  // Generate files...
}
```

**Generated Files:**

1. **slides/presentation.md** - Sample presentation with examples
2. **template/theme.json** - Default theme configuration
3. **template/style.css** - Placeholder for custom styles
4. **images/.gitkeep** - Ensures images directory is tracked by git
5. **README.md** - Project-specific documentation
6. **.gitignore** - Ignores generated PDFs and dependencies

**Front Matter Format:**

The init module creates slides with YAML-like front matter:

```yaml
---
title: My Presentation
author: Your Name
date: 2024-11-17
theme: default
---
```

This metadata is parsed by the renderer to configure the presentation.

### Server Module (`src/server.js`)

Provides development server with live reload:

```javascript
function startServer(options) {
  const app = express();
  const server = http.createServer(app);
  const io = socketIO(server);

  // Watch for changes
  const watcher = chokidar.watch([slidesPath, templateDir]);
  watcher.on('change', (filePath) => {
    io.emit('reload');
  });

  // Serve presentation
  app.get('/', (req, res) => {
    const html = renderSlides(markdown, options);
    res.send(html);
  });
}
```

**Features:**

1. **Static File Serving:**
   - Serves images from `images/` directory
   - Serves custom templates from `template/` directory

2. **Live Reload:**
   - Uses Chokidar to watch for file changes
   - Socket.IO broadcasts reload events to browsers
   - Preserves current slide position when possible

3. **Two Rendering Modes:**
   - **Raw Mode** (`--raw` flag): Shows markdown as plain text
   - **HTML Mode** (default): Renders beautiful slides

**Raw Mode Implementation:**

Raw mode displays the markdown exactly as written, useful for:
- Debugging markdown syntax
- Understanding slide structure
- Demonstrating Step 2 of the challenge

```javascript
function renderRawMode(markdown) {
  return `
    <div class="slide">
      <pre>${escapeHtml(slideText)}</pre>
    </div>
  `;
}
```

### Renderer Module (`src/renderer.js`)

Converts Markdown to HTML slides:

```javascript
function parseMarkdown(markdown) {
  // Extract front matter
  const frontMatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  // Split into slides
  const slideTexts = content.split(/\n---\n/);

  return { frontMatter, slides: slideTexts };
}
```

**Parsing Pipeline:**

1. **Front Matter Extraction:**
   ```javascript
   frontMatterText.split('\n').forEach(line => {
     const match = line.match(/^(\w+):\s*(.+)$/);
     if (match) {
       frontMatter[match[1]] = match[2].trim();
     }
   });
   ```

2. **Slide Splitting:**
   - Splits content on `\n---\n` separator
   - Each slide is parsed independently
   - Filters out empty slides

3. **Markdown to HTML Conversion:**
   ```javascript
   const html = marked(slideText.trim());
   ```

4. **Template Application:**
   - Loads theme configuration
   - Injects custom styles
   - Wraps content in slide divs

**HTML Structure:**

Each slide is wrapped in a container:

```html
<div class="slide" data-slide="0">
  <div class="slide-content">
    <!-- Rendered markdown -->
  </div>
  <div class="slide-number">1 / 10</div>
</div>
```

**Marked.js Configuration:**

```javascript
marked.setOptions({
  highlight: function(code, lang) {
    return `<code class="language-${lang}">${escapeHtml(code)}</code>`;
  },
  breaks: true,  // Convert \n to <br>
  gfm: true      // GitHub Flavored Markdown
});
```

## Rendering Pipeline

### Step-by-Step Process

1. **Read Markdown File:**
   ```javascript
   const markdown = fs.readFileSync(slidesPath, 'utf-8');
   ```

2. **Parse Front Matter:**
   ```javascript
   const { frontMatter, slides } = parseMarkdown(markdown);
   ```

3. **Load Theme:**
   ```javascript
   const theme = loadTheme(templateDir);
   ```

4. **Convert Each Slide:**
   ```javascript
   slides.forEach(slideText => {
     const html = marked(slideText);
     return wrapInSlideDiv(html);
   });
   ```

5. **Generate Full HTML:**
   ```javascript
   return generateHTML({
     title: frontMatter.title,
     slides: slideHTML,
     theme: theme,
     customStyle: customStyle
   });
   ```

### Theme Loading

Themes can be customized in two ways:

1. **theme.json** - Structured configuration:
   ```json
   {
     "colors": {
       "primary": "#2c3e50",
       "secondary": "#3498db"
     },
     "fonts": {
       "heading": "Helvetica Neue",
       "body": "Helvetica Neue"
     }
   }
   ```

2. **style.css** - Raw CSS overrides:
   ```css
   .slide h1 {
     color: #e74c3c;
   }
   ```

The theme system merges these configurations:

```javascript
function loadTheme(templateDir) {
  const defaultTheme = { /* ... */ };
  const customTheme = loadJSON('theme.json');
  return { ...defaultTheme, ...customTheme };
}
```

## Live Reload System

### Architecture

```
┌─────────────┐         ┌─────────────┐
│  Chokidar   │────────>│   Server    │
│   Watcher   │  change │             │
└─────────────┘         └──────┬──────┘
                               │ emit
                               v
                        ┌─────────────┐
                        │  Socket.IO  │
                        └──────┬──────┘
                               │
                               v
                        ┌─────────────┐
                        │   Browser   │
                        │   Client    │
                        └─────────────┘
```

### Implementation

**Server Side:**

```javascript
const watcher = chokidar.watch([slidesPath, templateDir], {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (filePath) => {
  console.log('File changed:', filePath);
  io.emit('reload');
});
```

**Client Side:**

```javascript
const socket = io();
socket.on('reload', () => {
  location.reload();
});
```

### Why Socket.IO?

Alternatives considered:
- **Server-Sent Events (SSE)** - One-way only, less browser support
- **WebSockets (raw)** - Lower level, more complex
- **Polling** - Inefficient, higher latency

Socket.IO provides:
- Automatic reconnection
- Fallback to polling if WebSockets unavailable
- Simple event-based API
- Wide browser support

## PDF Export System

### Process Flow

```
1. Start temp server
2. Launch Puppeteer
3. Navigate to presentation
4. Wait for full load
5. Generate PDF
6. Clean up
```

### Implementation

```javascript
async function exportToPDF(options) {
  // Start temporary server
  const server = startTempServer(options.port);

  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: 'new'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Load presentation
  await page.goto(`http://localhost:${port}`, {
    waitUntil: 'networkidle0'
  });

  // Generate PDF
  await page.pdf({
    path: outputPath,
    width: '1920px',
    height: '1080px',
    printBackground: true
  });

  // Cleanup
  await browser.close();
  server.close();
}
```

### PDF Print Styles

Special CSS for PDF output:

```css
@media print {
  .slide {
    page-break-after: always;
    display: block !important;
    opacity: 1 !important;
    position: relative !important;
    height: 100vh;
  }

  .controls, .progress {
    display: none;
  }
}
```

This ensures:
- Each slide prints on a separate page
- All slides are visible (not just active slide)
- UI controls are hidden in PDF
- Backgrounds and colors are preserved

## Theme System

### Default Theme Structure

```javascript
{
  name: "default",
  colors: {
    primary: "#2c3e50",      // Headings
    secondary: "#3498db",    // Accents
    background: "#ffffff",   // Slide background
    text: "#333333"          // Body text
  },
  fonts: {
    heading: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    body: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    code: "'Monaco', 'Courier New', monospace"
  }
}
```

### CSS Generation

Themes are applied via CSS variables:

```javascript
function generateCSS(theme) {
  return `
    body {
      font-family: ${theme.fonts.body};
      color: ${theme.colors.text};
    }

    .slide {
      background: ${theme.colors.background};
    }

    h1 {
      font-family: ${theme.fonts.heading};
      color: ${theme.colors.primary};
    }

    h2 {
      color: ${theme.colors.secondary};
    }
  `;
}
```

### Custom Theme Override

Custom themes override default values:

```javascript
const finalTheme = {
  ...defaultTheme,
  ...customTheme,
  colors: {
    ...defaultTheme.colors,
    ...customTheme.colors
  },
  fonts: {
    ...defaultTheme.fonts,
    ...customTheme.fonts
  }
};
```

This allows partial customization while maintaining defaults.

## Performance Considerations

### File Watching

Chokidar is configured to ignore hidden files and node_modules:

```javascript
chokidar.watch(paths, {
  ignored: /(^|[\/\\])\../,  // Ignore dotfiles
  ignoreInitial: true         // Don't trigger on startup
});
```

### Markdown Parsing

Marked.js is configured for optimal performance:
- GFM mode for common features
- Simple highlighting (no heavy syntax highlighter)
- Cached configuration

### Browser Performance

Client-side JavaScript is minimal:
- No heavy frameworks (vanilla JS)
- CSS transitions for smooth slide changes
- Passive event listeners for better scrolling

## Security Considerations

### Input Sanitization

HTML in markdown is escaped by Marked.js:

```javascript
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### Puppeteer Security

Puppeteer is launched with security flags:

```javascript
puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
});
```

### File System Access

File operations are restricted to:
- Project directories only
- No path traversal allowed
- Validated file paths

## Testing Strategies

### Manual Testing

1. Create test presentation
2. Start server
3. Edit slides and verify live reload
4. Test keyboard navigation
5. Export to PDF and verify output

### Automated Testing

Potential test coverage:
- Unit tests for parser
- Integration tests for server
- E2E tests with Puppeteer

## Future Enhancements

Potential improvements:

1. **Speaker Notes**
   - Add notes that only presenter sees
   - Separate view for notes

2. **Slide Transitions**
   - Fade, slide, zoom effects
   - Configurable per slide

3. **Interactive Elements**
   - Polls and quizzes
   - Live code execution

4. **Export Formats**
   - PowerPoint (PPTX)
   - Google Slides
   - Static HTML bundle

5. **Presenter Mode**
   - Speaker notes view
   - Timer and clock
   - Next slide preview

## References

- [Marked.js Documentation](https://marked.js.org/)
- [Chokidar API](https://github.com/paulmillr/chokidar)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Puppeteer API](https://pptr.dev/)
- [Express.js Guide](https://expressjs.com/)
