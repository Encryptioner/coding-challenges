# Build Your Own Web Browser

This challenge is to build your own web browser from scratch.

## Background

A web browser is one of the most complex software applications in existence. It takes a URL, fetches resources over the network, parses HTML and CSS, executes JavaScript, and renders pixels to the screen. Modern browsers like Chrome, Firefox, and Safari represent millions of lines of code developed over decades.

The browser architecture we know today evolved from simple HTML renderers to sophisticated application platforms. Understanding how a browser works gives you insight into web standards, network protocols, parsing algorithms, and graphics rendering.

## The Challenge - Building Your Own Web Browser

In this coding challenge, we'll build a functional web browser that can:

1. Fetch web pages over HTTP/HTTPS
2. Parse HTML into a Document Object Model (DOM)
3. Parse and apply CSS styles
4. Execute JavaScript
5. Render content to a display surface
6. Handle user interaction (clicks, scrolling, form input)

You'll implement each component step by step, culminating in a browser that can render real websites.

## Step Zero

Set up your development environment. Choose a language with good support for:
- Network operations (HTTP client)
- String parsing and text processing
- Graphics rendering (canvas, window, or terminal)
- JavaScript execution (embedded engine or integration)

**Recommended Languages**:
- **JavaScript/TypeScript**: Native JS integration, excellent DOM APIs
- **Python**: Beautiful libraries, Brython or Pyodide for JS
- **Rust**: Performance, safety, growing ecosystem
- **Go**: Good standard library, cross-platform

For this challenge, we'll use **TypeScript** as it provides native JavaScript integration and excellent type safety.

## Step 1

In this step, your goal is to implement basic HTTP/HTTPS fetching.

Your browser should be able to:
1. Accept a URL from command line or UI
2. Parse the URL into protocol, host, port, and path
3. Make an HTTP GET request
4. Receive and store the response body
5. Handle HTTP redirects (3xx status codes)
6. Report errors (network failures, DNS failures, etc.)

Test it with:
```bash
browser fetch https://example.com/
# Should output: HTTP 200 OK
# And save the HTML content
```

**Key Concepts**:
- URL parsing (RFC 3986)
- HTTP request/response (RFC 7230)
- DNS resolution
- TCP connection management
- TLS/SSL for HTTPS

## Step 2

In this step, your goal is to parse HTML into a DOM tree.

Implement an HTML parser that:
1. Tokenizes HTML into tags, text, comments, etc.
2. Builds a tree structure from the tokens
3. Handles malformed HTML gracefully (like browsers do)
4. Supports common HTML5 elements

Your parser should handle:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <h1>Hello</h1>
    <p>This is a <strong>test</strong>.</p>
    <a href="https://example.com">Link</a>
</body>
</html>
```

And produce a DOM tree:
```
Document
 └─ html
     ├─ head
     │   └─ title
     │       └─ "Test Page"
     └─ body
         ├─ h1
         │   └─ "Hello"
         ├─ p
         │   ├─ "This is a "
         │   └─ strong
         │       └─ "test"
         └─ a[href="https://example.com"]
             └─ "Link"
```

**Key Concepts**:
- Tokenization (tag vs text vs comment)
- Tree construction (opening/closing tags)
- Self-closing tags
- Attribute parsing
- Error recovery

## Step 3

In this step, your goal is to add CSS parsing and style computation.

Your browser should:
1. Parse CSS into rule sets, selectors, and declarations
2. Match selectors to DOM elements
3. Compute the "computed style" for each element
4. Handle inheritance (color, font-size, etc.)
5. Implement the cascade (author !important > author > user > user agent)

Support these CSS features:
```css
/* Element selectors */
h1 { color: blue; }

/* Class selectors */
.warning { color: red; }

/* ID selectors */
#main { font-size: 18px; }

/* Descendant selectors */
div p { margin: 10px; }

/* Properties */
p {
    color: #333;
    background-color: white;
    font-size: 16px;
    margin: 0;
    padding: 10px;
}
```

**Key Concepts**:
- Selector specificity (ID > class > element)
- The cascade (multiple sources, importance)
- Inheritance (some properties inherit)
- Default styles (user agent stylesheet)
- Color parsing (names, hex, rgb, hsl)

## Step 4

In this step, your goal is to implement the layout engine.

Your browser should:
1. Calculate the width and height of each element
2. Handle block layout (div, p, h1-h6, etc.)
3. Handle inline layout (span, a, strong, em, etc.)
4. Support the CSS box model (margin, border, padding, width)
5. Implement text wrapping and line breaking

The box model:
```
┌─────────────── margin ───────────────┐
│ ╔═══════════ border ════════════════╗ │
│ ║ ╔═══════ padding ════════════════╗ ║ │
│ ║ ║           width                ║ ║ │
│ ║ ║ ┌───────── content ─────────┐ ║ ║ │
│ ║ ║ │                            │ ║ ║ │
│ ║ ║ │      Text content          │ ║ ║ │
│ ║ ║ │                            │ ║ ║ │
│ ║ ║ └────────────────────────────┘ ║ ║ │
│ ║ ╚═════════════════════════════════╝ ║ │
│ ╚═════════════════════════════════════╝ │
└──────────────────────────────────────────┘

total width = margin-left + border-left + padding-left
              + width
              + padding-right + border-right + margin-right
```

**Key Concepts**:
- Block formatting context
- Inline formatting context
- The CSS box model
- Text measurement
- Line breaking algorithm
- Margins (collapse behavior)

## Step 5

In this step, your goal is to implement painting (rendering to screen).

Your browser should:
1. Take the layout tree and draw it
2. Handle text rendering (fonts, sizes, weights)
3. Draw rectangles (backgrounds, borders)
4. Handle images (<img> tags)
5. Support colors and basic visual effects

For a browser-based implementation (rendering to canvas or DOM):
```javascript
function render(node, x, y) {
    const style = node.computedStyle;

    // Draw background
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(x, y, node.width, node.height);

    // Draw border
    if (style.borderWidth > 0) {
        ctx.strokeStyle = style.borderColor;
        ctx.lineWidth = style.borderWidth;
        ctx.strokeRect(x, y, node.width, node.height);
    }

    // Draw text
    ctx.fillStyle = style.color;
    ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    ctx.fillText(node.textContent, x + style.paddingLeft, y + style.paddingTop);

    // Render children
    let childY = y + style.marginTop;
    for (const child of node.children) {
        render(child, x + style.marginLeft, childY);
        childY += child.height + child.style.marginBottom;
    }
}
```

**Key Concepts**:
- Canvas API or terminal rendering
- Font rendering
- Color blending
- Z-index and stacking context
- Paint order (background → content → border)

## Step 6

In this step, your goal is to add JavaScript support.

Your browser should:
1. Execute <script> tags in order
2. Provide access to the DOM (document, window APIs)
3. Implement basic DOM manipulation methods:
   - `document.getElementById()`
   - `document.querySelector()`
   - `element.innerHTML`
   - `element.textContent`
4. Handle event listeners (click, submit, etc.)

Example JavaScript execution:
```html
<div id="output">Not clicked yet</div>
<button id="btn">Click me</button>

<script>
const btn = document.getElementById('btn');
btn.addEventListener('click', function() {
    const output = document.getElementById('output');
    output.textContent = 'Clicked!';
});
</script>
```

**Key Concepts**:
- JavaScript engine integration (V8, QuickJS, or builtin)
- DOM-JS bridge
- Event loop
- Event propagation (capture/bubble)
- Async operations

## Step 7

In this step, your goal is to handle user interaction.

Your browser should support:
1. Mouse clicks (follow links, trigger events)
2. Form submission (GET/POST requests)
3. Navigation (back/forward history)
4. Scrolling (overflow: auto, scroll events)
5. Keyboard input (form fields)

Click handling:
```javascript
element.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        browser.navigate(href);  // Navigate to link
    }
});
```

**Key Concepts**:
- Event dispatching
- Event targets and propagation
- Form encoding (application/x-www-form-urlencoded)
- Navigation stack
- Focus management

## Step 8

In this step, your goal is to support modern web features.

Add support for:
1. HTTPS and security (certificate validation)
2. Cookies (storage, SameSite attribute)
3. Local Storage and Session Storage
4. Images (<img> tags)
5. Forms (GET/POST, input types)
6. CSS gradients and shadows
7. Flexbox layout
8. Basic animations/transitions

Example cookie handling:
```javascript
// Receive Set-Cookie header
// Set-Cookie: session=abc123; Path=/; HttpOnly; Secure
document.cookie = "session=abc123; path=/; secure";

// Send Cookie header with requests
// Cookie: session=abc123
```

**Key Concepts**:
- Cookie jar (persistence)
- Same-Origin Policy
- Content Security Policy
- Image decoding
- Flexbox layout algorithm
- Animation frames

## Going Further

There's plenty more you can add:
- **JavaScript engine**: Integrate QuickJS or V8 for full JS support
- **Canvas API**: Support <canvas> for 2D graphics
- **Video/Audio**: Media element support
- **Web Workers**: Multi-threaded JavaScript
- **WebSocket**: Real-time communication
- **Shadow DOM**: Component encapsulation
- **Developer Tools**: Inspector, console, debugger
- **Performance**: Optimization, caching, service workers

## References

- [HTML Living Standard](https://html.spec.whatwg.org/)
- [CSS Scoping](https://www.w3.org/Style/CSS/)
- [ECMAScript Specification](https://tc39.es/ecma262/)
- [HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [URL Living Standard](https://url.spec.whatwg.org/)
- [Browser Engineering Basics](https://browser.engineering/)
- [Rendering on the Web](https://www.chromium.org/developers/design-documents/rendering-basics)
