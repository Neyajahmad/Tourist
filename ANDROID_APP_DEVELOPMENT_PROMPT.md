# Net2Vision Android App Development - Complete Specification

## 🎯 Project Overview
Build a native Android application using **Kotlin** and **XML** that replicates ALL features of the Net2Vision web application with Firebase authentication integration.

## 📱 App Name & Branding
- **App Name:** Net2Vision
- **Package Name:** com.net2vision.touristsafety
- **Icon:** Shield with eye/vision symbol (blue gradient #3B82F6 → #2563EB → #1D4ED8)
- **Theme Colors:**
  - Primary: #3B82F6 (Blue 500)
  - Secondary: #2563EB (Blue 600)
  - Accent: #10b981 (Green 500)
  - Warning: #f59e0b (Amber 500)
  - Danger: #ef4444 (Red 500)
  - Background: #0f172a (Slate 900)

## 🏗️ Architecture & Tech Stack

### Core Technologies
- **Language:** Kotlin
- **UI:** XML Layouts with Material Design 3
- **Authentication:** Firebase Authentication (Email/Password)
- **Database:** Firebase Firestore
- **Real-time:** Firebase Realtime Database + Socket.IO client
- **Maps:** Google Maps SDK for Android
- **Location:** FusedLocationProviderClient
- **Networking:** Retrofit2 + OkHttp3
- **Image Loading:** Glide
- **Dependency Injection:** Hilt/Dagger
- **Architecture:** MVVM (Model-View-ViewModel)
- **Coroutines:** Kotlin Coroutines for async operations

### Project Structure
```
app/
├── src/main/
│   ├── java/com/net2vision/touristsafety/
│   │   ├── data/
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   └── remote/
│   │   ├── ui/
│   │   │   ├── landing/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   └── admin/
│   │   ├── utils/
│   │   ├── di/
│   │   └── MainActivity.kt
│   ├── res/
│   │   ├── layout/
│   │   ├── drawable/
│   │   ├── values/
│   │   └── navigation/
│   └── AndroidManifest.xml
```


## 📋 Complete Feature List

### 1. Landing Screen (Splash/Welcome)
**XML Layout:** `activity_landing.xml`
**Kotlin Class:** `LandingActivity.kt`

**Features:**
- Full-screen video background (use VideoView or ExoPlayer)
- App logo and tagline animation
- Two prominent buttons:
  - "Tourist Login & Register" (Blue gradient)
  - "Admin Dashboard Login" (Dark with border)
- Auto-navigate if user already logged in
- Smooth fade-in animations

**UI Components:**
- VideoView for background
- ImageView for logo overlay
- TextView for tagline
- MaterialButton (2x) for navigation
- ConstraintLayout for positioning

---

### 2. User Authentication Module

#### 2.1 User Login Screen
**XML Layout:** `activity_login.xml`
**Kotlin Class:** `LoginActivity.kt`

**Features:**
- Video background (same as web)
- Firebase Email/Password authentication
- Email input field with validation
- Password input field with show/hide toggle
- "Login" button with loading state
- "Create Account" link to registration
- "Back to Home" button
- Error message display (Toast/Snackbar)
- Remember me checkbox (optional)
- Location permission request on successful login

**Firebase Integration:**
```kotlin
FirebaseAuth.getInstance().signInWithEmailAndPassword(email, password)
```

**UI Components:**
- VideoView background
- TextInputLayout (2x) for email/password
- MaterialButton for login
- TextView for "Create Account" link
- ProgressBar for loading state
- Back button (ImageButton)


#### 2.2 User Registration Screen
**XML Layout:** `activity_register.xml`
**Kotlin Class:** `RegisterActivity.kt`

**Features:**
- Video background
- Firebase user creation
- Input fields:
  - Full Name (TextInputLayout)
  - Phone Number (TextInputLayout with phone format)
  - Email Address (TextInputLayout with email validation)
  - Password (TextInputLayout with strength indicator)
- Blockchain identity hash generation (client-side)
- "Create Account" button with loading state
- "Already have account? Login" link
- Success dialog showing user details
- Auto-navigate to login after registration

**Firebase Integration:**
```kotlin
FirebaseAuth.getInstance().createUserWithEmailAndPassword(email, password)
// Store additional user data in Firestore
FirebaseFirestore.getInstance().collection("users").document(uid).set(userData)
```

**UI Components:**
- VideoView background
- TextInputLayout (4x) for inputs
- MaterialButton for registration
- TextView for login link
- ProgressBar for loading
- AlertDialog for success message

---

#### 2.3 Admin Login Screen
**XML Layout:** `activity_admin_login.xml`
**Kotlin Class:** `AdminLoginActivity.kt`

**Features:**
- Different video background (admin theme)
- Hardcoded admin credentials check OR Firebase custom claims
- Admin ID input (email format)
- Password input
- "Access Dashboard" button
- Error handling for invalid credentials
- Navigate to Admin Dashboard on success

**Admin Credentials:**
- Email: admin@gmail.com
- Password: 12345678
- OR use Firebase custom claims: `user.getIdToken().claims['admin'] == true`


---

### 3. User Dashboard (Main Feature)

#### 3.1 Dashboard Layout
**XML Layout:** `activity_dashboard.xml` with `fragment_map.xml`, `fragment_sos.xml`, `fragment_chat.xml`
**Kotlin Class:** `DashboardActivity.kt` + 3 Fragments

**Bottom Navigation Tabs:**
1. **Map** (MapPin icon)
2. **SOS** (Siren icon)
3. **Chat** (MessageSquare icon)

**Features:**
- BottomNavigationView for tab switching
- ViewPager2 for smooth fragment transitions
- Persistent user session
- Real-time location tracking
- Socket.IO connection for real-time updates

---

#### 3.2 Map Fragment
**XML Layout:** `fragment_map.xml`
**Kotlin Class:** `MapFragment.kt`

**Features:**
- Google Maps integration (MapView/SupportMapFragment)
- Real-time user location marker
- Location tracking with FusedLocationProviderClient
- Speed calculation (km/h) with EMA smoothing
- Path polyline showing user movement trail (last 300 points)
- Floating info card showing:
  - Current coordinates (lat, lng)
  - Current speed (km/h)
  - Nearest landmark name
- Restricted zones (orange circles)
- Crowded areas (red circles)
- Landmarks markers
- Auto-center on user location
- Zoom controls

**Location Permissions:**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**Google Maps Setup:**
```kotlin
val mapFragment = supportFragmentManager.findFragmentById(R.id.map) as SupportMapFragment
mapFragment.getMapAsync { googleMap ->
    // Setup map
}
```

**Real-time Location:**
```kotlin
fusedLocationClient.requestLocationUpdates(
    locationRequest,
    locationCallback,
    Looper.getMainLooper()
)
```


#### 3.3 SOS Fragment
**XML Layout:** `fragment_sos.xml`
**Kotlin Class:** `SOSFragment.kt`

**Features:**
- User profile card:
  - Profile avatar (first letter of name)
  - Welcome message
  - User name
  - Logout button
- Safety Score Card:
  - Large percentage display (0-100%)
  - Risk level label (SAFE/WARNING/EMERGENCY)
  - Dynamic background color:
    - Green (#10b981) for Safe
    - Amber (#f59e0b) for Warning
    - Red (#ef4444) for Emergency
- Large SOS Alert Button:
  - Pulsing animation
  - Siren icon + "🚨 SOS ALERT" text
  - 60-second cooldown after trigger
  - Location validation (allowed areas only)
- Safety Alerts section:
  - List of warnings (restricted zones, crowded areas)
  - Real-time updates
- Admin messages display (if any)

**SOS Logic:**
```kotlin
// Check if in allowed area
val allowedAreas = listOf(
    Area("Delhi", 28.6139, 77.2090, 50000),
    Area("LPU", 31.2536, 75.7056, 5000),
    Area("Amritsar", 31.6340, 74.8723, 30000)
)

// Calculate distance using Haversine formula
fun isInAllowedArea(lat: Double, lng: Double): Boolean {
    return allowedAreas.any { area ->
        calculateDistance(lat, lng, area.lat, area.lng) <= area.radius
    }
}

// Trigger SOS
if (isInAllowedArea(currentLat, currentLng)) {
    // Send SOS via Socket.IO
    socket.emit("sosTrigger", sosData)
    // Show success modal
} else {
    // Show restricted area modal
}
```

**AI Risk Calculation:**
- Call backend API: `POST /api/incidents/check-risk`
- Payload: speed, movement_gap, area_risk, time_hour, lat, lng, touristId
- Response: risk_level, risk_score
- Update UI every 30 seconds


#### 3.4 Chat Fragment
**XML Layout:** `fragment_chat.xml`
**Kotlin Class:** `ChatFragment.kt`

**Features:**
- Emergency Support chat header
- Scrollable messages RecyclerView:
  - User messages (right-aligned, blue background)
  - Admin messages (left-aligned, gray background)
  - Text messages
  - Audio messages (with play button)
  - Timestamps
  - Auto-scroll to bottom on new message
- Message input area:
  - EditText for typing
  - Send button (disabled when empty)
  - Voice recording button
- Voice recording controls:
  - Record button → starts recording
  - Pause/Resume button
  - Send button (sends audio)
  - Cancel button (discards audio)
- Real-time Socket.IO integration:
  - Listen for 'adminMessage' events
  - Emit 'userMessage' events
- Audio recording using MediaRecorder
- Audio playback using MediaPlayer

**Socket.IO Integration:**
```kotlin
// Connect
socket = IO.socket("http://your-api-url")
socket.connect()

// Join room
socket.emit("join", userId)

// Listen for admin messages
socket.on("adminMessage") { args ->
    val message = args[0] as JSONObject
    // Add to chat
}

// Send user message
socket.emit("userMessage", JSONObject().apply {
    put("fromUserId", userId)
    put("type", "text")
    put("text", messageText)
})
```

**Audio Recording:**
```kotlin
val mediaRecorder = MediaRecorder().apply {
    setAudioSource(MediaRecorder.AudioSource.MIC)
    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
    setOutputFile(audioFile.absolutePath)
    prepare()
    start()
}
```

**RecyclerView Adapter:**
- ViewType: USER_TEXT, USER_AUDIO, ADMIN_TEXT, ADMIN_AUDIO
- DiffUtil for efficient updates
- Auto-scroll to bottom


---

### 4. Admin Dashboard

#### 4.1 Admin Dashboard Layout
**XML Layout:** `activity_admin_dashboard.xml`
**Kotlin Class:** `AdminDashboardActivity.kt`

**Features:**
- Top app bar with:
  - "Admin Dashboard" title
  - Logout button
- Statistics cards:
  - Total Active Users (count)
  - Active SOS Alerts (count)
  - Total Incidents (count)
- Active Users List (RecyclerView):
  - User avatar
  - User name
  - Current location (lat, lng)
  - Safety status badge
  - Speed indicator
  - "View on Map" button
  - "Send Message" button
- SOS Alerts List (RecyclerView):
  - User name
  - Phone number
  - Location
  - Timestamp
  - "Respond" button
  - "Mark Resolved" button
- Real-time updates via Socket.IO
- Google Maps view showing all active users

**Socket.IO Admin Events:**
```kotlin
// Listen for location updates
socket.on("locationUpdate") { args ->
    val data = args[0] as JSONObject
    // Update user location on map
}

// Listen for SOS triggers
socket.on("sosTrigger") { args ->
    val sosData = args[0] as JSONObject
    // Add to SOS alerts list
    // Show notification
}

// Send message to user
socket.emit("adminMessage", JSONObject().apply {
    put("toUserId", userId)
    put("type", "text")
    put("text", messageText)
})
```

**Admin Chat Dialog:**
- Bottom sheet or dialog for chatting with specific user
- Text input
- Voice recording
- Message history
- Real-time updates


---

### 5. Modals & Dialogs

#### 5.1 Disclaimer Modal
**XML Layout:** `dialog_disclaimer.xml`
**Show on:** First dashboard launch

**Content:**
- App disclaimer text
- Safety guidelines
- Terms of use
- "I Understand" button
- Store in SharedPreferences (don't show again)

#### 5.2 SOS Success Modal
**XML Layout:** `dialog_sos_success.xml`
**Show on:** SOS trigger success

**Content:**
- Success icon (checkmark)
- "SOS Alert Sent Successfully"
- "Help is on the way" message
- Emergency contact info
- "OK" button

#### 5.3 SOS Cooldown Modal
**XML Layout:** `dialog_sos_cooldown.xml`
**Show on:** SOS trigger during cooldown

**Content:**
- Warning icon
- "Please wait" message
- Countdown timer (seconds remaining)
- "OK" button

#### 5.4 Restricted Area Modal
**XML Layout:** `dialog_restricted_area.xml`
**Show on:** SOS trigger outside allowed areas

**Content:**
- Warning icon
- "SOS Not Available in This Area"
- List of allowed areas with distances
- "OK" button

---

### 6. Permissions & Services

#### 6.1 Required Permissions
```xml
<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Audio -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Foreground Service -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

#### 6.2 Location Tracking Service
**Class:** `LocationTrackingService.kt`

**Features:**
- Foreground service with notification
- Continuous location updates
- Send updates to server via Socket.IO
- Battery-optimized (use PRIORITY_BALANCED_POWER_ACCURACY)
- Auto-restart on app kill


---

### 7. Data Models

#### 7.1 User Model
```kotlin
data class User(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val identityHash: String = "",
    val role: String = "user", // "user" or "admin"
    val createdAt: Long = System.currentTimeMillis()
)
```

#### 7.2 Location Model
```kotlin
data class LocationData(
    val lat: Double,
    val lng: Double,
    val speed: Double = 0.0,
    val timestamp: Long = System.currentTimeMillis()
)
```

#### 7.3 Risk Model
```kotlin
data class RiskData(
    val label: String = "Safe", // "Safe", "Warning", "Emergency"
    val score: Int = 0 // 0-100
)
```

#### 7.4 Message Model
```kotlin
data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val from: String, // "me" or "admin"
    val type: String, // "text" or "audio"
    val text: String? = null,
    val audioUrl: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
```

#### 7.5 SOS Model
```kotlin
data class SOSAlert(
    val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val userName: String,
    val phone: String,
    val location: LocationData,
    val timestamp: Long = System.currentTimeMillis(),
    val status: String = "active" // "active", "responding", "resolved"
)
```

---

### 8. API Integration

#### 8.1 Retrofit Setup
```kotlin
interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body credentials: LoginRequest): Response<LoginResponse>
    
    @POST("api/auth/register")
    suspend fun register(@Body userData: RegisterRequest): Response<RegisterResponse>
    
    @POST("api/incidents/check-risk")
    suspend fun checkRisk(@Body riskData: RiskRequest): Response<RiskResponse>
    
    @GET("api/geo/map-data")
    suspend fun getMapData(): Response<MapDataResponse>
}
```

#### 8.2 API Base URL
```kotlin
const val API_BASE_URL = "http://your-backend-url:5001/"
// OR use BuildConfig for different environments
```


---

### 9. Firebase Configuration

#### 9.1 Firebase Setup Steps
1. Create Firebase project at console.firebase.google.com
2. Add Android app with package name: `com.net2vision.touristsafety`
3. Download `google-services.json` and place in `app/` directory
4. Enable Firebase Authentication (Email/Password)
5. Create Firestore database
6. Set up Firestore security rules

#### 9.2 Firestore Structure
```
users/
  {userId}/
    - name: String
    - email: String
    - phone: String
    - identityHash: String
    - role: String
    - createdAt: Timestamp

incidents/
  {incidentId}/
    - userId: String
    - location: GeoPoint
    - riskScore: Number
    - riskLevel: String
    - timestamp: Timestamp

sosAlerts/
  {alertId}/
    - userId: String
    - userName: String
    - phone: String
    - location: GeoPoint
    - status: String
    - timestamp: Timestamp
```

#### 9.3 Firebase Dependencies
```gradle
// Firebase BOM
implementation platform('com.google.firebase:firebase-bom:32.7.0')

// Firebase products
implementation 'com.google.firebase:firebase-auth-ktx'
implementation 'com.google.firebase:firebase-firestore-ktx'
implementation 'com.google.firebase:firebase-database-ktx'
implementation 'com.google.firebase:firebase-messaging-ktx'
implementation 'com.google.firebase:firebase-analytics-ktx'
```

---

### 10. Dependencies (build.gradle)

```gradle
dependencies {
    // Core Android
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    
    // Lifecycle & ViewModel
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    implementation 'androidx.activity:activity-ktx:1.8.2'
    implementation 'androidx.fragment:fragment-ktx:1.6.2'
    
    // Navigation
    implementation 'androidx.navigation:navigation-fragment-ktx:2.7.6'
    implementation 'androidx.navigation:navigation-ui-ktx:2.7.6'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    
    // Retrofit & OkHttp
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'
    
    // Socket.IO
    implementation 'io.socket:socket.io-client:2.1.0'
    
    // Google Maps
    implementation 'com.google.android.gms:play-services-maps:18.2.0'
    implementation 'com.google.android.gms:play-services-location:21.1.0'
    
    // Firebase
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-auth-ktx'
    implementation 'com.google.firebase:firebase-firestore-ktx'
    
    // Image Loading
    implementation 'com.github.bumptech.glide:glide:4.16.0'
    
    // Hilt (Dependency Injection)
    implementation 'com.google.dagger:hilt-android:2.50'
    kapt 'com.google.dagger:hilt-compiler:2.50'
    
    // ExoPlayer (for video backgrounds)
    implementation 'com.google.android.exoplayer:exoplayer:2.19.1'
    
    // Lottie (for animations)
    implementation 'com.airbnb.android:lottie:6.3.0'
}
```


---

### 11. UI/UX Design Guidelines

#### 11.1 Color Scheme
```xml
<!-- res/values/colors.xml -->
<resources>
    <color name="primary">#3B82F6</color>
    <color name="primary_dark">#2563EB</color>
    <color name="primary_darker">#1D4ED8</color>
    <color name="accent_green">#10b981</color>
    <color name="accent_amber">#f59e0b</color>
    <color name="accent_red">#ef4444</color>
    <color name="background">#0f172a</color>
    <color name="surface">#1e293b</color>
    <color name="text_primary">#ffffff</color>
    <color name="text_secondary">#cbd5e1</color>
</resources>
```

#### 11.2 Typography
```xml
<!-- res/values/themes.xml -->
<style name="TextAppearance.Net2Vision.Headline1" parent="TextAppearance.MaterialComponents.Headline1">
    <item name="fontFamily">@font/inter_bold</item>
    <item name="android:textSize">32sp</item>
    <item name="android:textColor">@color/text_primary</item>
</style>

<style name="TextAppearance.Net2Vision.Body1" parent="TextAppearance.MaterialComponents.Body1">
    <item name="fontFamily">@font/inter_regular</item>
    <item name="android:textSize">16sp</item>
    <item name="android:textColor">@color/text_secondary</item>
</style>
```

#### 11.3 Button Styles
```xml
<!-- Primary Button -->
<style name="Widget.Net2Vision.Button.Primary" parent="Widget.MaterialComponents.Button">
    <item name="backgroundTint">@color/primary</item>
    <item name="android:textColor">@color/text_primary</item>
    <item name="cornerRadius">14dp</item>
    <item name="android:paddingVertical">16dp</item>
    <item name="android:textAllCaps">false</item>
    <item name="fontFamily">@font/inter_bold</item>
</style>

<!-- SOS Button -->
<style name="Widget.Net2Vision.Button.SOS" parent="Widget.MaterialComponents.Button">
    <item name="backgroundTint">@color/accent_red</item>
    <item name="android:textColor">@color/text_primary</item>
    <item name="cornerRadius">16dp</item>
    <item name="android:paddingVertical">20dp</item>
    <item name="android:textSize">18sp</item>
    <item name="fontFamily">@font/inter_bold</item>
</style>
```

#### 11.4 Card Styles
```xml
<style name="Widget.Net2Vision.CardView" parent="Widget.MaterialComponents.CardView">
    <item name="cardBackgroundColor">@color/surface</item>
    <item name="cardCornerRadius">16dp</item>
    <item name="cardElevation">8dp</item>
    <item name="contentPadding">16dp</item>
</style>
```

---

### 12. Animations

#### 12.1 Fade In Animation
```xml
<!-- res/anim/fade_in.xml -->
<alpha xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="500"
    android:fromAlpha="0.0"
    android:toAlpha="1.0" />
```

#### 12.2 Slide Up Animation
```xml
<!-- res/anim/slide_up.xml -->
<translate xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="300"
    android:fromYDelta="100%"
    android:toYDelta="0%" />
```

#### 12.3 Pulse Animation (for SOS button)
```kotlin
val pulseAnimation = ObjectAnimator.ofFloat(sosButton, "scaleX", 1f, 1.1f, 1f).apply {
    duration = 1000
    repeatCount = ObjectAnimator.INFINITE
    repeatMode = ObjectAnimator.REVERSE
}
```


---

### 13. Testing Requirements

#### 13.1 Unit Tests
- ViewModel tests
- Repository tests
- Utility function tests (Haversine distance, speed calculation)

#### 13.2 Instrumentation Tests
- Login flow
- Registration flow
- Location tracking
- SOS trigger
- Chat functionality

#### 13.3 UI Tests (Espresso)
- Navigation between screens
- Button clicks
- Form validation
- Dialog interactions

---

### 14. Build Variants

```gradle
android {
    buildTypes {
        debug {
            applicationIdSuffix ".debug"
            debuggable true
            buildConfigField "String", "API_BASE_URL", "\"http://10.0.2.2:5001/\""
        }
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            buildConfigField "String", "API_BASE_URL", "\"https://your-production-api.com/\""
        }
    }
}
```

---

### 15. ProGuard Rules

```proguard
# Retrofit
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}

# Socket.IO
-keep class io.socket.** { *; }
-keep class org.json.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }

# Glide
-keep public class * implements com.bumptech.glide.module.GlideModule
```

---

### 16. Security Considerations

1. **API Keys:** Store in BuildConfig or local.properties (not in version control)
2. **Firebase Rules:** Implement proper Firestore security rules
3. **SSL Pinning:** Implement certificate pinning for API calls
4. **Data Encryption:** Encrypt sensitive data in SharedPreferences
5. **ProGuard:** Enable code obfuscation for release builds
6. **Root Detection:** Implement root detection for security-critical features

---

### 17. Performance Optimization

1. **Location Updates:** Use appropriate priority (BALANCED_POWER_ACCURACY)
2. **Image Loading:** Use Glide with proper caching
3. **RecyclerView:** Use DiffUtil for efficient updates
4. **Memory Leaks:** Use LeakCanary for detection
5. **Network Calls:** Implement proper caching with OkHttp
6. **Background Work:** Use WorkManager for scheduled tasks


---

### 18. Implementation Checklist

#### Phase 1: Project Setup (Week 1)
- [ ] Create Android Studio project
- [ ] Setup Firebase project and add google-services.json
- [ ] Add all dependencies to build.gradle
- [ ] Setup MVVM architecture folders
- [ ] Configure Hilt for dependency injection
- [ ] Setup Retrofit and API service
- [ ] Add Google Maps API key
- [ ] Create color scheme and themes
- [ ] Add app icon and splash screen

#### Phase 2: Authentication (Week 2)
- [ ] Create Landing screen with video background
- [ ] Implement User Login with Firebase
- [ ] Implement User Registration with Firebase
- [ ] Implement Admin Login
- [ ] Add form validation
- [ ] Handle authentication errors
- [ ] Store user session
- [ ] Implement auto-login

#### Phase 3: User Dashboard - Map (Week 3)
- [ ] Create Dashboard activity with BottomNavigationView
- [ ] Implement Map Fragment with Google Maps
- [ ] Request location permissions
- [ ] Implement real-time location tracking
- [ ] Calculate and display speed
- [ ] Draw path polyline
- [ ] Add restricted zones and crowded areas
- [ ] Fetch and display landmarks
- [ ] Create floating info card

#### Phase 4: User Dashboard - SOS (Week 4)
- [ ] Create SOS Fragment layout
- [ ] Implement user profile card
- [ ] Create Safety Score card with dynamic colors
- [ ] Implement SOS button with pulse animation
- [ ] Add location validation (allowed areas)
- [ ] Implement 60-second cooldown
- [ ] Integrate AI risk calculation API
- [ ] Create SOS success modal
- [ ] Create restricted area modal
- [ ] Create cooldown modal
- [ ] Display safety alerts

#### Phase 5: User Dashboard - Chat (Week 5)
- [ ] Create Chat Fragment layout
- [ ] Setup RecyclerView for messages
- [ ] Implement Socket.IO connection
- [ ] Handle text message sending
- [ ] Handle text message receiving
- [ ] Implement audio recording
- [ ] Implement audio playback
- [ ] Add recording controls (pause/resume/cancel)
- [ ] Auto-scroll to bottom on new messages
- [ ] Handle connection errors

#### Phase 6: Admin Dashboard (Week 6)
- [ ] Create Admin Dashboard activity
- [ ] Display statistics cards
- [ ] Create active users RecyclerView
- [ ] Create SOS alerts RecyclerView
- [ ] Implement Google Maps with all users
- [ ] Setup Socket.IO for admin
- [ ] Listen for location updates
- [ ] Listen for SOS triggers
- [ ] Implement admin chat dialog
- [ ] Add send message functionality
- [ ] Add mark resolved functionality

#### Phase 7: Services & Background Work (Week 7)
- [ ] Create LocationTrackingService
- [ ] Implement foreground service notification
- [ ] Handle service lifecycle
- [ ] Implement auto-restart on kill
- [ ] Add battery optimization handling
- [ ] Create disclaimer modal
- [ ] Implement SharedPreferences for settings
- [ ] Add logout functionality

#### Phase 8: Testing & Polish (Week 8)
- [ ] Write unit tests
- [ ] Write instrumentation tests
- [ ] Test on multiple devices
- [ ] Test different Android versions
- [ ] Fix bugs and crashes
- [ ] Optimize performance
- [ ] Add loading states
- [ ] Add error handling
- [ ] Implement offline mode handling
- [ ] Add analytics (Firebase Analytics)

#### Phase 9: Release Preparation (Week 9)
- [ ] Enable ProGuard
- [ ] Test release build
- [ ] Create app signing key
- [ ] Prepare Play Store listing
- [ ] Create screenshots
- [ ] Write app description
- [ ] Set up Firebase App Distribution for beta testing
- [ ] Conduct beta testing
- [ ] Fix beta feedback issues

#### Phase 10: Deployment (Week 10)
- [ ] Generate signed APK/AAB
- [ ] Upload to Google Play Console
- [ ] Submit for review
- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Plan future updates


---

### 19. Key Code Snippets

#### 19.1 Firebase Authentication - Login
```kotlin
class AuthRepository @Inject constructor(
    private val firebaseAuth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) {
    suspend fun login(email: String, password: String): Result<User> {
        return try {
            val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
            val uid = result.user?.uid ?: throw Exception("User ID not found")
            
            // Fetch user data from Firestore
            val userDoc = firestore.collection("users").document(uid).get().await()
            val user = userDoc.toObject(User::class.java) ?: throw Exception("User data not found")
            
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

#### 19.2 Location Tracking
```kotlin
class LocationManager @Inject constructor(
    private val fusedLocationClient: FusedLocationProviderClient
) {
    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        10000L // 10 seconds
    ).apply {
        setMinUpdateIntervalMillis(5000L) // 5 seconds
        setMaxUpdateDelayMillis(15000L)
    }.build()
    
    fun startLocationUpdates(callback: (Location) -> Unit) {
        val locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    callback(location)
                }
            }
        }
        
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }
}
```

#### 19.3 Socket.IO Integration
```kotlin
class SocketManager @Inject constructor() {
    private var socket: Socket? = null
    
    fun connect(url: String) {
        socket = IO.socket(url).apply {
            on(Socket.EVENT_CONNECT) {
                Log.d("Socket", "Connected")
            }
            on(Socket.EVENT_DISCONNECT) {
                Log.d("Socket", "Disconnected")
            }
            connect()
        }
    }
    
    fun emit(event: String, data: JSONObject) {
        socket?.emit(event, data)
    }
    
    fun on(event: String, callback: (Array<Any>) -> Unit) {
        socket?.on(event) { args ->
            callback(args)
        }
    }
    
    fun disconnect() {
        socket?.disconnect()
    }
}
```

#### 19.4 Risk Calculation API Call
```kotlin
suspend fun checkRisk(
    speed: Double,
    lat: Double,
    lng: Double,
    touristId: String
): RiskData {
    val request = RiskRequest(
        speed = speed,
        movement_gap = 0,
        area_risk = 0,
        time_hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY),
        lat = lat,
        lng = lng,
        touristId = touristId
    )
    
    val response = apiService.checkRisk(request)
    return if (response.isSuccessful) {
        response.body()?.let {
            RiskData(label = it.risk_level, score = it.risk_score)
        } ?: RiskData()
    } else {
        RiskData()
    }
}
```


---

### 20. Final Notes & Best Practices

#### 20.1 Code Quality
- Follow Kotlin coding conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use extension functions where appropriate
- Implement proper error handling

#### 20.2 Git Workflow
- Use feature branches
- Write descriptive commit messages
- Create pull requests for code review
- Tag releases properly

#### 20.3 Documentation
- Document all public APIs
- Create README with setup instructions
- Document Firebase configuration steps
- Create user manual for app features

#### 20.4 Continuous Integration
- Setup GitHub Actions or similar
- Run tests on every commit
- Automate APK generation
- Setup Firebase App Distribution

---

## 🎯 Success Criteria

Your Android app should:
1. ✅ Match the web app UI/UX exactly (mobile version)
2. ✅ Use Firebase for authentication (not the Node.js backend)
3. ✅ Connect to the same backend API for risk calculation
4. ✅ Use Socket.IO for real-time features
5. ✅ Track location accurately with Google Maps
6. ✅ Calculate AI safety percentage correctly
7. ✅ Implement SOS with all restrictions and cooldowns
8. ✅ Support real-time chat with text and audio
9. ✅ Provide admin dashboard with all features
10. ✅ Handle all edge cases and errors gracefully
11. ✅ Work offline where possible
12. ✅ Be performant and battery-efficient
13. ✅ Follow Material Design 3 guidelines
14. ✅ Support Android 8.0 (API 26) and above
15. ✅ Pass all security checks

---

## 📞 Support & Resources

- **Web App Reference:** Use the existing React web app as UI/UX reference
- **Backend API:** http://your-backend-url:5001
- **Firebase Console:** https://console.firebase.google.com
- **Google Maps API:** https://console.cloud.google.com
- **Socket.IO Docs:** https://socket.io/docs/v4/client-api/
- **Material Design:** https://m3.material.io/

---

## 🚀 Ready to Build!

This specification provides everything needed to build a production-ready Android app that perfectly mirrors your Net2Vision web application. Follow the implementation checklist phase by phase, and you'll have a fully functional app in 10 weeks!

**Good luck with your Android development! 🎉**
