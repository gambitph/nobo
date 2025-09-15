export default function Home({ posts, config }) {

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
                  <a href={`/posts/${post.slug}`}>{post.title}</a>
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

export async function getStaticProps() {
  // For static generation, we'll use a simple approach
  // In a real implementation, you'd read the JSON files directly
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Read posts
    const postsDir = path.join(process.cwd(), 'content', 'posts');
    const postFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.json'));
    const posts = postFiles.map(file => {
      const postPath = path.join(postsDir, file);
      return JSON.parse(fs.readFileSync(postPath, 'utf8'));
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Read config
    const configPath = path.join(process.cwd(), 'content', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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
}
