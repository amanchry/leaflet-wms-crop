# Publishing Guide

This guide explains how to publish the plugin to both npm and GitHub.

<!-- npm  -->
npm i leaflet-wms-crop
<script src="https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@latest/leaflet-wms-crop.js"></script>

<!-- GitHUB (jsdel) -->
https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@latest/leaflet-wms-crop.js


<!-- ------------------- -->
## Publishing to npm 
<!-- ------------------- -->
### Step 1: Update package.json

Make sure `package.json` has correct details:
- Package name (must be unique on npm)
- Version number
- Repository URL
- Author name

### Step 2: Check Name Availability

```bash
npm search leaflet-wms-crop
```

If taken, use:
- `leaflet-wms-crop-plugin`
- `@yourusername/leaflet-wms-crop`
- `leaflet-wms-boundary-crop`

### Step 3: Login to npm

```bash
npm login
```
Create account at https://www.npmjs.com/signup if needed.

### Step 4: Publish

```bash
npm publish
```

**For first publish:** Use `npm publish`

**For scoped packages:** Use `npm publish --access public`

### Step 5: Verify

Check your package on npm:
```
https://www.npmjs.com/package/leaflet-wms-crop
```


---

## 🚀 Publishing to GitHub (jsDelivr)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `leaflet-wms-crop`
3. Make it Public
4. Click "Create repository"

### Step 2: Push Code

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/amanchry/leaflet-wms-crop.git
git push -u origin main
```

### Step 3: Create Release

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `v1.0.0`
5. Description: "Initial release"
6. Click "Publish release"

### Step 4: Verify jsDelivr URL

Test the URL in browser:
```
https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@v1.0.0/leaflet-wms-crop.js
```

---

<!-- ------------------- -->
## Usage URLs
<!-- ------------------- -->

### npm (unpkg)

```html
<!-- Latest version -->
<script src="https://unpkg.com/leaflet-wms-crop/leaflet-wms-crop.js"></script>

<!-- Specific version -->
<script src="https://unpkg.com/leaflet-wms-crop@1.0.0/leaflet-wms-crop.js"></script>
```

### GitHub (jsDelivr)

```html
<!-- Latest release -->
<script src="https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@latest/leaflet-wms-crop.js"></script>

<!-- Specific version -->
<script src="https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@v1.0.0/leaflet-wms-crop.js"></script>

<!-- From main branch -->
<script src="https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@main/leaflet-wms-crop.js"></script>
```

---


## 📝 Update Process
1. Edit the code

2. Push on npm
### For npm:

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Or manually edit package.json
# Then publish
npm publish
```

3. Push on GitHub
### For GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature X"
git push

# Create new release
# Go to GitHub → Releases → Create new release
# Tag: v1.0.1
# Publish
```


---

## 🌐 CDN Comparison

| CDN | URL Format | Best For |
|-----|-----------|----------|
| **unpkg** (npm) | `https://unpkg.com/package@version/file` | npm packages |
| **jsDelivr** (GitHub) | `https://cdn.jsdelivr.net/gh/user/repo@tag/file` | GitHub releases |
| **jsDelivr** (npm) | `https://cdn.jsdelivr.net/npm/package@version/file` | npm packages |

---

## 💡 Tips

1. **Always create releases** on GitHub for versioning
2. **Use semantic versioning** (1.0.0, 1.0.1, 1.1.0, 2.0.0)
3. **Test CDN URLs** in browser before sharing
4. **Keep README updated** with correct URLs
5. **Tag releases** on GitHub (e.g., `v1.0.0`)

---

After publishing, your plugin will work with:
- ✅ npm/React/Node.js projects
- ✅ CDN (unpkg/jsDelivr)
- ✅ Direct HTML usage
- ✅ Any JavaScript framework
