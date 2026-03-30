# 🚀 Quick Deploy Checklist - Render Uptime Fix

## ✅ Pre-Deployment

- [x] Health check route added at `/`
- [x] Alternative health route added at `/health`
- [x] Error handling middleware added
- [x] 404 handler added
- [x] Server uses `process.env.PORT`

## 📦 Deploy to Render

```bash
# 1. Commit changes
git add server/index.js
git commit -m "Add health check routes for Render uptime"

# 2. Push to GitHub
git push origin main

# 3. Render auto-deploys (wait 2-3 minutes)
```

## 🧪 Test After Deployment

### Quick Test (Browser)
Open: `https://your-render-url.onrender.com/`

**Expected:** JSON with "Server is running 🚀"

### Command Line Test
```bash
curl https://your-render-url.onrender.com/
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Server is running 🚀",
  "timestamp": "2024-03-30T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

## 🔍 Setup UptimeRobot

1. Go to: https://uptimerobot.com/dashboard
2. Click: "Add New Monitor"
3. Configure:
   - Type: HTTP(s)
   - URL: `https://your-render-url.onrender.com/`
   - Interval: 5 minutes
4. Save

## ✅ Verify Success

- [ ] Browser shows "Server is running 🚀"
- [ ] curl returns 200 status
- [ ] UptimeRobot shows "UP"
- [ ] Frontend loads AI safety score
- [ ] No "UNKNOWN (AI ERROR)" messages

## 🎯 Expected Results

**Before:**
- ❌ Backend DOWN
- ❌ 504 timeout errors
- ❌ "UNKNOWN (AI ERROR)"

**After:**
- ✅ Backend UP (99%+ uptime)
- ✅ Fast response (< 1s)
- ✅ AI safety score loads

---

**Need Help?** See `RENDER_UPTIME_FIX.md` for detailed guide.
