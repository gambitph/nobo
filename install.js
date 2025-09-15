#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function install() {
  console.log('🚀 Installing NoBo...');
  
  try {
    // Install dependencies for the main package
    console.log('📦 Installing main dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Install dependencies for nobo-core
    console.log('📦 Installing nobo-core dependencies...');
    process.chdir('packages/nobo-core');
    execSync('npm install', { stdio: 'inherit' });
    
    // Build nobo-core
    console.log('🔨 Building nobo-core...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Go back to root
    process.chdir('../..');
    
    // Install dependencies for example site
    console.log('📦 Installing example site dependencies...');
    process.chdir('example-site');
    execSync('npm install', { stdio: 'inherit' });
    
    // Go back to root
    process.chdir('..');
    
    console.log('✅ Installation complete!');
    console.log('\n🎉 NoBo is ready to use!');
    console.log('\nNext steps:');
    console.log('  npm run dev          # Start the example site');
    console.log('  npm run build        # Build the example site');
    console.log('  node bin/nobo.js --help  # See CLI options');
    
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  }
}

install();
