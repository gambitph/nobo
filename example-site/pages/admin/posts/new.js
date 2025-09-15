import { useState } from 'react';
import { Storage } from 'nobo-core';
import { useRouter } from 'next/router';

export default function NewPost() {
  const router = useRouter();
  const [post, setPost] = useState({
    title: '',
    slug: '',
    date: new Date().toISOString().split('T')[0],
    content: ''
  });
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="post-editor">
      <div className="editor-header">
        <h1>New Post</h1>
        <a href="/admin/posts" className="btn">← Back to Posts</a>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            placeholder="Post title"
            value={post.title}
            onChange={handleTitleChange}
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
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
