import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Siren, User, MapPin, Activity, CheckCircle, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import io from 'socket.io-client';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Red Pulse Icon for SOS
const sosIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const AdminDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userLocations, setUserLocations] = useState({});
  const [trails, setTrails] = useState({});
  const [focusUserId, setFocusUserId] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recordingFor, setRecordingFor] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const toUserRef = useRef(null);
  const streamRef = useRef(null);
  const sendOnStopRef = useRef(true);
  const [incomingMsgs, setIncomingMsgs] = useState([]);
  const [chats, setChats] = useState({});
  const [chatInput, setChatInput] = useState('');
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const [userNote, setUserNote] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = viewport.w <= 768;
  const b64ToBlobUrl = (b64, type = 'audio/webm;codecs=opus') => {
    try {
      const byteChars = atob(b64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const bytes = new Uint8Array(byteNums);
      const blob = new Blob([bytes], { type });
      return URL.createObjectURL(blob);
    } catch (e) {
      return `data:${type};base64,${b64}`;
    }
  };
  const cleanupRecording = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      recorderRef.current = null
      chunksRef.current = []
      toUserRef.current = null
      sendOnStopRef.current = true
      setIsPaused(false)
      setRecordingFor(null)
    } catch (e) { }
  }

  useEffect(() => {
    // Listen for SOS Alerts
    socket.on('sosAlert', (data) => {
      const newAlert = { ...data, id: Date.now() };
      setAlerts(prev => [newAlert, ...prev]);

      // Auto-select the newest alert
      setSelectedAlert(newAlert);
    });

    // Listen for Active Users
    socket.on('activeUsers', (activeIds) => {
      setActiveUsers(activeIds);
    });

    // Request initial active users list on load
    socket.emit('requestActiveUsers');

    // Live tourist locations
    socket.on('touristLocation', (data) => {
      const { lat, lng, userId } = data || {};
      if (!userId || typeof lat !== 'number' || typeof lng !== 'number') return;
      setUserLocations(prev => ({ ...prev, [userId]: { lat, lng, time: Date.now() } }));
      setTrails(prev => {
        const existing = prev[userId] || [];
        const next = [...existing, [lat, lng]];
        // limit trail length
        if (next.length > 100) next.shift();
        return { ...prev, [userId]: next };
      });
    });

    socket.on('userMessage', (msg) => {
      setIncomingMsgs(prev => [{ id: Date.now(), ...msg }, ...prev].slice(0, 100));
      if (msg?.fromUserId) {
        setChats(prev => {
          const thread = prev[msg.fromUserId] ? [...prev[msg.fromUserId]] : [];
          if (msg.type === 'audio' && msg.audio) {
            const src = b64ToBlobUrl(msg.audio);
            thread.push({ from: 'user', type: 'audio', audioSrc: src, time: Date.now() });
            setUserNote({ type: 'audio', text: 'Audio message from user', audioSrc: src });
          } else {
            thread.push({ from: 'user', type: 'text', text: msg.text, time: Date.now() });
          }
          return { ...prev, [msg.fromUserId]: thread.slice(-200) };
        });
      }
    });

    // Fetch All Users
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/auth/users`);
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();

    return () => {
      socket.off('sosAlert');
      socket.off('activeUsers');
      socket.off('touristLocation');
      socket.off('userMessage');
    };
  }, []);

  const currentChatUserId = focusUserId || selectedAlert?.userId || null;
  useEffect(() => {
    try { chatEndRef.current && chatEndRef.current.scrollIntoView({ behavior: 'smooth' }) } catch (e) { }
  }, [chats, currentChatUserId]);
  const sendAdminChat = () => {
    if (!currentChatUserId || !chatInput.trim()) return;
    const text = chatInput.trim();
    socket.emit('adminMessage', { toUserId: currentChatUserId, type: 'text', text });
    setChats(prev => {
      const thread = prev[currentChatUserId] ? [...prev[currentChatUserId]] : [];
      thread.push({ from: 'admin', type: 'text', text, time: Date.now() });
      return { ...prev, [currentChatUserId]: thread.slice(-200) };
    });
    setChatInput('');
  };
  const handleAdminLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin-login');
  };
  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (selectedAlert?.id === id) setSelectedAlert(null);
  };

  return (
    <div className="dashboard-container" style={{ flexDirection: isMobile ? 'column' : 'row' }}>

      {isMobile && (
        <div>
          <div className="mobile-admin-header">
            <h2>Admin Dashboard</h2>
            <button onClick={handleAdminLogout}>Logout</button>
          </div>
          <div className="mobile-tabs">
            <div className={`mobile-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Registered Users</div>
            <div className={`mobile-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>Global Map</div>
            <div className={`mobile-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>SOS Alerts</div>
          </div>
        </div>
      )}

      {/* Sidebar / Alert Panel (Visible on Desktop OR when users/alerts tab is active on mobile) */}
      {(!isMobile || activeTab === 'users' || activeTab === 'alerts') && (
        <div className="sidebar sidebar-admin" style={{ display: 'flex', flexDirection: 'column' }}>
          {!isMobile && (
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Shield size={28} color="#f59e0b" />
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Admin Command</h2>
                </div>
                <button onClick={handleAdminLogout} style={{ padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(239,68,68,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Logout</button>
              </div>
            </div>
          )}

          {/* Live SOS Feed (Visible on Desktop OR when alerts tab is active) */}
          {(!isMobile || activeTab === 'alerts') && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: isMobile ? '#f8fafc' : 'transparent', color: isMobile ? '#0f172a' : 'white' }}>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '16px' }}>
                Live Emergency Feed
              </h3>
              {userNote && (
                <div style={{ marginBottom: '12px', padding: '16px', borderRadius: '16px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>User Message</p>
                  <p style={{ marginTop: '8px' }}>{userNote.text}</p>
                  {userNote.type === 'audio' && userNote.audioSrc && (
                    <audio controls src={userNote.audioSrc} style={{ width: '100%', marginTop: '8px' }} />
                  )}
                  <button onClick={() => setUserNote(null)} style={{ marginTop: '10px', padding: '8px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Dismiss</button>
                </div>
              )}
              {incomingMsgs.length > 0 && (
                <div style={{ marginBottom: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Incoming User Messages</p>
                  {incomingMsgs.map(m => (
                    <div key={m.id} style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)' }}>
                      <p style={{ margin: 0, color: '#cbd5e1' }}>From: {m.fromUserId?.substring(0, 8)}...</p>
                      {m.type === 'text' && <p style={{ marginTop: '4px' }}>{m.text}</p>}
                      {/* audio messages are shown in the chat panel below */}
                    </div>
                  ))}
                </div>
              )}
              {currentChatUserId && (
                <div style={{ marginBottom: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Chat with {users.find(u => u._id === currentChatUserId)?.name || currentChatUserId.substring(0, 6)}</p>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', marginTop: '8px', paddingRight: '6px' }}>
                    {(chats[currentChatUserId] || []).filter(m => m.type !== 'audio').map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: msg.from === 'admin' ? 'flex-end' : 'flex-start', marginTop: '6px' }}>
                        <div style={{ maxWidth: '70%', padding: '8px 10px', borderRadius: '10px', background: msg.from === 'admin' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type reply…" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                    <button onClick={sendAdminChat} style={{ padding: '10px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Send</button>
                  </div>
                  <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: '#cbd5e1' }}>Voice Messages</p>
                    <div style={{ maxHeight: '140px', overflowY: 'auto', marginTop: '6px', paddingRight: '6px' }}>
                      {(chats[currentChatUserId] || []).filter(m => m.type === 'audio').map((msg, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: msg.from === 'admin' ? 'flex-end' : 'flex-start', marginTop: '6px' }}>
                          <div style={{ maxWidth: '85%', padding: '8px 10px', borderRadius: '10px', background: msg.from === 'admin' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <audio controls src={msg.audioSrc || (msg.audio ? `data:audio/webm;codecs=opus;base64,${msg.audio}` : '')} style={{ width: '100%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {alerts.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                    <CheckCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p>All Quiet. No Active Alerts.</p>
                  </div>
                )}
                {alerts.map(alert => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => setSelectedAlert(alert)}
                    style={{
                      background: selectedAlert?.id === alert.id ? (isMobile ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)') : (isMobile ? 'white' : 'rgba(255,255,255,0.05)'),
                      border: `1px solid ${selectedAlert?.id === alert.id ? '#ef4444' : (isMobile ? '#e2e8f0' : 'rgba(255,255,255,0.1)')}`,
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: isMobile ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Siren color="#ef4444" size={20} className="pulse-icon" />
                        <span style={{ fontWeight: 'bold', color: '#ef4444' }}>SOS DETECTED</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(alert.time).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{alert.userName || 'Unknown Tourist'}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>ID: {alert.userId}</p>
                      {alert.phone && <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>Phone: {alert.phone}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <MapPin size={14} />
                      <span>{alert.location?.lat.toFixed(4)}, {alert.location?.lng.toFixed(4)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      <XCircle size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* User List (Visible on Desktop OR when users tab is active) */}
          {(!isMobile || activeTab === 'users') && (
            <div style={{ height: isMobile ? '100%' : '40%', borderTop: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)', padding: '20px', overflowY: 'auto', background: isMobile ? '#f8fafc' : 'rgba(0,0,0,0.2)', color: isMobile ? '#0f172a' : 'white' }}>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '16px' }}>
                Registered Tourists ({users.length})
              </h3>
              {users.map(user => {
                const isActive = activeUsers.includes(user._id);
                return (
                  <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="white" />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{user.name}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{user._id.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#10b981' : '#64748b' }}></div>
                      <span style={{ fontSize: '0.8rem', color: isActive ? '#10b981' : '#64748b' }}>{isActive ? 'Active' : 'Offline'}</span>
                      {isActive && (
                        <>
                          <button onClick={() => setFocusUserId(user._id)} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(59,130,246,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Live</button>
                          <button onClick={() => { setFocusUserId(user._id); setSelectedAlert(null); }} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(16,185,129,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Text</button>
                          <button onClick={async () => { try { setFocusUserId(user._id); const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' }); recorderRef.current = rec; chunksRef.current = []; setRecordingFor(user._id); toUserRef.current = user._id; sendOnStopRef.current = true; setIsPaused(false); rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }; rec.onstop = async () => { if (!sendOnStopRef.current) { cleanupRecording(); return; } const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' }); const buf = await blob.arrayBuffer(); const b64 = btoa(String.fromCharCode(...new Uint8Array(buf))); socket.emit('adminMessage', { toUserId: toUserRef.current, type: 'audio', audio: b64 }); setChats(prev => { const uid = toUserRef.current; const thread = prev[uid] ? [...prev[uid]] : []; const src = b64ToBlobUrl(b64); thread.push({ from: 'admin', type: 'audio', audioSrc: src, time: Date.now() }); return { ...prev, [uid]: thread.slice(-200) }; }); cleanupRecording(); }; rec.start(); } catch (e) { } }} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(245,158,11,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>{recordingFor === user._id ? (isPaused ? 'Paused...' : 'Recording...') : 'Audio'}</button>
                          {recordingFor === user._id && (
                            <>
                              {isPaused ? (
                                <button onClick={() => { try { recorderRef.current && recorderRef.current.resume(); setIsPaused(false) } catch (e) { } }} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(16,185,129,0.3)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Resume</button>
                              ) : (
                                <button onClick={() => { try { recorderRef.current && recorderRef.current.pause(); setIsPaused(true) } catch (e) { } }} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(59,130,246,0.3)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Pause</button>
                              )}
                              <button onClick={() => { try { sendOnStopRef.current = true; recorderRef.current && recorderRef.current.stop() } catch (e) { } }} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(245,158,11,0.4)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Send</button>
                              <button onClick={() => { try { sendOnStopRef.current = false; if (recorderRef.current) recorderRef.current.stop(); else cleanupRecording(); } catch (e) { } }} style={{ padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(239,68,68,0.4)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Map Area */}
      {(!isMobile || activeTab === 'map') && (
        <div className="map-wrapper" style={{ flex: 1, position: 'relative', height: isMobile ? 'calc(100vh - 100px)' : '100%' }}>
          <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Show Alert Markers */}
            {alerts.map(alert => (
              <Marker key={alert.id} position={[alert.location.lat, alert.location.lng]} icon={sosIcon}>
                <Popup>
                  <strong>SOS: {alert.userName}</strong> <br />
                  ID: {alert.userId} <br />
                  {alert.phone ? <>Phone: {alert.phone} <br /></> : null}
                  Time: {new Date(alert.time).toLocaleTimeString()}
                </Popup>
              </Marker>
            ))}

            {/* Live Active Users */}
            {Object.entries(userLocations).map(([uid, loc]) => {
              const user = users.find(u => u._id === uid);
              const name = user?.name || 'Unknown';
              const trail = trails[uid] || [];
              let speedKmh = 0;
              if (trail.length >= 2) {
                const [lat1, lng1] = trail[trail.length - 2];
                const [lat2, lng2] = trail[trail.length - 1];
                const toRad = (d) => d * Math.PI / 180;
                const R = 6371;
                const dLat = toRad(lat2 - lat1);
                const dLng = toRad(lng2 - lng1);
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distKm = R * c;
                const dtSec = 3;
                speedKmh = (distKm / (dtSec / 3600));
              }
              return (
                <React.Fragment key={`user-${uid}`}>
                  <Marker position={[loc.lat, loc.lng]}>
                    <Popup>
                      <strong>{name}</strong><br />
                      ID: {uid.substring(0, 8)}...<br />
                      Lat: {loc.lat.toFixed(5)}<br />
                      Lng: {loc.lng.toFixed(5)}<br />
                      Speed: {speedKmh.toFixed(2)} km/h
                    </Popup>
                  </Marker>
                  {trail.length >= 2 && (
                    <Polyline positions={trail} pathOptions={{ color: '#3B82F6', weight: 3, opacity: 0.7 }} />
                  )}
                </React.Fragment>
              )
            })}

            <MapUpdater selectedAlert={selectedAlert} focusUser={focusUserId ? userLocations[focusUserId] : null} />
          </MapContainer>

          {!selectedAlert && (
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '10px 20px', borderRadius: '20px', backdropFilter: 'blur(5px)', zIndex: 1000 }}>
              Monitoring Global Activity...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Component to fly map to selected alert
function MapUpdater({ selectedAlert, focusUser }) {
  const map = useMap();
  useEffect(() => {
    if (selectedAlert) {
      map.flyTo([selectedAlert.location.lat, selectedAlert.location.lng], 16);
    }
    if (focusUser) {
      map.flyTo([focusUser.lat, focusUser.lng], 15);
    }
  }, [selectedAlert, focusUser, map]);
  return null;
}

export default AdminDashboard;
