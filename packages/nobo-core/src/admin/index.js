import React, { useState, useEffect } from 'react';
import Storage from '../storage/index.js';
import BlockRenderer from '../blocks/index.js';

class Admin {
  constructor(contentPath = './content') {
    this.storage = new Storage(contentPath);
    this.blockRenderer = new BlockRenderer();
  }

  // Admin API routes
  getApiRoutes() {
    return {
      '/api/admin/posts': {
        GET: this.getPosts.bind(this),
        POST: this.createPost.bind(this)
      },
      '/api/admin/posts/[slug]': {
        GET: this.getPost.bind(this),
        PUT: this.updatePost.bind(this),
        DELETE: this.deletePost.bind(this)
      },
      '/api/admin/config': {
        GET: this.getConfig.bind(this),
        PUT: this.updateConfig.bind(this)
      },
      '/api/admin/upload': {
        POST: this.uploadFile.bind(this)
      }
    };
  }

  async getPosts(req, res) {
    try {
      const posts = await this.storage.getPosts();
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPost(req, res) {
    try {
      const { slug } = req.query;
      const post = await this.storage.getPost(slug);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createPost(req, res) {
    try {
      const post = req.body;
      
      // Validate required fields
      if (!post.title || !post.slug) {
        return res.status(400).json({ error: 'Title and slug are required' });
      }

      // Set default values
      post.date = post.date || new Date().toISOString().split('T')[0];
      post.content = post.content || '';

      const success = await this.storage.savePost(post);
      if (success) {
        res.status(201).json(post);
      } else {
        res.status(500).json({ error: 'Failed to save post' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updatePost(req, res) {
    try {
      const { slug } = req.query;
      const post = req.body;
      post.slug = slug; // Ensure slug matches URL

      const success = await this.storage.savePost(post);
      if (success) {
        res.status(200).json(post);
      } else {
        res.status(500).json({ error: 'Failed to update post' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deletePost(req, res) {
    try {
      const { slug } = req.query;
      const success = await this.storage.deletePost(slug);
      if (success) {
        res.status(200).json({ message: 'Post deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete post' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getConfig(req, res) {
    try {
      const config = await this.storage.getConfig();
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateConfig(req, res) {
    try {
      const config = req.body;
      const success = await this.storage.saveConfig(config);
      if (success) {
        res.status(200).json(config);
      } else {
        res.status(500).json({ error: 'Failed to update config' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async uploadFile(req, res) {
    try {
      // This would need to be implemented with a file upload middleware
      // For now, return a placeholder response
      res.status(501).json({ error: 'File upload not implemented yet' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Admin components
  getAdminComponents() {
    return {
      LoginForm: this.LoginForm.bind(this),
      Dashboard: this.Dashboard.bind(this),
      PostEditor: this.PostEditor.bind(this),
      PostList: this.PostList.bind(this)
    };
  }

  LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const config = await this.storage.getConfig();
        if (username === config.admin.username && password === config.admin.password) {
          // Set session/token here
          window.location.href = '/admin';
        } else {
          setError('Invalid credentials');
        }
      } catch (err) {
        setError('Login failed');
      }
    };

    return React.createElement('div', { className: 'admin-login' },
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('h2', null, 'Admin Login'),
        error && React.createElement('div', { className: 'error' }, error),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Username',
          value: username,
          onChange: (e) => setUsername(e.target.value),
          required: true
        }),
        React.createElement('input', {
          type: 'password',
          placeholder: 'Password',
          value: password,
          onChange: (e) => setPassword(e.target.value),
          required: true
        }),
        React.createElement('button', { type: 'submit' }, 'Login')
      )
    );
  }

  Dashboard() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      this.loadPosts();
    }, []);

    const loadPosts = async () => {
      try {
        const response = await fetch('/api/admin/posts');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return React.createElement('div', { className: 'loading' }, 'Loading...');
    }

    return React.createElement('div', { className: 'admin-dashboard' },
      React.createElement('h1', null, 'Admin Dashboard'),
      React.createElement('div', { className: 'stats' },
        React.createElement('div', { className: 'stat' },
          React.createElement('h3', null, 'Total Posts'),
          React.createElement('span', null, posts.length)
        )
      ),
      React.createElement('div', { className: 'actions' },
        React.createElement('a', { href: '/admin/posts', className: 'btn' }, 'Manage Posts'),
        React.createElement('a', { href: '/admin/posts/new', className: 'btn' }, 'New Post')
      )
    );
  }

  PostList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      this.loadPosts();
    }, []);

    const loadPosts = async () => {
      try {
        const response = await fetch('/api/admin/posts');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    };

    const deletePost = async (slug) => {
      if (confirm('Are you sure you want to delete this post?')) {
        try {
          await fetch(`/api/admin/posts/${slug}`, { method: 'DELETE' });
          loadPosts();
        } catch (error) {
          console.error('Failed to delete post:', error);
        }
      }
    };

    if (loading) {
      return React.createElement('div', { className: 'loading' }, 'Loading...');
    }

    return React.createElement('div', { className: 'post-list' },
      React.createElement('div', { className: 'header' },
        React.createElement('h1', null, 'Posts'),
        React.createElement('a', { href: '/admin/posts/new', className: 'btn' }, 'New Post')
      ),
      React.createElement('div', { className: 'posts' },
        posts.map(post => 
          React.createElement('div', { key: post.slug, className: 'post-item' },
            React.createElement('h3', null, post.title),
            React.createElement('p', null, `Published: ${post.date}`),
            React.createElement('div', { className: 'actions' },
              React.createElement('a', { href: `/admin/posts/${post.slug}` }, 'Edit'),
              React.createElement('button', { 
                onClick: () => deletePost(post.slug),
                className: 'btn-danger'
              }, 'Delete')
            )
          )
        )
      )
    );
  }

  PostEditor() {
    const [post, setPost] = useState({
      title: '',
      slug: '',
      date: new Date().toISOString().split('T')[0],
      content: ''
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      setSaving(true);
      try {
        const method = post.slug ? 'PUT' : 'POST';
        const url = post.slug ? `/api/admin/posts/${post.slug}` : '/api/admin/posts';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
        });

        if (response.ok) {
          const savedPost = await response.json();
          setPost(savedPost);
          alert('Post saved successfully!');
        } else {
          alert('Failed to save post');
        }
      } catch (error) {
        console.error('Failed to save post:', error);
        alert('Failed to save post');
      } finally {
        setSaving(false);
      }
    };

    const generateSlug = (title) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    const handleTitleChange = (e) => {
      const title = e.target.value;
      setPost(prev => ({
        ...prev,
        title,
        slug: prev.slug || generateSlug(title)
      }));
    };

    return React.createElement('div', { className: 'post-editor' },
      React.createElement('div', { className: 'editor-header' },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Post title',
          value: post.title,
          onChange: handleTitleChange,
          className: 'title-input'
        }),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Slug',
          value: post.slug,
          onChange: (e) => setPost(prev => ({ ...prev, slug: e.target.value })),
          className: 'slug-input'
        }),
        React.createElement('input', {
          type: 'date',
          value: post.date,
          onChange: (e) => setPost(prev => ({ ...prev, date: e.target.value })),
          className: 'date-input'
        })
      ),
      React.createElement('textarea', {
        placeholder: 'Write your post content using Gutenberg blocks...',
        value: post.content,
        onChange: (e) => setPost(prev => ({ ...prev, content: e.target.value })),
        className: 'content-textarea'
      }),
      React.createElement('div', { className: 'editor-actions' },
        React.createElement('button', {
          onClick: handleSave,
          disabled: saving,
          className: 'btn-primary'
        }, saving ? 'Saving...' : 'Save Post')
      )
    );
  }
}

export default Admin;
