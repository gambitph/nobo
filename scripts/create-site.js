#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name('create-site')
  .description('Create a new NoBo site')
  .version('1.0.0');

program
  .command('create <name>')
  .description('Create a new NoBo site')
  .option('-d, --directory <dir>', 'Directory to create the site in', '.')
  .action(async (name, options) => {
    const siteDir = path.join(options.directory, name);
    
    console.log(`Creating NoBo site: ${name}`);
    console.log(`Directory: ${siteDir}`);
    
    try {
      await createSite(siteDir, name);
      console.log(`\n✅ Site created successfully!`);
      console.log(`\nNext steps:`);
      console.log(`  cd ${name}`);
      console.log(`  npm install`);
      console.log(`  npm run dev`);
      console.log(`\nVisit http://localhost:3000 to see your site`);
      console.log(`Visit http://localhost:3000/admin to access the admin panel`);
    } catch (error) {
      console.error('Error creating site:', error.message);
      process.exit(1);
    }
  });

program.parse();

async function createSite(siteDir, siteName) {
  // Create directory structure
  await fs.ensureDir(siteDir);
  await fs.ensureDir(path.join(siteDir, 'content'));
  await fs.ensureDir(path.join(siteDir, 'content', 'posts'));
  await fs.ensureDir(path.join(siteDir, 'content', 'uploads'));
  await fs.ensureDir(path.join(siteDir, 'content', 'themes'));
  await fs.ensureDir(path.join(siteDir, 'content', 'plugins'));
  await fs.ensureDir(path.join(siteDir, 'pages'));
  await fs.ensureDir(path.join(siteDir, 'pages', 'admin'));
  await fs.ensureDir(path.join(siteDir, 'pages', 'admin', 'posts'));
  await fs.ensureDir(path.join(siteDir, 'pages', 'posts'));
  await fs.ensureDir(path.join(siteDir, 'styles'));

  // Copy example site files
  const exampleDir = path.join(__dirname, '..', 'example-site');
  await copyExampleFiles(exampleDir, siteDir, siteName);
}

async function copyExampleFiles(exampleDir, siteDir, siteName) {
  const filesToCopy = [
    'package.json',
    'next.config.js',
    'pages/_app.js',
    'pages/index.js',
    'pages/posts/[slug].js',
    'pages/admin/index.js',
    'pages/admin/posts/index.js',
    'pages/admin/posts/new.js',
    'pages/admin/posts/[slug].js',
    'styles/globals.css',
    'content/config.json',
    'content/posts/hello-world.json',
    'content/posts/getting-started.json',
    'content/themes/default/theme.json',
    'content/themes/default/style.css'
  ];

  for (const file of filesToCopy) {
    const srcPath = path.join(exampleDir, file);
    const destPath = path.join(siteDir, file);
    
    if (await fs.pathExists(srcPath)) {
      await fs.ensureDir(path.dirname(destPath));
      let content = await fs.readFile(srcPath, 'utf8');
      
      // Replace site name in config
      if (file === 'content/config.json') {
        const config = JSON.parse(content);
        config.site.title = siteName;
        content = JSON.stringify(config, null, 2);
      }
      
      await fs.writeFile(destPath, content);
    }
  }
}