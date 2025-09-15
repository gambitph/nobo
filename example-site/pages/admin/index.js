export default function AdminDashboard({ posts, config }) {

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
        <div className="stat">
          <h3>Active Plugins</h3>
          <span>{config?.plugins?.length || 0}</span>
        </div>
      </div>

      <div className="actions">
        <a href="/admin/posts" className="btn">Manage Posts</a>
        <a href="/admin/posts/new" className="btn">New Post</a>
        <a href="/admin/settings" className="btn">Settings</a>
      </div>

      <div className="recent-posts">
        <h2>Recent Posts</h2>
        {(!posts || posts.length === 0) ? (
          <p>No posts yet. <a href="/admin/posts/new">Create your first post</a>!</p>
        ) : (
          <div className="posts">
            {posts.slice(0, 5).map((post) => (
              <div key={post.slug} className="post-item">
                <h3>{post.title}</h3>
                <p>Published: {post.date}</p>
                <div className="actions">
                  <a href={`/admin/posts/${post.slug}`}>Edit</a>
                  <a href={`/posts/${post.slug}`} target="_blank" rel="noopener noreferrer">View</a>
                </div>
              </div>
            ))}
          </div>
        )}
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
}
