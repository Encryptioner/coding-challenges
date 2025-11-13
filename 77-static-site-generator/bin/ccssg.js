#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { initProject, createTheme, createPage, buildSite, serveSite } = require('../lib/generator');

// Parse command line arguments
const args = process.argv.slice(2);

// Display help
function showHelp() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   CCSSG - Coding Challenges Static Site Generator         ║
╚════════════════════════════════════════════════════════════╝

Usage:
  ccssg <site-name>              Initialize a new site
  ccssg new theme <theme-name>   Create a new theme
  ccssg new page <page-name>     Create a new page
  ccssg build                    Build the static site
  ccssg serve                    Start development server with live reload
  ccssg help                     Show this help message

Examples:
  ccssg mysite                   # Create new site called 'mysite'
  ccssg new theme mytheme        # Create theme 'mytheme'
  ccssg new page about           # Create 'about.md' page
  ccssg build                    # Build site to public/ directory
  ccssg serve                    # Start dev server on http://localhost:8000

More info: https://github.com/codingchallenges/ccssg
    `);
}

// Main CLI logic
async function main() {
    if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        return;
    }

    const command = args[0];

    try {
        // Initialize new site
        if (command && !['new', 'build', 'serve', 'help'].includes(command)) {
            const siteName = command;
            console.log(`🚀 Initializing new site: ${siteName}`);
            await initProject(siteName);
            console.log(`✅ Site created successfully!`);
            console.log(`\nNext steps:`);
            console.log(`  cd ${siteName}`);
            console.log(`  ccssg new theme mytheme`);
            console.log(`  ccssg new page about`);
            console.log(`  ccssg build`);
            console.log(`  ccssg serve`);
            return;
        }

        // Handle subcommands
        if (command === 'new') {
            const subcommand = args[1];
            const name = args[2];

            if (!subcommand || !name) {
                console.error('❌ Error: Missing arguments');
                console.log('Usage: ccssg new <theme|page> <name>');
                process.exit(1);
            }

            if (subcommand === 'theme') {
                console.log(`🎨 Creating theme: ${name}`);
                await createTheme(name);
                console.log(`✅ Theme created successfully at themes/${name}/`);
            } else if (subcommand === 'page') {
                console.log(`📝 Creating page: ${name}`);
                await createPage(name);
                console.log(`✅ Page created successfully at content/${name}.md`);
            } else {
                console.error(`❌ Error: Unknown subcommand '${subcommand}'`);
                console.log('Valid subcommands: theme, page');
                process.exit(1);
            }
        } else if (command === 'build') {
            console.log('🔨 Building static site...');
            const stats = await buildSite();
            console.log(`✅ Build complete!`);
            console.log(`   Generated ${stats.pages} page(s) in public/`);
        } else if (command === 'serve') {
            console.log('🌐 Starting development server...');
            await serveSite();
        } else {
            console.error(`❌ Error: Unknown command '${command}'`);
            showHelp();
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
