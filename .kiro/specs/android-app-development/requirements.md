# Requirements Document: Net2Vision Android Application

## Introduction

This document specifies the functional and non-functional requirements for the Net2Vision Android application, a native mobile tourist safety platform built with Kotlin and XML. The application replicates all features of the existing Net2Vision web application while integrating Firebase authentication and maintaining connectivity with the existing Node.js backend for risk calculation and incident management.

The Net2Vision Android app provides real-time location tracking, AI-powered safety scoring, emergency SOS alerts with geographic restrictions, and bidirectional communication between tourists and administrators through text and audio messaging.

## Glossary

- **Tourist_User**: A registered mobile application user who uses the app for safety monitoring and emergency alerts
- **Admin_User**: An administrative user who monitors active tourists, responds to SOS alerts, and manages incidents
- **Safety_Score**: A numerical value (0-100%) calculated by the AI backend representing the current risk level for a tourist
- **Risk_Level**: A categorical safety status (Safe, Warning, Emergency) derived from the Safety_Score
- **SOS_Alert**: An emergency distress signal triggered by a Tourist_User that notifies Admin_Users
- **Allowed_Area**: A geographic region (Delhi, LPU, Amritsar) where SOS_Alert functionality is enabled
- **Restricted_Zone**: A geographic area marked as dangerous or off-limits, displayed as orange circles on the map
- **Crowded_Area**: A geographic area with high population density, displayed as red circles on the map
- **Location_Trail**: A polyline showing the Tourist_User's movement path (last 300 location points)
- **Cooldown_Period**: A 60-second interval after SOS_Alert trigger during which subsequent alerts are blocked
- **Firebase_Auth**: Firebase Authentication service used for user identity management
- **Backend_API**: The existing Node.js REST API at http://localhost:5001 for risk calculation
- **Socket_Connection**: Real-time bidirectional communication channel using Socket.IO protocol
- **Foreground_Service**: An Android service that continues location tracking when app is backgrounded
- **Audio_Message**: A voice recording sent through the chat system using MediaRecorder/MediaPlayer
- **Map_View**: Google Maps integration displaying tourist location, trails, zones, and landmarks
- **Dashboard**: The main Tourist_User interface with three tabs (Map, SOS, Chat)
- **Admin_Dashboard**: The administrative interface showing all active tourists and SOS alerts
- **Identity_Hash**: A blockchain-based unique identifier generated during user registration
- **EMA_Smoothing**: Exponential Moving Average algorithm used to smooth speed calculations
- **Haversine_Formula**: Mathematical formula for calculating distances between geographic coordinates


## Requirements

### Requirement 1: User Authentication System

**User Story:** As a tourist, I want to create an account and log in securely, so that I can access personalized safety features and maintain my profile.

#### Acceptance Criteria

1. THE Firebase_Auth SHALL authenticate users using email and password credentials
2. WHEN a user provides valid registration data (name, phone, email, password), THE Firebase_Auth SHALL create a new user account
3. WHEN a user successfully registers, THE Application SHALL generate an Identity_Hash for blockchain identity
4. WHEN a user successfully registers, THE Application SHALL store user data (name, phone, email, Identity_Hash) in Firebase Firestore
5. WHEN a user provides valid login credentials, THE Firebase_Auth SHALL authenticate the user and grant access to Dashboard
6. WHEN a user provides invalid credentials, THE Application SHALL display an error message within 2 seconds
7. WHEN a user successfully authenticates, THE Application SHALL store the authentication token locally for session persistence
8. WHEN the Application launches, THE Application SHALL check for existing authentication token and auto-login if valid
9. THE Application SHALL validate email format before submission (RFC 5322 standard)
10. THE Application SHALL require password length of at least 8 characters
11. WHEN a user registers successfully, THE Application SHALL display a success dialog showing user details
12. WHEN a user logs in successfully, THE Application SHALL request location permissions before navigating to Dashboard

### Requirement 2: Admin Authentication System

**User Story:** As an administrator, I want to log in to a separate admin interface, so that I can monitor tourists and respond to emergencies.

#### Acceptance Criteria

1. THE Application SHALL provide a separate admin login screen accessible from the landing page
2. WHEN admin credentials (admin@gmail.com / 12345678) are provided, THE Application SHALL authenticate and grant access to Admin_Dashboard
3. WHEN invalid admin credentials are provided, THE Application SHALL display an error message and deny access
4. THE Application SHALL differentiate admin sessions from Tourist_User sessions using role-based storage
5. WHEN an Admin_User logs out, THE Application SHALL clear admin session data and return to admin login screen

### Requirement 3: Real-Time Location Tracking

**User Story:** As a tourist, I want the app to track my location continuously, so that I can receive accurate safety assessments and emergency services can locate me.

#### Acceptance Criteria

1. WHEN location permissions are granted, THE Application SHALL request location updates every 10 seconds using FusedLocationProviderClient
2. THE Application SHALL use PRIORITY_HIGH_ACCURACY for location requests
3. WHEN a new location is received, THE Application SHALL calculate speed in km/h using distance and time delta
4. WHEN calculated speed is below 2.5 km/h, THE Application SHALL set speed to 0 km/h (stationary threshold)
5. WHEN calculated speed exceeds 180 km/h, THE Application SHALL reject the reading as invalid and use previous speed
6. THE Application SHALL apply EMA_Smoothing with alpha=0.25 to speed calculations
7. WHEN a new location is received, THE Application SHALL add the coordinates to Location_Trail (maximum 300 points)
8. WHEN Location_Trail exceeds 300 points, THE Application SHALL remove the oldest point
9. THE Application SHALL emit location updates to Socket_Connection with userId, lat, lng, and speed
10. THE Application SHALL display current coordinates with 4 decimal precision on Map_View
11. THE Application SHALL display current speed with 1 decimal precision on Map_View
12. WHEN the Application is backgrounded, THE Foreground_Service SHALL continue location tracking
13. THE Foreground_Service SHALL display a persistent notification indicating active location tracking


### Requirement 4: AI-Powered Safety Score Calculation

**User Story:** As a tourist, I want to see my current safety score, so that I can make informed decisions about my activities and location.

#### Acceptance Criteria

1. WHEN location updates occur, THE Application SHALL send risk calculation requests to Backend_API endpoint POST /api/incidents/check-risk
2. THE Application SHALL include speed, lat, lng, time_hour, and touristId in risk calculation requests
3. WHEN Backend_API responds, THE Application SHALL extract risk_level (Safe/Warning/Emergency) and risk_score (0-100)
4. THE Application SHALL update Safety_Score display within 2 seconds of receiving API response
5. THE Application SHALL display Safety_Score as a percentage with 0 decimal places
6. THE Application SHALL display Risk_Level as uppercase text (SAFE/WARNING/EMERGENCY)
7. WHEN Risk_Level is Safe, THE Application SHALL display Safety_Score card with green background (#10b981)
8. WHEN Risk_Level is Warning, THE Application SHALL display Safety_Score card with amber background (#f59e0b)
9. WHEN Risk_Level is Emergency, THE Application SHALL display Safety_Score card with red background (#ef4444)
10. THE Application SHALL refresh Safety_Score every 30 seconds while Dashboard is active
11. WHEN Backend_API is unreachable, THE Application SHALL display last known Safety_Score with a warning indicator

### Requirement 5: Interactive Map Visualization

**User Story:** As a tourist, I want to see my location on a map with safety zones and landmarks, so that I can navigate safely and understand my surroundings.

#### Acceptance Criteria

1. THE Map_View SHALL display Google Maps with the Tourist_User's current location as a marker
2. THE Map_View SHALL auto-center on the Tourist_User's location when first loaded
3. WHEN location updates occur, THE Map_View SHALL update the marker position smoothly
4. THE Map_View SHALL render Location_Trail as a blue polyline with 4px width and 70% opacity
5. THE Application SHALL fetch map data from Backend_API endpoint GET /api/geo/map-data every 30 seconds
6. WHEN Restricted_Zone data is received, THE Map_View SHALL render orange circles at specified coordinates with specified radius
7. WHEN Crowded_Area data is received, THE Map_View SHALL render red circles at specified coordinates with specified radius
8. WHEN landmark data is received, THE Map_View SHALL render markers at landmark locations
9. THE Map_View SHALL display a floating info card showing current coordinates, speed, and nearest landmark
10. THE Application SHALL calculate nearest landmark using Haversine_Formula within 1200 meters radius
11. THE Map_View SHALL provide zoom controls for user interaction
12. THE Map_View SHALL support pan gestures for map navigation
13. WHEN the Map tab is selected after being hidden, THE Map_View SHALL refresh its display dimensions

### Requirement 6: SOS Emergency Alert System

**User Story:** As a tourist in distress, I want to trigger an emergency alert, so that administrators can respond quickly and provide assistance.

#### Acceptance Criteria

1. THE Dashboard SHALL display a prominent SOS button with red background (#ef4444) and pulsing animation
2. WHEN the SOS button is tapped, THE Application SHALL check if current location is within any Allowed_Area
3. THE Application SHALL define Allowed_Area for Delhi (28.6139, 77.2090, 50km radius)
4. THE Application SHALL define Allowed_Area for LPU (31.2536, 75.7056, 5km radius)
5. THE Application SHALL define Allowed_Area for Amritsar (31.6340, 74.8723, 30km radius)
6. THE Application SHALL calculate distance to Allowed_Area centers using Haversine_Formula
7. WHEN current location is outside all Allowed_Area boundaries, THE Application SHALL display a restricted area modal and prevent SOS_Alert
8. WHEN current location is inside an Allowed_Area, THE Application SHALL check Cooldown_Period status
9. WHEN less than 60 seconds have elapsed since last SOS_Alert, THE Application SHALL display cooldown modal with remaining seconds
10. WHEN Cooldown_Period has expired and location is valid, THE Application SHALL emit SOS_Alert via Socket_Connection
11. THE SOS_Alert SHALL include userId, userName, phone, location (lat, lng), and timestamp
12. WHEN SOS_Alert is successfully sent, THE Application SHALL display success modal with "Help is on the way" message
13. WHEN SOS_Alert is successfully sent, THE Application SHALL start a 60-second Cooldown_Period timer
14. THE Application SHALL store last SOS_Alert timestamp locally to enforce Cooldown_Period across app restarts


### Requirement 7: Safety Alert Notifications

**User Story:** As a tourist, I want to receive warnings about nearby restricted zones and crowded areas, so that I can avoid dangerous situations.

#### Acceptance Criteria

1. WHEN the Tourist_User is within 500 meters of a Restricted_Zone boundary, THE Application SHALL display a proximity warning
2. THE proximity warning SHALL include the Restricted_Zone name and distance to boundary in meters
3. WHEN the Tourist_User enters a Crowded_Area, THE Application SHALL display a caution alert
4. THE caution alert SHALL include the Crowded_Area name and "caution" message
5. THE Application SHALL display safety alerts in a dedicated alerts section on the SOS tab
6. THE Application SHALL update safety alerts in real-time as location changes
7. THE Application SHALL remove alerts when the Tourist_User moves away from the hazard
8. WHEN multiple alerts are active, THE Application SHALL display all alerts in a scrollable list

### Requirement 8: Real-Time Chat System - Tourist Side

**User Story:** As a tourist, I want to communicate with administrators through text and voice messages, so that I can receive support during emergencies.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Chat tab with a message list and input area
2. WHEN the Chat tab is opened, THE Application SHALL establish Socket_Connection if not already connected
3. THE Application SHALL emit a 'join' event with userId when Socket_Connection is established
4. THE Application SHALL listen for 'adminMessage' events on Socket_Connection
5. WHEN an 'adminMessage' event is received with type='text', THE Application SHALL display the text message in the chat list
6. WHEN an 'adminMessage' event is received with type='audio', THE Application SHALL decode base64 audio and display an audio player
7. THE Application SHALL display admin messages on the left side with gray background
8. THE Application SHALL display Tourist_User messages on the right side with blue background
9. WHEN the Tourist_User types a message and taps send, THE Application SHALL emit 'userMessage' event with fromUserId, type='text', and text content
10. WHEN 'userMessage' is sent, THE Application SHALL add the message to chat list immediately (optimistic update)
11. THE Application SHALL display message timestamps in HH:MM format
12. THE Application SHALL auto-scroll to the bottom when new messages arrive
13. THE Application SHALL maintain chat history for the current session (maximum 200 messages)
14. WHEN the send button is tapped with empty input, THE Application SHALL disable the send action
15. THE Application SHALL display "No active messages" placeholder when chat is empty

### Requirement 9: Voice Recording and Playback

**User Story:** As a tourist, I want to send voice messages to administrators, so that I can communicate quickly during emergencies when typing is difficult.

#### Acceptance Criteria

1. THE Chat tab SHALL provide a "Record Voice" button below the text input
2. WHEN the "Record Voice" button is tapped, THE Application SHALL request microphone permission if not granted
3. WHEN microphone permission is denied, THE Application SHALL display an error message
4. WHEN microphone permission is granted, THE Application SHALL start audio recording using MediaRecorder
5. THE Application SHALL configure MediaRecorder with audio source MIC, output format MPEG_4, and encoder AAC
6. WHEN recording starts, THE Application SHALL replace the record button with recording controls (pause, send, cancel)
7. WHEN the pause button is tapped during recording, THE Application SHALL pause MediaRecorder
8. WHEN the pause button is tapped while paused, THE Application SHALL resume MediaRecorder
9. WHEN the send button is tapped during recording, THE Application SHALL stop MediaRecorder and process the audio file
10. THE Application SHALL encode the recorded audio file as base64 string
11. THE Application SHALL emit 'userMessage' event with fromUserId, type='audio', and base64 audio data
12. WHEN audio message is sent, THE Application SHALL add the audio message to chat list with a play button
13. WHEN the cancel button is tapped, THE Application SHALL stop MediaRecorder, discard the recording, and reset UI
14. WHEN an audio message play button is tapped, THE Application SHALL play the audio using MediaPlayer
15. THE Application SHALL display playback controls (play/pause) for audio messages
16. THE Application SHALL release MediaRecorder and MediaPlayer resources when not in use


### Requirement 10: Admin Dashboard - User Monitoring

**User Story:** As an administrator, I want to see all active tourists and their locations, so that I can monitor their safety status.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display statistics cards showing total active users, active SOS alerts, and total incidents
2. THE Admin_Dashboard SHALL fetch all users from Backend_API endpoint GET /api/auth/users on load
3. THE Admin_Dashboard SHALL listen for 'activeUsers' events on Socket_Connection
4. WHEN 'activeUsers' event is received, THE Admin_Dashboard SHALL update the active users count
5. THE Admin_Dashboard SHALL display an active users list in a RecyclerView
6. FOR EACH active user, THE Admin_Dashboard SHALL display user avatar (first letter of name), name, location coordinates, safety status, and speed
7. THE Admin_Dashboard SHALL listen for 'touristLocation' events on Socket_Connection
8. WHEN 'touristLocation' event is received, THE Admin_Dashboard SHALL update the user's location in the list and on the map
9. THE Admin_Dashboard SHALL maintain a location trail for each user (maximum 100 points)
10. THE Admin_Dashboard SHALL provide a "View on Map" button for each user
11. WHEN "View on Map" is tapped, THE Admin_Dashboard SHALL center the map on that user's location and zoom to level 15
12. THE Admin_Dashboard SHALL provide a "Send Message" button for each user
13. WHEN "Send Message" is tapped, THE Admin_Dashboard SHALL open a chat dialog for that specific user
14. THE Admin_Dashboard SHALL display all active users as markers on Google Maps
15. THE Admin_Dashboard SHALL render location trails for all active users as polylines on the map

### Requirement 11: Admin Dashboard - SOS Alert Management

**User Story:** As an administrator, I want to receive and respond to SOS alerts, so that I can provide timely assistance to tourists in distress.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL listen for 'sosAlert' events on Socket_Connection
2. WHEN 'sosAlert' event is received, THE Admin_Dashboard SHALL add the alert to the active alerts list
3. WHEN 'sosAlert' event is received, THE Admin_Dashboard SHALL display a system notification
4. THE Admin_Dashboard SHALL emit 'requestActiveSOS' event on load to fetch existing active alerts
5. THE Admin_Dashboard SHALL listen for 'activeSOSList' events and populate the alerts list
6. THE Admin_Dashboard SHALL display SOS alerts grouped by location in collapsible sections
7. FOR EACH SOS alert, THE Admin_Dashboard SHALL display user name, phone number, location, timestamp, and status
8. THE Admin_Dashboard SHALL sort alerts by status (pending first) and then by timestamp (newest first)
9. THE Admin_Dashboard SHALL provide a "Respond" button for each alert
10. WHEN "Respond" is tapped, THE Admin_Dashboard SHALL update alert status to 'responding' and open chat with that user
11. THE Admin_Dashboard SHALL emit 'updateSosStatus' event with userId and status='responding'
12. THE Admin_Dashboard SHALL provide a "Mark Resolved" button for each alert
13. WHEN "Mark Resolved" is tapped, THE Admin_Dashboard SHALL emit 'updateSosStatus' event with userId and status='resolved'
14. THE Admin_Dashboard SHALL listen for 'sosStatusUpdated' events
15. WHEN 'sosStatusUpdated' event is received with status='resolved', THE Admin_Dashboard SHALL remove the alert from active list and add to resolved list
16. THE Admin_Dashboard SHALL maintain a resolved alerts list (maximum 50 alerts)
17. THE Admin_Dashboard SHALL provide tabs to switch between active and resolved alerts
18. THE Admin_Dashboard SHALL display SOS alert markers on the map with red pulsing icons
19. WHEN an alert is selected, THE Admin_Dashboard SHALL highlight the corresponding marker on the map

### Requirement 12: Admin Dashboard - Chat System

**User Story:** As an administrator, I want to communicate with tourists through text and voice messages, so that I can provide guidance and support.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL listen for 'userMessage' events on Socket_Connection
2. WHEN 'userMessage' event is received, THE Admin_Dashboard SHALL add the message to the appropriate user's chat thread
3. WHEN 'userMessage' event with type='audio' is received, THE Admin_Dashboard SHALL decode base64 audio and create a playable audio URL
4. THE Admin_Dashboard SHALL maintain separate chat threads for each user (maximum 200 messages per thread)
5. THE Admin_Dashboard SHALL provide a chat dialog or panel for communicating with a selected user
6. THE chat dialog SHALL display the user's name in the header
7. THE chat dialog SHALL display message history in a scrollable list
8. THE chat dialog SHALL provide a text input field and send button
9. WHEN the Admin_User types a message and taps send, THE Admin_Dashboard SHALL emit 'adminMessage' event with toUserId, type='text', and text content
10. WHEN 'adminMessage' is sent, THE Admin_Dashboard SHALL add the message to the chat thread immediately
11. THE chat dialog SHALL provide a "Record Voice" button
12. WHEN "Record Voice" is tapped, THE Admin_Dashboard SHALL start audio recording using MediaRecorder
13. WHEN recording is complete and sent, THE Admin_Dashboard SHALL encode audio as base64 and emit 'adminMessage' event with type='audio'
14. THE chat dialog SHALL display admin messages on the right side and user messages on the left side
15. THE chat dialog SHALL auto-scroll to bottom when new messages arrive
16. THE Admin_Dashboard SHALL display a notification badge on users who have unread messages


### Requirement 13: User Interface and Navigation

**User Story:** As a user, I want an intuitive and visually appealing interface, so that I can easily access all features.

#### Acceptance Criteria

1. THE Application SHALL display a landing screen with video background on first launch
2. THE landing screen SHALL provide two navigation buttons: "Tourist Login & Register" and "Admin Dashboard Login"
3. THE Application SHALL use Material Design 3 components throughout the interface
4. THE Application SHALL use the color scheme: primary #3B82F6, accent green #10b981, warning #f59e0b, danger #ef4444, background #0f172a
5. THE Dashboard SHALL use BottomNavigationView with three tabs: Map, SOS, Chat
6. WHEN a tab is selected, THE Dashboard SHALL display the corresponding fragment with smooth transition
7. THE Dashboard SHALL display a user profile card on the SOS tab showing avatar, welcome message, and user name
8. THE Dashboard SHALL provide a logout button on the SOS tab
9. WHEN logout is tapped, THE Application SHALL clear authentication data and return to landing screen
10. THE Application SHALL use Inter font family for all text elements
11. THE Application SHALL display loading indicators during network operations
12. THE Application SHALL use fade-in animations for screen transitions
13. THE Application SHALL support both portrait and landscape orientations
14. THE Application SHALL adapt layout for different screen sizes (phones and tablets)
15. THE Application SHALL display the Net2Vision logo (shield with eye symbol) in blue gradient on the landing screen

### Requirement 14: Disclaimer and User Consent

**User Story:** As a tourist, I want to understand the app's terms and safety guidelines, so that I can use it responsibly.

#### Acceptance Criteria

1. WHEN a Tourist_User first accesses the Dashboard, THE Application SHALL display a disclaimer modal
2. THE disclaimer modal SHALL contain app disclaimer text, safety guidelines, and terms of use
3. THE disclaimer modal SHALL provide an "I Understand" button
4. WHEN "I Understand" is tapped, THE Application SHALL store consent in SharedPreferences
5. THE Application SHALL not display the disclaimer modal again for users who have provided consent
6. THE disclaimer modal SHALL block access to Dashboard features until consent is provided

### Requirement 15: Session Management and Persistence

**User Story:** As a user, I want to remain logged in across app sessions, so that I don't have to re-authenticate every time.

#### Acceptance Criteria

1. WHEN a user successfully authenticates, THE Application SHALL store the Firebase authentication token locally
2. WHEN a user successfully authenticates, THE Application SHALL store user data (id, name, email, phone, role) in SharedPreferences
3. WHEN the Application launches, THE Application SHALL check for existing authentication token
4. WHEN a valid authentication token exists, THE Application SHALL auto-navigate to the appropriate dashboard (Tourist or Admin)
5. WHEN the authentication token is invalid or expired, THE Application SHALL navigate to the login screen
6. WHEN a user logs out, THE Application SHALL clear all stored authentication data
7. WHEN a user logs out, THE Application SHALL disconnect Socket_Connection
8. WHEN a user logs out, THE Application SHALL stop Foreground_Service

### Requirement 16: Offline Mode and Error Handling

**User Story:** As a user, I want the app to handle network issues gracefully, so that I can still access basic features when offline.

#### Acceptance Criteria

1. WHEN the device has no internet connection, THE Application SHALL display a "No Internet Connection" message
2. WHEN Backend_API is unreachable, THE Application SHALL display the last known Safety_Score with a warning indicator
3. WHEN Socket_Connection is disconnected, THE Application SHALL attempt to reconnect every 5 seconds
4. WHEN Socket_Connection reconnects, THE Application SHALL re-emit 'join' event with userId
5. WHEN location services are disabled, THE Application SHALL display a prompt to enable location services
6. WHEN an API request fails, THE Application SHALL display an error message with retry option
7. THE Application SHALL cache map data locally for offline viewing
8. WHEN Firebase_Auth operations fail, THE Application SHALL display user-friendly error messages
9. THE Application SHALL log errors to Firebase Crashlytics for debugging


### Requirement 17: Permissions Management

**User Story:** As a user, I want to understand why the app needs certain permissions, so that I can make informed decisions about granting access.

#### Acceptance Criteria

1. THE Application SHALL request ACCESS_FINE_LOCATION permission before starting location tracking
2. THE Application SHALL request ACCESS_COARSE_LOCATION permission as a fallback if fine location is denied
3. THE Application SHALL request ACCESS_BACKGROUND_LOCATION permission for Foreground_Service functionality
4. THE Application SHALL request RECORD_AUDIO permission before starting voice recording
5. THE Application SHALL request POST_NOTIFICATIONS permission for displaying SOS alerts and chat notifications
6. WHEN a permission is denied, THE Application SHALL display a rationale explaining why the permission is needed
7. WHEN a critical permission (location) is permanently denied, THE Application SHALL display instructions to enable it in system settings
8. THE Application SHALL check permission status before attempting to use protected features
9. THE Application SHALL gracefully degrade functionality when optional permissions are denied

### Requirement 18: Background Location Tracking Service

**User Story:** As a tourist, I want the app to continue tracking my location when I'm not actively using it, so that I remain protected at all times.

#### Acceptance Criteria

1. THE Application SHALL implement a Foreground_Service for continuous location tracking
2. WHEN the Dashboard is active, THE Application SHALL start Foreground_Service
3. THE Foreground_Service SHALL display a persistent notification with app icon and "Location tracking active" message
4. THE Foreground_Service SHALL request location updates every 10 seconds
5. WHEN location updates are received, THE Foreground_Service SHALL emit updates to Socket_Connection
6. WHEN the Application is killed by the system, THE Foreground_Service SHALL attempt to restart
7. WHEN the user logs out, THE Application SHALL stop Foreground_Service
8. THE Foreground_Service SHALL use PRIORITY_BALANCED_POWER_ACCURACY to optimize battery consumption
9. THE Foreground_Service notification SHALL provide a "Stop Tracking" action
10. WHEN "Stop Tracking" is tapped, THE Application SHALL stop Foreground_Service and log out the user

### Requirement 19: Performance and Battery Optimization

**User Story:** As a user, I want the app to be responsive and battery-efficient, so that I can use it throughout the day without draining my device.

#### Acceptance Criteria

1. THE Application SHALL limit location update frequency to maximum once every 5 seconds
2. THE Application SHALL use PRIORITY_BALANCED_POWER_ACCURACY for location requests when battery is below 20%
3. THE Application SHALL cache map tiles locally to reduce network usage
4. THE Application SHALL use Glide library with memory and disk caching for image loading
5. THE Application SHALL use DiffUtil for RecyclerView updates to minimize UI redraws
6. THE Application SHALL release MediaRecorder and MediaPlayer resources immediately after use
7. THE Application SHALL disconnect Socket_Connection when the Application is backgrounded for more than 5 minutes
8. THE Application SHALL limit Location_Trail to 300 points to minimize memory usage
9. THE Application SHALL limit chat history to 200 messages per thread to minimize memory usage
10. THE Application SHALL use Kotlin Coroutines for asynchronous operations to prevent UI blocking
11. THE Application SHALL complete all UI operations within 16ms to maintain 60 FPS
12. THE Application SHALL load the Dashboard within 2 seconds of authentication

### Requirement 20: Security and Data Protection

**User Story:** As a user, I want my personal data and communications to be secure, so that my privacy is protected.

#### Acceptance Criteria

1. THE Application SHALL store Firebase authentication tokens using Android Keystore encryption
2. THE Application SHALL transmit all data over HTTPS connections
3. THE Application SHALL validate SSL certificates for all network requests
4. THE Application SHALL not log sensitive user data (passwords, tokens) in production builds
5. THE Application SHALL obfuscate code using ProGuard in release builds
6. THE Application SHALL implement Firebase Firestore security rules to restrict data access by user role
7. THE Application SHALL validate all user inputs to prevent injection attacks
8. THE Application SHALL clear sensitive data from memory after use
9. THE Application SHALL implement certificate pinning for Backend_API connections
10. THE Application SHALL detect rooted devices and display a security warning


### Requirement 21: Accessibility and Localization

**User Story:** As a user with accessibility needs, I want the app to support assistive technologies, so that I can use all features effectively.

#### Acceptance Criteria

1. THE Application SHALL provide content descriptions for all interactive UI elements
2. THE Application SHALL support TalkBack screen reader for visually impaired users
3. THE Application SHALL maintain minimum touch target size of 48dp for all interactive elements
4. THE Application SHALL provide sufficient color contrast (WCAG AA standard) for all text elements
5. THE Application SHALL support dynamic text sizing based on system font size settings
6. THE Application SHALL provide haptic feedback for critical actions (SOS button tap)
7. THE Application SHALL support English language for all UI text
8. THE Application SHALL use string resources for all user-facing text to enable future localization

### Requirement 22: Analytics and Monitoring

**User Story:** As a product owner, I want to track app usage and errors, so that I can improve the user experience.

#### Acceptance Criteria

1. THE Application SHALL integrate Firebase Analytics for usage tracking
2. THE Application SHALL log screen view events when users navigate between screens
3. THE Application SHALL log SOS_Alert trigger events with anonymized location data
4. THE Application SHALL log authentication events (login, registration, logout)
5. THE Application SHALL integrate Firebase Crashlytics for crash reporting
6. WHEN the Application crashes, THE Crashlytics SHALL capture stack trace and device information
7. THE Application SHALL not log personally identifiable information (PII) in analytics events
8. THE Application SHALL allow users to opt out of analytics tracking in settings

### Requirement 23: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive test coverage, so that I can ensure the app functions correctly.

#### Acceptance Criteria

1. THE Application SHALL include unit tests for all ViewModel classes with minimum 80% code coverage
2. THE Application SHALL include unit tests for Haversine_Formula distance calculations with known test cases
3. THE Application SHALL include unit tests for EMA_Smoothing speed calculations with known test cases
4. THE Application SHALL include instrumentation tests for authentication flows (login, registration)
5. THE Application SHALL include instrumentation tests for location tracking functionality
6. THE Application SHALL include instrumentation tests for SOS_Alert trigger with location validation
7. THE Application SHALL include UI tests for navigation between Dashboard tabs
8. THE Application SHALL include UI tests for chat message sending and receiving
9. THE Application SHALL pass all tests before release builds

### Requirement 24: Platform Compatibility

**User Story:** As a user, I want the app to work on my Android device, so that I can access safety features regardless of my device model.

#### Acceptance Criteria

1. THE Application SHALL support Android 8.0 (API level 26) and above
2. THE Application SHALL support screen sizes from 4.7 inches to 12 inches
3. THE Application SHALL support screen densities from mdpi to xxxhdpi
4. THE Application SHALL adapt layout for phones and tablets using responsive design
5. THE Application SHALL function correctly on devices with and without Google Play Services
6. THE Application SHALL handle device rotation without losing user data or state
7. THE Application SHALL support devices with physical navigation buttons and gesture navigation

### Requirement 25: Build and Deployment

**User Story:** As a developer, I want automated build and deployment processes, so that I can release updates efficiently.

#### Acceptance Criteria

1. THE Application SHALL provide debug and release build variants
2. THE debug build SHALL use API_BASE_URL http://10.0.2.2:5001 for local development
3. THE release build SHALL use production API_BASE_URL configured in BuildConfig
4. THE release build SHALL enable ProGuard code obfuscation
5. THE release build SHALL enable code shrinking to reduce APK size
6. THE Application SHALL generate signed APK using Android App Bundle format
7. THE Application SHALL include ProGuard rules for Retrofit, Socket.IO, Firebase, and Glide
8. THE Application SHALL target Google Play Store for distribution
9. THE Application SHALL include app signing key stored securely outside version control

