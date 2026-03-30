# Setup Instructions

This guide will help you set up the Net2Vision Tourist Safety Platform on your local machine or for deployment.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Python 3.8+ (for AI service)
- MongoDB (optional, if using database)
- Google Cloud account with billing enabled

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-name>
```

## 2. Environment Variables Setup

### Client Environment Variables

1. **For Development:**
```bash
cd client
cp .env.example .env.development
```

2. Edit `client/.env.development` and add your values:
```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
VITE_API_BASE_URL=http://localhost:5001
```

3. **For Production:**
```bash
cd client
cp .env.production.example .env.production.local
```

4. Edit `client/.env.production.local` and add your production values:
```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
VITE_API_BASE_URL=https://your-production-api.com
```

**Note:** `.env.production.local` is gitignored and safe for local production builds.

### Server Environment Variables

1. Copy the example file:
```bash
cd server
cp .env.example .env
```

2. Edit `server/.env` and add your values:
```env
AI_SERVICE_URL=http://localhost:8000/predict
JWT_SECRET=your_secure_random_jwt_secret
PORT=5001
```

## 3. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing (REQUIRED for Maps API)
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **API Key**
6. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API (if needed)
7. (Optional) Restrict your API key:
   - HTTP referrers for web: `localhost:5173`, `yourdomain.com`
   - API restrictions: Select only the APIs you need
8. Copy the API key and paste it in `client/.env.development`

## 4. Install Dependencies

### Client
```bash
cd client
npm install
```

### Server
```bash
cd server
npm install
```

### AI Service (if applicable)
```bash
cd ai-service
pip install -r requirements.txt
```

## 5. Run the Application

### Development Mode

1. Start the server:
```bash
cd server
npm start
```

2. Start the client:
```bash
cd client
npm run dev
```

3. Start AI service (if applicable):
```bash
cd ai-service
python main.py
```

The application will be available at:
- Client: http://localhost:5173
- Server: http://localhost:5001
- AI Service: http://localhost:8000

## 6. Build for Production

### Client
```bash
cd client
npm run build
```

The production build will be in `client/dist/`

### Server
The server runs as-is in production. Make sure to:
- Set `NODE_ENV=production`
- Use a strong JWT_SECRET
- Configure proper CORS settings
- Use HTTPS in production

## 7. Deployment

### Option 1: Netlify (Client)
1. Build the client: `npm run build`
2. Deploy the `client/dist` folder to Netlify
3. Set environment variables in Netlify dashboard:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_API_BASE_URL`

### Option 2: Vercel (Client)
1. Connect your GitHub repository
2. Set root directory to `client`
3. Add environment variables in Vercel dashboard
4. Deploy

### Option 3: Heroku (Server)
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git or GitHub integration

### Option 4: VPS (Full Stack)
1. Set up nginx as reverse proxy
2. Use PM2 to manage Node.js processes
3. Configure SSL with Let's Encrypt
4. Set up firewall rules

## 8. Security Checklist

Before deploying to production:

- [ ] All API keys are in environment variables (not hardcoded)
- [ ] `.env` files are in `.gitignore`
- [ ] JWT_SECRET is strong and unique
- [ ] Google Maps API key has proper restrictions
- [ ] CORS is configured for your domain only
- [ ] HTTPS is enabled
- [ ] Database credentials are secure
- [ ] Error messages don't expose sensitive information

## 9. Troubleshooting

### Google Maps not loading
- Check if billing is enabled on Google Cloud
- Verify API key is correct in `.env.development`
- Check browser console for errors
- Ensure Maps JavaScript API is enabled

### API connection errors
- Verify `VITE_API_BASE_URL` points to correct server
- Check if server is running
- Check CORS configuration

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`
- Check Node.js version compatibility

## 10. Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Documentation](https://react.dev/)

## Support

For issues or questions, please open an issue on GitHub or contact the development team.
