import React, { useState, useEffect, useRef, useMemo } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, LogOut, Siren, User, Bell, Activity, MessageSquare, Mic, Square, Play, Pause, Trash2, Send, Navigation, Info, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GoogleMapWrapper from '../components/GoogleMapWrapper';
import RestrictedAreaModal from '../components/RestrictedAreaModal';
import DisclaimerModal from '../components/DisclaimerModal';
import SOSModal from '../components/SOSModal';
import CooldownModal from '../components/CooldownModal';

// Allowed areas for SOS
const allowedAreas = [
  {
    name: "Delhi",
    lat: 28.6139,
    lng: 77.2090,
    radius: 50000 // in meters (~50 km) 
  },
  {
    name: "Lovely Professional University",
    lat: 31.2536,
    lng: 75.7056,
    radius: 5000
  },
  {
    name: "Amritsar",
    lat: 31.6340,
    lng: 74.8723,
    radius: 30000
  }
];

// Haversine formula for distance in meters
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const socket = io(API_BASE);

import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [risk, setRisk] = useState({ label: 'Safe', score: 0 });
  const [location, setLocation] = useState(() => {
    // Try to get stored location immediately for faster initial render
    const storedLat = parseFloat(localStorage.getItem('initialLat'));
    const storedLng = parseFloat(localStorage.getItem('initialLng'));
    if (!isNaN(storedLat) && !isNaN(storedLng)) {
      return { lat: storedLat, lng: storedLng };
    }
    return null;
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(() => {
    // If we have stored location, don't show loading screen
    const storedLat = parseFloat(localStorage.getItem('initialLat'));
    const storedLng = parseFloat(localStorage.getItem('initialLng'));
    return isNaN(storedLat) || isNaN(storedLng);
  });
  console.log("Current Location State:", location);
  const [adminNote, setAdminNote] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [lastSosTime, setLastSosTime] = useState(0);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [msgText, setMsgText] = useState('');
  const [chat, setChat] = useState([]);
  const messagesEndRef = useRef(null);
  const recRef = useRef(null);
  const sosChunksRef = useRef([]);
  const sosStreamRef = useRef(null);
  const sendOnStopRef = useRef(true);
  const [recPaused, setRecPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [path, setPath] = useState([]);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [geoData, setGeoData] = useState({ restrictedZones: [], crowdedAreas: [], landmarks: [], weatherAlerts: [], emergencyUpdates: [] });
  const [warnings, setWarnings] = useState([]);
  const prevLocRef = useRef({ lat: 51.505, lng: -0.09, t: Date.now() });
  const [nearestLandmark, setNearestLandmark] = useState(null);
  const speedEmaRef = useRef(0);
  const lastNearbyFetchRef = useRef({ lat: 0, lng: 0, t: 0 });
  const navigate = useNavigate();
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = viewport.w < 640;
  const isTablet = viewport.w < 1024;

  const [activeTab, setActiveTab] = useState('map');

  // Task 4.2: Convert location state to markers prop format
  const markers = useMemo(() => {
    if (!location) return [];
    return [{
      id: 'user',
      position: location,
      type: 'user',
      label: 'You',
      infoContent: `<div style="padding:8px;color:#0f172a;font-weight:600;">
        <div style="font-size:14px;margin-bottom:4px;">📍 Your Location</div>
        <div style="font-size:12px;color:#64748b;">${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</div>
      </div>`,
    }];
  }, [location]);

  // Task 4.3: Convert path array to polylines prop format
  const polylines = useMemo(() => {
    if (path.length < 2) return [];
    return [{
      id: 'user-trail',
      path: path.map(([lat, lng]) => ({ lat, lng })),
      color: '#3B82F6',
      weight: 4,
      opacity: 0.7,
    }];
  }, [path]);

  // Task 4.6: Convert geoData zones to circles prop format
  const circles = useMemo(() => {
    if (!location) return [];
    return [
      ...(geoData.restrictedZones || []).map(z => ({
        id: `restricted-${z.id}`,
        center: z.center,
        radius: z.radius,
        fillColor: '#f59e0b',
        fillOpacity: 0.15,
        strokeColor: '#f59e0b',
        strokeWeight: 2,
      })),
      ...(geoData.crowdedAreas || []).map(a => ({
        id: `crowded-${a.id}`,
        center: a.center,
        radius: a.radius,
        fillColor: '#ef4444',
        fillOpacity: 0.2,
        strokeColor: '#ef4444',
        strokeWeight: 2,
      })),
    ];
  }, [geoData, location]);

  useEffect(() => {
    window.onerror = (msg, url, lineNo, columnNo, error) => {
      console.error("GLOBAL ERROR:", msg, "at", url, ":", lineNo, ":", columnNo, error);
      return false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Show disclaimer only for normal users on the dashboard
    const role = localStorage.getItem('role');
    const isShown = sessionStorage.getItem('disclaimerShown');
    if (role === 'user' && !isShown) {
      setShowDisclaimer(true);
    }

    // Get user's current location immediately on mount
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            console.log('Got current location:', currentLat, currentLng);
            setLocation({ lat: currentLat, lng: currentLng });
            setIsLoadingLocation(false);
            
            // Store in localStorage for future use
            localStorage.setItem('initialLat', currentLat.toString());
            localStorage.setItem('initialLng', currentLng.toString());
            
            // Initialize previous location for speed calculation
            prevLocRef.current = { lat: currentLat, lng: currentLng, t: Date.now() };
            
            // Check risk for initial location
            checkRisk(currentLat, currentLng);
          },
          (error) => {
            console.warn('Geolocation error:', error.message);
            // If we already have a stored location, just use it
            if (location) {
              console.log('Using stored location:', location);
              setIsLoadingLocation(false);
            } else {
              // Fallback to default location (Delhi)
              console.log('Using default location: Delhi');
              const defaultLocation = { lat: 28.6139, lng: 77.2090 };
              setLocation(defaultLocation);
              setIsLoadingLocation(false);
            }
          },
          { 
            enableHighAccuracy: true,
            timeout: 5000, // Reduced from 10s to 5s for faster response
            maximumAge: 30000 // Allow cached location up to 30 seconds old
          }
        );
      } else {
        console.warn('Geolocation not supported');
        // Use stored or default location
        if (!location) {
          setLocation({ lat: 28.6139, lng: 77.2090 });
        }
        setIsLoadingLocation(false);
      }
    };

    // Get current location first
    getCurrentLocation();

    // Real-time tracking
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
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
            speedEmaRef.current = 0; // Instantly snap to 0 to prevent lingering speed while stationary
          } else if (kmh > 180) {
            kmh = speedEmaRef.current || 0;
          }

          const alpha = 0.25;
          const ema = alpha * kmh + (1 - alpha) * (speedEmaRef.current || 0);
          speedEmaRef.current = ema;
          setSpeedKmh(parseFloat(ema.toFixed(1)));
          prevLocRef.current = { lat: newLat, lng: newLng, t: now };
          setLocation({ lat: newLat, lng: newLng });
          setPath(prevPath => [...prevPath, [newLat, newLng]].slice(-300));
          if (shouldFetchNearby(newLat, newLng, now)) fetchNearbyLandmarks(newLat, newLng);

          // Emit update
          socket.emit('locationUpdate', { lat: newLat, lng: newLng, userId: user?.id });

          // Check Risk
          checkRisk(newLat, newLng);
        },
        (err) => {
          console.warn("Geolocation watch failed, using simulation");
          startSimulation();
        },
        { enableHighAccuracy: true }
      );
    } else {
      startSimulation();
    }

    // Join active users - only if user is properly authenticated
    const userId = user?._id || user?.id;
    if (userId && localStorage.getItem('token') && localStorage.getItem('role') === 'user') {
      console.log('User joining socket:', userId);
      socket.emit('join', userId);
    }

    socket.on('userMessage', (msg) => {
      // This listener is for receiving messages FROM admin, not echoing our own messages
      // Our own messages are already added to chat when we send them
      // So we should ignore messages where fromUserId matches our user id
      if (msg?.fromUserId === userId) {
        // This is our own message being echoed back - ignore it
        return;
      }
    });

    socket.on('adminMessage', msg => {
      console.log('Admin message received:', msg);
      if (!msg) return
      if (msg.type === 'text' && msg.text) {
        // Add to chat only, don't set adminNote (which creates the separate panel)
        setChat(prev => [...prev, { from: 'admin', type: 'text', text: msg.text, time: Date.now() }].slice(-200))
      } else if (msg.type === 'audio' && msg.audio) {
        const b64 = msg.audio;
        let src;
        try {
          const byteChars = atob(b64);
          const byteNums = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
          const bytes = new Uint8Array(byteNums);
          const blob = new Blob([bytes], { type: 'audio/webm;codecs=opus' });
          src = URL.createObjectURL(blob);
        } catch (e) {
          src = `data:audio/webm;codecs=opus;base64,${b64}`;
        }
        // Add to chat only, don't set adminNote (which creates the separate panel)
        setChat(prev => [...prev, { from: 'admin', type: 'audio', audioSrc: src, time: Date.now() }].slice(-200))
      }
    })

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.off('adminMessage')
    };
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const fetchGeo = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/geo/map-data`);
        if (mounted) setGeoData(res.data || {});
      } catch (e) { }
    };
    fetchGeo();
    const id = setInterval(fetchGeo, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const shouldFetchNearby = (lat, lng, now) => {
    const last = lastNearbyFetchRef.current;
    const movedM = getDistance(lat, lng, last.lat, last.lng);
    // Increased from 20s to 60s and 300m to 500m to reduce API calls
    return (now - last.t) > 60000 || movedM > 500;
  };
  const fetchNearbyLandmarks = async (lat, lng) => {
    try {
      const query = `[out:json];(node(around:1200,${lat},${lng})["name"]["tourism"];node(around:1200,${lat},${lng})["name"]["amenity"];node(around:1200,${lat},${lng})["name"]["historic"];);out 20;`;
      const res = await axios.get('https://overpass-api.de/api/interpreter', { 
        params: { data: query },
        timeout: 5000 // 5 second timeout to prevent long waits
      });
      const elements = res.data?.elements || [];
      let best = null, bestD = Infinity;
      elements.forEach(el => {
        const d = getDistance(lat, lng, el.lat, el.lon);
        const name = el.tags?.name;
        if (name && d < bestD) { bestD = d; best = { name, distM: d }; }
      });
      if (best) setNearestLandmark(best);
      lastNearbyFetchRef.current = { lat, lng, t: Date.now() };
    } catch (e) {
      // Silently fail - landmark fetching is not critical
      console.log('Landmark fetch skipped (API timeout or unavailable)');
      lastNearbyFetchRef.current = { lat, lng, t: Date.now() };
    }
  };

  useEffect(() => {
    if (!location) return; // Don't process warnings if location is not available yet
    
    const warns = [];
    // Restricted zones proximity (~500m before entry)
    (geoData.restrictedZones || []).forEach(z => {
      const d = getDistance(location.lat, location.lng, z.center.lat, z.center.lng);
      if (d > z.radius && d - z.radius <= 500) {
        warns.push({ type: 'restricted', id: z.id, message: `Restricted area ahead: ${z.name} (~${Math.max(0, Math.round(d - z.radius))}m)` });
      }
    });
    // Crowded areas caution when inside
    (geoData.crowdedAreas || []).forEach(a => {
      const d = getDistance(location.lat, location.lng, a.center.lat, a.center.lng);
      if (d <= a.radius) {
        warns.push({ type: 'crowded', id: a.id, message: `Overcrowded area: ${a.name} — caution` });
      }
    });
    setWarnings(warns);
    // Nearest landmark
    let nearest = null, best = Infinity;
    (geoData.landmarks || []).forEach(lm => {
      const d = getDistance(location.lat, location.lng, lm.location.lat, lm.location.lng);
      if (d < best) { best = d; nearest = { name: lm.name, distM: d }; }
    });
    setNearestLandmark(nearest);
  }, [location, geoData]);

  const startSimulation = () => {
    const interval = setInterval(() => {
      setLocation(prev => {
        const newLat = prev.lat + (Math.random() - 0.5) * 0.001;
        const newLng = prev.lng + (Math.random() - 0.5) * 0.001;
        socket.emit('locationUpdate', { ...prev, lat: newLat, lng: newLng, userId: user?.id });
        checkRisk(newLat, newLng);
        return { lat: newLat, lng: newLng };
      });
    }, 3000);
    return () => clearInterval(interval);
  };

  const checkRisk = async (lat, lng) => {
    const payload = {
      speed: speedEmaRef.current || 0,
      movement_gap: 0,
      area_risk: 0,
      time_hour: new Date().getHours(),
      lat, lng,
      touristId: user?.id
    };

    try {
      const res = await axios.post(`${API_BASE}/api/incidents/check-risk`, payload);
      setRisk({ label: res.data.risk_level, score: res.data.risk_score });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSOS = () => {
    const now = Date.now();
    if (now - lastSosTime < 60000) {
      const remaining = Math.ceil((60000 - (now - lastSosTime)) / 1000);
      setCooldownRemaining(remaining);
      setShowCooldownModal(true);
      return;
    }

    // Check if user is in an allowed area
    const isInsideAllowedArea = allowedAreas.some(area => {
      const distance = getDistance(location.lat, location.lng, area.lat, area.lng);
      return distance <= area.radius;
    });

    if (isInsideAllowedArea) {
      setLastSosTime(now);
      socket.emit('sosTrigger', {
        location,
        userId: user?.id,
        userName: user?.name,
        phone: user?.phone,
        time: new Date()
      });
      setShowSOSModal(true);
      setSosOpen(true);
    } else {
      setIsRestricted(true);
    }
  };
  const handleLogout = () => {
    if (user?.id) {
      socket.emit('leave', user.id);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('initialLat');
    localStorage.removeItem('initialLng');
    sessionStorage.removeItem('disclaimerShown');
    navigate('/login');
  };

  const getRiskColor = () => {
    const label = risk?.label || 'Safe';
    if (label === 'Emergency') return '#ef4444';
    if (label === 'Warning') return '#f59e0b';
    return '#10b981';
  };
  const cleanupSos = (cancelOnly = false) => {
    try {
      if (sosStreamRef.current) {
        sosStreamRef.current.getTracks().forEach(t => t.stop())
        sosStreamRef.current = null
      }
      if (cancelOnly) {
        sosChunksRef.current = []
      }
      recRef.current = null
      sendOnStopRef.current = true
      setRecPaused(false)
      setIsRecording(false)
    } catch (e) { }
  };

  const handleCloseDisclaimer = () => {
    sessionStorage.setItem('disclaimerShown', 'true');
    setShowDisclaimer(false);
  };

  const chatListMaxH = isMobile ? '28vh' : '300px';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  const handleSendMessage = () => {
    const t = msgText.trim();
    if (t) {
      socket.emit('userMessage', { fromUserId: user?.id, type: 'text', text: t });
      setChat(prev => [...prev, { from: 'me', type: 'text', text: t, time: Date.now() }].slice(-200));
      setMsgText('');
    }
  };

  return (
    <div className="main-dashboard">
      {/* Modal Components */}
      <RestrictedAreaModal
        isOpen={isRestricted}
        onClose={() => setIsRestricted(false)}
        allowedAreas={allowedAreas}
      />
      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={handleCloseDisclaimer}
      />
      <SOSModal
        isOpen={showSOSModal}
        onClose={() => setShowSOSModal(false)}
      />
      <CooldownModal
        isOpen={showCooldownModal}
        onClose={() => setShowCooldownModal(false)}
        remainingSeconds={cooldownRemaining}
      />

      {/* Mobile Tab Navigation */}
      {isMobile && (
        <div className="mobile-tabs">
          <button 
            className={`mobile-tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <MapPin size={20} />
            <span>Map</span>
          </button>
          <button 
            className={`mobile-tab ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            <Siren size={20} />
            <span>SOS</span>
          </button>
          <button 
            className={`mobile-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={20} />
            <span>Chat</span>
          </button>
        </div>
      )}

      {/* Mobile Logout Button - Top Right Corner */}
      {isMobile && (
        <button 
          onClick={handleLogout}
          className="mobile-logout-btn"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      )}

      {/* Left Section: Map (70%) */}
      <div className={`map-section ${isMobile && activeTab !== 'map' ? 'hidden' : ''}`}>
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
          {nearestLandmark && (
            <div className="map-info-item">
              <Navigation size={16} />
              <span>{nearestLandmark.name}</span>
            </div>
          )}
        </div>

        <div className="map-container-wrapper" style={{ height: '100%', width: '100%' }}>
          {!location || isLoadingLocation ? (
            <div className="loading-map" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: '#1e293b',
              color: '#cbd5e1'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid rgba(59, 130, 246, 0.3)',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '15px'
              }} />
              <p>Getting your location...</p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : (
            <GoogleMapWrapper
              center={location}
              zoom={13}
              markers={markers}
              polylines={polylines}
              circles={circles}
              isMobile={isMobile}
              style={{ height: '100%', width: '100%' }}
            />
          )}
        </div>

      </div>

      {/* Right Section: Side Panel (30%) */}
      <div className={`side-panel ${isMobile && activeTab !== 'sos' && activeTab !== 'chat' ? 'hidden' : ''}`}>
        <div className="side-panel-header">
          <div className="brand">
            <Shield size={24} color="#3b82f6" />
            <span>Safety Dashboard</span>
          </div>
        </div>

        {/* User Profile Card - Show on SOS tab for mobile */}
        {(!isMobile || activeTab === 'sos') && (
        <div className="profile-card">
          <div className="profile-img">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="profile-info">
            <p>Welcome back,</p>
            <h3>{user?.name || 'Tourist'}</h3>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
        )}

        {/* Safety Status Card - Show on SOS tab for mobile */}
        {(!isMobile || activeTab === 'sos') && (
        <div className="status-card" style={{ backgroundColor: getRiskColor() }}>
          <h2>Safety Score</h2>
          <div className="status-value">{risk?.score ?? 0}%</div>
          <div className="status-label">{(risk?.label || "Safe").toUpperCase()}</div>
        </div>
        )}

        {/* SOS Button - Show on SOS tab for mobile */}
        {(!isMobile || activeTab === 'sos') && (
        <button className="sos-btn" onClick={handleSOS}>
          <Siren size={24} /> 🚨 SOS ALERT
        </button>
        )}

        {/* Warnings / Alerts - Show on SOS tab for mobile */}
        {(!isMobile || activeTab === 'sos') && warnings.length > 0 && (
          <div className="alerts-container">
            <div className="alerts-header">
              <Bell size={18} />
              <span>Safety Alerts</span>
            </div>
            {warnings.map(w => (
              <div key={`${w.type}-${w.id}`} className="alert-item">
                • {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Admin Message Card - Show on SOS tab for mobile */}
        {(!isMobile || activeTab === 'sos') && adminNote && (
          <div className="admin-msg-card">
            <h4><Info size={16} /> Admin Message</h4>
            {adminNote.type === 'text' ? (
              <p>{adminNote.text}</p>
            ) : (
              <div className="audio-player">
                <Play size={14} fill="currentColor" />
                <audio controls src={adminNote.audioSrc} />
              </div>
            )}
          </div>
        )}

        {/* Chat Section - Show on chat tab for mobile */}
        {(!isMobile || activeTab === 'chat') && (
        <div className="chat-section">
          <div className="chat-header">
            <MessageSquare size={18} color="#3b82f6" />
            <span>Emergency Support</span>
          </div>

          <div className="messages-container">
            {chat.length === 0 ? (
              <div className="empty-chat">
                No active messages. Admin will contact you here in case of SOS.
              </div>
            ) : (
              <>
                {chat.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.from === 'me' ? 'user' : 'admin'}`}>
                    {msg.type === 'text' ? (
                      <p>{msg.text}</p>
                    ) : (
                      <div className="audio-message">
                        <Play size={14} fill="currentColor" />
                        <audio controls src={msg.audioSrc} />
                      </div>
                    )}
                    <div className="message-time">
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="chat-input-area">
            <div className="chat-input-row">
              <input
                className="chat-input"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type message..."
              />
              <button
                className="icon-btn send"
                onClick={handleSendMessage}
                disabled={!msgText.trim()}
                style={{ opacity: msgText.trim() ? 1 : 0.5 }}
              >
                <Send size={18} />
              </button>
            </div>

            <div className="chat-controls">
              {!isRecording ? (
                <button
                  className="voice-btn"
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      sosStreamRef.current = stream;
                      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
                      recRef.current = rec;
                      sosChunksRef.current = [];
                      sendOnStopRef.current = true;
                      setRecPaused(false);
                      setIsRecording(true);
                      rec.ondataavailable = e => { if (e.data && e.data.size > 0) sosChunksRef.current.push(e.data) };
                      rec.onstop = async () => {
                        if (!sendOnStopRef.current) { cleanupSos(true); return; }
                        try {
                          const blob = new Blob(sosChunksRef.current, { type: 'audio/webm' });
                          const buf = await blob.arrayBuffer();
                          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
                          const audioSrc = URL.createObjectURL(blob);
                          const currentUserId = user?._id || user?.id;
                          
                          console.log("USER SENDING AUDIO:", { fromUserId: currentUserId, type: 'audio', audio: b64 });
                          socket.emit('userMessage', { fromUserId: currentUserId, type: 'audio', audio: b64 });
                          
                          // Add to chat immediately (don't wait for socket echo)
                          setChat(prev => [...prev, { from: 'me', type: 'audio', audioSrc, time: Date.now() }].slice(-200));
                        } catch (e) { 
                          console.error('Error sending audio:', e);
                        }
                        cleanupSos(false);
                      };
                      rec.start();
                    } catch (e) {
                      console.error('Microphone access denied:', e);
                      alert('Microphone access is required for voice messages');
                    }
                  }}
                >
                  <Mic size={18} /> Record Voice
                </button>
              ) : (
                <div className="recording-controls">
                  <button className="icon-btn" onClick={() => {
                    try {
                      if (recPaused) { recRef.current.resume(); setRecPaused(false) }
                      else { recRef.current.pause(); setRecPaused(true) }
                    } catch (e) { }
                  }}>
                    {recPaused ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                  <button className="icon-btn send" style={{ flex: 1 }} onClick={() => {
                    try {
                      sendOnStopRef.current = true;
                      recRef.current.stop()
                    } catch (e) { }
                  }}>
                    <Send size={16} /> Send
                  </button>
                  <button className="icon-btn danger" onClick={() => {
                    try {
                      sendOnStopRef.current = false;
                      if (recRef.current) recRef.current.stop(); else cleanupSos(true)
                    } catch (e) { }
                  }}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
