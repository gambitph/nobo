import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

class Storage {
  constructor(contentPath = './content') {
    this.contentPath = contentPath;
    this.postsPath = path.join(contentPath, 'posts');
    this.uploadsPath = path.join(contentPath, 'uploads');
    this.themesPath = path.join(contentPath, 'themes');
    this.pluginsPath = path.join(contentPath, 'plugins');
    this.configPath = path.join(contentPath, 'config.json');
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      this.contentPath,
      this.postsPath,
      this.uploadsPath,
      this.themesPath,
      this.pluginsPath
    ];
    
    dirs.forEach(dir => {
      fs.ensureDirSync(dir);
    });
  }

  // Posts management
  async getPosts() {
    try {
      const files = await fs.readdir(this.postsPath);
      const posts = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const postPath = path.join(this.postsPath, file);
          const postData = await fs.readJson(postPath);
          posts.push(postData);
        }
      }
      
      return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error reading posts:', error);
      return [];
    }
  }

  async getPost(slug) {
    try {
      const postPath = path.join(this.postsPath, `${slug}.json`);
      return await fs.readJson(postPath);
    } catch (error) {
      console.error(`Error reading post ${slug}:`, error);
      return null;
    }
  }

  async savePost(post) {
    try {
      const postPath = path.join(this.postsPath, `${post.slug}.json`);
      await fs.writeJson(postPath, post, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Error saving post:', error);
      return false;
    }
  }

  async deletePost(slug) {
    try {
      const postPath = path.join(this.postsPath, `${slug}.json`);
      await fs.remove(postPath);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  // Config management
  async getConfig() {
    try {
      if (await fs.pathExists(this.configPath)) {
        return await fs.readJson(this.configPath);
      }
      return this.getDefaultConfig();
    } catch (error) {
      console.error('Error reading config:', error);
      return this.getDefaultConfig();
    }
  }

  async saveConfig(config) {
    try {
      await fs.writeJson(this.configPath, config, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  getDefaultConfig() {
    return {
      site: {
        title: 'My NoBo Site',
        description: 'A site built with NoBo',
        url: 'http://localhost:3000'
      },
      theme: 'default',
      plugins: [],
      admin: {
        username: 'admin',
        password: this.generatePassword()
      }
    };
  }

  generatePassword() {
    return crypto.randomBytes(16).toString('hex');
  }

  // File uploads
  async saveUpload(file, filename) {
    try {
      const uploadPath = path.join(this.uploadsPath, filename);
      await fs.writeFile(uploadPath, file);
      
      // Create metadata file
      const metadata = {
        filename,
        originalName: file.originalname || filename,
        size: file.size || file.length,
        mimeType: file.mimetype || 'application/octet-stream',
        uploadedAt: new Date().toISOString()
      };
      
      const metadataPath = path.join(this.uploadsPath, `${filename}.json`);
      await fs.writeJson(metadataPath, metadata, { spaces: 2 });
      
      return {
        success: true,
        filename,
        url: `/uploads/${filename}`
      };
    } catch (error) {
      console.error('Error saving upload:', error);
      return { success: false, error: error.message };
    }
  }

  async getUploads() {
    try {
      const files = await fs.readdir(this.uploadsPath);
      const uploads = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const metadataPath = path.join(this.uploadsPath, file);
          const metadata = await fs.readJson(metadataPath);
          uploads.push(metadata);
        }
      }
      
      return uploads.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    } catch (error) {
      console.error('Error reading uploads:', error);
      return [];
    }
  }
}

export default Storage;
