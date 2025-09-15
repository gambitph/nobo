# NoBo

A Next.js static site platform that works like a CMS but stores all content in JSON files inside a `content/` folder.

## Features

- 🚀 **Next.js powered** - Static site generation with Next.js
- 📝 **Gutenberg block editor** - Familiar WordPress-style content editing
- 📁 **File-based content** - All content stored as JSON files
- 🎨 **Theme system** - Customizable themes in the `content/themes/` folder
- 🔌 **Plugin system** - Extensible with plugins in `content/plugins/`
- 👤 **Admin dashboard** - Easy content management (development only)
- 📱 **Responsive** - Mobile-first design
- ⚡ **Fast** - Static site generation for optimal performance
- 🔒 **Secure** - Admin pages excluded from production builds

## Quick Start

### Create a new site

```bash
npx nobo create-site my-blog
cd my-blog
npm install
npm run dev
```

### Initialize in existing directory

```bash
npx nobo init
npm install
npm run dev
```

## Project Structure

```
my-site/
├─ content/                 # All user-specific content
│  ├─ posts/                # JSON files for posts
│  ├─ uploads/              # Uploaded files (images etc) with metadata
│  ├─ themes/               # User themes
│  ├─ plugins/              # User plugins
│  └─ config.json           # Active theme, active plugins, site settings
├─ node_modules/
├─ package.json
├─ next.config.js
└─ (nobo-core provides all core logic)
```

## Content Model

Posts are stored as `.json` files in `content/posts/`:

```json
{
  "title": "Hello World",
  "date": "2025-01-15",
  "slug": "hello-world",
  "content": "<!-- wp:heading --><h2>Welcome!</h2><!-- /wp:heading --><!-- wp:paragraph --><p>This is my first post in NoBo.</p><!-- /wp:paragraph -->"
}
```

Content is stored as a string of Gutenberg block markup (similar to WordPress), not an array of objects.

## Admin System

- **Admin login** at `/admin` (development only)
- **General admin dashboard** at `/admin`
- **Post management** at `/admin/posts`
- **Post editing** uses the Gutenberg block editor
- **File uploads** go into `content/uploads/` with metadata JSON files
- **Plugin/theme activation** controlled via `content/config.json`

> **Note**: Admin pages are only available during development. They are automatically excluded from production builds for security.

## Build Process

- `npm run dev` → launches Next.js dev server with admin features enabled
- `npm run build` → generates a static site that can be deployed to Cloudflare Pages/Netlify
- `npm run build:public` → same as build, explicitly excludes admin pages
- Uses `next export` (default output goes to `/out`)

## Development vs Production

### Development Mode
- Full admin interface available at `/admin`
- Content management through web interface
- Real-time editing and preview

### Production Build
- Only public-facing pages included
- Admin pages automatically excluded
- Optimized for static hosting
- No server-side dependencies

## Extensibility

The `content/` folder contains all site-specific things (posts, uploads, themes, plugins, settings).

Everything outside of `content/` comes from `nobo-core` and should not be modified by users.

### Themes

Each theme goes inside `content/themes/` and provides templates/hooks:

```
content/themes/my-theme/
├─ theme.json              # Theme configuration
├─ style.css               # Theme styles
└─ templates/              # HTML templates
   ├─ index.html
   ├─ post.html
   └─ page.html
```

### Plugins

Each plugin goes inside `content/plugins/` and can hook into behavior or add components:

```
content/plugins/my-plugin/
├─ plugin.json             # Plugin configuration
└─ index.js                # Plugin code
```

## Development

### Core Package

The `nobo-core` package contains all the core functionality:

- **Storage** - JSON file management
- **Admin** - Admin interface and API
- **Renderer** - Content rendering with Gutenberg blocks
- **Theme** - Theme system
- **Plugin** - Plugin system
- **Config** - Configuration management

### Building

```bash
# Build the core package
npm run build-core

# Run the example site in development
npm run dev

# Build the example site for production
npm run build
```

## Security

- Admin pages are only available during development
- Production builds exclude all admin functionality
- No server-side dependencies in production
- Content managed through file system, not database

## License

MIT