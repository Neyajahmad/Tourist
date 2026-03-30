# ✅ Netlify Node.js Version Fix

## Problem
Netlify build failed with:
```
You are using Node.js 18.20.8
Vite requires Node.js version 20.19+ or 22.12+
```

## Solution
Updated Node.js version to 20 for Netlify builds.

---

## 🔧 Changes Made

### 1. Created `.nvmrc` files
- Root: `.nvmrc` → Contains "20"
- Client: `client/.nvmrc` → Contains "20"

### 2. Updated `netlify.toml`
```toml
[build.environment]
  NODE_VERSION = "20"
```

---

## 🚀 Deploy Now

```bash
# Commit changes
git add .nvmrc client/.nvmrc netlify.toml NETLIFY_NODE_VERSION_FIX.md
git commit -m "Fix Node.js version for Netlify (requires v20+)"
git push origin main
```

Netlify will auto-deploy in 2-3 minutes.

---

## ✅ What to Expect

### Build Logs Will Show:
```
✅ Using Node.js 20.x
✅ npm run build
✅ vite build
✅ ✓ 2196 modules transformed
✅ Build succeeded
```

### Your Site Will:
- ✅ Build successfully
- ✅ Google Maps loads (after adding env vars)
- ✅ No Node.js version errors

---

## 📋 Complete Checklist

### Files Created/Updated
- [x] `.nvmrc` (root)
- [x] `client/.nvmrc`
- [x] `netlify.toml` (NODE_VERSION = "20")

### Netlify Environment Variables
- [ ] Add `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Add `VITE_API_BASE_URL`

### Deployment
- [ ] Commit and push changes
- [ ] Wait for Netlify auto-deploy
- [ ] Verify build succeeds
- [ ] Test production site

---

## 🧪 Verify Success

After deployment:

1. **Check Build Logs:**
   - Should show Node.js 20.x
   - No version errors
   - Build completes successfully

2. **Test Site:**
   - Open: https://touristsafety.netlify.app/dashboard
   - Map should load
   - No console errors

---

**Status:** ✅ Ready to deploy  
**Next:** Commit, push, and add environment variables
