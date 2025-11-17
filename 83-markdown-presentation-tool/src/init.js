const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SAMPLE_SLIDES = `---
title: My Presentation
author: Your Name
date: ${new Date().toLocaleDateString()}
theme: default
---

# Welcome to CCSlides

A Markdown-based presentation tool

---

## Features

- Write slides in Markdown
- Live reload during editing
- Export to PDF
- Custom themes
- Version control friendly

---

## Getting Started

1. Edit \`slides/presentation.md\`
2. Run \`ccslides serve\`
3. Open browser to http://localhost:3000
4. Start presenting!

---

## Markdown Support

- **Bold text**
- *Italic text*
- \`Code snippets\`
- Lists and more

\`\`\`javascript
// Code blocks with syntax highlighting
function hello() {
  console.log("Hello, World!");
}
\`\`\`

---

## Images

![Sample Image](../images/sample.png)

You can add images to the \`images/\` directory

---

## Thank You!

Questions?

---
`;

const SAMPLE_README = (projectName) => `# ${projectName}

A presentation created with CCSlides.

## Usage

### Development

Start the development server with live reload:

\`\`\`bash
ccslides serve
\`\`\`

Then open http://localhost:3000 in your browser.

### Editing

Edit your slides in \`slides/presentation.md\`. The changes will automatically reload in your browser.

### Export to PDF

Export your presentation to PDF:

\`\`\`bash
ccslides export -o ${projectName}.pdf
\`\`\`

## Slide Format

Slides are separated by \`---\` (three dashes on a new line).

Front matter at the top of the file (between \`---\`) contains metadata:

\`\`\`yaml
---
title: My Presentation
author: Your Name
date: 2024-01-01
theme: default
---
\`\`\`

## Customization

### Themes

You can customize the theme by editing files in the \`template/\` directory:

- \`template/style.css\` - Custom styles
- \`template/theme.json\` - Theme configuration

### Images

Place images in the \`images/\` directory and reference them in your slides:

\`\`\`markdown
![Description](../images/myimage.png)
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── slides/
│   └── presentation.md    # Your slide content
├── template/               # Custom theme (optional)
│   ├── style.css
│   └── theme.json
├── images/                 # Image assets
├── .gitignore
└── README.md
\`\`\`

## Learn More

- [CCSlides Documentation](https://codingchallenges.fyi/challenges/challenge-md-to-slides)
- [Markdown Guide](https://www.markdownguide.org/)
`;

const GITIGNORE = `node_modules/
*.pdf
.DS_Store
`;

const SAMPLE_THEME_CONFIG = {
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

const SAMPLE_STYLE = `/* Custom styles for your presentation */

/* You can override default styles here */

/* Example: Custom heading colors */
/*
.slide h1 {
  color: #e74c3c;
}

.slide h2 {
  color: #3498db;
}
*/

/* Example: Custom background */
/*
.slide {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
*/
`;

function initProject(projectName, options) {
  const projectPath = path.resolve(process.cwd(), projectName);

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }

  // Create project directory structure
  fs.mkdirSync(projectPath);
  fs.mkdirSync(path.join(projectPath, 'slides'));
  fs.mkdirSync(path.join(projectPath, 'template'));
  fs.mkdirSync(path.join(projectPath, 'images'));

  // Create sample presentation
  fs.writeFileSync(
    path.join(projectPath, 'slides', 'presentation.md'),
    SAMPLE_SLIDES
  );

  // Create README
  fs.writeFileSync(
    path.join(projectPath, 'README.md'),
    SAMPLE_README(projectName)
  );

  // Create .gitignore
  fs.writeFileSync(
    path.join(projectPath, '.gitignore'),
    GITIGNORE
  );

  // Create sample theme config
  fs.writeFileSync(
    path.join(projectPath, 'template', 'theme.json'),
    JSON.stringify(SAMPLE_THEME_CONFIG, null, 2)
  );

  // Create sample custom style
  fs.writeFileSync(
    path.join(projectPath, 'template', 'style.css'),
    SAMPLE_STYLE
  );

  // Create placeholder image directory note
  fs.writeFileSync(
    path.join(projectPath, 'images', '.gitkeep'),
    '# Place your images here\n'
  );

  // Initialize git if requested
  if (options.git !== false) {
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
      execSync('git commit -m "Initial commit: CCSlides presentation"', {
        cwd: projectPath,
        stdio: 'ignore'
      });
    } catch (error) {
      console.warn('Warning: Git initialization failed. Continuing without git...');
    }
  }
}

module.exports = { initProject };
