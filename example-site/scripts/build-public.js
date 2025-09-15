#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Building NoBo site for production...');

try {
  // Temporarily move admin pages out of the way
  console.log('📁 Moving admin pages temporarily...');
  const adminDir = path.join(process.cwd(), 'pages', 'admin');
  const tempAdminDir = path.join(process.cwd(), 'temp-admin');
  
  if (await fs.pathExists(adminDir)) {
    await fs.move(adminDir, tempAdminDir);
    console.log('✅ Moved admin pages to temp directory');
  }
  
  // Run the Next.js build
  console.log('📦 Building with Next.js...');
  execSync('next build', { stdio: 'inherit' });
  
  // Move admin pages back
  console.log('📁 Restoring admin pages...');
  if (await fs.pathExists(tempAdminDir)) {
    await fs.move(tempAdminDir, adminDir);
    console.log('✅ Restored admin pages');
  }
  
  // Remove admin pages from the output (just in case)
  console.log('🧹 Cleaning up output directory...');
  const outDir = path.join(process.cwd(), 'out');
  
  if (await fs.pathExists(path.join(outDir, 'admin'))) {
    await fs.remove(path.join(outDir, 'admin'));
    console.log('✅ Removed /admin directory from output');
  }
  
  console.log('🎉 Public build complete!');
  console.log('📁 Output directory: ./out');
  console.log('🌐 Ready for deployment to static hosting');
  console.log('💡 Admin pages are available in development mode only');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Make sure to restore admin pages even if build fails
  const adminDir = path.join(process.cwd(), 'pages', 'admin');
  const tempAdminDir = path.join(process.cwd(), 'temp-admin');
  
  if (await fs.pathExists(tempAdminDir)) {
    await fs.move(tempAdminDir, adminDir);
    console.log('✅ Restored admin pages after error');
  }
  
  process.exit(1);
}