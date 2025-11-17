const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');
const chokidar = require('chokidar');
const { parseMarkdown, renderSlides } = require('./renderer');
const chalk = require('chalk');

function startServer(options) {
  const app = express();
  const server = http.createServer(app);
  const io = socketIO(server);

  const port = parseInt(options.port) || 3000;
  const presentationDir = path.resolve(process.cwd(), options.dir);
  const slidesPath = path.join(presentationDir, 'slides', 'presentation.md');
  const templateDir = path.join(presentationDir, 'template');
  const imagesDir = path.join(presentationDir, 'images');

  // Check if presentation exists
  if (!fs.existsSync(slidesPath)) {
    throw new Error(`Presentation file not found: ${slidesPath}\nRun 'ccslides init <project-name>' to create a new presentation.`);
  }

  // Serve static files
  app.use('/images', express.static(imagesDir));
  if (fs.existsSync(templateDir)) {
    app.use('/template', express.static(templateDir));
  }

  // Main route
  app.get('/', (req, res) => {
    try {
      const markdown = fs.readFileSync(slidesPath, 'utf-8');
      const html = renderSlides(markdown, {
        raw: options.raw,
        templateDir: fs.existsSync(templateDir) ? templateDir : null
      });
      res.send(html);
    } catch (error) {
      res.status(500).send(`<h1>Error</h1><pre>${error.message}</pre>`);
    }
  });

  // API endpoint to get current slides
  app.get('/api/slides', (req, res) => {
    try {
      const markdown = fs.readFileSync(slidesPath, 'utf-8');
      const parsed = parseMarkdown(markdown);
      res.json(parsed);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Socket.IO for live reload
  io.on('connection', (socket) => {
    console.log(chalk.gray('Client connected'));

    socket.on('disconnect', () => {
      console.log(chalk.gray('Client disconnected'));
    });
  });

  // Watch for file changes
  const watcher = chokidar.watch([slidesPath, templateDir], {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('change', (filePath) => {
    console.log(chalk.yellow('File changed:'), path.relative(presentationDir, filePath));
    io.emit('reload');
  });

  // Start server
  server.listen(port, () => {
    console.log(chalk.green('✓'), 'Server started');
    console.log(chalk.cyan('  URL:'), `http://localhost:${port}`);
    console.log(chalk.cyan('  Mode:'), options.raw ? 'Raw Markdown' : 'HTML Slides');
    console.log(chalk.cyan('  Watching:'), slidesPath);
    console.log();
    console.log(chalk.gray('  Press Ctrl+C to stop'));
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down...'));
    watcher.close();
    server.close(() => {
      console.log(chalk.green('Server stopped'));
      process.exit(0);
    });
  });
}

module.exports = { startServer };
