#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name('nobo')
  .description('NoBo - A Next.js static site platform')
  .version('1.0.0');

program
  .command('create-site <name>')
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

program
  .command('update [directory]')
  .description('Update an existing NoBo site with latest core files')
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

program
  .command('init')
  .description('Initialize NoBo in the current directory')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'siteName',
        message: 'Site name:',
        default: 'My NoBo Site'
      },
      {
        type: 'input',
        name: 'siteDescription',
        message: 'Site description:',
        default: 'A site built with NoBo'
      },
      {
        type: 'input',
        name: 'siteUrl',
        message: 'Site URL:',
        default: 'http://localhost:3000'
      }
    ]);

    try {
      await initSite(answers);
      console.log(`\n✅ NoBo initialized successfully!`);
      console.log(`\nNext steps:`);
      console.log(`  npm install`);
      console.log(`  npm run dev`);
    } catch (error) {
      console.error('Error initializing site:', error.message);
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
    'next.config.cjs',
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
    build: 'next build',
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

async function initSite(answers) {
  const currentDir = process.cwd();
  
  // Check if already initialized
  if (await fs.pathExists(path.join(currentDir, 'package.json'))) {
    const packageJson = await fs.readJson(path.join(currentDir, 'package.json'));
    if (packageJson.dependencies && packageJson.dependencies['nobo-core']) {
      console.log('NoBo is already initialized in this directory');
      return;
    }
  }

  // Create content directory structure
  await fs.ensureDir(path.join(currentDir, 'content'));
  await fs.ensureDir(path.join(currentDir, 'content', 'posts'));
  await fs.ensureDir(path.join(currentDir, 'content', 'uploads'));
  await fs.ensureDir(path.join(currentDir, 'content', 'themes'));
  await fs.ensureDir(path.join(currentDir, 'content', 'plugins'));

  // Create package.json if it doesn't exist
  const packageJsonPath = path.join(currentDir, 'package.json');
  let packageJson = {};
  
  if (await fs.pathExists(packageJsonPath)) {
    packageJson = await fs.readJson(packageJsonPath);
  }

  packageJson = {
    ...packageJson,
    name: packageJson.name || 'my-nobo-site',
    version: packageJson.version || '1.0.0',
    description: packageJson.description || answers.siteDescription,
    private: true,
    type: 'module',
    scripts: {
      ...packageJson.scripts,
      dev: 'next dev',
      build: 'next build',
      'build:public': 'node scripts/build-public.js',
      start: 'next start',
      export: 'npm run build:public'
    },
    dependencies: {
      ...packageJson.dependencies,
      next: '^14.0.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'nobo-core': 'file:../packages/nobo-core'
    }
  };

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Create next.config.cjs
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false
      };
    }
    return config;
  }
}

export default nextConfig
`;

  await fs.writeFile(path.join(currentDir, 'next.config.js'), nextConfig);

  // Create config.json
  const config = {
    site: {
      title: answers.siteName,
      description: answers.siteDescription,
      url: answers.siteUrl,
      language: 'en',
      timezone: 'UTC'
    },
    theme: 'default',
    plugins: [],
    admin: {
      username: 'admin',
      password: generatePassword()
    },
    build: {
      outputDir: 'out',
      trailingSlash: false,
      generateSitemap: true,
      generateRSS: true
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image'
    }
  };

  await fs.writeJson(path.join(currentDir, 'content', 'config.json'), config, { spaces: 2 });

  // Create example post
  const examplePost = {
    title: 'Welcome to NoBo',
    date: new Date().toISOString().split('T')[0],
    slug: 'welcome-to-nobo',
    content: '<!-- wp:heading --><h2>Welcome to NoBo!</h2><!-- /wp:heading --><!-- wp:paragraph --><p>This is your first post. You can edit it in the admin panel or by editing the JSON file directly.</p><!-- /wp:paragraph -->'
  };

  await fs.writeJson(path.join(currentDir, 'content', 'posts', 'welcome-to-nobo.json'), examplePost, { spaces: 2 });

  // Copy theme files
  await copyThemeFiles(currentDir);
  
  // Copy page files
  await copyPageFiles(currentDir);
}

async function copyExampleFiles(exampleDir, siteDir, siteName) {
  const filesToCopy = [
    'package.json',
    'next.config.cjs',
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
    'content/themes/default/style.css',
    'scripts/build-public.js'
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

async function copyThemeFiles(siteDir) {
  const themeDir = path.join(siteDir, 'content', 'themes', 'default');
  await fs.ensureDir(themeDir);
  await fs.ensureDir(path.join(themeDir, 'templates'));

  // Create theme.json
  const themeConfig = {
    name: 'Default Theme',
    version: '1.0.0',
    description: 'A simple default theme for NoBo',
    author: 'NoBo Team',
    styles: ['style.css'],
    templates: {
      index: 'index.html',
      post: 'post.html',
      page: 'page.html'
    }
  };

  await fs.writeJson(path.join(themeDir, 'theme.json'), themeConfig, { spaces: 2 });

  // Create style.css (simplified version)
  const styleCss = `/* Default NoBo Theme Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #fff;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
}

.site-header {
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    padding: 2rem 0;
    margin-bottom: 2rem;
}

.site-title {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.site-title a {
    color: #333;
    text-decoration: none;
}

.site-description {
    color: #666;
    font-size: 1.1rem;
}

.main-content {
    min-height: 400px;
    margin-bottom: 2rem;
}

.post-card {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    background: #fff;
}

.post-title {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.post-title a {
    color: #333;
    text-decoration: none;
}

.post-date {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.post {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;
}

.post-content {
    line-height: 1.8;
}

.site-footer {
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    padding: 2rem 0;
    text-align: center;
    color: #666;
}

/* Admin styles */
.admin-dashboard, .post-list, .post-editor {
    padding: 2rem;
}

.btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
}

.btn:hover {
    background: #0056b3;
}

.btn-danger {
    background: #dc3545;
}

.btn-primary {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
}

.loading {
    text-align: center;
    padding: 2rem;
    color: #666;
}
`;

  await fs.writeFile(path.join(themeDir, 'style.css'), styleCss);
}

async function copyPageFiles(siteDir) {
  const pagesDir = path.join(siteDir, 'pages');
  await fs.ensureDir(pagesDir);
  await fs.ensureDir(path.join(pagesDir, 'admin'));
  await fs.ensureDir(path.join(pagesDir, 'admin', 'posts'));
  await fs.ensureDir(path.join(pagesDir, 'posts'));
  await fs.ensureDir(path.join(siteDir, 'styles'));

  // Copy basic page files (simplified versions)
  const pageFiles = {
    '_app.js': `import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}`,
    'index.js': `export default function Home({ posts, config }) {

  return (
    <div className="container">
      <header className="site-header">
        <h1 className="site-title">
          <a href="/">{config?.site?.title || 'My NoBo Site'}</a>
        </h1>
        <p className="site-description">
          {config?.site?.description || 'A site built with NoBo'}
        </p>
      </header>

      <main className="main-content">
        <h2>Latest Posts</h2>
        {posts.length === 0 ? (
          <p>No posts yet. <a href="/admin">Create your first post</a>!</p>
        ) : (
          <div className="posts">
            {posts.map((post) => (
              <article key={post.slug} className="post-card">
                <h2 className="post-title">
                  <a href={\`/posts/\${post.slug}\`}>{post.title}</a>
                </h2>
                <time className="post-date">{post.date}</time>
                <div 
                  className="post-excerpt"
                  dangerouslySetInnerHTML={{ 
                    __html: getExcerpt(post.content) 
                  }}
                />
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <p>&copy; {new Date().getFullYear()} {config?.site?.title || 'My NoBo Site'}</p>
      </footer>
    </div>
  );
}

function getExcerpt(content, length = 150) {
  if (!content) return '';
  
  const cleanContent = content.replace(/<!-- wp:[\\w\\s]+ -->/g, '').replace(/<!-- \\/wp:[\\w\\s]+ -->/g, '');
  const textContent = cleanContent.replace(/<[^>]*>/g, '');
  
  if (textContent.length <= length) {
    return textContent;
  }
  
  return textContent.substring(0, length).trim() + '...';
}

export async function getStaticProps() {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    // Read posts
    const postsDir = path.default.join(process.cwd(), 'content', 'posts');
    const postFiles = fs.default.readdirSync(postsDir).filter(file => file.endsWith('.json'));
    const posts = postFiles.map(file => {
      const postPath = path.default.join(postsDir, file);
      return JSON.parse(fs.default.readFileSync(postPath, 'utf8'));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Read config
    const configPath = path.default.join(process.cwd(), 'content', 'config.json');
    const config = JSON.parse(fs.default.readFileSync(configPath, 'utf8'));

    return {
      props: {
        posts,
        config
      }
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        posts: [],
        config: {
          site: {
            title: 'My NoBo Site',
            description: 'A site built with NoBo'
          }
        }
      }
    };
  }
}`,
    'admin/index.js': `export default function AdminDashboard({ posts, config }) {

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="stats">
        <div className="stat">
          <h3>Total Posts</h3>
          <span>{posts?.length || 0}</span>
        </div>
        <div className="stat">
          <h3>Active Theme</h3>
          <span>{config?.theme || 'default'}</span>
        </div>
      </div>

      <div className="actions">
        <a href="/admin/posts" className="btn">Manage Posts</a>
        <a href="/admin/posts/new" className="btn">New Post</a>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    // Read posts
    const postsDir = path.default.join(process.cwd(), 'content', 'posts');
    const postFiles = fs.default.readdirSync(postsDir).filter(file => file.endsWith('.json'));
    const posts = postFiles.map(file => {
      const postPath = path.default.join(postsDir, file);
      return JSON.parse(fs.default.readFileSync(postPath, 'utf8'));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Read config
    const configPath = path.default.join(process.cwd(), 'content', 'config.json');
    const config = JSON.parse(fs.default.readFileSync(configPath, 'utf8'));

    return {
      props: {
        posts,
        config
      }
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        posts: [],
        config: {
          site: {
            title: 'My NoBo Site',
            description: 'A site built with NoBo'
          }
        }
      }
    };
  }
}`
  };

  for (const [file, content] of Object.entries(pageFiles)) {
    await fs.writeFile(path.join(pagesDir, file), content);
  }

  // Create styles/globals.css
  const globalsCss = `@import url('../content/themes/default/style.css');

html, body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}

a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
`;

  await fs.writeFile(path.join(siteDir, 'styles', 'globals.css'), globalsCss);
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}