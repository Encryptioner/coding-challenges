const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const http = require('http');
const chokidar = require('chokidar');

// Default templates
const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ Title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
        }
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    {{ Content }}
</body>
</html>`;

const DEFAULT_INDEX_MD = `# Welcome to Your New Site!

This is your homepage. Edit **content/index.md** to change this content.

## Getting Started

1. Edit your content in the \`content/\` directory
2. Customize your theme in \`themes/\`
3. Run \`ccssg build\` to generate your site
4. Run \`ccssg serve\` to preview with live reload

## Features

- **Markdown Support**: Write content in Markdown
- **Themes**: Customize the look and feel
- **Live Reload**: See changes instantly
- **Fast Builds**: Optimized static site generation

Happy building! 🚀
`;

const DEFAULT_PAGE_MD = `# {{ PageName }}

This is the {{ PageName }} page. Edit this file to add your content.

## About This Page

Add your content here using Markdown syntax.
`;

// Initialize a new project
async function initProject(siteName) {
    const sitePath = path.join(process.cwd(), siteName);

    // Check if directory already exists
    try {
        await fs.access(sitePath);
        throw new Error(`Directory '${siteName}' already exists`);
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }

    // Create directory structure
    await fs.mkdir(sitePath, { recursive: true });
    await fs.mkdir(path.join(sitePath, 'content'), { recursive: true });

    // Create default index.md
    await fs.writeFile(
        path.join(sitePath, 'content', 'index.md'),
        DEFAULT_INDEX_MD
    );

    // Create config file
    const config = {
        title: siteName,
        theme: 'default',
        baseURL: '/',
        languageCode: 'en-us'
    };

    await fs.writeFile(
        path.join(sitePath, 'config.json'),
        JSON.stringify(config, null, 2)
    );

    return sitePath;
}

// Create a new theme
async function createTheme(themeName) {
    const themePath = path.join(process.cwd(), 'themes', themeName);

    // Check if we're in a site directory
    try {
        await fs.access(path.join(process.cwd(), 'content'));
    } catch (err) {
        throw new Error('Not in a site directory. Run this from your site root.');
    }

    // Create theme directory
    await fs.mkdir(themePath, { recursive: true });

    // Create default theme template
    await fs.writeFile(
        path.join(themePath, 'index.html'),
        DEFAULT_INDEX_HTML
    );

    return themePath;
}

// Create a new page
async function createPage(pageName) {
    const contentPath = path.join(process.cwd(), 'content');

    // Check if we're in a site directory
    try {
        await fs.access(contentPath);
    } catch (err) {
        throw new Error('Not in a site directory. Run this from your site root.');
    }

    // Create page file
    const pagePath = path.join(contentPath, `${pageName}.md`);

    // Check if page already exists
    try {
        await fs.access(pagePath);
        throw new Error(`Page '${pageName}.md' already exists`);
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }

    // Create page with template
    const pageContent = DEFAULT_PAGE_MD.replace(/{{ PageName }}/g, pageName);
    await fs.writeFile(pagePath, pageContent);

    return pagePath;
}

// Extract title from markdown content
function extractTitle(markdown) {
    const lines = markdown.split('\n');
    for (const line of lines) {
        if (line.startsWith('# ')) {
            return line.substring(2).trim();
        }
    }
    return 'Untitled Page';
}

// Render template with variables
function renderTemplate(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
}

// Build the static site
async function buildSite() {
    const sitePath = process.cwd();
    const contentPath = path.join(sitePath, 'content');
    const publicPath = path.join(sitePath, 'public');

    // Check if we're in a site directory
    try {
        await fs.access(contentPath);
    } catch (err) {
        throw new Error('Not in a site directory. Run this from your site root.');
    }

    // Load config
    let config = { theme: 'default' };
    try {
        const configData = await fs.readFile(path.join(sitePath, 'config.json'), 'utf-8');
        config = JSON.parse(configData);
    } catch (err) {
        // Use default config
    }

    // Find theme template
    let template = DEFAULT_INDEX_HTML;
    const themePath = path.join(sitePath, 'themes', config.theme, 'index.html');
    try {
        template = await fs.readFile(themePath, 'utf-8');
    } catch (err) {
        console.log(`⚠️  Using default template (theme '${config.theme}' not found)`);
    }

    // Create/clear public directory
    try {
        await fs.rm(publicPath, { recursive: true, force: true });
    } catch (err) {
        // Directory might not exist
    }
    await fs.mkdir(publicPath, { recursive: true });

    // Read all markdown files from content directory
    const files = await fs.readdir(contentPath);
    const markdownFiles = files.filter(f => f.endsWith('.md'));

    let pageCount = 0;

    for (const file of markdownFiles) {
        const markdownPath = path.join(contentPath, file);
        const markdown = await fs.readFile(markdownPath, 'utf-8');

        // Extract title and convert markdown to HTML
        const title = extractTitle(markdown);
        const htmlContent = marked(markdown);

        // Render template
        const html = renderTemplate(template, {
            Title: title,
            Content: htmlContent
        });

        // Write output file
        const outputFile = file.replace('.md', '.html');
        const outputPath = path.join(publicPath, outputFile);
        await fs.writeFile(outputPath, html);

        pageCount++;
    }

    return { pages: pageCount };
}

// Serve the site with live reload
async function serveSite() {
    const sitePath = process.cwd();
    const publicPath = path.join(sitePath, 'public');

    // Build the site first
    console.log('📦 Initial build...');
    await buildSite();
    console.log('✅ Build complete!\n');

    // Create HTTP server
    const PORT = process.env.PORT || 8000;

    const server = http.createServer(async (req, res) => {
        // Parse URL and handle routing
        let filePath = path.join(publicPath, req.url === '/' ? 'index.html' : req.url);

        // Determine content type
        const extname = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        const contentType = contentTypes[extname] || 'text/html';

        try {
            const content = await fs.readFile(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Page Not Found</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Server Error</h1>');
            }
        }
    });

    server.listen(PORT, () => {
        console.log(`╔════════════════════════════════════════════════════════╗`);
        console.log(`║  🌐 Development server running!                       ║`);
        console.log(`║                                                        ║`);
        console.log(`║  URL: http://localhost:${PORT}                            ║`);
        console.log(`║                                                        ║`);
        console.log(`║  👀 Watching for changes...                           ║`);
        console.log(`╚════════════════════════════════════════════════════════╝\n`);
    });

    // Watch for file changes
    const watcher = chokidar.watch([
        path.join(sitePath, 'content'),
        path.join(sitePath, 'themes')
    ], {
        ignored: /(^|[\/\\])\../, // ignore hidden files
        persistent: true
    });

    watcher.on('change', async (filePath) => {
        console.log(`\n📝 File changed: ${path.relative(sitePath, filePath)}`);
        console.log('🔨 Rebuilding...');
        try {
            await buildSite();
            console.log('✅ Build complete! Refresh your browser.\n');
        } catch (error) {
            console.error(`❌ Build failed: ${error.message}\n`);
        }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n👋 Shutting down gracefully...');
        watcher.close();
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });
}

module.exports = {
    initProject,
    createTheme,
    createPage,
    buildSite,
    serveSite
};
