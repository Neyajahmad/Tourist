# 🚀 Deployment Guide - Net2Vision Tourist Safety Platform

## ✅ Pre-Deployment Status

**Build Status:** ✅ Successful
**All Features:** ✅ Working
**Code Quality:** ✅ Production Ready

## 🔑 Critical Configuration

### 1. Google Maps API Key
**Setup Required:** Configure your own Google Maps API key in environment variables
**Location:** `client/.env.development` or `client/.env.production`

**Verify:**
- [ ] API key is valid
- [ ] Billing is enabled
- [ ] Maps JavaScript API is enabled
- [ ] API restrictions configured for production domain

### 2. API Base URL
**Current:** `http://localhost:5001` (development)
**Production:** Update via environment variable

**Files to check:**
- `client/src/pages/Dashboard.jsx` (line ~48)
- `client/src/pages/AdminDashboard.jsx` (line ~11)

**Set environment variable:**
```bash
VITE_API_BASE_URL=https://your-production-api.com
```

## 📦 Build for Production

### Step 1: Install Dependencies
```bash
cd client
npm install
```

### Step 2: Create Production Build
```bash
npm run build
```

**Output:**
- Build folder: `client/dist/`
- Bundle size: ~554 KB (gzipped: ~170 KB)
- Build time: ~700ms

### Step 3: Test Production Build Locally
```bash
npm run preview
```

## 🌐 Deployment Options

### Option A: Netlify (Recommended for Frontend)

1. **Connect Repository**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy
   cd client
   netlify deploy --prod
   ```

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables:
     - `VITE_API_BASE_URL`: Your backend URL

3. **Add _redirects file** (already in `client/public/_redirects`)
   ```
   /*    /index.html   200
   ```

### Option B: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd client
   vercel --prod
   ```

3. **Configure**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

### Option C: Traditional Server (Apache/Nginx)

1. **Build the app**
   ```bash
   cd client
   npm run build
   ```

2. **Copy dist folder to server**
   ```bash
   scp -r dist/* user@server:/var/www/html/
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       root /var/www/html;
       index index.html;
       
       # SPA routing
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # API proxy (optional)
       location /api {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔒 Security Configuration

### 1. HTTPS Setup (CRITICAL)
**Why:** Geolocation API requires HTTPS

**Using Let's Encrypt (Free):**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 2. Environment Variables

**Create `.env.production`:**
```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_GOOGLE_MAPS_API_KEY=your-production-key
```

### 3. Google Maps API Restrictions

**HTTP Referrers:**
```
https://your-domain.com/*
https://www.your-domain.com/*
```

**API Restrictions:**
- Enable: Maps JavaScript API
- Enable: Geolocation API

## 🖥️ Backend Deployment

### Server Requirements
- Node.js 18+
- MongoDB
- Socket.IO support

### Deploy Backend

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment**
   ```env
   PORT=5001
   MONGODB_URI=mongodb://...
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

3. **Start server**
   ```bash
   npm start
   ```

4. **Use PM2 for production**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "net2vision-api"
   pm2 save
   pm2 startup
   ```

### CORS Configuration
```javascript
// server/index.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com'
  ],
  credentials: true
}));
```

### Socket.IO Configuration
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: [
      'https://your-domain.com',
      'https://www.your-domain.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

## 🧪 Post-Deployment Testing

### 1. Smoke Tests

**User Dashboard:**
```
✓ Map loads
✓ Location permission prompt
✓ Blue pin marker appears
✓ Pulsing circles animate
✓ Location updates in real-time
✓ SOS button works
✓ Chat opens
```

**Admin Dashboard:**
```
✓ Login works
✓ Tourist list loads
✓ Online/offline status shows
✓ Click tourist → map centers
✓ Green pin markers show
✓ SOS alerts appear (red pins)
✓ Chat with tourists works
✓ Map clustering works
```

### 2. Mobile Testing

**Test on actual devices:**
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad/Android)

**Verify:**
- [ ] Touch interactions work
- [ ] Mobile tabs function
- [ ] Map is responsive
- [ ] Location tracking works
- [ ] SOS button accessible

### 3. Performance Testing

**Tools:**
- Google Lighthouse
- WebPageTest
- GTmetrix

**Target Metrics:**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

## 🐛 Troubleshooting

### Issue: Map Not Loading

**Check:**
1. Browser console for errors
2. API key is valid
3. Billing enabled
4. HTTPS enabled
5. Domain in API restrictions

**Fix:**
```javascript
// Check in browser console
console.log('Google Maps loaded:', !!window.google);
```

### Issue: Location Not Working

**Check:**
1. HTTPS enabled (required!)
2. Permission granted
3. GPS enabled on device
4. Not in incognito mode

**Fix:**
```javascript
// Test geolocation
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('Location:', pos.coords),
  (err) => console.error('Error:', err)
);
```

### Issue: Socket.IO Not Connecting

**Check:**
1. Server running
2. CORS configured
3. Firewall allows WebSocket
4. API URL correct

**Fix:**
```javascript
// Check connection
socket.on('connect', () => console.log('Connected'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

### Issue: Markers Not Showing

**Check:**
1. Data format correct
2. Coordinates valid
3. Marker type specified
4. Map initialized

**Debug:**
```javascript
console.log('Markers:', markers);
console.log('Map instance:', mapInstanceRef.current);
```

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/react
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### 2. Analytics (Google Analytics)

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. Uptime Monitoring

**Services:**
- UptimeRobot (free)
- Pingdom
- StatusCake

**Monitor:**
- Frontend URL
- Backend API
- Socket.IO endpoint

## 🔄 CI/CD Setup (Optional)

### GitHub Actions

**Create `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd client
        npm install
    
    - name: Build
      run: |
        cd client
        npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
    
    - name: Deploy to Netlify
      uses: netlify/actions/cli@master
      with:
        args: deploy --prod --dir=client/dist
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## ✅ Final Checklist

### Before Deployment
- [ ] Build successful
- [ ] All tests passing
- [ ] Environment variables set
- [ ] API keys configured
- [ ] HTTPS certificate ready
- [ ] Database backed up
- [ ] CORS configured
- [ ] Socket.IO configured

### After Deployment
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] Socket.IO connected
- [ ] Map loads correctly
- [ ] Location tracking works
- [ ] SOS alerts function
- [ ] Chat system works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Monitoring active

## 🎉 Deployment Complete!

Your Net2Vision Tourist Safety Platform is now live!

**Features Deployed:**
- ✅ Real-time location tracking
- ✅ Google Maps with pin markers
- ✅ SOS alert system
- ✅ Admin monitoring dashboard
- ✅ Chat functionality
- ✅ Mobile responsive design
- ✅ Dark theme
- ✅ Accuracy visualization

**Next Steps:**
1. Monitor for errors
2. Gather user feedback
3. Optimize performance
4. Add new features
5. Scale as needed

---

**Support:** Check documentation files
**Version:** 1.0.0
**Status:** 🚀 Production Ready
