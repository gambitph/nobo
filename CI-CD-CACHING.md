# NoBo CI/CD Caching Strategy

NoBo implements intelligent caching that works in both local development and CI/CD environments like Cloudflare Pages, Netlify, and GitHub Actions.

## 🚀 How It Works

### Multi-Strategy Caching

NoBo uses a **fallback cascade** of caching strategies:

1. **Local Cache** (`.nobo-cache.json`) - Fastest, for local development
2. **Git-Based Cache** (`.build-marker`) - For git repositories with build history
3. **CI Cache** (File timestamps) - For CI environments without git history

### Cache Strategy Flow

```
Build Request
    ↓
Try Local Cache (.nobo-cache.json)
    ↓ (if fails)
Try Git-Based Cache (.build-marker)
    ↓ (if fails)  
Try CI Cache (file timestamps)
    ↓ (if fails)
Force Full Rebuild
```

## 📁 Cache Files

### Local Development
- **`.nobo-cache.json`** - Contains content hashes and build metadata
- **`out/.build-marker`** - Git commit-based build marker (if in git repo)

### CI/CD Environments
- **File timestamps** - Checks if content files changed since last build
- **Build artifacts** - Reuses existing build if recent and unchanged

## 🏗️ Universal CI/CD Deployment

NoBo sites work with **any static hosting platform** without host-specific configuration files. The caching system is platform-agnostic.

### Universal Build Process

**All platforms use the same simple setup:**

1. **Build command**: `npm run build`
2. **Output directory**: `out`
3. **Node.js version**: 18+ (recommended)

### Platform-Specific Setup

#### Cloudflare Pages
- Build command: `npm run build`
- Build output directory: `out`
- Node.js version: 18

#### Netlify  
- Build command: `npm run build`
- Publish directory: `out`
- Node.js version: 18

#### Vercel
- Build command: `npm run build`
- Output directory: `out`
- Node.js version: 18

#### GitHub Pages (via Actions)
```yaml
- name: Build NoBo site
  run: npm run build
  env:
    # Optional: Force rebuild in CI
    # FORCE_REBUILD: 1
```

#### Any Other Platform
- Build command: `npm run build`
- Static files directory: `out`
- Node.js version: 18+

## ⚡ Performance Benefits

### Local Development
- **First build**: Normal speed
- **No changes**: Instant (uses local cache)
- **Content changes**: Only rebuilds affected pages

### CI/CD Environments
- **Fresh environment**: Full build (expected)
- **Content unchanged**: Can reuse recent builds (CI cache)
- **Git-based**: Can detect changes since last commit

## 🔧 Cache Control

### Force Rebuild
```bash
# Local development
FORCE_REBUILD=1 npm run build

# CI/CD environments
# Set FORCE_REBUILD=1 in environment variables
```

### Cache Invalidation
- **Automatic**: Content files changed
- **Manual**: Delete `.nobo-cache.json` or set `FORCE_REBUILD=1`
- **Git**: New commits automatically invalidate git-based cache

## 📊 Cache Strategy Details

### 1. Local Cache Strategy
- **When**: Local development with existing cache file
- **How**: Compares MD5 hashes of content files
- **Speed**: Instant for unchanged content
- **Fallback**: Git-based cache if cache file corrupted

### 2. Git-Based Cache Strategy  
- **When**: Git repository with build marker
- **How**: Compares current commit with build marker commit
- **Speed**: Very fast, uses git diff
- **Fallback**: CI cache if git operations fail

### 3. CI Cache Strategy
- **When**: CI environment with recent build artifacts
- **How**: Checks file modification times
- **Speed**: Moderate, scans content directory
- **Fallback**: Full rebuild

## 🛠️ Troubleshooting

### Cache Not Working
1. **Check cache files exist**:
   ```bash
   ls -la .nobo-cache.json out/.build-marker
   ```

2. **Force rebuild**:
   ```bash
   FORCE_REBUILD=1 npm run build
   ```

3. **Clear all caches**:
   ```bash
   rm .nobo-cache.json out/.build-marker
   npm run build
   ```

### CI/CD Issues
1. **Ensure git history** is available (`fetch-depth: 0` in GitHub Actions)
2. **Check build artifacts** are preserved between builds
3. **Verify content directory** structure is correct

### Performance Issues
1. **Large sites**: Consider incremental builds for specific content types
2. **Slow CI**: Use build caching in CI platform settings
3. **Memory issues**: Monitor build process memory usage

## 🔍 Debug Information

The build process shows which cache strategy is being used:

```
🔍 Checking for content changes...
  📋 Using local cache strategy
✅ No content changes detected. Using cached build...
```

Or:

```
🔍 Checking for content changes...
  📋 Using ci cache strategy  
📝 Detected changes in: modified:posts/hello-world.json
```

## 🛠️ Universal Setup Instructions

### No Configuration Files Needed
NoBo works out of the box with any static hosting platform. No host-specific configuration files required.

### Universal Build Process
**All platforms use the same simple setup:**

1. **Build command**: `npm run build`
2. **Output directory**: `out`
3. **Node.js version**: 18+ (recommended)

### Platform Configuration
Simply configure your hosting platform with:
- **Build command**: `npm run build`
- **Output/publish directory**: `out`
- **Node.js version**: 18

### Optional: Force Rebuild in CI
If you need to force a rebuild in CI environments:
```bash
FORCE_REBUILD=1 npm run build
```

### Benefits of Universal Approach
- ✅ **No vendor lock-in** - Works everywhere
- ✅ **Easy migration** between platforms
- ✅ **Standard Node.js build** process
- ✅ **No configuration files** to maintain
- ✅ **Works with any CI/CD** system

## 📈 Best Practices

### For Developers
- **Commit frequently** to enable git-based caching
- **Use local cache** for rapid development iterations
- **Force rebuild** when debugging build issues

### For CI/CD
- **Enable build caching** in your CI platform
- **Preserve build artifacts** between builds when possible
- **Use git history** for better change detection
- **Monitor build times** and adjust cache strategies as needed

### For Large Sites
- **Consider content chunking** for very large content directories
- **Use CDN caching** for static assets
- **Monitor cache hit rates** and optimize accordingly

## 🎯 Expected Performance

### Small Sites (< 100 posts)
- **Local**: Instant rebuilds for unchanged content
- **CI**: 30-60 seconds for full builds
- **Cache hit**: 5-10 seconds

### Medium Sites (100-1000 posts)  
- **Local**: 1-2 seconds for unchanged content
- **CI**: 2-5 minutes for full builds
- **Cache hit**: 30-60 seconds

### Large Sites (1000+ posts)
- **Local**: 5-10 seconds for unchanged content
- **CI**: 10-30 minutes for full builds
- **Cache hit**: 2-5 minutes

The caching system scales with your content and provides significant time savings for both development and deployment workflows.
