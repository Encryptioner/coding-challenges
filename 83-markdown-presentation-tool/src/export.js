const puppeteer = require('puppeteer');
const { startServer } = require('./server');
const chalk = require('chalk');

async function exportToPDF(options) {
  const outputPath = options.output;
  const port = parseInt(options.port) || 3001;

  console.log(chalk.cyan('Starting temporary server...'));

  // Start a temporary server
  const serverOptions = {
    port: port.toString(),
    dir: options.dir,
    raw: false
  };

  // We need to start server in a way that we can shut it down
  const express = require('express');
  const path = require('path');
  const fs = require('fs');
  const http = require('http');
  const { renderSlides } = require('./renderer');

  const app = express();
  const server = http.createServer(app);

  const presentationDir = path.resolve(process.cwd(), options.dir);
  const slidesPath = path.join(presentationDir, 'slides', 'presentation.md');
  const templateDir = path.join(presentationDir, 'template');
  const imagesDir = path.join(presentationDir, 'images');

  if (!fs.existsSync(slidesPath)) {
    throw new Error(`Presentation file not found: ${slidesPath}`);
  }

  app.use('/images', express.static(imagesDir));
  if (fs.existsSync(templateDir)) {
    app.use('/template', express.static(templateDir));
  }

  app.get('/', (req, res) => {
    try {
      const markdown = fs.readFileSync(slidesPath, 'utf-8');
      const html = renderSlides(markdown, {
        raw: false,
        templateDir: fs.existsSync(templateDir) ? templateDir : null
      });
      res.send(html);
    } catch (error) {
      res.status(500).send(`<h1>Error</h1><pre>${error.message}</pre>`);
    }
  });

  await new Promise((resolve) => {
    server.listen(port, () => {
      console.log(chalk.gray(`  Server running on port ${port}`));
      resolve();
    });
  });

  try {
    console.log(chalk.cyan('Launching browser...'));

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(chalk.cyan('Loading presentation...'));
    await page.goto(`http://localhost:${port}`, {
      waitUntil: 'networkidle0'
    });

    console.log(chalk.cyan('Generating PDF...'));

    await page.pdf({
      path: outputPath,
      width: '1920px',
      height: '1080px',
      printBackground: true,
      preferCSSPageSize: false
    });

    await browser.close();

    console.log(chalk.green('✓'), `PDF generated: ${outputPath}`);

  } finally {
    // Clean up server
    server.close();
  }
}

module.exports = { exportToPDF };
