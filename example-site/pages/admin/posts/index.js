import { useState, useEffect } from 'react';
import { Storage } from 'nobo-core';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const storage = new Storage('./content');
      const postsData = await storage.getPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (slug) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const storage = new Storage('./content');
        const success = await storage.deletePost(slug);
        if (success) {
          loadPosts(); // Reload the list
        } else {
          alert('Failed to delete post');
        }
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Failed to delete post');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="post-list">
      <div className="header">
        <h1>Posts</h1>
        <a href="/admin/posts/new" className="btn">New Post</a>
      </div>

      {posts.length === 0 ? (
        <p>No posts yet. <a href="/admin/posts/new">Create your first post</a>!</p>
      ) : (
        <div className="posts">
          {posts.map((post) => (
            <div key={post.slug} className="post-item">
              <h3>{post.title}</h3>
              <p>Published: {post.date}</p>
              <div className="actions">
                <a href={`/admin/posts/${post.slug}`} className="btn">Edit</a>
                <a href={`/posts/${post.slug}`} target="_blank" rel="noopener noreferrer" className="btn">View</a>
                <button 
                  onClick={() => deletePost(post.slug)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
