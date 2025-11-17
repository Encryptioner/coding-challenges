const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

// Configure marked for syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    return `<code class="language-${lang}">${escapeHtml(code)}</code>`;
  },
  breaks: true,
  gfm: true
});

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

function parseMarkdown(markdown) {
  // Extract front matter
  let frontMatter = {};
  let content = markdown;

  const frontMatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontMatterMatch) {
    const frontMatterText = frontMatterMatch[1];
    content = frontMatterMatch[2];

    // Parse front matter (simple YAML-like parsing)
    frontMatterText.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        frontMatter[match[1]] = match[2].trim();
      }
    });
  }

  // Split into slides (by ---)
  const slideTexts = content.split(/\n---\n/).filter(s => s.trim());

  return {
    frontMatter,
    slides: slideTexts
  };
}

function renderRawMode(markdown) {
  const parsed = parseMarkdown(markdown);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${parsed.frontMatter.title || 'Presentation'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Monaco', 'Courier New', monospace;
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #4ec9b0;
      margin-bottom: 20px;
    }
    .slide {
      background: #252526;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 20px;
      white-space: pre-wrap;
      font-family: 'Monaco', 'Courier New', monospace;
    }
    .slide-number {
      color: #858585;
      font-size: 12px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📄 ${parsed.frontMatter.title || 'Presentation'} (Raw Markdown)</h1>
    ${parsed.slides.map((slide, index) => `
    <div class="slide">
      <div class="slide-number">Slide ${index + 1}</div>
      ${escapeHtml(slide.trim())}
    </div>
    `).join('')}
  </div>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    socket.on('reload', () => {
      console.log('Changes detected, reloading...');
      location.reload();
    });
  </script>
</body>
</html>`;
}

function loadTheme(templateDir) {
  const defaultTheme = {
    name: "default",
    colors: {
      primary: "#2c3e50",
      secondary: "#3498db",
      background: "#ffffff",
      text: "#333333"
    },
    fonts: {
      heading: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      body: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      code: "'Monaco', 'Courier New', monospace"
    }
  };

  if (!templateDir) {
    return defaultTheme;
  }

  const themeFile = path.join(templateDir, 'theme.json');
  if (fs.existsSync(themeFile)) {
    try {
      const customTheme = JSON.parse(fs.readFileSync(themeFile, 'utf-8'));
      return { ...defaultTheme, ...customTheme };
    } catch (error) {
      console.warn('Warning: Failed to load custom theme, using default');
      return defaultTheme;
    }
  }

  return defaultTheme;
}

function loadCustomStyle(templateDir) {
  if (!templateDir) {
    return '';
  }

  const styleFile = path.join(templateDir, 'style.css');
  if (fs.existsSync(styleFile)) {
    return fs.readFileSync(styleFile, 'utf-8');
  }

  return '';
}

function renderHTMLMode(markdown, templateDir) {
  const parsed = parseMarkdown(markdown);
  const theme = loadTheme(templateDir);
  const customStyle = loadCustomStyle(templateDir);

  const slideHTML = parsed.slides.map((slideText, index) => {
    const html = marked(slideText.trim());
    return `
    <div class="slide" data-slide="${index}">
      <div class="slide-content">
        ${html}
      </div>
      <div class="slide-number">${index + 1} / ${parsed.slides.length}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${parsed.frontMatter.title || 'Presentation'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${theme.fonts.body};
      background: #000;
      color: ${theme.colors.text};
      overflow: hidden;
    }

    .presentation {
      width: 100vw;
      height: 100vh;
      position: relative;
    }

    .slide {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: none;
      background: ${theme.colors.background};
      padding: 60px 80px;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }

    .slide.active {
      display: flex;
      flex-direction: column;
      opacity: 1;
    }

    .slide-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .slide h1 {
      font-family: ${theme.fonts.heading};
      color: ${theme.colors.primary};
      font-size: 3.5em;
      margin-bottom: 0.5em;
      line-height: 1.2;
    }

    .slide h2 {
      font-family: ${theme.fonts.heading};
      color: ${theme.colors.secondary};
      font-size: 2.5em;
      margin-bottom: 0.5em;
      margin-top: 0.5em;
      line-height: 1.3;
    }

    .slide h3 {
      font-family: ${theme.fonts.heading};
      color: ${theme.colors.primary};
      font-size: 1.8em;
      margin-bottom: 0.5em;
      margin-top: 0.5em;
    }

    .slide p {
      font-size: 1.5em;
      line-height: 1.6;
      margin-bottom: 0.8em;
    }

    .slide ul, .slide ol {
      font-size: 1.5em;
      line-height: 1.8;
      margin-left: 1.5em;
      margin-bottom: 0.8em;
    }

    .slide li {
      margin-bottom: 0.4em;
    }

    .slide code {
      font-family: ${theme.fonts.code};
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }

    .slide pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 20px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1em 0;
      font-size: 1.2em;
    }

    .slide pre code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: 1em;
    }

    .slide img {
      max-width: 80%;
      max-height: 500px;
      display: block;
      margin: 1em auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .slide blockquote {
      border-left: 4px solid ${theme.colors.secondary};
      padding-left: 20px;
      margin: 1em 0;
      font-style: italic;
      font-size: 1.3em;
      color: #666;
    }

    .slide-number {
      position: absolute;
      bottom: 20px;
      right: 40px;
      font-size: 0.9em;
      color: #999;
    }

    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 100;
    }

    .btn {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.2s;
    }

    .btn:hover {
      background: rgba(255, 255, 255, 1);
    }

    .progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: rgba(0,0,0,0.1);
      z-index: 100;
    }

    .progress-bar {
      height: 100%;
      background: ${theme.colors.secondary};
      transition: width 0.3s;
    }

    /* Custom styles */
    ${customStyle}

    /* Print styles */
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
  </style>
</head>
<body>
  <div class="progress">
    <div class="progress-bar" id="progressBar"></div>
  </div>

  <div class="presentation" id="presentation">
    ${slideHTML}
  </div>

  <div class="controls">
    <button class="btn" id="prevBtn">← Previous</button>
    <button class="btn" id="nextBtn">Next →</button>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const progressBar = document.getElementById('progressBar');

    function showSlide(index) {
      slides.forEach(s => s.classList.remove('active'));
      if (slides[index]) {
        slides[index].classList.add('active');
        currentSlide = index;
        updateProgress();
      }
    }

    function updateProgress() {
      const progress = ((currentSlide + 1) / totalSlides) * 100;
      progressBar.style.width = progress + '%';
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        showSlide(currentSlide + 1);
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        showSlide(currentSlide - 1);
      }
    }

    // Event listeners
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
    document.getElementById('prevBtn').addEventListener('click', prevSlide);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        showSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        showSlide(totalSlides - 1);
      }
    });

    // Live reload
    const socket = io();
    socket.on('reload', () => {
      console.log('Changes detected, reloading...');
      location.reload();
    });

    // Initialize
    showSlide(0);
  </script>
</body>
</html>`;
}

function renderSlides(markdown, options = {}) {
  if (options.raw) {
    return renderRawMode(markdown);
  } else {
    return renderHTMLMode(markdown, options.templateDir);
  }
}

module.exports = {
  parseMarkdown,
  renderSlides
};
