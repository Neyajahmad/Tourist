import { useEffect, useRef, useState } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const GoogleMapWrapper = ({
  center,
  zoom,
  style,
  markers = [],
  polylines = [],
  circles = [],
  enableClustering = false,
  clusteringThreshold = 50,
  onMapLoad,
  onCenterChanged,
  onZoomChanged,
  isMobile = false,
  showAccuracyCircle = false, // NEW: Enable accuracy circle for user marker
  accuracy = null, // NEW: Accuracy in meters
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});
  const circlesRef = useRef({});
  const clustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const accuracyCircleRef = useRef(null); // NEW: Ref for accuracy circle
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wait for Google Maps API to load
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        console.log('Google Maps API is ready');
        setIsLoading(false);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkGoogleMaps()) {
      return;
    }

    // Listen for the initMap callback
    const originalInitMap = window.initMap;
    window.initMap = function() {
      if (originalInitMap) originalInitMap();
      checkGoogleMaps();
    };

    // Poll for Google Maps API as fallback
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout after 15 seconds with detailed error
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.google || !window.google.maps) {
        console.error('Google Maps failed to load. Possible causes:');
        console.error('- API key is invalid or expired');
        console.error('- Billing is not enabled on the Google Cloud project');
        console.error('- Maps JavaScript API is not enabled');
        console.error('- API key restrictions are blocking this domain');
        setMapError('Unable to load Google Maps. Please check the browser console for details and verify your API key configuration.');
        setIsLoading(false);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize map on mount
  useEffect(() => {
    if (isLoading || !window.google || !window.google.maps || !mapRef.current) {
      return;
    }

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        styles: DARK_THEME_STYLES,
        disableDefaultUI: isMobile,
        zoomControl: !isMobile,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: !isMobile,
      });

      mapInstanceRef.current = map;
      
      if (onMapLoad) {
        onMapLoad(map);
      }

      // Add event listeners
      map.addListener('center_changed', () => {
        if (onCenterChanged) {
          const center = map.getCenter();
          onCenterChanged({ lat: center.lat(), lng: center.lng() });
        }
      });

      map.addListener('zoom_changed', () => {
        if (onZoomChanged) {
          onZoomChanged(map.getZoom());
        }
      });

      return () => {
        // Cleanup
        Object.values(markersRef.current).forEach(m => m.setMap(null));
        Object.values(polylinesRef.current).forEach(p => p.setMap(null));
        Object.values(circlesRef.current).forEach(c => c.setMap(null));
        if (clustererRef.current) {
          clustererRef.current.clearMarkers();
        }
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
      };
    } catch (error) {
      console.error('Map initialization failed:', error);
      setMapError('Failed to initialize map. Please refresh the page.');
    }
  }, [isLoading]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updateMarkers(markers, mapInstanceRef.current, markersRef, clustererRef, enableClustering, clusteringThreshold, infoWindowRef);
  }, [markers, enableClustering, clusteringThreshold]);

  // Update polylines
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updatePolylines(polylines, mapInstanceRef.current, polylinesRef);
  }, [polylines]);

  // Update circles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updateCircles(circles, mapInstanceRef.current, circlesRef);
  }, [circles]);

  // Update accuracy circle (NEW)
  useEffect(() => {
    if (!mapInstanceRef.current || !showAccuracyCircle) return;
    
    if (accuracy && center) {
      if (!accuracyCircleRef.current) {
        // Create accuracy circle
        accuracyCircleRef.current = new google.maps.Circle({
          center: center,
          radius: accuracy,
          map: mapInstanceRef.current,
          fillColor: '#4285F4',
          fillOpacity: 0.15,
          strokeColor: '#4285F4',
          strokeOpacity: 0.3,
          strokeWeight: 1,
          zIndex: 998,
          clickable: false,
        });
      } else {
        // Update existing accuracy circle
        accuracyCircleRef.current.setCenter(center);
        accuracyCircleRef.current.setRadius(accuracy);
      }
    } else if (accuracyCircleRef.current) {
      // Remove accuracy circle if no accuracy data
      accuracyCircleRef.current.setMap(null);
      accuracyCircleRef.current = null;
    }
  }, [showAccuracyCircle, accuracy, center]);

  // Update center
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(center);
  }, [center]);

  // Update zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(zoom);
  }, [zoom]);

  if (isLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1e293b',
        color: '#cbd5e1',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }} />
          <p>Loading map...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1e293b',
        color: '#cbd5e1',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <p>{mapError}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%', ...style }} />;
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
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9080' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#475569' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }]
  }
];

// Helper function to get marker icon based on type
const getMarkerIcon = (type) => {
  if (!window.google) return null;
  
  // Custom pin path (Google Maps style)
  const pinPath = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';
  
  switch (type) {
    case 'user':
      // Blue pin for current user
      return {
        path: pinPath,
        fillColor: '#4285F4', // Google blue
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 2,
        anchor: new google.maps.Point(12, 22), // Pin point at bottom
      };
    case 'tourist':
      // Green pin for tourists
      return {
        path: pinPath,
        fillColor: '#10b981', // Green
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.8,
        anchor: new google.maps.Point(12, 22), // Pin point at bottom
      };
    case 'sos':
      // Red pin for SOS alerts with bounce animation
      return {
        path: pinPath,
        fillColor: '#ef4444', // Red
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
        scale: 2.2,
        anchor: new google.maps.Point(12, 22), // Pin point at bottom
        animation: google.maps.Animation.BOUNCE,
      };
    default:
      return null;
  }
};

// Update markers function
const updateMarkers = (markers, map, markersRef, clustererRef, enableClustering, clusteringThreshold, infoWindowRef) => {
  const currentIds = new Set(Object.keys(markersRef.current));
  const newIds = new Set(markers.map(m => m.id));
  
  // Remove markers that no longer exist
  currentIds.forEach(id => {
    if (!newIds.has(id)) {
      markersRef.current[id].setMap(null);
      // Also remove pulsing circles if they exist
      if (markersRef.current[`${id}-pulse`]) {
        markersRef.current[`${id}-pulse`].setMap(null);
        delete markersRef.current[`${id}-pulse`];
      }
      if (markersRef.current[`${id}-ripple`]) {
        markersRef.current[`${id}-ripple`].setMap(null);
        delete markersRef.current[`${id}-ripple`];
      }
      delete markersRef.current[id];
    }
  });
  
  // Add or update markers
  markers.forEach(markerData => {
    if (markersRef.current[markerData.id]) {
      // Update existing marker position
      const marker = markersRef.current[markerData.id];
      marker.setPosition(markerData.position);
      
      // Update pulsing circles position if they exist
      if (markersRef.current[`${markerData.id}-pulse`]) {
        markersRef.current[`${markerData.id}-pulse`].setCenter(markerData.position);
      }
      if (markersRef.current[`${markerData.id}-ripple`]) {
        markersRef.current[`${markerData.id}-ripple`].setCenter(markerData.position);
      }
    } else {
      // Create new marker
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: map,
        title: markerData.label,
        icon: getMarkerIcon(markerData.type),
        zIndex: markerData.type === 'user' ? 1000 : (markerData.type === 'sos' ? 999 : 100), // User marker on top
      });
      
      // Add pulsing circle for user marker
      if (markerData.type === 'user') {
        // Create multiple concentric circles for ripple effect (much smaller)
        const circles = [];
        
        // Inner pulsing circle (main animation) - much smaller
        const pulsingCircle = new google.maps.Circle({
          center: markerData.position,
          radius: 15, // Much smaller start (was 25)
          fillColor: '#3b82f6',
          fillOpacity: 0.3,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.7,
          strokeWeight: 2, // Thinner
          map: map,
          zIndex: 999,
        });
        circles.push(pulsingCircle);
        
        // Outer ripple circle (slower animation) - much smaller
        const rippleCircle = new google.maps.Circle({
          center: markerData.position,
          radius: 25, // Much smaller (was 40)
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.4,
          strokeWeight: 1.5, // Thinner
          map: map,
          zIndex: 998,
        });
        circles.push(rippleCircle);
        
        // Store the circles
        markersRef.current[`${markerData.id}-pulse`] = pulsingCircle;
        markersRef.current[`${markerData.id}-ripple`] = rippleCircle;
        
        // Animate with zoom in/zoom out effect (breathing animation)
        let growing = true;
        let currentRadius = 15; // Much smaller start
        let rippleGrowing = false; // Start opposite phase
        let rippleRadius = 25; // Much smaller start
        
        const pulseInterval = setInterval(() => {
          // Main pulse animation (zoom in/zoom out)
          if (growing) {
            currentRadius += 2; // Smooth growth
            if (currentRadius >= 35) growing = false; // Much smaller max (was 60)
          } else {
            currentRadius -= 2; // Smooth shrink
            if (currentRadius <= 15) growing = true; // Much smaller min (was 25)
          }
          
          // Ripple animation (opposite phase for wave effect)
          if (rippleGrowing) {
            rippleRadius += 1.5;
            if (rippleRadius >= 45) rippleGrowing = false; // Much smaller max (was 80)
          } else {
            rippleRadius -= 1.5;
            if (rippleRadius <= 25) rippleGrowing = true; // Much smaller min (was 40)
          }
          
          // Update circles with smooth zoom animation
          if (markersRef.current[`${markerData.id}-pulse`]) {
            markersRef.current[`${markerData.id}-pulse`].setRadius(currentRadius);
            // Smooth fade effect (zoom out = fade out)
            const progress = (currentRadius - 15) / 20; // 0 to 1
            const opacity = 0.3 - (progress * 0.2); // Fade from 0.3 to 0.1
            const strokeOpacity = 0.7 - (progress * 0.4); // Fade from 0.7 to 0.3
            markersRef.current[`${markerData.id}-pulse`].setOptions({
              fillOpacity: Math.max(0.1, opacity),
              strokeOpacity: Math.max(0.3, strokeOpacity)
            });
          } else {
            clearInterval(pulseInterval);
          }
          
          if (markersRef.current[`${markerData.id}-ripple`]) {
            markersRef.current[`${markerData.id}-ripple`].setRadius(rippleRadius);
            // Smooth fade effect for ripple
            const rippleProgress = (rippleRadius - 25) / 20; // 0 to 1
            const rippleOpacity = 0.15 - (rippleProgress * 0.12); // Fade from 0.15 to 0.03
            const rippleStrokeOpacity = 0.4 - (rippleProgress * 0.28); // Fade from 0.4 to 0.12
            markersRef.current[`${markerData.id}-ripple`].setOptions({
              fillOpacity: Math.max(0.03, rippleOpacity),
              strokeOpacity: Math.max(0.12, rippleStrokeOpacity)
            });
          }
        }, 50); // Smooth 20 FPS animation
      }
      
      // Store SOS flag for clustering exclusion
      marker.isSOS = markerData.type === 'sos';
      
      // Add click listener for info window if infoContent is provided
      if (markerData.infoContent) {
        marker.addListener('click', () => {
          // Close existing info window
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          
          // Create new info window
          const infoWindow = new google.maps.InfoWindow({
            content: markerData.infoContent,
          });
          
          infoWindow.open(map, marker);
          infoWindowRef.current = infoWindow;
        });
      }
      
      // Add custom onClick handler if provided (in addition to info window)
      if (markerData.onClick) {
        marker.addListener('click', markerData.onClick);
      }
      
      markersRef.current[markerData.id] = marker;
    }
  });
  
  // Handle clustering
  if (enableClustering && markers.length > clusteringThreshold) {
    const clusterableMarkers = Object.values(markersRef.current).filter(m => !m.isSOS && m instanceof google.maps.Marker);
    
    if (!clustererRef.current) {
      try {
        clustererRef.current = new MarkerClusterer({
          map,
          markers: clusterableMarkers,
        });
      } catch (error) {
        console.error('Clustering failed:', error);
      }
    } else {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(clusterableMarkers);
    }
  } else if (clustererRef.current) {
    clustererRef.current.clearMarkers();
    clustererRef.current = null;
  }
};

// Update polylines function
const updatePolylines = (polylines, map, polylinesRef) => {
  const currentIds = new Set(Object.keys(polylinesRef.current));
  const newIds = new Set(polylines.map(p => p.id));
  
  // Remove old polylines
  currentIds.forEach(id => {
    if (!newIds.has(id)) {
      polylinesRef.current[id].setMap(null);
      delete polylinesRef.current[id];
    }
  });
  
  // Add or update polylines
  polylines.forEach(polylineData => {
    if (polylinesRef.current[polylineData.id]) {
      // Update existing polyline
      polylinesRef.current[polylineData.id].setPath(polylineData.path);
    } else {
      // Create new polyline
      const polyline = new google.maps.Polyline({
        path: polylineData.path,
        geodesic: true,
        strokeColor: polylineData.color,
        strokeOpacity: polylineData.opacity,
        strokeWeight: polylineData.weight,
        map: map,
      });
      polylinesRef.current[polylineData.id] = polyline;
    }
  });
};

// Update circles function
const updateCircles = (circles, map, circlesRef) => {
  const currentIds = new Set(Object.keys(circlesRef.current));
  const newIds = new Set(circles.map(c => c.id));
  
  // Remove old circles
  currentIds.forEach(id => {
    if (!newIds.has(id)) {
      circlesRef.current[id].setMap(null);
      delete circlesRef.current[id];
    }
  });
  
  // Add or update circles
  circles.forEach(circleData => {
    if (circlesRef.current[circleData.id]) {
      // Update existing circle
      const circle = circlesRef.current[circleData.id];
      circle.setCenter(circleData.center);
      circle.setRadius(circleData.radius);
    } else {
      // Create new circle
      const circle = new google.maps.Circle({
        center: circleData.center,
        radius: circleData.radius,
        fillColor: circleData.fillColor,
        fillOpacity: circleData.fillOpacity,
        strokeColor: circleData.strokeColor,
        strokeWeight: circleData.strokeWeight,
        map: map,
      });
      circlesRef.current[circleData.id] = circle;
    }
  });
};

export default GoogleMapWrapper;
