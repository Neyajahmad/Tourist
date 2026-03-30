# Requirements Document

## Introduction

This document specifies the requirements for replacing the current Leaflet/OpenStreetMap mapping implementation with Google Maps JavaScript API in the Net2Vision web application. The application currently uses Leaflet for displaying real-time tourist locations, SOS alerts, restricted zones, crowded areas, and location trails in both User Dashboard and Admin Dashboard. The migration to Google Maps must maintain all existing functionality while providing improved mapping capabilities and visual consistency.

## Glossary

- **User_Dashboard**: The tourist-facing interface displaying the user's own location, path trail, restricted zones, crowded areas, and safety information
- **Admin_Dashboard**: The administrative interface displaying all active tourists, SOS alerts, location trails, and communication tools
- **Google_Maps_API**: Google Maps JavaScript API v3 for rendering interactive maps
- **Leaflet**: The current mapping library being replaced (react-leaflet)
- **Map_Marker**: A visual indicator on the map representing a location (user, SOS alert, etc.)
- **Polyline**: A line drawn on the map connecting multiple coordinates to show movement trails
- **Circle_Overlay**: A circular shape drawn on the map to represent zones (restricted or crowded areas)
- **Socket_IO**: Real-time communication library for location updates and alerts
- **Marker_Clustering**: Grouping nearby markers into clusters for performance optimization
- **Dark_Theme**: A dark color scheme applied to the map for visual consistency with the application

## Requirements

### Requirement 1: Google Maps API Integration

**User Story:** As a developer, I want to integrate Google Maps JavaScript API into the application, so that I can replace the Leaflet mapping library.

#### Acceptance Criteria

1. THE System SHALL load the Google Maps JavaScript API script with API key from environment variables in the HTML document
2. THE System SHALL initialize Google Maps API before rendering any map components
3. THE System SHALL remove all Leaflet dependencies (react-leaflet, leaflet) from package.json
4. THE System SHALL remove all Leaflet CSS imports from the codebase
5. THE System SHALL handle Google Maps API loading errors gracefully with user-friendly error messages

### Requirement 2: User Dashboard Map Display

**User Story:** As a tourist, I want to see my location on a Google Map, so that I can track my position and surroundings.

#### Acceptance Criteria

1. WHEN the User_Dashboard loads, THE System SHALL display a Google Map centered on the user's current location
2. THE System SHALL display the user's current location with a custom marker on the map
3. THE System SHALL apply dark theme styling to the Google Map using Google Maps Styling API
4. THE System SHALL auto-center the map on the user's location when location updates occur
5. THE System SHALL set the initial map zoom level to 13
6. THE System SHALL display map controls appropriate for mobile and desktop devices

### Requirement 3: User Location Tracking and Path Display

**User Story:** As a tourist, I want to see my movement trail on the map, so that I can visualize where I have traveled.

#### Acceptance Criteria

1. WHEN the user's location updates, THE System SHALL add the new coordinates to the path trail
2. THE System SHALL display the path trail as a blue polyline (#3B82F6) with 4px weight and 0.7 opacity
3. THE System SHALL limit the path trail to the last 300 location points
4. WHEN real-time location updates are received via Socket_IO, THE System SHALL update the marker position smoothly without recreating the marker
5. THE System SHALL calculate and display the user's current speed in km/h
6. THE System SHALL display a floating info card showing coordinates, speed, and nearest landmark

### Requirement 4: Restricted and Crowded Zone Display

**User Story:** As a tourist, I want to see restricted zones and crowded areas on the map, so that I can avoid them.

#### Acceptance Criteria

1. THE System SHALL display restricted zones as orange circles (#f59e0b) with 15% fill opacity
2. THE System SHALL display crowded areas as red circles (#ef4444) with 20% fill opacity
3. WHEN the user approaches within 500 meters of a restricted zone, THE System SHALL display a proximity warning
4. WHEN the user is inside a crowded area, THE System SHALL display a caution message
5. THE System SHALL fetch zone data from the backend API endpoint /api/geo/map-data

### Requirement 5: Admin Dashboard Map Display

**User Story:** As an administrator, I want to see all active tourists on a Google Map, so that I can monitor their locations in real-time.

#### Acceptance Criteria

1. WHEN the Admin_Dashboard loads, THE System SHALL display a Google Map centered on India (22.9734, 78.6569) with zoom level 5
2. THE System SHALL display markers for all active tourists with their name and ID
3. THE System SHALL display SOS alerts with red pulsing markers
4. THE System SHALL apply dark theme styling to the Google Map
5. THE System SHALL set map bounds to India's geographic boundaries with maxBounds [6.4627, 68.1097] to [35.5133, 97.3956]
6. THE System SHALL display a status overlay showing the count of active tourists

### Requirement 6: Tourist Location Trails on Admin Dashboard

**User Story:** As an administrator, I want to see location trails for each tourist, so that I can understand their movement patterns.

#### Acceptance Criteria

1. THE System SHALL display a polyline trail for each tourist showing their last 100 location points
2. THE System SHALL render trails in blue (#3B82F6) with 3px weight and 0.7 opacity
3. WHEN a tourist's location updates via Socket_IO, THE System SHALL append the new point to their trail
4. THE System SHALL limit each trail to 100 points maximum
5. THE System SHALL update marker positions smoothly without recreating markers on each location update

### Requirement 7: Marker Clustering for Performance

**User Story:** As an administrator, I want markers to cluster when zoomed out, so that the map remains performant with many active users.

#### Acceptance Criteria

1. WHEN there are more than 50 active tourist markers, THE System SHALL enable marker clustering
2. THE System SHALL use Google Maps MarkerClusterer library for clustering
3. THE System SHALL display cluster icons showing the count of markers in each cluster
4. WHEN the administrator clicks a cluster, THE System SHALL zoom in to reveal individual markers
5. THE System SHALL exclude SOS alert markers from clustering

### Requirement 8: Interactive Marker Popups and Info Windows

**User Story:** As an administrator, I want to click on tourist markers to see details, so that I can access user information and communication options.

#### Acceptance Criteria

1. WHEN the administrator clicks a tourist marker, THE System SHALL display an info window with user name, ID, and location coordinates
2. THE Info window SHALL include a "Chat" button to initiate communication with the tourist
3. WHEN the administrator clicks a SOS marker, THE System SHALL display alert details including user name, area, and time
4. THE System SHALL close the previous info window when a new marker is clicked
5. ON mobile devices, WHEN a tourist marker is clicked, THE System SHALL center the map on that location and switch to the chat tab

### Requirement 9: Responsive Mobile Behavior

**User Story:** As a mobile user, I want the map to work seamlessly on my device, so that I can use all features on the go.

#### Acceptance Criteria

1. WHEN the viewport width is less than 640px, THE System SHALL apply mobile-optimized map controls
2. ON mobile User_Dashboard, WHEN the map tab is active, THE System SHALL resize the map to fill the available viewport
3. ON mobile Admin_Dashboard, WHEN a user is selected from the sidebar, THE System SHALL center the map on that user's location with zoom level 15
4. THE System SHALL handle touch gestures for map panning and zooming
5. WHEN the user switches between tabs on mobile, THE System SHALL trigger map resize to prevent rendering issues

### Requirement 10: Real-Time Updates via Socket.IO

**User Story:** As a user, I want my location updates to be transmitted in real-time, so that administrators can monitor my position accurately.

#### Acceptance Criteria

1. WHEN the user's location changes, THE System SHALL emit a locationUpdate event via Socket_IO with lat, lng, and userId
2. WHEN the Admin_Dashboard receives a touristLocation event, THE System SHALL update the corresponding marker position
3. WHEN a SOS alert is triggered, THE System SHALL emit a sosTrigger event with location, userId, userName, phone, and time
4. WHEN the Admin_Dashboard receives a sosAlert event, THE System SHALL add or update the SOS marker on the map
5. THE System SHALL maintain all existing Socket_IO event listeners and emitters

### Requirement 11: Map Component Architecture

**User Story:** As a developer, I want a reusable Google Map wrapper component, so that I can maintain consistent map behavior across dashboards.

#### Acceptance Criteria

1. THE System SHALL create a GoogleMapWrapper component in client/src/components/GoogleMapWrapper.jsx
2. THE GoogleMapWrapper SHALL accept props for center, zoom, markers, polylines, circles, and styling options
3. THE GoogleMapWrapper SHALL handle Google Maps API initialization and cleanup
4. THE GoogleMapWrapper SHALL expose methods for updating marker positions without full re-render
5. THE GoogleMapWrapper SHALL handle map resize events when container dimensions change

### Requirement 12: Dark Theme Styling

**User Story:** As a user, I want the map to match the application's dark theme, so that the interface is visually consistent.

#### Acceptance Criteria

1. THE System SHALL apply Google Maps dark theme styling using the Styles API
2. THE dark theme SHALL use dark colors for roads, water, and terrain features
3. THE dark theme SHALL maintain sufficient contrast for labels and markers
4. THE System SHALL apply the same dark theme to both User_Dashboard and Admin_Dashboard maps
5. THE dark theme SHALL be defined as a reusable style configuration

### Requirement 13: Performance Optimization

**User Story:** As a user, I want the map to perform smoothly, so that I can interact with it without lag.

#### Acceptance Criteria

1. THE System SHALL update marker positions by modifying existing marker objects rather than recreating them
2. THE System SHALL debounce rapid location updates to prevent excessive re-renders
3. THE System SHALL limit polyline points to prevent rendering performance degradation
4. WHEN there are more than 100 active users, THE System SHALL enable marker clustering automatically
5. THE System SHALL use React best practices (useMemo, useCallback) to prevent unnecessary component re-renders

### Requirement 14: Browser and Device Compatibility

**User Story:** As a user, I want the map to work on my browser and device, so that I can access the application from anywhere.

#### Acceptance Criteria

1. THE System SHALL support Google Maps on Chrome, Firefox, Safari, and Edge browsers
2. THE System SHALL support Google Maps on iOS Safari and Android Chrome mobile browsers
3. THE System SHALL maintain existing responsive breakpoints (mobile: <640px, tablet: <1024px)
4. THE System SHALL handle browser geolocation API for user location tracking
5. THE System SHALL provide fallback behavior when geolocation is unavailable or denied

### Requirement 15: Migration and Cleanup

**User Story:** As a developer, I want to completely remove Leaflet dependencies, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL remove react-leaflet and leaflet packages from client/package.json
2. THE System SHALL remove all import statements for Leaflet libraries from Dashboard.jsx and AdminDashboard.jsx
3. THE System SHALL remove the Leaflet CSS import ('leaflet/dist/leaflet.css')
4. THE System SHALL remove Leaflet icon configuration code (L.Icon.Default.prototype modifications)
5. THE System SHALL verify no Leaflet references remain in the codebase after migration

