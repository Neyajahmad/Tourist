# Implementation Plan: Google Maps Integration

## Overview

This implementation plan converts the Google Maps integration design into actionable coding tasks. The migration replaces Leaflet/OpenStreetMap with Google Maps JavaScript API while maintaining all existing functionality including real-time location tracking, SOS alerts, zone overlays, and trails.

**Implementation Language**: JavaScript (React)

**API Key**: AIzaSyAABImcnCQJvcX4u0Vesivu7A8

## Tasks

- [x] 1. Setup and Infrastructure
  - [x] 1.1 Add Google Maps script to index.html
    - Add Google Maps JavaScript API script tag in the `<head>` section of `client/index.html`
    - Include API key and required libraries (marker)
    - Use async and defer attributes for optimal loading
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Install marker clustering package
    - Run `npm install @googlemaps/markerclusterer` in client directory
    - Verify package installation in package.json
    - _Requirements: 7.2_

  - [x] 1.3 Create GoogleMapWrapper component skeleton
    - Create new file `client/src/components/GoogleMapWrapper.jsx`
    - Set up basic component structure with props interface
    - Add map container div with ref
    - Implement basic error handling for missing Google Maps API
    - _Requirements: 11.1, 11.2, 1.5_

  - [ ]* 1.4 Write property test for API initialization order
    - **Property 1: Google Maps API Initialization Order**
    - **Validates: Requirements 1.2**
    - Test that window.google is available before map initialization attempts
    - Use fast-check to generate various component mount scenarios

  - [x] 1.5 Verify Google Maps API loads successfully
    - Add console logging to verify window.google is defined
    - Test in browser that map script loads without errors
    - Verify API key is valid and quota is available
    - _Requirements: 1.1, 1.2_


- [-] 2. GoogleMapWrapper Component Implementation
  - [x] 2.1 Implement map initialization logic
    - Initialize Google Maps instance in useEffect on component mount
    - Configure map options (center, zoom, styles, controls)
    - Apply dark theme styling using DARK_THEME_STYLES constant
    - Set up map event listeners (center_changed, zoom_changed)
    - Implement cleanup on component unmount
    - _Requirements: 11.3, 12.1, 12.2, 12.3_

  - [ ]* 2.2 Write property test for dark theme application
    - **Property 2: Dark Theme Styling**
    - **Validates: Requirements 2.3, 5.4, 12.1**
    - Test that dark theme styles are applied on map initialization
    - Verify styles array contains required dark color configurations

  - [x] 2.3 Implement marker management system
    - Create marker update logic that reuses existing markers
    - Implement marker creation with custom icons (user, tourist, SOS)
    - Add marker click event handlers
    - Store markers in ref to prevent recreation on updates
    - _Requirements: 11.4, 13.1_

  - [ ]* 2.4 Write property test for marker reuse optimization
    - **Property 8: Marker Reuse Optimization**
    - **Validates: Requirements 3.4, 6.5, 13.1**
    - Test that existing markers are updated (not recreated) on position changes
    - Verify marker object identity remains the same across updates

  - [x] 2.5 Implement polyline rendering for trails
    - Create polyline update logic that reuses existing polylines
    - Configure polyline styling (color, weight, opacity)
    - Store polylines in ref for efficient updates
    - _Requirements: 3.2, 6.2_

  - [x] 2.6 Implement circle rendering for zones
    - Create circle update logic that reuses existing circles
    - Configure circle styling for restricted zones (orange) and crowded areas (red)
    - Store circles in ref for efficient updates
    - _Requirements: 4.1, 4.2_

  - [x] 2.7 Add marker clustering support
    - Integrate @googlemaps/markerclusterer library
    - Implement conditional clustering based on marker count threshold
    - Exclude SOS markers from clustering
    - Configure cluster icons and behavior
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ]* 2.8 Write property test for clustering activation threshold
    - **Property 15: Clustering Activation Threshold**
    - **Validates: Requirements 7.1**
    - Test that clustering activates when marker count exceeds 50
    - Verify clustering is disabled when marker count is below threshold

  - [ ]* 2.9 Write property test for SOS marker clustering exclusion
    - **Property 18: SOS Marker Clustering Exclusion**
    - **Validates: Requirements 7.5**
    - Test that SOS markers are never included in clusters
    - Verify SOS markers remain visible regardless of proximity to other markers

  - [x] 2.10 Implement info window management
    - Create info window display logic with single-window constraint
    - Implement info window content rendering
    - Add close previous window logic when new marker is clicked
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ]* 2.11 Write property test for single info window display
    - **Property 21: Single Info Window Display**
    - **Validates: Requirements 8.4**
    - Test that only one info window is open at a time
    - Verify previous info window closes when new marker is clicked

  - [x] 2.12 Add map resize handling
    - Implement resize trigger when container dimensions change
    - Add resize method call on prop changes
    - _Requirements: 11.5_

  - [x] 2.13 Implement responsive mobile controls
    - Configure map controls based on viewport width
    - Hide controls on mobile (width < 640px)
    - Show appropriate controls on desktop
    - _Requirements: 2.6, 9.1_

  - [ ]* 2.14 Write property test for responsive map controls
    - **Property 5: Responsive Map Controls**
    - **Validates: Requirements 2.6, 9.1**
    - Test that controls are hidden when viewport width < 640px
    - Test that controls are visible when viewport width >= 640px

  - [x] 2.15 Add comprehensive error handling
    - Handle Google Maps API loading failures
    - Display user-friendly error messages
    - Implement fallback behavior for missing API
    - _Requirements: 1.5_

  - [ ]* 2.16 Write property test for API loading error handling
    - **Property 2: API Loading Error Handling**
    - **Validates: Requirements 1.5**
    - Test that user-friendly error message displays on API failure
    - Verify component doesn't crash when window.google is undefined

- [ ] 3. Checkpoint - Verify GoogleMapWrapper component
  - Ensure GoogleMapWrapper renders correctly with test props
  - Verify all marker types display with correct icons
  - Test polyline and circle rendering
  - Ensure marker clustering works with 50+ markers
  - Ask the user if questions arise


- [-] 4. User Dashboard Integration
  - [x] 4.1 Import GoogleMapWrapper in Dashboard.jsx
    - Add import statement for GoogleMapWrapper component
    - Remove Leaflet imports (MapContainer, TileLayer, Marker, Popup, Polyline, Circle)
    - Remove Leaflet CSS import
    - Remove Leaflet icon configuration code
    - _Requirements: 15.2, 15.3, 15.4_

  - [x] 4.2 Convert location state to markers prop format
    - Transform location state into markers array with user marker
    - Set marker type to 'user'
    - Add marker label 'You'
    - Use useMemo to prevent unnecessary recalculations
    - _Requirements: 2.2, 11.2_

  - [x] 4.3 Convert path array to polylines prop format
    - Transform path array into polylines array with single trail
    - Configure trail styling (blue #3B82F6, 4px weight, 0.7 opacity)
    - Use useMemo for optimization
    - _Requirements: 3.1, 3.2_

  - [ ]* 4.4 Write property test for trail accumulation
    - **Property 6: Trail Accumulation**
    - **Validates: Requirements 3.1, 6.3**
    - Test that new coordinates are appended to path trail on location updates
    - Verify trail array grows with each location update

  - [ ]* 4.5 Write property test for trail size limiting
    - **Property 7: Trail Size Limiting**
    - **Validates: Requirements 3.3, 6.4, 13.3**
    - Test that user trail never exceeds 300 points
    - Verify oldest points are removed when limit is reached

  - [x] 4.6 Convert geoData zones to circles prop format
    - Transform restrictedZones to circles with orange styling
    - Transform crowdedAreas to circles with red styling
    - Configure radius, fill opacity, and stroke properties
    - Use useMemo for optimization
    - _Requirements: 4.1, 4.2_

  - [x] 4.7 Replace MapContainer with GoogleMapWrapper
    - Replace Leaflet MapContainer with GoogleMapWrapper component
    - Pass center, zoom, markers, polylines, and circles props
    - Set isMobile prop based on viewport width
    - Remove MapUpdater component (functionality now in GoogleMapWrapper)
    - _Requirements: 2.1, 11.2_

  - [ ]* 4.8 Write property test for user dashboard map centering
    - **Property 3: User Dashboard Map Centering**
    - **Validates: Requirements 2.1, 2.4**
    - Test that map center updates to match user location on location changes
    - Verify map pans to new coordinates

  - [ ]* 4.9 Write property test for user location marker presence
    - **Property 4: User Location Marker Presence**
    - **Validates: Requirements 2.2**
    - Test that a marker is rendered at user's exact coordinates
    - Verify marker exists for any valid location

  - [ ] 4.10 Test location tracking functionality
    - Verify real-time location updates work via geolocation API
    - Test that location updates emit via Socket.IO
    - Verify marker position updates smoothly
    - Test simulation mode fallback
    - _Requirements: 10.1, 14.4_

  - [ ]* 4.11 Write property test for location update socket emission
    - **Property 26: Location Update Socket Emission**
    - **Validates: Requirements 10.1**
    - Test that locationUpdate event is emitted on location changes
    - Verify event contains lat, lng, and userId

  - [ ] 4.12 Test path trail rendering
    - Verify trail displays as blue polyline
    - Test that trail updates as user moves
    - Verify trail limits to 300 points
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 4.13 Test zone overlays
    - Verify restricted zones display with orange circles
    - Verify crowded areas display with red circles
    - Test zone data fetching from /api/geo/map-data
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 4.14 Write property test for proximity warning trigger
    - **Property 10: Proximity Warning Trigger**
    - **Validates: Requirements 4.3**
    - Test that warning displays when user is within 500m of restricted zone boundary
    - Verify warning only shows when outside zone but within proximity threshold

  - [ ]* 4.15 Write property test for zone containment detection
    - **Property 11: Zone Containment Detection**
    - **Validates: Requirements 4.4**
    - Test that caution message displays when user is inside crowded area
    - Verify detection works for any location within zone radius

  - [ ] 4.16 Test mobile responsiveness
    - Test map display on mobile viewport (< 640px)
    - Verify tab switching works correctly
    - Test map resize on tab changes
    - Verify touch gestures work for panning and zooming
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

  - [ ]* 4.17 Write property test for mobile map viewport sizing
    - **Property 23: Mobile Map Viewport Sizing**
    - **Validates: Requirements 9.2**
    - Test that map container fills available viewport on mobile when map tab is active
    - Verify dimensions adjust correctly

  - [ ]* 4.18 Write property test for tab switch map resize
    - **Property 25: Tab Switch Map Resize**
    - **Validates: Requirements 9.5**
    - Test that map resize is triggered on tab switch events
    - Verify map renders correctly after tab changes

- [ ] 5. Checkpoint - Verify User Dashboard integration
  - Ensure all User Dashboard features work with Google Maps
  - Test location tracking, trail rendering, and zone overlays
  - Verify mobile responsiveness and tab switching
  - Ask the user if questions arise


- [ ] 6. Admin Dashboard Integration
  - [x] 6.1 Import GoogleMapWrapper in AdminDashboard.jsx
    - Add import statement for GoogleMapWrapper component
    - Remove Leaflet imports (MapContainer, TileLayer, Marker, Popup, Polyline)
    - Remove Leaflet CSS import
    - Remove Leaflet icon configuration code
    - _Requirements: 15.2, 15.3, 15.4_

  - [x] 6.2 Convert userLocations to markers prop format
    - Transform userLocations object into markers array
    - Determine marker type based on SOS alert status
    - Add user name labels from users array
    - Implement marker click handlers
    - Use useMemo for optimization
    - _Requirements: 5.2, 5.3, 8.1_

  - [ ]* 6.3 Write property test for active tourist marker rendering
    - **Property 12: Active Tourist Marker Rendering**
    - **Validates: Requirements 5.2**
    - Test that each active tourist in userLocations has a corresponding marker
    - Verify marker count matches active tourist count

  - [ ]* 6.4 Write property test for SOS marker styling
    - **Property 13: SOS Marker Styling**
    - **Validates: Requirements 5.3**
    - Test that SOS alert markers are rendered with red styling
    - Verify SOS markers are visually distinct from regular tourist markers

  - [x] 6.3 Convert trails to polylines prop format
    - Transform trails object into polylines array
    - Configure trail styling (blue #3B82F6, 3px weight, 0.7 opacity)
    - Create unique ID for each trail
    - Use useMemo for optimization
    - _Requirements: 6.1, 6.2_

  - [ ]* 6.6 Write property test for tourist trail limiting
    - **Property 7: Trail Size Limiting (Tourist trails)**
    - **Validates: Requirements 6.4**
    - Test that tourist trails never exceed 100 points
    - Verify oldest points are removed when limit is reached

  - [x] 6.7 Add marker clustering configuration
    - Enable clustering for Admin Dashboard
    - Set clustering threshold to 50 markers
    - Configure cluster icons
    - Ensure SOS markers are excluded from clustering
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ]* 6.8 Write property test for high-volume clustering
    - **Property 35: High-Volume Clustering**
    - **Validates: Requirements 13.4**
    - Test that clustering activates when marker count exceeds 100
    - Verify performance optimization at scale

  - [ ]* 6.9 Write property test for cluster count accuracy
    - **Property 16: Cluster Count Accuracy**
    - **Validates: Requirements 7.3**
    - Test that displayed cluster count matches actual marker count in cluster
    - Verify count accuracy across various cluster sizes

  - [ ]* 6.10 Write property test for cluster zoom interaction
    - **Property 17: Cluster Zoom Interaction**
    - **Validates: Requirements 7.4**
    - Test that clicking cluster increases zoom level
    - Verify individual markers are revealed after zoom

  - [x] 6.11 Implement marker click handlers
    - Create handleMarkerClick function for tourist markers
    - Create handleAlertMarkerClick function for SOS markers
    - Integrate with existing user selection logic
    - Update selected user state on marker click
    - _Requirements: 8.1, 8.3_

  - [x] 6.12 Implement info window content
    - Create info window content for tourist markers (name, ID, coordinates)
    - Create info window content for SOS markers (name, area, time)
    - Add "Chat" button to tourist info windows
    - Integrate with existing chat functionality
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 6.13 Write property test for tourist info window content
    - **Property 19: Tourist Info Window Content**
    - **Validates: Requirements 8.1**
    - Test that tourist marker info window contains name, ID, and coordinates
    - Verify all required fields are present

  - [ ]* 6.14 Write property test for SOS info window content
    - **Property 20: SOS Info Window Content**
    - **Validates: Requirements 8.3**
    - Test that SOS marker info window contains user name, area, and time
    - Verify all required fields are present

  - [x] 6.15 Replace MapContainer with GoogleMapWrapper
    - Replace Leaflet MapContainer with GoogleMapWrapper component
    - Pass center, zoom, markers, polylines props
    - Set enableClustering to true
    - Set isMobile prop based on viewport width
    - Configure initial map bounds to India
    - _Requirements: 5.1, 5.5, 11.2_

  - [ ] 6.16 Test multiple tourist markers
    - Verify markers display for all active tourists
    - Test marker updates via Socket.IO touristLocation events
    - Verify marker positions update smoothly
    - _Requirements: 5.2, 10.2_

  - [ ]* 6.17 Write property test for tourist location socket reception
    - **Property 27: Tourist Location Socket Reception**
    - **Validates: Requirements 10.2**
    - Test that marker position updates on touristLocation event
    - Verify coordinates match received event data

  - [ ] 6.18 Test SOS alert markers
    - Verify SOS markers display with red styling
    - Test SOS marker creation via Socket.IO sosAlert events
    - Verify SOS markers are excluded from clustering
    - _Requirements: 5.3, 10.4_

  - [ ]* 6.19 Write property test for SOS trigger socket emission
    - **Property 28: SOS Trigger Socket Emission**
    - **Validates: Requirements 10.3**
    - Test that sosTrigger event is emitted with correct data
    - Verify event contains location, userId, userName, phone, and time

  - [ ]* 6.20 Write property test for SOS alert socket reception
    - **Property 29: SOS Alert Socket Reception**
    - **Validates: Requirements 10.4**
    - Test that SOS marker is added/updated on sosAlert event
    - Verify marker appears at alert location

  - [ ] 6.21 Test marker clustering with 50+ users
    - Simulate 50+ active users
    - Verify clustering activates automatically
    - Test cluster click to zoom behavior
    - Verify SOS markers remain unclustered
    - _Requirements: 7.1, 7.4, 7.5_

  - [ ] 6.22 Test info windows
    - Verify info windows display correct data
    - Test single info window constraint
    - Test "Chat" button functionality
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ] 6.23 Test mobile responsiveness
    - Test map display on mobile viewport (< 768px)
    - Verify marker click centers map and switches to chat tab
    - Test user selection from sidebar centers map
    - Verify touch gestures work
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ]* 6.24 Write property test for mobile marker click behavior
    - **Property 22: Mobile Marker Click Behavior**
    - **Validates: Requirements 8.5**
    - Test that marker click on mobile centers map and switches to chat tab
    - Verify behavior only occurs on mobile viewport

  - [ ]* 6.25 Write property test for mobile user selection centering
    - **Property 24: Mobile User Selection Centering**
    - **Validates: Requirements 9.3**
    - Test that selecting user from sidebar centers map with zoom level 15
    - Verify centering only occurs on mobile viewport

  - [ ] 6.26 Test active tourist count display
    - Verify status overlay shows correct count of active tourists
    - Test count updates as users join/leave
    - _Requirements: 5.6_

  - [ ]* 6.27 Write property test for active tourist count display
    - **Property 14: Active Tourist Count Display**
    - **Validates: Requirements 5.6**
    - Test that displayed count matches number of tourists in activeUsers array
    - Verify count accuracy across various user counts

- [ ] 7. Checkpoint - Verify Admin Dashboard integration
  - Ensure all Admin Dashboard features work with Google Maps
  - Test tourist markers, SOS alerts, trails, and clustering
  - Verify info windows and mobile responsiveness
  - Ask the user if questions arise


- [ ] 8. Real-Time Communication Testing
  - [ ] 8.1 Test Socket.IO location updates
    - Verify locationUpdate events emit from User Dashboard
    - Verify touristLocation events received on Admin Dashboard
    - Test marker position updates in real-time
    - _Requirements: 10.1, 10.2_

  - [ ] 8.2 Test Socket.IO SOS alerts
    - Verify sosTrigger events emit from User Dashboard
    - Verify sosAlert events received on Admin Dashboard
    - Test SOS marker creation and updates
    - _Requirements: 10.3, 10.4_

  - [ ] 8.3 Test Socket.IO event preservation
    - Verify all existing Socket.IO events still work
    - Test adminMessage and userMessage events
    - Test updateSosStatus and sosStatusUpdated events
    - Verify event structure remains unchanged
    - _Requirements: 10.5_

  - [ ]* 8.4 Write property test for socket event preservation
    - **Property 30: Socket Event Preservation**
    - **Validates: Requirements 10.5**
    - Test that all existing Socket.IO events maintain structure and handling
    - Verify no events are broken by migration

  - [ ]* 8.5 Write property test for update debouncing
    - **Property 34: Update Debouncing**
    - **Validates: Requirements 13.2**
    - Test that rapid location updates (multiple within 100ms) are debounced
    - Verify only most recent update is processed

- [ ] 9. Performance Optimization and Testing
  - [ ] 9.1 Implement marker reuse optimization
    - Verify markers are updated (not recreated) on position changes
    - Test with rapid location updates
    - Monitor memory usage
    - _Requirements: 13.1_

  - [ ] 9.2 Implement trail point limiting
    - Verify user trail limits to 300 points
    - Verify tourist trails limit to 100 points
    - Test with long-running sessions
    - _Requirements: 13.3_

  - [ ] 9.3 Implement update debouncing
    - Add debouncing to location update handlers
    - Set debounce delay to 100ms
    - Test with rapid location changes
    - _Requirements: 13.2_

  - [ ] 9.4 Test performance with 100+ markers
    - Simulate 100+ active tourists on Admin Dashboard
    - Verify clustering activates automatically
    - Measure rendering performance
    - Verify smooth interactions
    - _Requirements: 13.4_

  - [ ] 9.5 Test React optimization hooks
    - Verify useMemo prevents unnecessary recalculations
    - Verify useCallback prevents unnecessary re-renders
    - Use React DevTools Profiler to measure performance
    - _Requirements: 13.5_

  - [ ]* 9.6 Write property test for speed calculation
    - **Property 9: Speed Calculation**
    - **Validates: Requirements 3.5**
    - Test that speed is correctly calculated from distance and time
    - Verify calculation works for any two consecutive location updates

- [ ] 10. Browser and Device Compatibility Testing
  - [ ] 10.1 Test on Chrome browser
    - Test on Chrome 90+ (desktop and mobile)
    - Verify all features work correctly
    - Test geolocation API
    - _Requirements: 14.1, 14.2_

  - [ ] 10.2 Test on Firefox browser
    - Test on Firefox 88+
    - Verify all features work correctly
    - Test geolocation API
    - _Requirements: 14.1_

  - [ ] 10.3 Test on Safari browser
    - Test on Safari 14+ (desktop and iOS)
    - Verify all features work correctly
    - Test geolocation API
    - _Requirements: 14.1, 14.2_

  - [ ] 10.4 Test on Edge browser
    - Test on Edge 90+
    - Verify all features work correctly
    - Test geolocation API
    - _Requirements: 14.1_

  - [ ] 10.5 Test responsive breakpoints
    - Test mobile layout (< 640px)
    - Test tablet layout (640px - 1024px)
    - Test desktop layout (> 1024px)
    - Verify all breakpoints work correctly
    - _Requirements: 14.3_

  - [ ] 10.6 Test geolocation API
    - Test geolocation permission grant
    - Test geolocation permission denial
    - Test geolocation unavailable scenario
    - Verify fallback behavior works
    - _Requirements: 14.4, 14.5_

  - [ ]* 10.7 Write property test for geolocation API usage
    - **Property 36: Geolocation API Usage**
    - **Validates: Requirements 14.4**
    - Test that geolocation API is called on User Dashboard load
    - Verify location is obtained from browser

  - [ ]* 10.8 Write property test for geolocation fallback
    - **Property 37: Geolocation Fallback**
    - **Validates: Requirements 14.5**
    - Test that fallback location is used when geolocation fails
    - Verify system doesn't crash on geolocation denial

- [ ] 11. Cleanup and Migration Finalization
  - [x] 11.1 Remove Leaflet packages from package.json
    - Remove "leaflet" dependency
    - Remove "react-leaflet" dependency
    - Run `npm install` to update package-lock.json
    - _Requirements: 15.1_

  - [x] 11.2 Search and remove all Leaflet references
    - Search codebase for "leaflet" imports
    - Search for "L.Icon" references
    - Search for "MapContainer" usage
    - Search for "TileLayer" usage
    - Remove any remaining Leaflet code
    - _Requirements: 15.2, 15.4_

  - [x] 11.3 Remove Leaflet CSS imports
    - Remove 'leaflet/dist/leaflet.css' imports
    - Verify no Leaflet CSS remains
    - _Requirements: 15.3_

  - [x] 11.4 Verify no Leaflet references remain
    - Run grep search: `grep -r "leaflet" client/src/`
    - Run grep search: `grep -r "L\\.Icon" client/src/`
    - Run grep search: `grep -r "MapContainer" client/src/`
    - Verify all searches return no results
    - _Requirements: 15.5_

  - [ ] 11.5 Update documentation
    - Update README with Google Maps integration details
    - Document API key configuration
    - Document new GoogleMapWrapper component
    - Add migration notes

- [ ] 12. Final Testing and Validation
  - [ ] 12.1 Run full test suite
    - Run all unit tests
    - Run all property-based tests (minimum 100 iterations each)
    - Verify all tests pass
    - Fix any failing tests

  - [ ] 12.2 Perform manual testing checklist
    - Test User Dashboard location tracking
    - Test User Dashboard trail rendering
    - Test User Dashboard zone overlays
    - Test User Dashboard SOS functionality
    - Test Admin Dashboard tourist markers
    - Test Admin Dashboard SOS alerts
    - Test Admin Dashboard marker clustering
    - Test Admin Dashboard info windows
    - Test real-time Socket.IO updates
    - Test mobile responsiveness on both dashboards

  - [ ] 12.3 Test on mobile devices
    - Test on iOS device (iPhone)
    - Test on Android device
    - Verify touch gestures work
    - Verify mobile layouts work correctly
    - _Requirements: 14.2_

  - [ ] 12.4 Performance validation
    - Verify map initialization < 1 second
    - Verify marker updates < 16ms (60 FPS)
    - Verify trail rendering with 300 points < 50ms
    - Verify clustering 100+ markers < 100ms

  - [ ] 12.5 Security validation
    - Verify API key restrictions are configured in Google Cloud Console
    - Test API key only works on allowed domains
    - Verify location data validation is working
    - Test input validation for all location data

- [ ] 13. Final checkpoint - Complete migration verification
  - Ensure all Leaflet dependencies are removed
  - Verify all features work with Google Maps
  - Confirm all tests pass
  - Validate performance meets requirements
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- All Socket.IO events must maintain backward compatibility
- API key must be configured with proper restrictions in Google Cloud Console
- Performance benchmarks must be met for production readiness

## Property-Based Test Configuration

All property-based tests should use the following configuration:

```javascript
import fc from 'fast-check';

// Minimum 100 iterations per test
fc.assert(
  fc.property(/* generators */, /* test function */),
  { numRuns: 100 }
);

// Tag format: Feature: google-maps-integration, Property {number}: {property_text}
```

## Implementation Language

All code will be implemented in **JavaScript (React)** to maintain consistency with the existing codebase.
