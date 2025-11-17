#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { initProject } = require('../src/init');
const { startServer } = require('../src/server');
const { exportToPDF } = require('../src/export');
const chalk = require('chalk');

const program = new Command();

program
  .name('ccslides')
  .description('Create and present Markdown-based presentations')
  .version('1.0.0');

program
  .command('init <project-name>')
  .description('Create a new presentation project')
  .option('-g, --no-git', 'Skip git initialization')
  .action((projectName, options) => {
    try {
      initProject(projectName, options);
      console.log(chalk.green('✓'), `Project "${projectName}" created successfully!`);
      console.log('\nNext steps:');
      console.log(chalk.cyan(`  cd ${projectName}`));
      console.log(chalk.cyan('  ccslides serve'));
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start the presentation server with live reload')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-d, --dir <directory>', 'Presentation directory', '.')
  .option('--raw', 'Render raw markdown (Step 2 mode)', false)
  .action((options) => {
    try {
      startServer(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export presentation to PDF')
  .option('-o, --output <file>', 'Output PDF file', 'presentation.pdf')
  .option('-d, --dir <directory>', 'Presentation directory', '.')
  .option('-p, --port <port>', 'Temporary server port', '3001')
  .action(async (options) => {
    try {
      await exportToPDF(options);
      console.log(chalk.green('✓'), `Presentation exported to ${options.output}`);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
