# Build Your Own Web Browser - Implementation

A functional web browser built from scratch, demonstrating HTML parsing, CSS rendering, JavaScript execution, and user interaction handling. Built with TypeScript and deployable to GitHub Pages.

## Overview

This implementation recreates core browser functionality by building a rendering engine that fetches web pages, parses HTML/CSS/JavaScript, and renders content to the screen. It demonstrates how modern browsers work under the hood.

## Features

- ✅ **HTTP/HTTPS Client**: Fetch web pages with redirect handling
- ✅ **HTML Parser**: Tokenize and build DOM tree from HTML
- ✅ **CSS Parser**: Parse stylesheets and compute computed styles
- ✅ **Layout Engine**: Block and inline layout with box model
- ✅ **Rendering Engine**: Paint to HTML5 Canvas
- ✅ **JavaScript Support**: Execute scripts and provide DOM APIs
- ✅ **Event Handling**: Click, form submission, navigation
- ✅ **User Interface**: Address bar, back/forward buttons, scrollable viewport
- ✅ **Developer Tools**: Inspector for examining DOM and styles

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Browser UI                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │ ← Back │ →  │  │  Address Bar    │  │  Go ⟼           │ │
│  └──────────────┘  └─────────────────┘  └──────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Viewport (Canvas)                     │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │  Rendered Web Content                              │ │ │
│  │  │  <h1>Page Title</h1>                               │ │ │
│  │  │  <p>Content here...</p>                            │ │
│  │  │  <a href="...">Link</a>                            │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Developer Tools (toggle)                               │ │
│  │  DOM Tree | Computed Styles | Console                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│                    Browser Core Engine                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Network   │  │    HTML      │  │      CSS           │   │
│  │    Fetch    │  │   Parser     │  │     Parser         │   │
│  │             │  │              │  │                    │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────────┘   │
│         │                │                   │               │
│         └────────────────┼───────────────────┘               │
│                          ▼                                   │
│                  ┌──────────────┐                             │
│                  │   DOM Tree   │                             │
│                  └──────┬───────┘                             │
│                         ▼                                    │
│                  ┌──────────────┐                             │
│                  │ Style Engine │                             │
│                  └──────┬───────┘                             │
│                         ▼                                    │
│                  ┌──────────────┐                             │
│                  │  Layout      │                             │
│                  └──────┬───────┘                             │
│                         ▼                                    │
│                  ┌──────────────┐                             │
│                  │   Paint      │                             │
│                  └──────────────┘                             │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              JavaScript Engine                          │  │
│  │  - DOM APIs (document, element, window)                │  │
│  │  - Event handling (addEventListener)                    │  │
│  │  - Console (console.log)                               │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Build and Installation

### Prerequisites

- **Node.js 18+** and **pnpm**
- **TypeScript 5+**
- Modern web browser (for viewing the output)

### Build from Source

```bash
# Navigate to challenge directory
cd 25-browser

# Install dependencies
pnpm install

# Development server with hot reload
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

### GitHub Pages Deployment

This challenge is deployable to GitHub Pages. The build output is automatically included in the repository's deployment system.

```bash
# Build and test locally before deployment
pnpm build
pnpm preview
```

## Usage

### As a Web Application

Open `dist/index.html` in a browser or visit the GitHub Pages URL.

```bash
# Start local development server
pnpm dev

# Navigate to
open http://localhost:5173
```

### Command-Line Interface

```bash
# Fetch a page and output the DOM tree
pnpm start fetch https://example.com/

# Render a page to PNG (requires headless browser)
pnpm start render https://example.com/ output.png

# Run in headless mode (for testing)
pnpm start test https://example.com/
```

## User Interface

### Main Browser Window

```
┌─────────────────────────────────────────────────────────────────┐
│ ◀ Back    ▶ Forward    ↻ Refresh      ⌂ Home                   │
├─────────────────────────────────────────────────────────────────┤
│ https://example.com                                    [ Go ⟼ ] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │                    Page Content                             │ │
│ │                                                             │ │
│ │                    Example Domain                           │ │
│ │                                                             │ │
│ │                This domain is for use...                   │ │
│ │                                                             │ │
│ │              [More information...]                          │ │
│ │                                                             │ │
│ │                                  ▲                          │ │
│ │                                  │ scrollbar                │ │
│ │                                  ▼                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Status: Connected | Loading: 124ms | Elements: 15 | [ DevTools ]│
└─────────────────────────────────────────────────────────────────┘
```

### Developer Tools

```
┌─────────────────────────────────────────────────────────────────┐
│ Developer Tools                                    [×]          │
├─────────────────────────────────────────────────────────────────┤
│ [DOM Tree] [Computed Styles] [Console] [Network]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ▼ html                                                          │
│   ▼ head                                                       │
│     ▼ title                                                    │
│       "Example Domain"                                         │
│   ▼ body                                                       │
│     ▼ div                                                      │
│       ▼ h1                                                     │
│         "Example Domain"                                       │
│       ▼ p                                                      │
│         "This domain is for use..."                            │
│       ▼ a[href="https://www.iana.org/domains/example"]        │
│         "More information..."                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
25-browser/
├── src/
│   ├── core/
│   │   ├── browser.ts          # Main browser orchestration
│   │   ├── network.ts          # HTTP/HTTPS client
│   │   ├── history.ts          # Navigation history
│   │   └── cookies.ts          # Cookie management
│   ├── html/
│   │   ├── parser.ts           # HTML tokenizer and parser
│   │   ├── dom.ts              # DOM interfaces and classes
│   │   └── entities.ts         # HTML entity decoding
│   ├── css/
│   │   ├── parser.ts           # CSS parser
│   │   ├── selector.ts         # Selector matching
│   │   ├── cascade.ts          # Style cascade and inheritance
│   │   └── properties.ts       # CSS property definitions
│   ├── layout/
│   │   ├── engine.ts           # Layout engine
│   │   ├── block.ts            # Block layout algorithm
│   │   ├── inline.ts           # Inline layout algorithm
│   │   └── box-model.ts        # Box model calculations
│   ├── render/
│   │   ├── canvas.ts           # Canvas painting
│   │   ├── text.ts             # Text measurement and rendering
│   │   ├── images.ts           # Image loading and rendering
│   │   └── colors.ts           # Color parsing and conversion
│   ├── js/
│   │   ├── runtime.ts          # JavaScript runtime bridge
│   │   ├── dom-api.ts          # DOM API implementations
│   │   ├── events.ts           # Event system
│   │   └── console.ts          # Console implementation
│   ├── ui/
│   │   ├── browser-ui.tsx      # Main React UI component
│   │   ├── address-bar.tsx     # Address bar component
│   │   ├── viewport.tsx        # Canvas viewport component
│   │   └── devtools.tsx        # Developer tools panel
│   └── utils/
│       ├── url.ts              # URL parsing and manipulation
│       ├── http.ts             # HTTP utilities
│       └── encoding.ts         # Text encoding (UTF-8, etc.)
├── test/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test HTML/CSS files
├── docs/
│   ├── implementation.md       # Implementation details
│   ├── examples.md             # Usage examples
│   └── internals.md            # Deep dive into internals
├── index.html                  # Entry point
├── CHALLENGE.md                # Challenge requirements
├── README.md                   # This file
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

## How It Works

### Browser Lifecycle

```
1. User enters URL
   ↓
2. Browser parses URL
   ↓
3. Network fetch initiates
   ├─ DNS lookup
   ├─ TCP connection
   ├─ TLS handshake (if HTTPS)
   └─ HTTP GET request
   ↓
4. Response received
   ├─ HTML content
   ├─ CSS links (followed)
   ├─ Script tags (executed)
   └─ Image sources (loaded)
   ↓
5. HTML Parser builds DOM
   └─ Tree of nodes (elements, text, comments)
   ↓
6. CSS Parser creates style sheets
   ↓
7. Style Engine computes styles
   ├─ Match selectors to elements
   ├─ Apply cascade rules
   └─ Calculate computed values
   ↓
8. Layout Engine calculates geometry
   ├─ Block layout for block elements
   ├─ Inline layout for text
   └─ Box model (margin, border, padding, content)
   ↓
9. Render Engine paints
   ├─ Draw backgrounds
   ├─ Draw borders
   ├─ Draw text
   └─ Draw images
   ↓
10. Display presented to user
```

### HTML Parsing

```
HTML Tokenization:
┌─────────────────────────────────────────────────────────────┐
│  "<p>Hello <strong>world</strong></p>"                      │
│                                                             │
│  Tokens:                                                    │
│  1. StartTag: { name: "p", attributes: {} }                │
│  2. Text: "Hello "                                          │
│  3. StartTag: { name: "strong", attributes: {} }           │
│  4. Text: "world"                                           │
│  5. EndTag: { name: "strong" }                              │
│  6. EndTag: { name: "p" }                                   │
└─────────────────────────────────────────────────────────────┘

Tree Construction:
┌─────────────────────────────────────────────────────────────┐
│  Document                                                   │
│    └─ p                                                     │
│        ├─ "Hello "                                         │
│        └─ strong                                            │
│            └─ "world"                                       │
└─────────────────────────────────────────────────────────────┘
```

### CSS Cascade

```
Style Computation for Element:
┌─────────────────────────────────────────────────────────────┐
│  1. Collect all matching rules                             │
│     - User agent stylesheet (defaults)                      │
│     - Author stylesheet (<style>, <link>)                   │
│     - Inline styles (style attribute)                       │
│     - !important declarations                                │
│                                                             │
│  2. Calculate specificity per rule                          │
│     ID selectors:   1,0,0                                   │
│     Class selectors: 0,1,0                                  │
│     Element selectors: 0,0,1                                │
│     Example: #main div.warning → 1,1,1                     │
│                                                             │
│  3. Sort by specificity (highest wins)                      │
│                                                             │
│  4. For each property:                                      │
│     - If !important: highest specificity wins               │
│     - If tie: last declaration wins                         │
│     - Inherit if property is inheritable                    │
│     - Use default value otherwise                           │
│                                                             │
│  5. Return computed style object                            │
└─────────────────────────────────────────────────────────────┘
```

### Layout Algorithm

```
Block Layout (simplified):
function layoutBlock(node) {
    node.width = parent.width
                  - parent.padding.left
                  - parent.padding.right
                  - node.margin.left
                  - node.margin.right
                  - node.border.left
                  - node.border.right;

    let y = 0;
    for (child of node.children) {
        child.x = 0;
        child.y = y;

        if (child.style.display === 'block') {
            layoutBlock(child);
            y += child.height
                 + child.margin.top
                 + child.margin.bottom;
        } else {
            layoutInline(child);
            y += child.lineHeight;
        }
    }

    node.height = y;
}
```

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Chrome/Edge | ✅ Full support | Native Canvas API |
| Firefox | ✅ Full support | Native Canvas API |
| Safari | ✅ Full support | Native Canvas API |
| Mobile browsers | ✅ Full support | Touch events supported |

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Integration Tests

```bash
# Run integration tests (requires running dev server)
pnpm test:integration

# Test against real websites
pnpm test:real-world
```

### Manual Testing

Load test pages from the `test/fixtures/` directory:

```bash
# Start dev server
pnpm dev

# Navigate to test pages
http://localhost:5173/test/fixtures/basic.html
http://localhost:5173/test/fixtures/forms.html
http://localhost:5173/test/fixtures/javascript.html
```

## Troubleshooting

### Page Won't Load

**Symptom**: Blank page or error message

**Solutions**:
- Check browser console for errors
- Verify URL is correct and accessible
- Check network tab for failed requests
- Some sites may block automated browsers

### Styling Looks Wrong

**Symptom**: Page renders but styling is incorrect

**Solutions**:
- Check CSS parser errors in console
- Verify selector matching in DevTools
- Some CSS features may not be implemented yet
- Check for !important declarations

### JavaScript Not Working

**Symptom**: Scripts don't execute or produce errors

**Solutions**:
- Check console for JavaScript errors
- Verify DOM APIs are implemented
- Some ES6+ features may not be supported
- Check for CORS issues with external scripts

### Performance Issues

**Symptom**: Page loads slowly or renders slowly

**Solutions**:
- Check page size and number of elements
- Enable performance monitoring in DevTools
- Some pages may be too complex for this implementation
- Consider limiting JavaScript execution

## Performance Considerations

- **Rendering**: Canvas-based painting is fast for simple pages
- **Layout**: O(n) where n is number of elements
- **Style computation**: O(n × m) where m is number of rules
- **JavaScript**: Similar to native browser performance
- **Memory**: ~50-100MB base + page content

## Security Considerations

⚠️ **This is an educational implementation, not a security-hardened browser:**

- No Content Security Policy enforcement
- No Same-Origin Policy (can be circumvented)
- No XSS protection
- Limited input validation
- Not suitable for untrusted content

**Never use this browser for sensitive operations like banking.**

## Further Reading

- [HTML Living Standard](https://html.spec.whatwg.org/)
- [CSS Scoping](https://www.w3.org/Style/CSS/)
- [Browser Engineering](https://browser.engineering/)
- [Rendering Architecture](https://www.chromium.org/developers/design-documents/rendering-architecture)

## License

MIT License - See LICENSE file for details

## Contributing

This is a coding challenge implementation. For the original challenge concept, note that while inspired by browser engineering, this is an educational project for learning purposes.
