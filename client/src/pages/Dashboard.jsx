import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import io from 'socket.io-client';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, MapPin, LogOut, Siren, User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const socket = io(API_BASE);

const Dashboard = () => {
  const [location, setLocation] = useState({ lat: 51.505, lng: -0.09 });
  const [risk, setRisk] = useState({ label: 'Safe', score: 0 });
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [adminNote, setAdminNote] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [chat, setChat] = useState([]);
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Initialize with stored location or default
    const storedLat = parseFloat(localStorage.getItem('initialLat'));
    const storedLng = parseFloat(localStorage.getItem('initialLng'));
    if (!isNaN(storedLat) && !isNaN(storedLng)) {
      setLocation({ lat: storedLat, lng: storedLng });
    }

    // Real-time tracking
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          const now = Date.now();
          const prev = prevLocRef.current;
          const distM = L.latLng(prev.lat, prev.lng).distanceTo(L.latLng(newLat, newLng));
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
          socket.emit('locationUpdate', { lat: newLat, lng: newLng, userId: user.id });

          // Check Risk
          checkRisk(newLat, newLng);
        },
        (err) => {
          console.warn("Geolocation failed, using simulation");
          startSimulation();
        },
        { enableHighAccuracy: true }
      );
    } else {
      startSimulation();
    }

    // Join active users
    if (user?.id) {
      socket.emit('join', user.id);
    }
    socket.on('adminMessage', msg => {
      if (!msg) return
      if (msg.type === 'text' && msg.text) {
        setAdminNote({ type: 'text', text: msg.text })
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
        setAdminNote({ type: 'audio', text: 'Audio message from admin', audioSrc: src })
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
    const movedM = L.latLng(lat, lng).distanceTo(L.latLng(last.lat, last.lng));
    return (now - last.t) > 20000 || movedM > 300;
  };
  const fetchNearbyLandmarks = async (lat, lng) => {
    try {
      const query = `[out:json];(node(around:1200,${lat},${lng})["name"]["tourism"];node(around:1200,${lat},${lng})["name"]["amenity"];node(around:1200,${lat},${lng})["name"]["historic"];);out 20;`;
      const res = await axios.get('https://overpass-api.de/api/interpreter', { params: { data: query } });
      const elements = res.data?.elements || [];
      let best = null, bestD = Infinity;
      elements.forEach(el => {
        const p = L.latLng(lat, lng);
        const d = p.distanceTo(L.latLng(el.lat, el.lon));
        const name = el.tags?.name;
        if (name && d < bestD) { bestD = d; best = { name, distM: d }; }
      });
      if (best) setNearestLandmark(best);
      lastNearbyFetchRef.current = { lat, lng, t: Date.now() };
    } catch (e) { }
  };

  useEffect(() => {
    const warns = [];
    // Restricted zones proximity (~500m before entry)
    (geoData.restrictedZones || []).forEach(z => {
      const d = L.latLng(location.lat, location.lng).distanceTo(L.latLng(z.center.lat, z.center.lng));
      if (d > z.radius && d - z.radius <= 500) {
        warns.push({ type: 'restricted', id: z.id, message: `Restricted area ahead: ${z.name} (~${Math.max(0, Math.round(d - z.radius))}m)` });
      }
    });
    // Crowded areas caution when inside
    (geoData.crowdedAreas || []).forEach(a => {
      const d = L.latLng(location.lat, location.lng).distanceTo(L.latLng(a.center.lat, a.center.lng));
      if (d <= a.radius) {
        warns.push({ type: 'crowded', id: a.id, message: `Overcrowded area: ${a.name} — caution` });
      }
    });
    setWarnings(warns);
    // Nearest landmark
    let nearest = null, best = Infinity;
    (geoData.landmarks || []).forEach(lm => {
      const d = L.latLng(location.lat, location.lng).distanceTo(L.latLng(lm.location.lat, lm.location.lng));
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
    socket.emit('sosTrigger', {
      location,
      userId: user?.id,
      userName: user?.name,
      phone: user?.phone,
      time: new Date()
    });
    alert("SOS SENT! Help is on the way.");
    setSosOpen(true);
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('initialLat');
    localStorage.removeItem('initialLng');
    navigate('/login');
  };

  const getRiskColor = () => {
    if (risk.label === 'Emergency') return '#ef4444';
    if (risk.label === 'Warning') return '#f59e0b';
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

  const chatListMaxH = isMobile ? '28vh' : '160px';
  return (
    <div className="dashboard-container" style={{ flexDirection: isMobile ? 'column' : 'row' }}>

      {isMobile && (
        <div style={{ flexShrink: 0 }}>
          <div className="mobile-admin-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={24} color="#3B82F6" />
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Tourist Dashboard</h2>
            </div>
            <button onClick={handleLogout} style={{ color: '#ef4444', fontWeight: 'bold' }}>LOGOUT</button>
          </div>
          <div className="mobile-tabs">
            <div className={`mobile-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>Current Location</div>
            <div className={`mobile-tab ${activeTab === 'sos' ? 'active' : ''}`} onClick={() => setActiveTab('sos')}>SOS Alert</div>
          </div>
        </div>
      )}

      {/* Main Map Area */}
      <div className="map-wrapper map-wrapper-user" style={isMobile ? { display: activeTab === 'map' ? 'flex' : 'none', position: 'relative', zIndex: 0, margin: 0, top: 0, left: 0, flex: 1, flexDirection: 'column', minHeight: 0 } : {}}>
        <div style={{ flex: 1, borderRadius: isMobile ? '0' : '24px', overflow: 'hidden', border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
          <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={!isMobile}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                Current Location <br /> Risk: {risk.label}
              </Popup>
            </Marker>
            {path.length > 1 && (
              <Polyline positions={path} pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.7 }} />
            )}
            {(geoData.restrictedZones || []).map(z => (
              <Circle key={z.id} center={[z.center.lat, z.center.lng]} radius={z.radius} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15 }} />
            ))}
            {(geoData.crowdedAreas || []).map(a => (
              <Circle key={a.id} center={[a.center.lat, a.center.lng]} radius={a.radius} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2 }} />
            ))}
            <MapUpdater location={location} activeTab={activeTab} />
          </MapContainer>
        </div>

        {/* Floating Stats */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="floating-stats"
          style={isMobile ? { top: 'auto', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '92%', maxWidth: '400px', padding: '12px', zIndex: 1000, position: 'absolute' } : {}}
        >
          {isMobile ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Speed</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem' }}>{speedKmh.toFixed(1)} km/h</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Landmark</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nearestLandmark ? nearestLandmark.name : '--'}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Lat</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem' }}>{location.lat.toFixed(4)}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Lng</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem' }}>{location.lng.toFixed(4)}</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={20} color="#3B82F6" />
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Latitude</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{location.lat.toFixed(4)}</p>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={20} color="#3B82F6" />
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Longitude</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{location.lng.toFixed(4)}</p>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Speed</p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{speedKmh.toFixed(1)} km/h</p>
              </div>
              {nearestLandmark && (
                <>
                  <div className="stat-divider"></div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Nearest Landmark</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{nearestLandmark.name} ({Math.round(nearestLandmark.distM)} m)</p>
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      </div>
      {/* Sidebar / SOS Alert Panel */}
      <motion.div
        initial={{ x: isMobile ? 0 : -100, opacity: isMobile ? 0 : 1 }}
        animate={{ x: 0, opacity: 1 }}
        className="sidebar sidebar-user"
        style={isMobile ? { display: activeTab === 'sos' ? 'flex' : 'none', flex: 1, margin: 0, width: '100%', borderRadius: 0, background: '#f8fafc', overflowY: 'auto', padding: '20px', flexDirection: 'column', color: '#0f172a' } : {}}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
              <Shield size={32} color="#3B82F6" />
              <h2 style={{ marginLeft: '12px', fontSize: '1.2rem', fontWeight: 'bold' }}>User Dashboard</h2>
            </div>
          )}

          {isMobile ? (
            <div className="mobile-user-card">
              <div className="mobile-user-avatar">
                <User size={24} color="white" />
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Welcome,</p>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{user?.name || 'Tourist'}</h3>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '30px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#3B82F6', padding: '8px', borderRadius: '50%' }}>
                <User size={20} color="white" />
              </div>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>Welcome,</p>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{user?.name || 'Tourist'}</h3>
              </div>
            </div>
          )}

          <motion.div
            animate={{ backgroundColor: getRiskColor() }}
            style={{
              padding: isMobile ? '16px' : '24px',
              textAlign: 'center',
              marginBottom: '20px',
              borderRadius: isMobile ? '12px' : '20px',
              color: 'white',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
          >
            <h4 style={{ margin: 0, opacity: 0.9, fontSize: isMobile ? '0.9rem' : '1rem' }}>Safety Status</h4>
            <h1 style={{ margin: '4px 0', fontSize: isMobile ? '2.5rem' : '2.5rem', fontWeight: 'bold' }}>{risk.score}%</h1>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase' }}>{risk.label}</p>
          </motion.div>
          {warnings.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '16px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Warnings</p>
              {warnings.map(w => (
                <p key={`${w.type}-${w.id}`} style={{ marginTop: '6px', fontSize: '0.9rem' }}>{w.message}</p>
              ))}
            </div>
          )}
          {adminNote && (
            <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '16px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Admin Message</p>
              <p style={{ marginTop: '8px' }}>{adminNote.text}</p>
              {adminNote.type === 'audio' && adminNote.audioSrc && (
                <audio controls src={adminNote.audioSrc} style={{ width: '100%', marginTop: '8px' }} />
              )}
              <button onClick={() => setAdminNote(null)} style={{ marginTop: '10px', padding: '8px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Dismiss</button>
            </div>
          )}
          {/* Admin popup removed: admin replies appear in chat thread below */}
        </div>

        <div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSOS}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: isMobile ? '12px' : '16px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s infinite',
              marginBottom: isMobile ? '12px' : '0'
            }}
          >
            <Siren size={24} /> SOS ALERT
          </motion.button>

          {isMobile && (
            <button
              onClick={() => setSosOpen(!sosOpen)}
              style={{
                width: '100%',
                padding: '16px',
                background: 'transparent',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Contact Admin
            </button>
          )}
          {sosOpen && (
            <div style={{ marginTop: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Contact Admin</p>
              {chat.length > 0 && (
                <div style={{ marginTop: '12px', maxHeight: chatListMaxH, overflowY: 'auto', paddingRight: '6px' }}>
                  {chat.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start', marginTop: '6px' }}>
                      <div style={{ maxWidth: '80%', padding: '8px 10px', borderRadius: '10px', background: msg.from === 'me' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {msg.type === 'text' ? <p style={{ margin: 0, fontSize: '0.9rem' }}>{msg.text}</p> : <audio controls src={msg.audioSrc} style={{ width: '100%' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Type message…" style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                  <button onClick={() => {
                    const t = msgText.trim();
                    if (t) {
                      socket.emit('userMessage', { fromUserId: user?.id, type: 'text', text: t });
                      setChat(prev => [...prev, { from: 'me', type: 'text', text: t, time: Date.now() }].slice(-200));
                      setMsgText('')
                    }
                  }} style={{ padding: '10px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Send Text</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {!isRecording && (
                    <button onClick={async () => {
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
                            socket.emit('userMessage', { fromUserId: user?.id, type: 'audio', audio: b64 });
                          } catch (e) { }
                          cleanupSos(false);
                        };
                        rec.start();
                      } catch (e) { }
                    }} style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}>Record Audio</button>
                  )}
                  {isRecording && (
                    <>
                      <button onClick={() => {
                        try {
                          if (recPaused) { recRef.current.resume(); setRecPaused(false) }
                          else { recRef.current.pause(); setRecPaused(true) }
                        } catch (e) { }
                      }} style={{ padding: '10px 14px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{recPaused ? 'Resume' : 'Pause'}</button>
                      <button onClick={() => {
                        try {
                          sendOnStopRef.current = true;
                          recRef.current.stop()
                        } catch (e) { }
                      }} style={{ padding: '10px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Send Audio</button>
                      <button onClick={() => {
                        try {
                          sendOnStopRef.current = false;
                          if (recRef.current) recRef.current.stop(); else cleanupSos(true)
                        } catch (e) { }
                      }} style={{ padding: '10px 14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '20px',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center',
                padding: '10px'
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          )}
        </div>
      </motion.div>
    </div >
  );
};

function MapUpdater({ location, activeTab }) {
  const map = useMap();
  useEffect(() => {
    map.setView([location.lat, location.lng]);
  }, [location, map]);

  useEffect(() => {
    if (activeTab === 'map') {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [activeTab, map]);

  return null;
}

export default Dashboard;
