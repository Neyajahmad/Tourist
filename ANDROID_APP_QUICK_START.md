# Net2Vision Android App - Quick Start Guide

## 📱 Project Summary
Build a native Android app using **Kotlin + XML** that replicates your Net2Vision web application with Firebase authentication.

## 🎯 Core Requirements

### Authentication
- **User Login/Register:** Firebase Email/Password
- **Admin Login:** Hardcoded or Firebase custom claims
- Same UI as web (mobile version)

### User Dashboard (3 Tabs)
1. **Map Tab:**
   - Google Maps with real-time location
   - Speed calculation (km/h)
   - Path tracking (polyline)
   - Restricted zones & crowded areas
   - Landmarks display

2. **SOS Tab:**
   - User profile card
   - AI Safety Score (0-100%) with dynamic colors
   - SOS Alert button (pulsing animation)
   - 60-second cooldown
   - Location validation (allowed areas only)
   - Safety alerts list

3. **Chat Tab:**
   - Real-time messaging with admin
   - Text messages
   - Voice recording & playback
   - Socket.IO integration
   - Auto-scroll

### Admin Dashboard
- Active users list with locations
- SOS alerts management
- Real-time map showing all users
- Chat with individual users
- Statistics cards

## 🛠️ Tech Stack

```
Language: Kotlin
UI: XML + Material Design 3
Auth: Firebase Authentication
Database: Firebase Firestore
Real-time: Socket.IO Client
Maps: Google Maps SDK
Location: FusedLocationProviderClient
Network: Retrofit2 + OkHttp3
Architecture: MVVM
DI: Hilt/Dagger
```

## 📦 Key Dependencies

```gradle
// Firebase
implementation platform('com.google.firebase:firebase-bom:32.7.0')
implementation 'com.google.firebase:firebase-auth-ktx'
implementation 'com.google.firebase:firebase-firestore-ktx'

// Maps & Location
implementation 'com.google.android.gms:play-services-maps:18.2.0'
implementation 'com.google.android.gms:play-services-location:21.1.0'

// Networking
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'io.socket:socket.io-client:2.1.0'

// UI
implementation 'com.google.android.material:material:1.11.0'
implementation 'com.google.android.exoplayer:exoplayer:2.19.1' // Video backgrounds
```

## 🚀 10-Week Implementation Plan

**Week 1:** Project setup + Firebase configuration
**Week 2:** Authentication screens (Login, Register, Admin)
**Week 3:** Map Fragment (Google Maps + Location tracking)
**Week 4:** SOS Fragment (Safety score + SOS button)
**Week 5:** Chat Fragment (Socket.IO + Audio recording)
**Week 6:** Admin Dashboard (Users list + SOS management)
**Week 7:** Background services + Modals
**Week 8:** Testing + Bug fixes
**Week 9:** Beta testing + Polish
**Week 10:** Release preparation + Deployment

## 📋 Must-Have Features

✅ Firebase Email/Password authentication
✅ Real-time location tracking with Google Maps
✅ AI safety percentage calculation (API call)
✅ SOS button with cooldown & location validation
✅ Real-time chat (text + audio) via Socket.IO
✅ Admin dashboard with user monitoring
✅ Video backgrounds on auth screens
✅ Material Design 3 UI matching web app
✅ Foreground service for location tracking
✅ Push notifications for SOS alerts

## 🔑 API Endpoints to Use

```
POST /api/auth/login          - User login (optional, use Firebase)
POST /api/auth/register       - User registration (optional, use Firebase)
POST /api/incidents/check-risk - AI risk calculation (REQUIRED)
GET  /api/geo/map-data        - Get restricted zones, landmarks (REQUIRED)
```

## 🔌 Socket.IO Events

**Emit:**
- `join` - Join user room
- `locationUpdate` - Send location updates
- `sosTrigger` - Trigger SOS alert
- `userMessage` - Send chat message

**Listen:**
- `adminMessage` - Receive admin messages
- `locationUpdate` - Receive user location (admin)
- `sosTrigger` - Receive SOS alerts (admin)

## 📱 Screens to Build

1. **LandingActivity** - Splash with video + 2 buttons
2. **LoginActivity** - Email/Password login
3. **RegisterActivity** - User registration
4. **AdminLoginActivity** - Admin login
5. **DashboardActivity** - Main app (3 fragments)
   - MapFragment
   - SOSFragment
   - ChatFragment
6. **AdminDashboardActivity** - Admin panel

## 🎨 Design System

**Colors:**
- Primary: #3B82F6 (Blue)
- Success: #10b981 (Green)
- Warning: #f59e0b (Amber)
- Danger: #ef4444 (Red)
- Background: #0f172a (Dark)

**Typography:** Inter font family
**Corner Radius:** 12-16dp for cards/buttons
**Elevation:** 4-8dp for cards

## 🔐 Permissions Required

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

## 📖 Full Documentation

See `ANDROID_APP_DEVELOPMENT_PROMPT.md` for:
- Complete feature specifications
- Detailed code examples
- XML layouts
- API integration guides
- Testing requirements
- Deployment checklist

---

**Start with Phase 1 and follow the checklist!** 🚀
