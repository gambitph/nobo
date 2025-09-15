import { useState, useEffect } from 'react';
import { Storage } from 'nobo-core';
import { useRouter } from 'next/router';

export default function EditPost() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState({
    title: '',
    slug: '',
    date: '',
    content: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      const storage = new Storage('./content');
      const postData = await storage.getPost(slug);
      
      if (postData) {
        setPost(postData);
      } else {
        alert('Post not found');
        router.push('/admin/posts');
      }
    } catch (error) {
      console.error('Failed to load post:', error);
      alert('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!post.title || !post.slug) {
      alert('Title and slug are required');
      return;
    }

    setSaving(true);
    try {
      const storage = new Storage('./content');
      const success = await storage.savePost(post);
      
      if (success) {
        alert('Post saved successfully!');
        router.push('/admin/posts');
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

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        const storage = new Storage('./content');
        const success = await storage.deletePost(slug);
        
        if (success) {
          alert('Post deleted successfully!');
          router.push('/admin/posts');
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
    <div className="post-editor">
      <div className="editor-header">
        <h1>Edit Post: {post.title}</h1>
        <div className="header-actions">
          <a href={`/posts/${post.slug}`} target="_blank" rel="noopener noreferrer" className="btn">View Post</a>
          <a href="/admin/posts" className="btn">← Back to Posts</a>
        </div>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            placeholder="Post title"
            value={post.title}
            onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
            className="title-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug">Slug</label>
          <input
            type="text"
            id="slug"
            placeholder="post-slug"
            value={post.slug}
            onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
            className="slug-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            value={post.date}
            onChange={(e) => setPost(prev => ({ ...prev, date: e.target.value }))}
            className="date-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            placeholder="Write your post content using Gutenberg blocks..."
            value={post.content}
            onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
            className="content-textarea"
          />
          <small>
            Use Gutenberg block syntax. Example: <code>{"<!-- wp:paragraph --><p>Your content</p><!-- /wp:paragraph -->"}</code>
          </small>
        </div>

        <div className="editor-actions">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
          >
            Delete Post
          </button>
        </div>
      </div>
    </div>
  );
}
