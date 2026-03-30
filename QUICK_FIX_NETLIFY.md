# 🚀 Quick Fix: Netlify Google Maps Error

## The Problem

**Two issues:**
1. ❌ Node.js version too old (18.20.8) - Vite needs 20.19+
2. ❌ Google Maps API key not injected (shows "YOUR_GOOGLE_MAPS_API_KEY")

**Error:**
```
You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+
```

---

## ⚡ Quick Fix (5 minutes)

### Step 1: Update Node.js Version

I've updated `netlify.toml` to use Node.js 20.

**Commit and push:**
```bash
git add netlify.toml
git commit -m "Fix Node.js version for Netlify build"
git push origin main
```

Netlify will auto-deploy with Node.js 20.

### Step 2: Add Environment Variables to Netlify

1. Go to: https://app.netlify.com/
2. Click your site: **touristsafety**
3. Click: **Site settings** (top menu)
4. Click: **Environment variables** (left sidebar)
5. Click: **Add a variable**

### Step 3: Add These Variables

**Variable 1:**
```
Key:   VITE_GOOGLE_MAPS_API_KEY
Value: AIzaSyCbqIsWii1axk962rzDk7Fjg3lTnMGufcg
```

**Variable 2:**
```
Key:   VITE_API_BASE_URL
Value: https://tourist-vh25.onrender.com
```

Click **Create variable** for each.

### Step 4: Redeploy

1. Go to: **Deploys** tab
2. Click: **Trigger deploy** button
3. Select: **Deploy site**
4. Wait 2-3 minutes

### Step 5: Test

Open: https://touristsafety.netlify.app/dashboard

**You should see:**
- ✅ Map loads correctly
- ✅ Blue pin marker shows your location
- ✅ No "InvalidKeyMapError"

---

## ✅ Success Indicators

**Browser Console:**
```
✅ Google Maps API loaded successfully
✅ Google Maps API is ready
✅ Got current location: 31.248... 75.703...
```

**Map Display:**
- ✅ Dark theme map visible
- ✅ Blue pin marker at your location
- ✅ Pulsing circles around marker
- ✅ Location updates in real-time

---

## 🐛 If Still Not Working

### Check API Key Restrictions

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your API key
3. Under "Application restrictions":
   - Select: **HTTP referrers**
   - Add: `https://touristsafety.netlify.app/*`
   - Add: `https://*.netlify.app/*`
4. Under "API restrictions":
   - Ensure: **Maps JavaScript API** is enabled
5. Click **Save**
6. Wait 2-3 minutes

### Check Billing

1. Go to: https://console.cloud.google.com/billing
2. Ensure billing is **enabled**
3. Add payment method if needed

---

## 📞 Quick Support

**Error:** "InvalidKeyMapError"  
**Fix:** Set `VITE_GOOGLE_MAPS_API_KEY` in Netlify dashboard

**Error:** "Billing not enabled"  
**Fix:** Enable billing in Google Cloud Console

**Error:** "Referer not allowed"  
**Fix:** Add Netlify domain to API key restrictions

---

**Time to Fix:** 5 minutes  
**Difficulty:** Easy  
**Status:** Ready to deploy
