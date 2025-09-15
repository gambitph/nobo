import fs from 'fs-extra';
import path from 'path';

class Config {
  constructor(contentPath = './content') {
    this.contentPath = contentPath;
    this.configPath = path.join(contentPath, 'config.json');
  }

  // Get configuration
  async get() {
    try {
      if (await fs.pathExists(this.configPath)) {
        return await fs.readJson(this.configPath);
      }
      return this.getDefault();
    } catch (error) {
      console.error('Error reading config:', error);
      return this.getDefault();
    }
  }

  // Save configuration
  async save(config) {
    try {
      await fs.ensureDir(this.contentPath);
      await fs.writeJson(this.configPath, config, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  // Get default configuration
  getDefault() {
    return {
      site: {
        title: 'My NoBo Site',
        description: 'A site built with NoBo',
        url: 'http://localhost:3000',
        language: 'en',
        timezone: 'UTC'
      },
      theme: 'default',
      plugins: [],
      admin: {
        username: 'admin',
        password: this.generatePassword()
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
  }

  // Generate a random password
  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Update specific configuration section
  async update(section, data) {
    try {
      const config = await this.get();
      config[section] = { ...config[section], ...data };
      return await this.save(config);
    } catch (error) {
      console.error(`Error updating config section ${section}:`, error);
      return false;
    }
  }

  // Get site configuration
  async getSite() {
    const config = await this.get();
    return config.site || this.getDefault().site;
  }

  // Update site configuration
  async updateSite(siteData) {
    return await this.update('site', siteData);
  }

  // Get theme configuration
  async getTheme() {
    const config = await this.get();
    return config.theme || 'default';
  }

  // Update theme
  async setTheme(themeName) {
    return await this.update('theme', themeName);
  }

  // Get plugins configuration
  async getPlugins() {
    const config = await this.get();
    return config.plugins || [];
  }

  // Update plugins
  async setPlugins(plugins) {
    return await this.update('plugins', plugins);
  }

  // Get admin configuration
  async getAdmin() {
    const config = await this.get();
    return config.admin || this.getDefault().admin;
  }

  // Update admin configuration
  async updateAdmin(adminData) {
    return await this.update('admin', adminData);
  }

  // Get build configuration
  async getBuild() {
    const config = await this.get();
    return config.build || this.getDefault().build;
  }

  // Update build configuration
  async updateBuild(buildData) {
    return await this.update('build', buildData);
  }

  // Get SEO configuration
  async getSEO() {
    const config = await this.get();
    return config.seo || this.getDefault().seo;
  }

  // Update SEO configuration
  async updateSEO(seoData) {
    return await this.update('seo', seoData);
  }

  // Validate configuration
  validate(config) {
    const errors = [];

    // Validate required fields
    if (!config.site || !config.site.title) {
      errors.push('Site title is required');
    }

    if (!config.site || !config.site.url) {
      errors.push('Site URL is required');
    }

    // Validate URL format
    if (config.site && config.site.url) {
      try {
        new URL(config.site.url);
      } catch (e) {
        errors.push('Site URL must be a valid URL');
      }
    }

    // Validate theme
    if (!config.theme) {
      errors.push('Theme is required');
    }

    // Validate admin credentials
    if (!config.admin || !config.admin.username || !config.admin.password) {
      errors.push('Admin credentials are required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Initialize configuration file
  async initialize() {
    try {
      const config = this.getDefault();
      await this.save(config);
      return true;
    } catch (error) {
      console.error('Error initializing config:', error);
      return false;
    }
  }

  // Reset to default configuration
  async reset() {
    try {
      const defaultConfig = this.getDefault();
      return await this.save(defaultConfig);
    } catch (error) {
      console.error('Error resetting config:', error);
      return false;
    }
  }
}

export default Config;
