# Dashboard.jsx - Accuracy Circle Integration Guide

## Quick Integration Steps

### 1. Add Accuracy State (Line ~70)

```jsx
const [location, setLocation] = useState(() => {
  const storedLat = parseFloat(localStorage.getItem('initialLat'));
  const storedLng = parseFloat(localStorage.getItem('initialLng'));
  if (!isNaN(storedLat) && !isNaN(storedLng)) {
    return { lat: storedLat, lng: storedLng };
  }
  return null;
});

// ADD THIS:
const [accuracy, setAccuracy] = useState(null);
```

### 2. Update getCurrentLocation Function (Line ~180)

```jsx
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        const currentAccuracy = position.coords.accuracy; // ADD THIS
        
        console.log('Got current location:', currentLat, currentLng);
        console.log('Accuracy:', currentAccuracy, 'm'); // ADD THIS
        
        setLocation({ lat: currentLat, lng: currentLng });
        setAccuracy(currentAccuracy); // ADD THIS
        setIsLoadingLocation(false);
        
        localStorage.setItem('initialLat', currentLat.toString());
        localStorage.setItem('initialLng', currentLng.toString());
        
        prevLocRef.current = { lat: currentLat, lng: currentLng, t: Date.now() };
        checkRisk(currentLat, currentLng);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        if (location) {
          console.log('Using stored location:', location);
          setIsLoadingLocation(false);
        } else {
          console.log('Using default location: Delhi');
          const defaultLocation = { lat: 28.6139, lng: 77.2090 };
          setLocation(defaultLocation);
          setIsLoadingLocation(false);
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
      }
    );
  }
};
```

### 3. Update watchPosition Handler (Line ~220)

```jsx
watchId = navigator.geolocation.watchPosition(
  (position) => {
    const newLat = position.coords.latitude;
    const newLng = position.coords.longitude;
    const newAccuracy = position.coords.accuracy; // ADD THIS
    
    const now = Date.now();
    const prev = prevLocRef.current;
    const distM = getDistance(prev.lat, prev.lng, newLat, newLng);
    const dtS = Math.max(1, (now - prev.t) / 1000);
    
    let kmh;
    if (typeof position.coords.speed === 'number' && position.coords.speed !== null && position.coords.speed >= 0) {
      kmh = position.coords.speed * 3.6;
    } else {
      kmh = (distM / dtS) * 3.6;
    }

    if (kmh < 2.5) {
      kmh = 0;
      speedEmaRef.current = 0;
    } else if (kmh > 180) {
      kmh = speedEmaRef.current || 0;
    }

    const alpha = 0.25;
    const ema = alpha * kmh + (1 - alpha) * (speedEmaRef.current || 0);
    speedEmaRef.current = ema;
    setSpeedKmh(parseFloat(ema.toFixed(1)));
    prevLocRef.current = { lat: newLat, lng: newLng, t: now };
    
    setLocation({ lat: newLat, lng: newLng });
    setAccuracy(newAccuracy); // ADD THIS
    
    setPath(prevPath => [...prevPath, [newLat, newLng]].slice(-300));
    if (shouldFetchNearby(newLat, newLng, now)) fetchNearbyLandmarks(newLat, newLng);

    socket.emit('locationUpdate', { lat: newLat, lng: newLng, userId: user?.id });
    checkRisk(newLat, newLng);
  },
  (err) => {
    console.warn("Geolocation watch failed, using simulation");
    startSimulation();
  },
  { enableHighAccuracy: true }
);
```

### 4. Update GoogleMapWrapper Component (Line ~650)

```jsx
<GoogleMapWrapper
  center={location}
  zoom={13}
  markers={markers}
  polylines={polylines}
  circles={circles}
  showAccuracyCircle={true}  // ADD THIS
  accuracy={accuracy}         // ADD THIS
  isMobile={isMobile}
  style={{ height: '100%', width: '100%' }}
/>
```

### 5. Add Accuracy Display to Map Info Card (Optional, Line ~620)

```jsx
<div className="map-info-card">
  <div className="map-info-item">
    <MapPin size={16} />
    <span>
      {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Getting location...'}
    </span>
  </div>
  <div className="map-info-item">
    <Activity size={16} />
    <span>{speedKmh.toFixed(1)} km/h</span>
  </div>
  {/* ADD THIS: */}
  {accuracy && (
    <div className="map-info-item">
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
        ±{accuracy.toFixed(0)}m accuracy
      </span>
    </div>
  )}
  {nearestLandmark && (
    <div className="map-info-item">
      <Navigation size={16} />
      <span>{nearestLandmark.name}</span>
    </div>
  )}
</div>
```

## Complete Code Snippet

Here's the complete section with all changes:

```jsx
// State declarations (around line 70)
const [location, setLocation] = useState(() => {
  const storedLat = parseFloat(localStorage.getItem('initialLat'));
  const storedLng = parseFloat(localStorage.getItem('initialLng'));
  if (!isNaN(storedLat) && !isNaN(storedLng)) {
    return { lat: storedLat, lng: storedLng };
  }
  return null;
});
const [accuracy, setAccuracy] = useState(null); // NEW

// In the geolocation handler
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        const currentAccuracy = position.coords.accuracy; // NEW
        
        setLocation({ lat: currentLat, lng: currentLng });
        setAccuracy(currentAccuracy); // NEW
        setIsLoadingLocation(false);
        
        localStorage.setItem('initialLat', currentLat.toString());
        localStorage.setItem('initialLng', currentLng.toString());
        prevLocRef.current = { lat: currentLat, lng: currentLng, t: Date.now() };
        checkRisk(currentLat, currentLng);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        if (location) {
          setIsLoadingLocation(false);
        } else {
          const defaultLocation = { lat: 28.6139, lng: 77.2090 };
          setLocation(defaultLocation);
          setIsLoadingLocation(false);
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
      }
    );
  }
};

// In watchPosition
watchId = navigator.geolocation.watchPosition(
  (position) => {
    const newLat = position.coords.latitude;
    const newLng = position.coords.longitude;
    const newAccuracy = position.coords.accuracy; // NEW
    
    // ... existing speed calculation code ...
    
    setLocation({ lat: newLat, lng: newLng });
    setAccuracy(newAccuracy); // NEW
    
    // ... rest of the code ...
  },
  (err) => {
    console.warn("Geolocation watch failed");
    startSimulation();
  },
  { enableHighAccuracy: true }
);

// In the render section
<GoogleMapWrapper
  center={location}
  zoom={13}
  markers={markers}
  polylines={polylines}
  circles={circles}
  showAccuracyCircle={true}  // NEW
  accuracy={accuracy}         // NEW
  isMobile={isMobile}
  style={{ height: '100%', width: '100%' }}
/>
```

## Visual Result

After integration, you'll see:
- 🔵 Blue dot marker (your existing implementation)
- ⭕ Light blue accuracy circle around the marker
- 📊 Accuracy value in the info card (optional)

The accuracy circle will:
- Update in real-time as GPS accuracy changes
- Be larger when accuracy is poor (indoors, urban canyons)
- Be smaller when accuracy is good (open sky, good GPS signal)

## Testing

1. **Desktop:** Open in Chrome/Firefox with location enabled
2. **Mobile:** Test on actual device for best GPS accuracy
3. **Check Console:** Look for accuracy values in logs
4. **Move Around:** Watch the circle size change based on GPS quality

## Troubleshooting

**Circle not showing:**
- Check `showAccuracyCircle={true}` is set
- Verify `accuracy` state has a value
- Check browser console for errors

**Circle too large:**
- This is normal indoors or in urban areas
- Move to open area for better GPS signal
- Wait a few seconds for GPS to lock

**Circle not updating:**
- Verify `setAccuracy()` is being called in watchPosition
- Check that accuracy value is changing in console logs

## Done! 🎉

Your map now has Google Maps-style location tracking with accuracy visualization!
