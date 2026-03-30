# 🔧 Netlify Deployment Fix - Google Maps API Key

## 🐛 Problem

Your production site shows:
```
InvalidKeyMapError - Google Maps JavaScript API error
```

The URL shows: `js?key=YOUR_GOOGLE_M...` which means the API key placeholder wasn't replaced.

---

## 🎯 Root Cause

Netlify doesn't have access to your environment variables during build. The Vite plugin needs `VITE_GOOGLE_MAPS_API_KEY` to inject the real API key into the HTML.

---

## ✅ Solution: Set Environment Variables in Netlify

### Step 1: Go to Netlify Dashboard

1. Open https://app.netlify.com/
2. Click on your site (touristsafety)
3. Go to **Site settings**
4. Click **Environment variables** (in the left sidebar)

### Step 2: Add Environment Variables

Click **Add a variable** and add these:

#### Variable 1: Google Maps API Key
- **Key:** `VITE_GOOGLE_MAPS_API_KEY`
- **Value:** `AIzaSyCbqIsWii1axk962rzDk7Fjg3lTnMGufcg`
- **Scopes:** Select "All scopes" or "Production"

#### Variable 2: API Base URL
- **Key:** `VITE_API_BASE_URL`
- **Value:** `https://tourist-vh25.onrender.com`
- **Scopes:** Select "All scopes" or "Production"

### Step 3: Trigger Redeploy

After adding environment variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 2-3 minutes for build to complete

---

## 🧪 Verify the Fix

### Test 1: Check Build Logs

In Netlify deploy logs, look for:
```
Building site...
✓ built in XXXms
```

No errors about missing environment variables.

### Test 2: Check Deployed Site

Open: https://touristsafety.netlify.app/dashboard

**In browser console, you should see:**
```
✅ Google Maps API loaded successfully
✅ Google Maps API is ready
```

**You should NOT see:**
```
❌ InvalidKeyMapError
❌ YOUR_GOOGLE_MAPS_API_KEY
```

### Test 3: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "maps.googleapis.com"
3. Check the request URL
4. Should show: `key=AIzaSyCbqIsWii1axk962rzDk7Fjg3lTnMGufcg`
5. Should NOT show: `key=YOUR_GOOGLE_MAPS_API_KEY`

---

## 📝 Alternative: Use netlify.toml

I've created a `netlify.toml` file in your project root. This configures Netlify build settings.

**Commit and push:**
```bash
git add netlify.toml NETLIFY_DEPLOYMENT_FIX.md
git commit -m "Add Netlify configuration"
git push origin main
```

Netlify will auto-deploy with the new configuration.

---

## 🔍 Troubleshooting

### Issue: Still shows "YOUR_GOOGLE_MAPS_API_KEY"

**Cause:** Environment variables not set in Netlify

**Solution:**
1. Double-check environment variables in Netlify dashboard
2. Ensure variable name is exactly: `VITE_GOOGLE_MAPS_API_KEY` (case-sensitive)
3. Trigger a new deploy (don't use cached build)

### Issue: InvalidKeyMapError persists

**Cause:** API key is invalid or has restrictions

**Solution:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Check "Application restrictions":
   - Set to "HTTP referrers"
   - Add: `https://touristsafety.netlify.app/*`
   - Add: `https://*.netlify.app/*` (for deploy previews)
4. Check "API restrictions":
   - Ensure "Maps JavaScript API" is enabled
5. Save and wait 2-3 minutes

### Issue: Build succeeds but map still doesn't load

**Cause:** Billing not enabled on Google Cloud

**Solution:**
1. Go to https://console.cloud.google.com/billing
2. Enable billing for your project
3. Add a payment method
4. Wait 5-10 minutes for changes to propagate

---

## 📋 Complete Checklist

### Netlify Configuration
- [ ] Environment variable `VITE_GOOGLE_MAPS_API_KEY` added
- [ ] Environment variable `VITE_API_BASE_URL` added
- [ ] Variables set to "Production" scope
- [ ] Site redeployed after adding variables

### Google Cloud Configuration
- [ ] Billing enabled
- [ ] Maps JavaScript API enabled
- [ ] API key restrictions allow Netlify domain
- [ ] API key is active (not deleted/disabled)

### Verification
- [ ] Build logs show no errors
- [ ] Browser console shows "Google Maps API loaded successfully"
- [ ] No "InvalidKeyMapError" in console
- [ ] Map displays correctly
- [ ] Location tracking works

---

## 🎯 Expected Results

### Before Fix
```
❌ URL: js?key=YOUR_GOOGLE_MAPS_API_KEY
❌ Error: InvalidKeyMapError
❌ Map: "Oops! Something went wrong"
```

### After Fix
```
✅ URL: js?key=AIzaSyCbqIsWii1axk962rzDk7Fjg3lTnMGufcg
✅ Console: "Google Maps API loaded successfully"
✅ Map: Displays correctly with dark theme
✅ Location: Blue pin marker shows user location
```

---

## 🚀 Quick Fix Commands

```bash
# 1. Commit netlify.toml
git add netlify.toml NETLIFY_DEPLOYMENT_FIX.md
git commit -m "Add Netlify configuration for environment variables"
git push origin main

# 2. Set environment variables in Netlify dashboard
# (See Step 2 above)

# 3. Trigger redeploy
# (From Netlify dashboard)

# 4. Test
# Open: https://touristsafety.netlify.app/dashboard
```

---

## 💡 Why This Happens

**Vite Environment Variables:**
- Vite only includes environment variables that start with `VITE_`
- These variables must be set at BUILD TIME (not runtime)
- Netlify needs these variables in its dashboard to inject them during build

**The Build Process:**
1. Netlify clones your repo
2. Netlify reads environment variables from dashboard
3. Vite builds the app and injects `VITE_*` variables
4. HTML plugin replaces `GOOGLE_MAPS_API_KEY_PLACEHOLDER` with actual key
5. Built files are deployed

**If environment variables are missing:**
- Vite can't inject them
- Placeholder remains as "YOUR_GOOGLE_MAPS_API_KEY"
- Google Maps API rejects the invalid key

---

## 📞 Need Help?

If the issue persists:

1. **Check Netlify build logs:**
   - Look for environment variable warnings
   - Check if Vite plugin runs successfully

2. **Verify environment variables:**
   - Go to Site settings → Environment variables
   - Ensure `VITE_GOOGLE_MAPS_API_KEY` is set
   - Check for typos in variable name

3. **Clear Netlify cache:**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Clear cache and deploy site"

4. **Test locally:**
   ```bash
   cd client
   npm run build
   npm run preview
   ```
   If it works locally but not on Netlify, it's an environment variable issue.

---

**Status:** 🔧 Fix ready - Set environment variables in Netlify  
**Next Action:** Add `VITE_GOOGLE_MAPS_API_KEY` to Netlify dashboard  
**Expected Time:** 5 minutes (2 min setup + 3 min redeploy)
