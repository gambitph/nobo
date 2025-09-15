#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

console.log('🚀 Building NoBo site for production...');

try {
  // Check if we can use cached build
  console.log('🔍 Checking for content changes...');
  const cacheInfo = await checkContentChanges();
  
  if (cacheInfo.isValid && !process.env.FORCE_REBUILD) {
    console.log('✅ No content changes detected. Using cached build...');
    console.log('💡 Run with FORCE_REBUILD=1 to force a full rebuild');
    
    // Still add security measures to cached build
    const outDir = path.join(process.cwd(), 'out');
    if (await fs.pathExists(outDir)) {
      console.log('🔒 Adding security measures to cached build...');
      await addSecurityMeasures(outDir);
      console.log('🎉 Cached build ready!');
      console.log('📁 Output directory: ./out');
      console.log('🔒 Directory browsing protection enabled');
      process.exit(0);
    }
  }
  
  if (cacheInfo.changes.length > 0) {
    console.log(`📝 Detected changes in: ${cacheInfo.changes.join(', ')}`);
  }
  
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
  
  // Add security measures to prevent directory browsing
  console.log('🔒 Adding security measures...');
  await addSecurityMeasures(outDir);
  
  // Update cache with new content hashes
  console.log('💾 Updating build cache...');
  await updateBuildCache();
  
  console.log('🎉 Public build complete!');
  console.log('📁 Output directory: ./out');
  console.log('🌐 Ready for deployment to static hosting');
  console.log('💡 Admin pages are available in development mode only');
  console.log('🔒 Directory browsing protection enabled');
  
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

async function addSecurityMeasures(outDir) {
  // Create a blank index.html to prevent directory listing
  const blankIndexContent = `<!DOCTYPE html>
<html>
<head>
    <title>Access Denied</title>
    <meta name="robots" content="noindex, nofollow">
</head>
<body>
    <h1>Access Denied</h1>
    <p>Directory listing is not permitted.</p>
</body>
</html>`;

  // Recursively add index.html files to all directories
  await addIndexFilesRecursively(outDir, blankIndexContent);
  
  // Add robots.txt to prevent search engine indexing of sensitive directories
  const robotsContent = `User-agent: *
Disallow: /_next/
Disallow: /admin/
Disallow: /.git/
Disallow: /node_modules/
Disallow: /scripts/

# Allow all other content
Allow: /posts/
Allow: /`;
  
  await fs.writeFile(path.join(outDir, 'robots.txt'), robotsContent);
  console.log('  ✅ Added robots.txt');
  
  // Add .htaccess for Apache servers
  const htaccessContent = `# Prevent directory browsing
Options -Indexes

# Block access to sensitive files and directories
<FilesMatch "\\.(json|js|css|map)$">
    <IfModule mod_headers.c>
        Header set Cache-Control "public, max-age=31536000"
    </IfModule>
</FilesMatch>

# Block access to _next directory (except static assets)
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/_next/(?!static/).*$
RewriteRule ^(.*)$ /404.html [R=404,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>`;
  
  await fs.writeFile(path.join(outDir, '.htaccess'), htaccessContent);
  console.log('  ✅ Added .htaccess for Apache servers');
  
  // Add _headers for Netlify
  const netlifyHeadersContent = `/_next/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/*.html
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable`;
  
  await fs.writeFile(path.join(outDir, '_headers'), netlifyHeadersContent);
  console.log('  ✅ Added _headers for Netlify');
}

async function addIndexFilesRecursively(dir, content) {
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = await fs.stat(itemPath);
    
    if (stat.isDirectory()) {
      // Skip certain directories that should remain accessible
      if (item === 'static' || item === 'css' || item === 'chunks') {
        continue;
      }
      
      const indexPath = path.join(itemPath, 'index.html');
      if (!await fs.pathExists(indexPath)) {
        await fs.writeFile(indexPath, content);
        console.log(`  ✅ Added index.html to ${path.relative(process.cwd(), itemPath)}`);
      }
      
      // Recursively process subdirectories
      await addIndexFilesRecursively(itemPath, content);
    }
  }
}

async function checkContentChanges() {
  const cacheFile = path.join(process.cwd(), '.nobo-cache.json');
  const outDir = path.join(process.cwd(), 'out');
  
  // Try multiple cache strategies
  const cacheStrategies = [
    () => checkLocalCache(cacheFile, outDir),
    () => checkGitBasedCache(outDir),
    () => checkCICache(outDir)
  ];
  
  for (const strategy of cacheStrategies) {
    try {
      const result = await strategy();
      if (result) {
        console.log(`  📋 Using ${result.strategy} cache strategy`);
        return result;
      }
    } catch (error) {
      console.log(`  ⚠️ Cache strategy failed: ${error.message}`);
    }
  }
  
  // If all strategies fail, force rebuild
  return { isValid: false, changes: ['no-cache-available'], strategy: 'none' };
}

async function checkLocalCache(cacheFile, outDir) {
  // If no cache file or output directory exists, skip this strategy
  if (!await fs.pathExists(cacheFile) || !await fs.pathExists(outDir)) {
    return null;
  }
  
  try {
    const cache = await fs.readJson(cacheFile);
    const currentHashes = await getContentHashes();
    
    // Check if any content has changed
    const changes = [];
    
    // Check posts
    for (const [file, hash] of Object.entries(currentHashes.posts)) {
      if (cache.hashes.posts[file] !== hash) {
        changes.push(`post:${file}`);
      }
    }
    
    // Check config
    if (cache.hashes.config !== currentHashes.config) {
      changes.push('config');
    }
    
    // Check themes
    for (const [file, hash] of Object.entries(currentHashes.themes)) {
      if (cache.hashes.themes[file] !== hash) {
        changes.push(`theme:${file}`);
      }
    }
    
    // Check if any files were removed
    for (const file of Object.keys(cache.hashes.posts)) {
      if (!currentHashes.posts[file]) {
        changes.push(`removed-post:${file}`);
      }
    }
    
    return {
      isValid: changes.length === 0,
      changes,
      cache,
      currentHashes,
      strategy: 'local'
    };
  } catch (error) {
    console.log('⚠️ Local cache file corrupted');
    return null;
  }
}

async function checkGitBasedCache(outDir) {
  // Skip if not in a git repository or no output directory
  if (!await fs.pathExists('.git') || !await fs.pathExists(outDir)) {
    return null;
  }
  
  try {
    // Get current git commit hash
    const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    
    // Check if we have a build marker for this commit
    const buildMarker = path.join(outDir, '.build-marker');
    if (await fs.pathExists(buildMarker)) {
      const markerContent = await fs.readFile(buildMarker, 'utf8');
      const markerData = JSON.parse(markerContent);
      
      if (markerData.commit === currentCommit) {
        // Check if content files have changed since this commit
        const contentChanges = await getGitContentChanges(markerData.commit);
        
        return {
          isValid: contentChanges.length === 0,
          changes: contentChanges,
          strategy: 'git',
          commit: currentCommit
        };
      }
    }
    
    return null;
  } catch (error) {
    console.log('⚠️ Git-based cache failed:', error.message);
    return null;
  }
}

async function checkCICache(outDir) {
  // For CI environments, check if we can reuse existing build artifacts
  if (!await fs.pathExists(outDir)) {
    return null;
  }
  
  try {
    // Check if build artifacts are recent (less than 1 hour old)
    const buildTime = await getBuildTime(outDir);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (buildTime && buildTime > oneHourAgo) {
      // Check if any content files have been modified since build
      const contentChanges = await getContentChangesSince(buildTime);
      
      return {
        isValid: contentChanges.length === 0,
        changes: contentChanges,
        strategy: 'ci',
        buildTime
      };
    }
    
    return null;
  } catch (error) {
    console.log('⚠️ CI cache failed:', error.message);
    return null;
  }
}

async function getGitContentChanges(sinceCommit) {
  try {
    const changes = [];
    const contentDir = 'content/';
    
    // Get list of changed files since the commit
    const gitOutput = execSync(`git diff --name-only ${sinceCommit} HEAD -- ${contentDir}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (gitOutput.trim()) {
      const changedFiles = gitOutput.trim().split('\n');
      for (const file of changedFiles) {
        if (file.startsWith(contentDir)) {
          changes.push(`git:${file}`);
        }
      }
    }
    
    return changes;
  } catch (error) {
    return ['git-check-failed'];
  }
}

async function getContentChangesSince(sinceTime) {
  try {
    const changes = [];
    const contentDir = path.join(process.cwd(), 'content');
    
    if (!await fs.pathExists(contentDir)) {
      return ['no-content-dir'];
    }
    
    // Recursively check all files in content directory
    await checkDirectoryModifications(contentDir, sinceTime, changes, '');
    
    return changes;
  } catch (error) {
    return ['content-check-failed'];
  }
}

async function checkDirectoryModifications(dir, sinceTime, changes, prefix) {
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = await fs.stat(itemPath);
    
    if (stat.isDirectory()) {
      await checkDirectoryModifications(itemPath, sinceTime, changes, `${prefix}${item}/`);
    } else {
      if (stat.mtime > sinceTime) {
        changes.push(`modified:${prefix}${item}`);
      }
    }
  }
}

async function getBuildTime(outDir) {
  try {
    const indexPath = path.join(outDir, 'index.html');
    if (await fs.pathExists(indexPath)) {
      const stat = await fs.stat(indexPath);
      return stat.mtime;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function getContentHashes() {
  const hashes = {
    posts: {},
    config: null,
    themes: {}
  };
  
  try {
    // Hash all post files
    const postsDir = path.join(process.cwd(), 'content', 'posts');
    if (await fs.pathExists(postsDir)) {
      const postFiles = await fs.readdir(postsDir);
      for (const file of postFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(postsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          hashes.posts[file] = crypto.createHash('md5').update(content).digest('hex');
        }
      }
    }
    
    // Hash config file
    const configPath = path.join(process.cwd(), 'content', 'config.json');
    if (await fs.pathExists(configPath)) {
      const configContent = await fs.readFile(configPath, 'utf8');
      hashes.config = crypto.createHash('md5').update(configContent).digest('hex');
    }
    
    // Hash theme files
    const themesDir = path.join(process.cwd(), 'content', 'themes');
    if (await fs.pathExists(themesDir)) {
      await hashDirectory(themesDir, hashes.themes);
    }
    
    return hashes;
  } catch (error) {
    console.error('Error calculating content hashes:', error);
    return hashes;
  }
}

async function hashDirectory(dir, hashes, prefix = '') {
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = await fs.stat(itemPath);
    
    if (stat.isDirectory()) {
      await hashDirectory(itemPath, hashes, `${prefix}${item}/`);
    } else {
      const content = await fs.readFile(itemPath, 'utf8');
      const hash = crypto.createHash('md5').update(content).digest('hex');
      hashes[`${prefix}${item}`] = hash;
    }
  }
}

async function updateBuildCache() {
  const cacheFile = path.join(process.cwd(), '.nobo-cache.json');
  const outDir = path.join(process.cwd(), 'out');
  const currentHashes = await getContentHashes();
  
  // Update local cache file
  const cache = {
    lastBuild: new Date().toISOString(),
    hashes: currentHashes,
    version: '1.0.0'
  };
  
  await fs.writeJson(cacheFile, cache, { spaces: 2 });
  console.log('  ✅ Local build cache updated');
  
  // Create git-based build marker if in a git repository
  try {
    if (await fs.pathExists('.git')) {
      const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const buildMarker = {
        commit: currentCommit,
        buildTime: new Date().toISOString(),
        hashes: currentHashes
      };
      
      await fs.writeJson(path.join(outDir, '.build-marker'), buildMarker, { spaces: 2 });
      console.log('  ✅ Git build marker created');
    }
  } catch (error) {
    console.log('  ⚠️ Could not create git build marker:', error.message);
  }
}