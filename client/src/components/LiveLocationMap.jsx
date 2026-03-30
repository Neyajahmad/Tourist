import React, { useState, useEffect, useRef } from 'react';

/**
 * LiveLocationMap - Google Maps-style real-time location tracking
 * 
 * Features:
 * - Blue dot marker (Google Maps style)
 * - Accuracy radius circle
 * - Smooth position updates
 * - Auto-follow mode
 * - Dark theme support
 * - High accuracy tracking
 */
const LiveLocationMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const watchIdRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [autoFollow, setAutoFollow] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // Initialize Google Maps
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        console.log('✅ Google Maps API is ready');
        setIsLoading(false);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    const interval = setInterval(() => {
      if (checkGoogleMaps()) clearInterval(interval);
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.google || !window.google.maps) {
        setMapError('Google Maps failed to load. Please check your API key.');
        setIsLoading(false);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Create map instance
  useEffect(() => {
    if (isLoading || !window.google || !mapRef.current || mapInstanceRef.current) return;

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 }, // India center
        zoom: 5,
        styles: DARK_THEME_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      console.log('✅ Map initialized');
    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      setMapError('Failed to initialize map');
    }
  }, [isLoading]);

  // Start location tracking
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    console.log('🎯 Starting location tracking...');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy: posAccuracy } = position.coords;
      
      console.log('📍 Location update:', {
        lat: latitude.toFixed(6),
        lng: longitude.toFixed(6),
        accuracy: `${posAccuracy.toFixed(0)}m`
      });

      const newLocation = { lat: latitude, lng: longitude };
      setUserLocation(newLocation);
      setAccuracy(posAccuracy);
      setLocationError(null);

      // Update or create marker
      if (!markerRef.current) {
        createMarker(newLocation);
        createAccuracyCircle(newLocation, posAccuracy);
        
        // Center map on first location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newLocation);
          mapInstanceRef.current.setZoom(16);
        }
      } else {
        // Smooth update existing marker
        updateMarkerPosition(newLocation);
        updateAccuracyCircle(newLocation, posAccuracy);
        
        // Auto-follow if enabled
        if (autoFollow && mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newLocation);
        }
      }
    };

    const handleError = (error) => {
      console.error('❌ Geolocation error:', error);
      let errorMessage = 'Unable to get your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }
      
      setLocationError(errorMessage);
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // Cleanup
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        console.log('🛑 Location tracking stopped');
      }
    };
  }, [autoFollow]);

  // Create blue dot marker (Google Maps style)
  const createMarker = (position) => {
    if (!mapInstanceRef.current) return;

    markerRef.current = new google.maps.Marker({
      position: position,
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4', // Google blue
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      zIndex: 1000,
      optimized: true,
    });

    console.log('✅ Marker created');
  };

  // Create accuracy circle
  const createAccuracyCircle = (position, accuracy) => {
    if (!mapInstanceRef.current) return;

    accuracyCircleRef.current = new google.maps.Circle({
      center: position,
      radius: accuracy,
      map: mapInstanceRef.current,
      fillColor: '#4285F4',
      fillOpacity: 0.15,
      strokeColor: '#4285F4',
      strokeOpacity: 0.3,
      strokeWeight: 1,
      zIndex: 999,
    });

    console.log(`✅ Accuracy circle created (${accuracy.toFixed(0)}m)`);
  };

  // Smooth marker position update
  const updateMarkerPosition = (newPosition) => {
    if (!markerRef.current) return;

    // Smooth animation using setPosition
    markerRef.current.setPosition(newPosition);
  };

  // Update accuracy circle
  const updateAccuracyCircle = (newPosition, newAccuracy) => {
    if (!accuracyCircleRef.current) return;

    accuracyCircleRef.current.setCenter(newPosition);
    accuracyCircleRef.current.setRadius(newAccuracy);
  };

  // Toggle auto-follow
  const toggleAutoFollow = () => {
    setAutoFollow(prev => !prev);
    
    // If enabling auto-follow, center on current location
    if (!autoFollow && userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(userLocation);
    }
  };

  // Recenter on user location
  const recenterMap = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(16);
      setAutoFollow(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading map...</p>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{mapError}</p>
        <button onClick={() => window.location.reload()} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Map Container */}
      <div ref={mapRef} style={styles.map} />

      {/* Control Panel */}
      <div style={styles.controlPanel}>
        {/* Location Status */}
        <div style={styles.statusCard}>
          {userLocation ? (
            <>
              <div style={styles.statusIndicator} />
              <div style={styles.statusText}>
                <div style={styles.statusTitle}>Location Active</div>
                <div style={styles.statusSubtitle}>
                  Accuracy: ±{accuracy ? accuracy.toFixed(0) : '—'}m
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ ...styles.statusIndicator, background: '#f59e0b' }} />
              <div style={styles.statusText}>
                <div style={styles.statusTitle}>Searching...</div>
                <div style={styles.statusSubtitle}>Getting your location</div>
              </div>
            </>
          )}
        </div>

        {/* Location Error */}
        {locationError && (
          <div style={styles.errorBanner}>
            ⚠️ {locationError}
          </div>
        )}

        {/* Coordinates Display */}
        {userLocation && (
          <div style={styles.coordsCard}>
            <div style={styles.coordRow}>
              <span style={styles.coordLabel}>Latitude:</span>
              <span style={styles.coordValue}>{userLocation.lat.toFixed(6)}</span>
            </div>
            <div style={styles.coordRow}>
              <span style={styles.coordLabel}>Longitude:</span>
              <span style={styles.coordValue}>{userLocation.lng.toFixed(6)}</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div style={styles.buttonGroup}>
          <button
            onClick={toggleAutoFollow}
            style={{
              ...styles.button,
              background: autoFollow ? '#10b981' : 'rgba(255,255,255,0.1)',
            }}
          >
            {autoFollow ? '🎯 Auto-Follow ON' : '⏸️ Auto-Follow OFF'}
          </button>
          
          <button onClick={recenterMap} style={styles.button}>
            📍 Recenter
          </button>
        </div>
      </div>

      {/* Floating Recenter Button (Mobile-friendly) */}
      {userLocation && !autoFollow && (
        <button onClick={recenterMap} style={styles.floatingButton}>
          📍
        </button>
      )}
    </div>
  );
};

// Dark theme styles for Google Maps
const DARK_THEME_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1e3a2f' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#475569' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }]
  },
];

// Styles
const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    background: '#0f172a',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#1e293b',
    color: '#cbd5e1',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(66, 133, 244, 0.3)',
    borderTop: '4px solid #4285F4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#1e293b',
    color: '#cbd5e1',
    padding: '20px',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: '15px',
    textAlign: 'center',
  },
  retryButton: {
    padding: '10px 20px',
    background: '#4285F4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  controlPanel: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '320px',
    zIndex: 1000,
  },
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(15, 23, 42, 0.95)',
    padding: '14px 16px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  statusIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 10px #10b981',
    flexShrink: 0,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '2px',
  },
  statusSubtitle: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
  },
  coordsCard: {
    background: 'rgba(15, 23, 42, 0.95)',
    padding: '14px 16px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  coordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '12px',
  },
  coordLabel: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  coordValue: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  button: {
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
    backdropFilter: 'blur(10px)',
  },
  floatingButton: {
    position: 'absolute',
    bottom: '30px',
    right: '30px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#4285F4',
    color: 'white',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 1000,
    transition: 'all 0.2s',
  },
};

// Add keyframe animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default LiveLocationMap;
