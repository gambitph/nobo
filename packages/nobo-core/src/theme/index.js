import fs from 'fs-extra';
import path from 'path';

class Theme {
  constructor(contentPath = './content') {
    this.contentPath = contentPath;
    this.themesPath = path.join(contentPath, 'themes');
    this.defaultThemePath = path.join(this.themesPath, 'default');
  }

  // Get the active theme name from config
  async getActiveTheme() {
    try {
      const configPath = path.join(this.contentPath, 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return config.theme || 'default';
      }
      return 'default';
    } catch (error) {
      console.error('Error reading theme config:', error);
      return 'default';
    }
  }

  // Get theme path
  getThemePath(themeName) {
    return path.join(this.themesPath, themeName);
  }

  // Get theme configuration
  async getThemeConfig(themeName) {
    try {
      const themePath = this.getThemePath(themeName);
      const configPath = path.join(themePath, 'theme.json');
      
      if (await fs.pathExists(configPath)) {
        return await fs.readJson(configPath);
      }
      
      return this.getDefaultThemeConfig();
    } catch (error) {
      console.error('Error reading theme config:', error);
      return this.getDefaultThemeConfig();
    }
  }

  getDefaultThemeConfig() {
    return {
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
  }

  // Get theme template
  async getTemplate(themeName, templateName) {
    try {
      const themePath = this.getThemePath(themeName);
      const templatePath = path.join(themePath, 'templates', `${templateName}.html`);
      
      if (await fs.pathExists(templatePath)) {
        return await fs.readFile(templatePath, 'utf8');
      }
      
      return this.getDefaultTemplate(templateName);
    } catch (error) {
      console.error('Error reading template:', error);
      return this.getDefaultTemplate(templateName);
    }
  }

  getDefaultTemplate(templateName) {
    const templates = {
      index: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{site.title}}</title>
    <meta name="description" content="{{site.description}}">
    <link rel="stylesheet" href="/themes/default/style.css">
</head>
<body>
    <header class="site-header">
        <h1 class="site-title">
            <a href="/">{{site.title}}</a>
        </h1>
        <p class="site-description">{{site.description}}</p>
    </header>
    
    <main class="main-content">
        {{content}}
    </main>
    
    <footer class="site-footer">
        <p>&copy; {{year}} {{site.title}}</p>
    </footer>
</body>
</html>`,

      post: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{post.title}} - {{site.title}}</title>
    <meta name="description" content="{{post.excerpt}}">
    <link rel="stylesheet" href="/themes/default/style.css">
</head>
<body>
    <header class="site-header">
        <h1 class="site-title">
            <a href="/">{{site.title}}</a>
        </h1>
        <p class="site-description">{{site.description}}</p>
    </header>
    
    <main class="main-content">
        <article class="post">
            <header class="post-header">
                <h1 class="post-title">{{post.title}}</h1>
                <time class="post-date">{{post.date}}</time>
            </header>
            <div class="post-content">
                {{post.content}}
            </div>
        </article>
    </main>
    
    <footer class="site-footer">
        <p>&copy; {{year}} {{site.title}}</p>
    </footer>
</body>
</html>`
    };

    return templates[templateName] || templates.index;
  }

  // Render template with data
  renderTemplate(template, data) {
    let rendered = template;
    
    // Replace template variables
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'object') {
        Object.keys(value).forEach(subKey => {
          rendered = rendered.replace(
            new RegExp(`{{${key}.${subKey}}}`, 'g'),
            value[subKey] || ''
          );
        });
      } else {
        rendered = rendered.replace(
          new RegExp(`{{${key}}}`, 'g'),
          value || ''
        );
      }
    });

    // Replace special variables
    rendered = rendered.replace(/{{year}}/g, new Date().getFullYear());
    
    return rendered;
  }

  // Initialize default theme
  async initializeDefaultTheme() {
    try {
      await fs.ensureDir(this.defaultThemePath);
      await fs.ensureDir(path.join(this.defaultThemePath, 'templates'));
      await fs.ensureDir(path.join(this.defaultThemePath, 'assets'));

      // Create theme.json
      const themeConfig = this.getDefaultThemeConfig();
      await fs.writeJson(
        path.join(this.defaultThemePath, 'theme.json'),
        themeConfig,
        { spaces: 2 }
      );

      // Create default CSS
      const defaultCSS = this.getDefaultCSS();
      await fs.writeFile(
        path.join(this.defaultThemePath, 'style.css'),
        defaultCSS
      );

      // Create templates
      const templates = ['index', 'post'];
      for (const template of templates) {
        const templateContent = this.getDefaultTemplate(template);
        await fs.writeFile(
          path.join(this.defaultThemePath, 'templates', `${template}.html`),
          templateContent
        );
      }

      return true;
    } catch (error) {
      console.error('Error initializing default theme:', error);
      return false;
    }
  }

  getDefaultCSS() {
    return `/* Default NoBo Theme Styles */

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

/* Header */
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

.site-title a:hover {
    color: #007bff;
}

.site-description {
    color: #666;
    font-size: 1.1rem;
}

/* Main Content */
.main-content {
    min-height: 400px;
    margin-bottom: 2rem;
}

/* Posts */
.post-card {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    background: #fff;
    transition: box-shadow 0.2s;
}

.post-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.post-title {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.post-title a {
    color: #333;
    text-decoration: none;
}

.post-title a:hover {
    color: #007bff;
}

.post-date {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.post-excerpt {
    color: #555;
    line-height: 1.6;
}

/* Post Content */
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

.post-content h1,
.post-content h2,
.post-content h3,
.post-content h4,
.post-content h5,
.post-content h6 {
    margin: 1.5rem 0 1rem 0;
    color: #333;
}

.post-content p {
    margin-bottom: 1rem;
}

.post-content img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
}

.post-content blockquote {
    border-left: 4px solid #007bff;
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: #666;
    font-style: italic;
}

.post-content code {
    background: #f8f9fa;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
}

.post-content pre {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1rem 0;
}

.post-content pre code {
    background: none;
    padding: 0;
}

.post-content ul,
.post-content ol {
    margin: 1rem 0;
    padding-left: 2rem;
}

.post-content li {
    margin-bottom: 0.5rem;
}

/* Footer */
.site-footer {
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    padding: 2rem 0;
    text-align: center;
    color: #666;
}

/* Responsive */
@media (max-width: 768px) {
    .container {
        padding: 0 15px;
    }
    
    .site-title {
        font-size: 2rem;
    }
    
    .post {
        padding: 1.5rem;
    }
}

/* Admin Styles */
.admin-login {
    max-width: 400px;
    margin: 100px auto;
    padding: 2rem;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    background: #fff;
}

.admin-login input {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.admin-login button {
    width: 100%;
    padding: 0.75rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
}

.admin-login button:hover {
    background: #0056b3;
}

.error {
    color: #dc3545;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
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

.btn-danger:hover {
    background: #c82333;
}

.btn-primary {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
}

.btn-primary:hover {
    background: #0056b3;
}

.btn-primary:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

.loading {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.admin-dashboard {
    padding: 2rem;
}

.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
}

.stat {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
}

.stat h3 {
    margin-bottom: 0.5rem;
    color: #666;
}

.stat span {
    font-size: 2rem;
    font-weight: bold;
    color: #007bff;
}

.actions {
    margin: 2rem 0;
}

.post-list {
    padding: 2rem;
}

.post-list .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.post-item {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.post-item h3 {
    margin-bottom: 0.5rem;
}

.post-item p {
    color: #666;
    margin-bottom: 1rem;
}

.post-item .actions {
    margin: 0;
}

.post-editor {
    padding: 2rem;
}

.editor-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
}

.editor-header input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.content-textarea {
    width: 100%;
    min-height: 400px;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 1rem;
}

.editor-actions {
    text-align: right;
}
`;
  }
}

export default Theme;
