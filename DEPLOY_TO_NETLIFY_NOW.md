# 🚀 Deploy to Netlify - Complete Guide

## ✅ All Fixes Applied

1. ✅ Node.js version set to 20
2. ✅ `.nvmrc` files created
3. ✅ `netlify.toml` configured
4. ✅ Build command ready

---

## 📦 Step 1: Commit All Changes

```bash
git add .nvmrc client/.nvmrc netlify.toml NETLIFY_NODE_VERSION_FIX.md DEPLOY_TO_NETLIFY_NOW.md
git commit -m "Fix Netlify build: Update Node.js to v20 for Vite compatibility"
git push origin main
```

---

## 🔑 Step 2: Add Environment Variables

### Go to Netlify Dashboard
1. Open: https://app.netlify.com/
2. Click your site: **touristsafety**
3. Go to: **Site settings** → **Environment variables**

### Add These Variables

**Variable 1: Google Maps API Key**
```
Key:   VITE_GOOGLE_MAPS_API_KEY
Value: AIzaSyCbqIsWii1axk962rzDk7Fjg3lTnMGufcg
Scope: Production
```

**Variable 2: Backend API URL**
```
Key:   VITE_API_BASE_URL
Value: https://tourist-vh25.onrender.com
Scope: Production
```

Click **Save** after adding each variable.

---

## ⏱️ Step 3: Wait for Auto-Deploy

After pushing to GitHub:
- Netlify detects changes automatically
- Build starts in 10-30 seconds
- Build takes 2-3 minutes
- Site deploys automatically

---

## 🧪 Step 4: Verify Deployment

### Check Build Logs
1. Go to: **Deploys** tab in Netlify
2. Click the latest deploy
3. Look for:
```
✅ Using Node.js 20.x
✅ npm run build
✅ vite build
✅ Build succeeded
```

### Test Your Site
Open: https://touristsafety.netlify.app/dashboard

**Should see:**
- ✅ Map loads with dark theme
- ✅ Blue pin marker at your location
- ✅ No "InvalidKeyMapError"
- ✅ Safety score displays

**Console should show:**
```
✅ Google Maps API loaded successfully
✅ Google Maps API is ready
✅ Got current location: 31.248... 75.703...
```

---

## 🐛 Troubleshooting

### Build Still Fails
**Check:**
- Node version in build logs (should be 20.x)
- Environment variables are set
- No typos in variable names

**Solution:**
- Clear build cache: Deploys → Trigger deploy → Clear cache and deploy

### Map Doesn't Load
**Check:**
- Environment variables are set correctly
- Google Maps API key is valid
- Billing enabled on Google Cloud

**Solution:**
- Verify `VITE_GOOGLE_MAPS_API_KEY` in Netlify
- Check Google Cloud Console for API restrictions

---

## ✅ Success Checklist

- [ ] Committed `.nvmrc` files
- [ ] Committed `netlify.toml`
- [ ] Pushed to GitHub
- [ ] Added `VITE_GOOGLE_MAPS_API_KEY` to Netlify
- [ ] Added `VITE_API_BASE_URL` to Netlify
- [ ] Build succeeded (check logs)
- [ ] Site loads correctly
- [ ] Map displays
- [ ] No console errors

---

## 🎉 You're Done!

Your site will be live at:
**https://touristsafety.netlify.app**

Backend API:
**https://tourist-vh25.onrender.com**

---

**Time to Deploy:** 5 minutes  
**Status:** Ready to go!
