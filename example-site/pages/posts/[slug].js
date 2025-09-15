function renderGutenbergBlocks(content) {
  if (!content) return '';
  
  // Simple Gutenberg block renderer
  let rendered = content;
  
  // Convert Gutenberg blocks to HTML
  rendered = rendered.replace(/<!-- wp:heading --><h(\d+)>(.*?)<\/h\1><!-- \/wp:heading -->/g, '<h$1>$2</h$1>');
  rendered = rendered.replace(/<!-- wp:paragraph --><p>(.*?)<\/p><!-- \/wp:paragraph -->/g, '<p>$1</p>');
  rendered = rendered.replace(/<!-- wp:list --><ul>(.*?)<\/ul><!-- \/wp:list -->/g, '<ul>$1</ul>');
  rendered = rendered.replace(/<!-- wp:list --><ol>(.*?)<\/ol><!-- \/wp:list -->/g, '<ol>$1</ol>');
  rendered = rendered.replace(/<!-- wp:quote --><blockquote class="wp-block-quote"><p>(.*?)<\/p><\/blockquote><!-- \/wp:quote -->/g, '<blockquote><p>$1</p></blockquote>');
  rendered = rendered.replace(/<!-- wp:code --><pre class="wp-block-code"><code>(.*?)<\/code><\/pre><!-- \/wp:code -->/g, '<pre><code>$1</code></pre>');
  
  return rendered;
}

export default function Post({ post, config }) {

  if (!post) {
    return (
      <div className="container">
        <h1>Post Not Found</h1>
        <p>The post you're looking for doesn't exist.</p>
        <a href="/">← Back to Home</a>
      </div>
    );
  }

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
        <article className="post">
          <header className="post-header">
            <h1 className="post-title">{post.title}</h1>
            <time className="post-date">{post.date}</time>
          </header>
          <div className="post-content">
            <div dangerouslySetInnerHTML={{ __html: renderGutenbergBlocks(post.content) }} />
          </div>
        </article>
      </main>

      <footer className="site-footer">
        <p>&copy; {new Date().getFullYear()} {config?.site?.title || 'My NoBo Site'}</p>
      </footer>
    </div>
  );
}

export async function getStaticPaths() {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const postsDir = path.default.join(process.cwd(), 'content', 'posts');
    const postFiles = fs.default.readdirSync(postsDir).filter(file => file.endsWith('.json'));
    const posts = postFiles.map(file => {
      const postPath = path.default.join(postsDir, file);
      return JSON.parse(fs.default.readFileSync(postPath, 'utf8'));
    });
    
    const paths = posts.map((post) => ({
      params: { slug: post.slug }
    }));

    return {
      paths,
      fallback: false
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: false
    };
  }
}

export async function getStaticProps({ params }) {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const postPath = path.default.join(process.cwd(), 'content', 'posts', `${params.slug}.json`);
    const configPath = path.default.join(process.cwd(), 'content', 'config.json');
    
    if (!fs.default.existsSync(postPath)) {
      return {
        notFound: true
      };
    }

    const post = JSON.parse(fs.default.readFileSync(postPath, 'utf8'));
    const config = JSON.parse(fs.default.readFileSync(configPath, 'utf8'));

    return {
      props: {
        post,
        config
      }
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      notFound: true
    };
  }
}
