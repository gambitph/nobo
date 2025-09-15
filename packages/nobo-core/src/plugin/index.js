import fs from 'fs-extra';
import path from 'path';

class Plugin {
  constructor(contentPath = './content') {
    this.contentPath = contentPath;
    this.pluginsPath = path.join(contentPath, 'plugins');
    this.activePlugins = [];
    this.hooks = new Map();
  }

  // Initialize plugins
  async initialize() {
    try {
      const configPath = path.join(this.contentPath, 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        this.activePlugins = config.plugins || [];
      }
      
      await this.loadPlugins();
    } catch (error) {
      console.error('Error initializing plugins:', error);
    }
  }

  // Load active plugins
  async loadPlugins() {
    for (const pluginName of this.activePlugins) {
      try {
        await this.loadPlugin(pluginName);
      } catch (error) {
        console.error(`Error loading plugin ${pluginName}:`, error);
      }
    }
  }

  // Load a specific plugin
  async loadPlugin(pluginName) {
    const pluginPath = path.join(this.pluginsPath, pluginName);
    const pluginConfigPath = path.join(pluginPath, 'plugin.json');
    
    if (!await fs.pathExists(pluginConfigPath)) {
      throw new Error(`Plugin config not found: ${pluginName}`);
    }

    const config = await fs.readJson(pluginConfigPath);
    
    // Load plugin main file if it exists
    const mainFile = path.join(pluginPath, 'index.js');
    if (await fs.pathExists(mainFile)) {
      // In a real implementation, you would require/import the plugin
      // For now, we'll just store the config
      console.log(`Loaded plugin: ${config.name}`);
    }

    return config;
  }

  // Register a hook
  registerHook(hookName, callback, priority = 10) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    this.hooks.get(hookName).push({
      callback,
      priority
    });
    
    // Sort by priority
    this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);
  }

  // Execute hooks
  async executeHook(hookName, ...args) {
    if (!this.hooks.has(hookName)) {
      return args[0]; // Return first argument if no hooks
    }

    let result = args[0];
    
    for (const hook of this.hooks.get(hookName)) {
      try {
        result = await hook.callback(result, ...args.slice(1));
      } catch (error) {
        console.error(`Error in hook ${hookName}:`, error);
      }
    }
    
    return result;
  }

  // Common hooks
  async filterContent(content, post) {
    return await this.executeHook('filter_content', content, post);
  }

  async filterTitle(title, post) {
    return await this.executeHook('filter_title', title, post);
  }

  async filterExcerpt(excerpt, post) {
    return await this.executeHook('filter_excerpt', excerpt, post);
  }

  async beforeRender(template, data) {
    return await this.executeHook('before_render', template, data);
  }

  async afterRender(html, data) {
    return await this.executeHook('after_render', html, data);
  }

  // Get plugin configuration
  async getPluginConfig(pluginName) {
    try {
      const pluginPath = path.join(this.pluginsPath, pluginName);
      const configPath = path.join(pluginPath, 'plugin.json');
      
      if (await fs.pathExists(configPath)) {
        return await fs.readJson(configPath);
      }
      
      return null;
    } catch (error) {
      console.error(`Error reading plugin config ${pluginName}:`, error);
      return null;
    }
  }

  // Create a new plugin
  async createPlugin(pluginName, config) {
    try {
      const pluginPath = path.join(this.pluginsPath, pluginName);
      await fs.ensureDir(pluginPath);
      
      const defaultConfig = {
        name: config.name || pluginName,
        version: config.version || '1.0.0',
        description: config.description || '',
        author: config.author || '',
        main: 'index.js',
        hooks: config.hooks || []
      };
      
      await fs.writeJson(
        path.join(pluginPath, 'plugin.json'),
        defaultConfig,
        { spaces: 2 }
      );
      
      // Create basic plugin file
      const pluginCode = this.getDefaultPluginCode(pluginName, defaultConfig);
      await fs.writeFile(
        path.join(pluginPath, 'index.js'),
        pluginCode
      );
      
      return true;
    } catch (error) {
      console.error(`Error creating plugin ${pluginName}:`, error);
      return false;
    }
  }

  getDefaultPluginCode(pluginName, config) {
    return `// ${config.name} - ${config.description}

class ${this.toPascalCase(pluginName)}Plugin {
  constructor() {
    this.name = '${config.name}';
    this.version = '${config.version}';
  }

  // Plugin initialization
  init() {
    console.log(\`Plugin \${this.name} v\${this.version} initialized\`);
    
    // Register hooks here
    // Example:
    // this.registerHook('filter_content', this.filterContent.bind(this));
  }

  // Example hook methods
  filterContent(content, post) {
    // Modify content before rendering
    return content;
  }

  filterTitle(title, post) {
    // Modify title before rendering
    return title;
  }

  // Register a hook
  registerHook(hookName, callback, priority = 10) {
    // This would be called by the plugin system
    // Implementation depends on your plugin architecture
  }
}

module.exports = ${this.toPascalCase(pluginName)}Plugin;
`;
  }

  toPascalCase(str) {
    return str.replace(/(^|-)([a-z])/g, (match, p1, p2) => p2.toUpperCase());
  }

  // Get all available plugins
  async getAvailablePlugins() {
    try {
      if (!await fs.pathExists(this.pluginsPath)) {
        return [];
      }

      const plugins = [];
      const dirs = await fs.readdir(this.pluginsPath);
      
      for (const dir of dirs) {
        const pluginPath = path.join(this.pluginsPath, dir);
        const stat = await fs.stat(pluginPath);
        
        if (stat.isDirectory()) {
          const config = await this.getPluginConfig(dir);
          if (config) {
            plugins.push({
              name: dir,
              ...config,
              active: this.activePlugins.includes(dir)
            });
          }
        }
      }
      
      return plugins;
    } catch (error) {
      console.error('Error getting available plugins:', error);
      return [];
    }
  }

  // Activate a plugin
  async activatePlugin(pluginName) {
    try {
      if (!this.activePlugins.includes(pluginName)) {
        this.activePlugins.push(pluginName);
        await this.savePluginConfig();
        await this.loadPlugin(pluginName);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error activating plugin ${pluginName}:`, error);
      return false;
    }
  }

  // Deactivate a plugin
  async deactivatePlugin(pluginName) {
    try {
      const index = this.activePlugins.indexOf(pluginName);
      if (index > -1) {
        this.activePlugins.splice(index, 1);
        await this.savePluginConfig();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deactivating plugin ${pluginName}:`, error);
      return false;
    }
  }

  // Save plugin configuration
  async savePluginConfig() {
    try {
      const configPath = path.join(this.contentPath, 'config.json');
      let config = {};
      
      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
      }
      
      config.plugins = this.activePlugins;
      await fs.writeJson(configPath, config, { spaces: 2 });
      
      return true;
    } catch (error) {
      console.error('Error saving plugin config:', error);
      return false;
    }
  }
}

export default Plugin;
