#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name('update-site')
  .description('Update an existing NoBo site with latest core files')
  .version('1.0.0');

program
  .command('update [directory]')
  .description('Update NoBo site in the specified directory (default: current directory)')
  .option('-f, --force', 'Force update even if there are conflicts')
  .option('--dry-run', 'Show what would be updated without making changes')
  .action(async (directory = '.', options) => {
    const siteDir = path.resolve(directory);
    
    console.log(`🔄 Updating NoBo site in: ${siteDir}`);
    
    try {
      await updateSite(siteDir, options);
      console.log(`\n✅ Site updated successfully!`);
      console.log(`\nNext steps:`);
      console.log(`  npm install  # Install any new dependencies`);
      console.log(`  npm run dev  # Test the updated site`);
    } catch (error) {
      console.error('❌ Update failed:', error.message);
      process.exit(1);
    }
  });

program.parse();

async function updateSite(siteDir, options) {
  // Check if this is a NoBo site
  const packageJsonPath = path.join(siteDir, 'package.json');
  if (!await fs.pathExists(packageJsonPath)) {
    throw new Error('No package.json found. This doesn\'t appear to be a NoBo site.');
  }

  const packageJson = await fs.readJson(packageJsonPath);
  if (!packageJson.dependencies || !packageJson.dependencies.next) {
    throw new Error('This doesn\'t appear to be a NoBo site (missing Next.js dependency).');
  }

  console.log('📋 Files to update:');
  
  // Files to update (excluding content/)
  const filesToUpdate = [
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
    'scripts/build-public.js'
  ];

  const exampleDir = path.join(__dirname, '..', 'example-site');
  const updates = [];

  for (const file of filesToUpdate) {
    const srcPath = path.join(exampleDir, file);
    const destPath = path.join(siteDir, file);
    
    if (await fs.pathExists(srcPath)) {
      const srcContent = await fs.readFile(srcPath, 'utf8');
      let destContent = '';
      
      if (await fs.pathExists(destPath)) {
        destContent = await fs.readFile(destPath, 'utf8');
      }
      
      if (srcContent !== destContent) {
        updates.push({
          file,
          action: await fs.pathExists(destPath) ? 'update' : 'create',
          size: srcContent.length
        });
      }
    }
  }

  if (updates.length === 0) {
    console.log('✅ Site is already up to date!');
    return;
  }

  // Show what will be updated
  updates.forEach(update => {
    console.log(`  ${update.action === 'create' ? '➕' : '🔄'} ${update.file} (${update.size} bytes)`);
  });

  if (options.dryRun) {
    console.log('\n🔍 Dry run complete. No files were modified.');
    return;
  }

  // Confirm update
  if (!options.force) {
    console.log(`\n⚠️  This will update ${updates.length} files.`);
    console.log('💡 Use --force to skip this confirmation.');
    console.log('💡 Use --dry-run to see what would be updated.');
    return;
  }

  console.log('\n📝 Updating files...');

  // Create necessary directories
  await fs.ensureDir(path.join(siteDir, 'scripts'));
  await fs.ensureDir(path.join(siteDir, 'styles'));
  await fs.ensureDir(path.join(siteDir, 'pages', 'admin', 'posts'));
  await fs.ensureDir(path.join(siteDir, 'pages', 'posts'));

  // Update files
  for (const update of updates) {
    const srcPath = path.join(exampleDir, update.file);
    const destPath = path.join(siteDir, update.file);
    
    await fs.ensureDir(path.dirname(destPath));
    await fs.writeFile(destPath, await fs.readFile(srcPath, 'utf8'));
    console.log(`  ✅ ${update.action === 'create' ? 'Created' : 'Updated'} ${update.file}`);
  }

  // Update package.json scripts if needed
  await updatePackageScripts(siteDir);
  
  // Ensure required dependencies are present
  await ensureDependencies(siteDir);
  
  // Clean up old CommonJS config files
  await cleanupOldConfigFiles(siteDir);

  console.log('\n🎉 Update complete!');
  console.log('\n📋 Summary:');
  console.log(`  • Updated ${updates.length} files`);
  console.log(`  • Preserved all content in content/ folder`);
  console.log(`  • Updated build process and core functionality`);
}

async function updatePackageScripts(siteDir) {
  const packageJsonPath = path.join(siteDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  const newScripts = {
    dev: 'next dev',
    build: 'node scripts/build-public.js',
    'build:dev': 'next build',
    'build:public': 'node scripts/build-public.js',
    start: 'next start',
    export: 'npm run build:public'
  };

  let updated = false;
  for (const [script, command] of Object.entries(newScripts)) {
    if (packageJson.scripts[script] !== command) {
      packageJson.scripts[script] = command;
      updated = true;
    }
  }

  if (updated) {
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    console.log('  ✅ Updated package.json scripts');
  }
}

async function ensureDependencies(siteDir) {
  const packageJsonPath = path.join(siteDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  const requiredDeps = {
    'fs-extra': '^11.3.1'
  };
  
  let updated = false;
  for (const [dep, version] of Object.entries(requiredDeps)) {
    if (!packageJson.dependencies[dep]) {
      packageJson.dependencies[dep] = version;
      updated = true;
      console.log(`  ➕ Added missing dependency: ${dep}@${version}`);
    }
  }
  
  if (updated) {
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    console.log('  📦 Updated package.json dependencies');
    console.log('  💡 Run "npm install" to install new dependencies');
  }
}

async function cleanupOldConfigFiles(siteDir) {
  // Remove old CommonJS config files that conflict with ES modules
  const oldConfigFile = path.join(siteDir, 'next.config.cjs');
  
  if (await fs.pathExists(oldConfigFile)) {
    await fs.remove(oldConfigFile);
    console.log('  🧹 Removed old next.config.cjs (conflicted with ES modules)');
  }
  
  // Remove middleware.js as it conflicts with static export
  const middlewareFile = path.join(siteDir, 'middleware.js');
  
  if (await fs.pathExists(middlewareFile)) {
    await fs.remove(middlewareFile);
    console.log('  🧹 Removed middleware.js (conflicts with static export)');
  }
}
