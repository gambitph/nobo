import React from 'react';

class BlockRenderer {
  constructor() {
    this.blocks = new Map();
    this.registerDefaultBlocks();
  }

  registerDefaultBlocks() {
    // Heading block
    this.registerBlock('heading', (props) => {
      const { level = 2, content } = props;
      const Tag = `h${level}`;
      return React.createElement(Tag, { dangerouslySetInnerHTML: { __html: content } });
    });

    // Paragraph block
    this.registerBlock('paragraph', (props) => {
      const { content } = props;
      return React.createElement('p', { dangerouslySetInnerHTML: { __html: content } });
    });

    // Image block
    this.registerBlock('image', (props) => {
      const { url, alt = '', caption = '' } = props;
      return React.createElement('figure', { className: 'wp-block-image' },
        React.createElement('img', { src: url, alt }),
        caption && React.createElement('figcaption', null, caption)
      );
    });

    // Quote block
    this.registerBlock('quote', (props) => {
      const { content, citation = '' } = props;
      return React.createElement('blockquote', { className: 'wp-block-quote' },
        React.createElement('p', { dangerouslySetInnerHTML: { __html: content } }),
        citation && React.createElement('cite', null, citation)
      );
    });

    // List block
    this.registerBlock('list', (props) => {
      const { content, ordered = false } = props;
      const Tag = ordered ? 'ol' : 'ul';
      return React.createElement(Tag, { 
        className: 'wp-block-list',
        dangerouslySetInnerHTML: { __html: content }
      });
    });

    // Code block
    this.registerBlock('code', (props) => {
      const { content, language = '' } = props;
      return React.createElement('pre', { className: 'wp-block-code' },
        React.createElement('code', { className: language ? `language-${language}` : '' }, content)
      );
    });
  }

  registerBlock(name, renderer) {
    this.blocks.set(name, renderer);
  }

  parseGutenbergBlocks(content) {
    const blockRegex = /<!-- wp:(\w+)(?:\s+(\{[^}]*\}))? -->\s*([\s\S]*?)\s*<!-- \/wp:\1 -->/g;
    const blocks = [];
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
      const [, blockName, attributesJson, blockContent] = match;
      
      let attributes = {};
      if (attributesJson) {
        try {
          attributes = JSON.parse(attributesJson);
        } catch (e) {
          console.warn('Failed to parse block attributes:', e);
        }
      }

      blocks.push({
        name: blockName,
        attributes,
        content: blockContent.trim()
      });
    }

    return blocks;
  }

  renderBlocks(blocks) {
    return blocks.map((block, index) => {
      const renderer = this.blocks.get(block.name);
      if (!renderer) {
        console.warn(`Unknown block type: ${block.name}`);
        return React.createElement('div', { 
          key: index, 
          className: 'wp-block-unknown',
          dangerouslySetInnerHTML: { __html: block.content }
        });
      }

      return React.createElement('div', { key: index, className: `wp-block-${block.name}` },
        renderer({ ...block.attributes, content: block.content })
      );
    });
  }

  render(content) {
    if (!content) return null;
    
    const blocks = this.parseGutenbergBlocks(content);
    if (blocks.length === 0) {
      // Fallback for content without Gutenberg blocks
      return React.createElement('div', { 
        className: 'wp-block-paragraph',
        dangerouslySetInnerHTML: { __html: content }
      });
    }

    return this.renderBlocks(blocks);
  }
}

export default BlockRenderer;
