import React from 'react';
import Storage from '../storage/index.js';
import BlockRenderer from '../blocks/index.js';

class Renderer {
  constructor(contentPath = './content') {
    this.storage = new Storage(contentPath);
    this.blockRenderer = new BlockRenderer();
  }

  // Get all posts for listing pages
  async getPosts() {
    return await this.storage.getPosts();
  }

  // Get a single post by slug
  async getPost(slug) {
    return await this.storage.getPost(slug);
  }

  // Get site configuration
  async getConfig() {
    return await this.storage.getConfig();
  }

  // Render a post's content using Gutenberg blocks
  renderPostContent(content) {
    return this.blockRenderer.render(content);
  }

  // Generate static paths for all posts
  async getStaticPaths() {
    const posts = await this.getPosts();
    return posts.map(post => ({
      params: { slug: post.slug }
    }));
  }

  // Get static props for a post page
  async getPostStaticProps(slug) {
    const post = await this.getPost(slug);
    const config = await this.getConfig();

    if (!post) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        post,
        config
      }
    };
  }

  // Get static props for the home page
  async getHomeStaticProps() {
    const posts = await this.getPosts();
    const config = await this.getConfig();

    return {
      props: {
        posts,
        config
      }
    };
  }

  // React components for rendering
  getComponents() {
    return {
      PostCard: this.PostCard.bind(this),
      PostContent: this.PostContent.bind(this),
      SiteHeader: this.SiteHeader.bind(this),
      SiteFooter: this.SiteFooter.bind(this)
    };
  }

  PostCard({ post }) {
    return React.createElement('article', { className: 'post-card' },
      React.createElement('h2', { className: 'post-title' },
        React.createElement('a', { href: `/posts/${post.slug}` }, post.title)
      ),
      React.createElement('time', { className: 'post-date' }, post.date),
      React.createElement('div', { 
        className: 'post-excerpt',
        dangerouslySetInnerHTML: { 
          __html: this.getExcerpt(post.content) 
        }
      })
    );
  }

  PostContent({ post }) {
    return React.createElement('article', { className: 'post' },
      React.createElement('header', { className: 'post-header' },
        React.createElement('h1', { className: 'post-title' }, post.title),
        React.createElement('time', { className: 'post-date' }, post.date)
      ),
      React.createElement('div', { className: 'post-content' },
        this.renderPostContent(post.content)
      )
    );
  }

  SiteHeader({ config }) {
    return React.createElement('header', { className: 'site-header' },
      React.createElement('h1', { className: 'site-title' },
        React.createElement('a', { href: '/' }, config.site.title)
      ),
      React.createElement('p', { className: 'site-description' }, config.site.description)
    );
  }

  SiteFooter({ config }) {
    return React.createElement('footer', { className: 'site-footer' },
      React.createElement('p', null, `© ${new Date().getFullYear()} ${config.site.title}`)
    );
  }

  // Helper method to extract excerpt from content
  getExcerpt(content, length = 150) {
    if (!content) return '';
    
    // Remove Gutenberg block comments
    const cleanContent = content.replace(/<!-- wp:[\w\s]+ -->/g, '').replace(/<!-- \/wp:[\w\s]+ -->/g, '');
    
    // Remove HTML tags
    const textContent = cleanContent.replace(/<[^>]*>/g, '');
    
    // Truncate and add ellipsis
    if (textContent.length <= length) {
      return textContent;
    }
    
    return textContent.substring(0, length).trim() + '...';
  }
}

export default Renderer;
