import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Siren, User, MapPin, Activity, CheckCircle, XCircle, MessageSquare, Users, Settings, LogOut, ChevronRight, Phone, Clock, AlertTriangle, Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import GoogleMapWrapper from '../components/GoogleMapWrapper';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const socket = io(API_BASE);

const AdminDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [sosTab, setSosTab] = useState('active'); // 'active' | 'resolved'
  const [expandedAreas, setExpandedAreas] = useState({});
  const [broadcastTarget, setBroadcastTarget] = useState({ type: 'all', area: null });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userLocations, setUserLocations] = useState({});
  const [trails, setTrails] = useState({});
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isPaused, setIsPaused] = useState(false);
  const toUserRef = useRef(null);
  const streamRef = useRef(null);
  const sendOnStopRef = useRef(true);
  const [incomingMsgs, setIncomingMsgs] = useState([]);
  const [chats, setChats] = useState({});
  const [chatInput, setChatInput] = useState('');
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('users'); // 'sos' | 'chat' | 'users' | 'map'
  const [selectedUser, setSelectedUser] = useState(null);
  const [focusUserId, setFocusUserId] = useState(null);
  const [recordingFor, setRecordingFor] = useState(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [mobileMapCenter, setMobileMapCenter] = useState([22.9734, 78.6569]);
  const [mobileMapZoom, setMobileMapZoom] = useState(5);
  const [mapCenter, setMapCenter] = useState({ lat: 22.9734, lng: 78.6569 });
  const [mapZoom, setMapZoom] = useState(5);
  const [expandedLocations, setExpandedLocations] = useState({});
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = viewport.w <= 768;

  useEffect(() => {
    // Listen for SOS Alerts
    socket.on('sosAlert', (data) => {
      // Don't add resolved alerts to the active list
      if (data.status === 'resolved') return;
      
      setAlerts(prev => {
        const existingIdx = prev.findIndex(a => a.userId === data.userId);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = data;
          return updated;
        }
        return [data, ...prev];
      });

      // Auto-select the newest alert if nothing is selected or if it's the same user
      if (!selectedAlert || selectedAlert.userId === data.userId) {
        setSelectedAlert(data);
      }
    });

    socket.on('activeSOSList', (list) => {
      // Filter out resolved alerts - only show active ones
      const activeAlerts = list.filter(alert => alert.status !== 'resolved');
      setAlerts(activeAlerts);
    });

    socket.on('sosStatusUpdated', ({ userId, status }) => {
      if (status === 'resolved') {
        setAlerts(prev => {
          const resolved = prev.find(a => a.userId === userId);
          if (resolved) {
            setResolvedAlerts(old => {
              // Avoid duplicates
              if (old.some(a => a.userId === userId)) return old;
              return [resolved, ...old].slice(0, 50);
            });
          }
          return prev.filter(a => a.userId !== userId);
        });
        if (selectedAlert?.userId === userId) setSelectedAlert(null);
      } else {
        setAlerts(prev => prev.map(a => a.userId === userId ? { ...a, status } : a));
      }
    });

    // Listen for Active Users
    socket.on('activeUsers', (activeIds) => {
      setActiveUsers(activeIds);
    });

    // Request initial data on load
    socket.emit('requestActiveUsers');
    socket.emit('requestActiveSOS');

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
      console.log('ADMIN RECEIVED MESSAGE:', msg);
      setIncomingMsgs(prev => [{ id: Date.now(), ...msg }, ...prev].slice(0, 100));
      if (msg?.fromUserId) {
        setChats(prev => {
          const thread = prev[msg.fromUserId] ? [...prev[msg.fromUserId]] : [];
          if (msg.type === 'audio' && msg.audio) {
            console.log('Processing audio message for user:', msg.fromUserId);
            const src = b64ToBlobUrl(msg.audio);
            thread.push({ from: 'user', type: 'audio', audioSrc: src, time: msg.time || Date.now() });
          } else {
            thread.push({ from: 'user', type: 'text', text: msg.text, time: msg.time || Date.now() });
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
    console.log(`Sending admin message to user: ${currentChatUserId}`, text);
    socket.emit('adminMessage', { toUserId: currentChatUserId, type: 'text', text });
    setChats(prev => {
      const thread = prev[currentChatUserId] ? [...prev[currentChatUserId]] : [];
      thread.push({ from: 'admin', type: 'text', text, time: Date.now() });
      return { ...prev, [currentChatUserId]: thread.slice(-200) };
    });
    setChatInput('');
  };
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFocusUserId(user._id);
    setSelectedAlert(null);
    
    // Update map center to user's location if available
    if (userLocations[user._id]) {
      const loc = userLocations[user._id];
      setMapCenter({ lat: loc.lat, lng: loc.lng });
      setMapZoom(16);
      
      // For mobile: switch to map tab to show location
      if (isMobile) {
        setMobileMapCenter([loc.lat, loc.lng]);
        setMobileMapZoom(16);
        setActiveTab('map');
      }
    }
    // Note: Does NOT switch to chat tab - only shows location on map
  };

  const handleAlertSelect = (alert) => {
    setSelectedAlert(alert);
    setFocusUserId(alert.userId);
    setSelectedUser(users.find(u => u._id === alert.userId) || null);
    
    // Update map center for alert
    setMapCenter({ lat: alert.location.lat, lng: alert.location.lng });
    setMapZoom(16);
    
    // For mobile: also show in chat tab with SOS alert card
    if (isMobile) {
      setActiveTab('chat');
    }
  };

  // Update map center when selectedAlert or focusUserId changes
  useEffect(() => {
    if (isMobile && activeTab === 'map') {
      // On mobile, use mobileMapCenter and mobileMapZoom
      setMapCenter({ lat: mobileMapCenter[0], lng: mobileMapCenter[1] });
      setMapZoom(mobileMapZoom);
    } else if (selectedAlert) {
      setMapCenter({ lat: selectedAlert.location.lat, lng: selectedAlert.location.lng });
      setMapZoom(16);
    } else if (focusUserId && userLocations[focusUserId]) {
      const loc = userLocations[focusUserId];
      setMapCenter({ lat: loc.lat, lng: loc.lng });
      setMapZoom(16);
    }
  }, [selectedAlert, focusUserId, userLocations, isMobile, activeTab, mobileMapCenter, mobileMapZoom]);

  const handleAdminLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    sessionStorage.removeItem('disclaimerShown');
    navigate('/admin-login');
  };

  // --- Audio Recording Logic ---
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
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      recorderRef.current = null;
      chunksRef.current = [];
      toUserRef.current = null;
      sendOnStopRef.current = true;
      setIsPaused(false);
      setRecordingFor(null);
    } catch (e) { }
  };

  const startRecording = async (targetId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = rec;
      chunksRef.current = [];
      setRecordingFor(targetId);
      toUserRef.current = targetId;
      sendOnStopRef.current = true;
      setIsPaused(false);

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        if (!sendOnStopRef.current) {
          cleanupRecording();
          return;
        }
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
          const buf = await blob.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          
          socket.emit('adminMessage', { toUserId: targetId, type: 'audio', audio: b64 });
          
          setChats(prev => {
            const thread = prev[targetId] ? [...prev[targetId]] : [];
            const src = b64ToBlobUrl(b64);
            thread.push({ from: 'admin', type: 'audio', audioSrc: src, time: Date.now() });
            return { ...prev, [targetId]: thread.slice(-200) };
          });
        } catch (e) {
          console.error("Error processing recorded audio:", e);
        }
        cleanupRecording();
      };

      rec.start();
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = (shouldSend) => {
    sendOnStopRef.current = shouldSend;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    } else {
      cleanupRecording();
    }
  };

  const pauseResumeRecording = () => {
    if (!recorderRef.current) return;
    if (recorderRef.current.state === 'recording') {
      recorderRef.current.pause();
      setIsPaused(true);
    } else if (recorderRef.current.state === 'paused') {
      recorderRef.current.resume();
      setIsPaused(false);
    }
  };
  // --- End Audio Recording Logic ---

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (selectedAlert?.id === id) setSelectedAlert(null);
  };

  const toggleArea = (area) => {
    setExpandedAreas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  const toggleLocation = (location) => {
    setExpandedLocations(prev => ({ ...prev, [location]: !prev[location] }));
  };

  const handleAlertClick = (alert) => {
    if (isMobile) {
      setModalAlert(alert);
      setAlertModalOpen(true);
    } else {
      handleAlertSelect(alert);
    }
  };

  const handleRespondToAlert = (alert) => {
    setSelectedAlert(alert);
    setFocusUserId(alert.userId);
    setSelectedUser(users.find(u => u._id === alert.userId) || null);
    setActiveTab('chat');
    setAlertModalOpen(false);
    setModalAlert(null);
  };

  const updateStatus = (userId, status) => {
    socket.emit('updateSosStatus', { userId, status });
    
    if (status === 'resolved') {
      // Remove from active alerts and clear selection
      setAlerts(prev => {
        const resolved = prev.find(a => a.userId === userId);
        if (resolved) {
          setResolvedAlerts(old => {
            // Avoid duplicates
            if (old.some(a => a.userId === userId)) return old;
            return [resolved, ...old].slice(0, 50);
          });
        }
        return prev.filter(a => a.userId !== userId);
      });
      
      // Clear selected alert if it's the one being resolved
      if (selectedAlert?.userId === userId) {
        setSelectedAlert(null);
        setFocusUserId(null);
        setSelectedUser(null);
      }
    } else {
      // For other status updates (responding, etc.)
      setAlerts(prev => prev.map(a => a.userId === userId ? { ...a, status } : a));
      if (selectedAlert?.userId === userId) {
        setSelectedAlert(prev => ({ ...prev, status }));
      }
    }
  };

  const handleBulkAction = (action, area = null) => {
    const targets = area ? (groupedAlerts[area] || []) : alerts;
    targets.forEach(alert => {
      updateStatus(alert.userId, action);
    });
  };

  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) return;
    socket.emit('broadcastMessage', {
      target: broadcastTarget.type,
      message: broadcastMsg.trim(),
      area: broadcastTarget.area
    });
    alert(`Broadcast sent to ${broadcastTarget.type === 'all' ? 'all users' : `users in ${broadcastTarget.area}`}`);
    setBroadcastMsg('');
  };

  // Convert userLocations + alerts to markers for GoogleMapWrapper
  const markers = useMemo(() => {
    const result = [];
    
    // Add SOS alert markers (type: 'sos')
    alerts.forEach(alert => {
      result.push({
        id: `sos-${alert.userId}`,
        position: { lat: alert.location.lat, lng: alert.location.lng },
        type: 'sos',
        label: alert.userName,
        infoContent: `<div style="padding:8px;color:#0f172a"><strong>SOS: ${alert.userName}</strong><br/>${alert.area}<br/>Time: ${new Date(alert.time).toLocaleTimeString()}</div>`,
        onClick: () => handleAlertSelect(alert)
      });
    });
    
    // Add tourist markers (type: 'tourist')
    Object.entries(userLocations).forEach(([uid, loc]) => {
      const user = users.find(u => u._id === uid);
      const name = user?.name || 'Unknown';
      result.push({
        id: `user-${uid}`,
        position: { lat: loc.lat, lng: loc.lng },
        type: 'tourist',
        label: name,
        infoContent: `<div style="padding:8px;color:#0f172a"><strong>${name}</strong><br/>ID: ${uid.substring(0, 8)}...</div>`,
        onClick: () => {
          if (user) handleUserSelect(user);
        }
      });
    });
    
    return result;
  }, [alerts, userLocations, users]);
  
  // Convert trails to polylines for GoogleMapWrapper
  const polylines = useMemo(() => {
    return Object.entries(trails)
      .filter(([uid, trail]) => trail.length >= 2)
      .map(([uid, trail]) => ({
        id: `trail-${uid}`,
        path: trail.map(([lat, lng]) => ({ lat, lng })),
        color: '#3B82F6',
        weight: 3,
        opacity: 0.7,
      }));
  }, [trails]);

  const groupedAlerts = alerts
    .filter(alert => alert.status !== 'resolved') // Only show non-resolved alerts
    .reduce((acc, alert) => {
      const area = alert.area || alert.location || 'Unknown';
      if (!acc[area]) acc[area] = [];
      acc[area].push(alert);
      return acc;
    }, {});

  // Group alerts by location for mobile
  const groupedByLocation = alerts
    .filter(alert => alert.status !== 'resolved') // Only show non-resolved alerts
    .reduce((acc, alert) => {
      const location = alert.area || alert.location || 'Unknown Location';
      if (!acc[location]) acc[location] = [];
      acc[location].push(alert);
      return acc;
    }, {});

  // Sort alerts within each area by priority: pending first, then by latest activity (updatedAt)
  Object.keys(groupedAlerts).forEach(area => {
    groupedAlerts[area].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.updatedAt || b.time) - new Date(a.updatedAt || a.time);
    });
  });

  const sortedAreas = Object.keys(groupedAlerts).sort((a, b) => {
    // Priority: Area with more pending alerts comes first
    const aPending = groupedAlerts[a].filter(x => x.status === 'pending').length;
    const bPending = groupedAlerts[b].filter(x => x.status === 'pending').length;
    if (bPending !== aPending) return bPending - aPending;
    return groupedAlerts[b].length - groupedAlerts[a].length;
  });

  return (
    <div className="admin-dashboard-layout" style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'Inter, system-ui, sans-serif',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      
      {/* Mobile Tab Navigation */}
      {isMobile && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          background: '#1e293b', 
          borderBottom: '2px solid rgba(255,255,255,0.1)', 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000,
          padding: '0'
        }}>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              flex: 1, 
              padding: '14px 8px', 
              textAlign: 'center', 
              fontWeight: 600, 
              color: activeTab === 'users' ? '#10b981' : '#6b7280',
              background: activeTab === 'users' ? 'rgba(16,185,129,0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #10b981' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              transition: 'all 0.2s'
            }}
          >
            <Users size={18} />
            <span>Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('sos')}
            style={{ 
              flex: 1, 
              padding: '14px 8px', 
              textAlign: 'center', 
              fontWeight: 600, 
              color: activeTab === 'sos' ? '#ef4444' : '#6b7280',
              background: activeTab === 'sos' ? 'rgba(239,68,68,0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sos' ? '3px solid #ef4444' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              transition: 'all 0.2s'
            }}
          >
            <Siren size={18} />
            <span>SOS</span>
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            style={{ 
              flex: 1, 
              padding: '14px 8px', 
              textAlign: 'center', 
              fontWeight: 600, 
              color: activeTab === 'chat' ? '#3b82f6' : '#6b7280',
              background: activeTab === 'chat' ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              transition: 'all 0.2s'
            }}
          >
            <MessageSquare size={18} />
            <span>Chat</span>
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            style={{ 
              flex: 1, 
              padding: '14px 8px', 
              textAlign: 'center', 
              fontWeight: 600, 
              color: activeTab === 'map' ? '#f59e0b' : '#6b7280',
              background: activeTab === 'map' ? 'rgba(245,158,11,0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'map' ? '3px solid #f59e0b' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              transition: 'all 0.2s'
            }}
          >
            <MapPin size={18} />
            <span>Map</span>
          </button>
        </div>
      )}
      
      {/* 1. Left Sidebar: Navigation & Lists */}
      <div className="admin-left-sidebar" style={{ 
        width: isMobile ? '100%' : '380px', 
        height: isMobile ? 'auto' : '100%',
        maxHeight: isMobile ? 'calc(100vh - 60px)' : '100%',
        display: isMobile ? (activeTab === 'users' || activeTab === 'sos' || activeTab === 'chat' ? 'flex' : 'none') : 'flex', 
        flexDirection: 'column',
        borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)',
        zIndex: 100,
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#f59e0b', padding: '8px', borderRadius: '10px' }}>
              <Shield size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Command Center</h2>
          </div>
          <button onClick={handleAdminLogout} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><LogOut size={18} /></button>
        </div>

        {/* Tab Switcher - Desktop Only */}
        {!isMobile && (
        <div style={{ display: 'flex', padding: '10px', gap: '5px' }}>
          <button 
            onClick={() => setActiveTab('sos')}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeTab === 'sos' ? 'rgba(239,68,68,0.15)' : 'transparent',
              color: activeTab === 'sos' ? '#ef4444' : '#94a3b8',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <Siren size={20} />
            {!isMobile && <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>SOS Alerts</span>}
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeTab === 'chat' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === 'chat' ? '#3b82f6' : '#94a3b8',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <MessageSquare size={20} />
            {!isMobile && <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Chats</span>}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeTab === 'users' ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: activeTab === 'users' ? '#10b981' : '#94a3b8',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <Users size={20} />
            {!isMobile && <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Tourists</span>}
          </button>
        </div>
        )}

        {/* Dynamic Content List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {activeTab === 'sos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '4px' }}>
                <button onClick={() => setSosTab('active')} style={{ flex: 1, padding: '6px', background: sosTab === 'active' ? '#ef4444' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Active</button>
                <button onClick={() => setSosTab('resolved')} style={{ flex: 1, padding: '6px', background: sosTab === 'resolved' ? '#10b981' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Resolved</button>
              </div>

              {sosTab === 'active' ? (
                isMobile ? (
                  // Mobile: Group by location with collapsible sections
                  Object.entries(groupedByLocation).sort((a, b) => {
                    const aPending = a[1].filter(x => x.status === 'pending').length;
                    const bPending = b[1].filter(x => x.status === 'pending').length;
                    if (bPending !== aPending) return bPending - aPending;
                    return b[1].length - a[1].length;
                  }).map(([location, locationAlerts]) => (
                    <div key={location}>
                      <div 
                        onClick={() => toggleLocation(location)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '14px', 
                          background: 'rgba(239,68,68,0.1)', 
                          borderRadius: '12px', 
                          cursor: 'pointer', 
                          marginBottom: '8px',
                          border: '1px solid rgba(239,68,68,0.3)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <MapPin size={16} color="#ef4444" />
                          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ef4444' }}>{location}</span>
                          <span style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            fontSize: '0.7rem', 
                            padding: '2px 8px', 
                            borderRadius: '10px',
                            fontWeight: '700'
                          }}>
                            {locationAlerts.length}
                          </span>
                        </div>
                        <ChevronRight 
                          size={16} 
                          color="#ef4444"
                          style={{ 
                            transform: expandedLocations[location] ? 'rotate(90deg)' : 'none', 
                            transition: '0.2s' 
                          }} 
                        />
                      </div>
                      
                      {expandedLocations[location] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', paddingLeft: '8px' }}>
                          {locationAlerts.sort((a, b) => {
                            if (a.status === 'pending' && b.status !== 'pending') return -1;
                            if (a.status !== 'pending' && b.status === 'pending') return 1;
                            return new Date(b.updatedAt || b.time) - new Date(a.updatedAt || a.time);
                          }).map(alert => {
                            const alertUserName = alert.userName || users.find(u => u._id === alert.userId)?.name || users.find(u => u._id === alert.userId)?.username || 'Unknown User';
                            return (
                              <div 
                                key={alert.userId} 
                                onClick={() => handleAlertClick(alert)}
                                style={{ 
                                  padding: '14px', 
                                  borderRadius: '12px', 
                                  cursor: 'pointer',
                                  background: 'rgba(239,68,68,0.05)',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                  transition: '0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ef4444' }}>{alertUserName}</span>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    {new Date(alert.updatedAt || alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    color: alert.status === 'pending' ? '#ef4444' : '#f59e0b', 
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    background: alert.status === 'pending' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                  }}>
                                    {alert.status}
                                  </span>
                                  {alert.count > 1 && (
                                    <span style={{ 
                                      background: '#ef4444', 
                                      color: 'white', 
                                      fontSize: '0.65rem', 
                                      padding: '2px 6px', 
                                      borderRadius: '6px',
                                      fontWeight: '700'
                                    }}>
                                      ×{alert.count}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                                  <div style={{ marginBottom: '4px' }}>
                                    <Phone size={10} style={{ display: 'inline', marginRight: '6px' }} />
                                    {alert.phone || 'No phone'}
                                  </div>
                                  <div>
                                    <Clock size={10} style={{ display: 'inline', marginRight: '6px' }} />
                                    {new Date(alert.time).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  // Desktop: Keep original grouped view
                  sortedAreas.map(area => (
                  <div key={area}>
                    <div 
                      onClick={() => toggleArea(area)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer', marginBottom: '5px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color="#f87171" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{area}</span>
                        <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '8px' }}>{groupedAlerts[area].length}</span>
                      </div>
                      <ChevronRight size={14} style={{ transform: expandedAreas[area] !== false ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                    </div>
                    {expandedAreas[area] !== false && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px' }}>
                        {groupedAlerts[area].map(alert => {
                          const alertUserName = alert.userName || users.find(u => u._id === alert.userId)?.name || users.find(u => u._id === alert.userId)?.username || 'Unknown User';
                          return (
                          <div 
                            key={alert.userId} 
                            onClick={() => handleAlertSelect(alert)}
                            style={{ 
                              padding: '12px', borderRadius: '10px', cursor: 'pointer',
                              background: selectedAlert?.userId === alert.userId ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${selectedAlert?.userId === alert.userId ? '#ef4444' : 'rgba(255,255,255,0.05)'}`,
                              transition: '0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{alertUserName}</span>
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(alert.updatedAt || alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.7rem', color: alert.status === 'pending' ? '#ef4444' : '#f59e0b', fontWeight: '700' }}>{alert.status.toUpperCase()}</span>
                              {alert.count > 1 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px' }}>×{alert.count}</span>}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
                )
              ) : (
                resolvedAlerts.map(alert => (
                  <div key={alert.id} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8' }}>{alert.userName}</span>
                      <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Resolved</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{alert.area}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.filter(u => activeUsers.includes(u._id)).map(user => {
                const userName = user.name || user.username || 'Unknown User';
                return (
                  <div 
                    key={user._id}
                    onClick={() => {
                      // For mobile: just set the user, don't switch tabs
                      setSelectedUser(user);
                      setFocusUserId(user._id);
                      setSelectedAlert(null);
                    }}
                    style={{ 
                      padding: '12px', borderRadius: '10px', cursor: 'pointer',
                      background: selectedUser?._id === user._id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedUser?._id === user._id ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
                      display: 'flex', alignItems: 'center', gap: '12px'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} color="#3b82f6" />
                      </div>
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a' }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>{userName}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>
                        {isMobile ? '🟢 Active - Tap to chat' : 'Active Now'}
                      </p>
                    </div>
                    {isMobile && (
                      <MessageSquare size={16} color="#3b82f6" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.map(user => {
                const userName = user.name || user.username || 'Unknown User';
                const isOnline = activeUsers.includes(user._id);
                const hasLocation = userLocations[user._id];
                return (
                  <div 
                    key={user._id}
                    onClick={() => {
                      if (isMobile && isOnline && hasLocation) {
                        // Mobile: Active user with location → go to map
                        handleUserSelect(user);
                      } else if (!isMobile) {
                        // Desktop: original behavior
                        handleUserSelect(user);
                      }
                    }}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '10px', 
                      cursor: (isMobile && isOnline && hasLocation) || !isMobile ? 'pointer' : 'default',
                      background: selectedUser?._id === user._id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedUser?._id === user._id ? '#10b981' : 'rgba(255,255,255,0.05)'}`,
                      display: 'flex', alignItems: 'center', gap: '12px',
                      opacity: (isMobile && (!isOnline || !hasLocation)) ? 0.6 : 1
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} color="#10b981" />
                      </div>
                      {isOnline && (
                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a' }}></div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>{userName}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>
                        {isOnline ? (
                          hasLocation ? '🟢 Online - Tap to view location' : '🟢 Online'
                        ) : (
                          isMobile ? '⚫ Offline' : `ID: ${user._id.substring(0, 8)}`
                        )}
                      </p>
                    </div>
                    {isMobile && isOnline && hasLocation && (
                      <MapPin size={16} color="#10b981" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mobile: Show chat interface inline when user is selected AND in Chat tab */}
          {isMobile && activeTab === 'chat' && focusUserId && (
            <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Removed SOS Alert Card - Only show in SOS tab */}
              
              <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#3b82f6' }}>
                  Chat: {users.find(u => u._id === focusUserId)?.name || users.find(u => u._id === focusUserId)?.username || 'Tourist'}
                </h4>
                <button onClick={() => { setFocusUserId(null); setSelectedUser(null); setSelectedAlert(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <XCircle size={18} />
                </button>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(chats[focusUserId] || []).map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: msg.from === 'admin' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ 
                      maxWidth: '80%', 
                      padding: '8px 12px', 
                      borderRadius: '12px', 
                      background: msg.from === 'admin' ? '#3b82f6' : '#1e293b', 
                      fontSize: '0.85rem'
                    }}>
                      {msg.type === 'text' ? msg.text : <audio controls src={msg.audioSrc} style={{ width: '100%', minWidth: '150px', height: '30px' }} />}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {recordingFor === focusUserId ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 12px', borderRadius: '12px' }}>
                    <div className="pulse-icon" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                    <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '700', flex: 1 }}>{isPaused ? 'Paused' : 'Recording...'}</span>
                    <button onClick={pauseResumeRecording} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>{isPaused ? <Play size={14} /> : <Pause size={14} />}</button>
                    <button onClick={() => stopRecording(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    <button onClick={() => stopRecording(true)} style={{ background: '#3b82f6', border: 'none', borderRadius: '8px', padding: '4px 10px', color: 'white', cursor: 'pointer', fontSize: '0.7rem' }}>Send</button>
                  </div>
                ) : (
                  <>
                    <input 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendAdminChat()}
                      placeholder="Type..." 
                      style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: 'white', fontSize: '0.8rem' }} 
                    />
                    <button onClick={() => startRecording(focusUserId)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', color: '#94a3b8', cursor: 'pointer' }}><Mic size={16} /></button>
                    <button onClick={sendAdminChat} style={{ background: '#3b82f6', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>Send</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile: Show SOS details inline when alert is selected - REMOVED, now using modal */}
        </div>
      </div>

      {/* 2. Center Panel: India Map View - Hidden on mobile unless map tab active */}
      {(!isMobile || activeTab === 'map') && (
      <div className="admin-center-panel" style={{ 
        flex: 1, 
        position: 'relative', 
        borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)',
        width: isMobile ? '100%' : 'auto',
        height: isMobile ? 'calc(100vh - 60px)' : '100%'
      }}>
        <GoogleMapWrapper
          center={mapCenter}
          zoom={mapZoom}
          markers={markers}
          polylines={polylines}
          enableClustering={true}
          clusteringThreshold={50}
          isMobile={isMobile}
          style={{ height: '100%', width: '100%' }}
        />

        {/* Map Overlay Status */}
        <div style={{ position: 'absolute', top: '20px', right: '80px', background: 'rgba(15, 23, 42, 0.8)', padding: '10px 15px', borderRadius: '12px', backdropFilter: 'blur(10px)', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>SYSTEM ONLINE: {activeUsers.length} TOURISTS</span>
        </div>

        {/* Mobile: Selected User Info Card */}
        {isMobile && selectedUser && userLocations[selectedUser._id] && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.95)', padding: '15px', borderRadius: '16px', backdropFilter: 'blur(10px)', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)', minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{selectedUser.name || selectedUser.username || 'Unknown User'}</h4>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Live Location</p>
              </div>
              <button onClick={() => { setSelectedUser(null); setFocusUserId(null); setMobileMapCenter([22.9734, 78.6569]); setMobileMapZoom(5); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <XCircle size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#cbd5e1' }}>
              <div style={{ flex: 1 }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {userLocations[selectedUser._id].lat.toFixed(4)}, {userLocations[selectedUser._id].lng.toFixed(4)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button 
                onClick={() => { setActiveTab('chat'); setFocusUserId(selectedUser._id); }}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <MessageSquare size={14} /> Chat
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* 3. Right Panel: Details & Actions */}
      {!isMobile && (
        <div className="admin-right-panel" style={{ width: '400px', height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
          
          <AnimatePresence mode="wait">
            {selectedAlert ? (
              <motion.div 
                key="sos-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                {/* SOS Header */}
                <div style={{ padding: '24px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ background: '#ef4444', padding: '10px', borderRadius: '12px' }}>
                      <Siren size={24} color="white" className="pulse-icon" />
                    </div>
                    <button onClick={() => setSelectedAlert(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><XCircle size={20} /></button>
                  </div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#ef4444' }}>Emergency Alert</h3>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Area: {selectedAlert.area}</p>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  {/* User Profile Info */}
                  <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={24} color="#ef4444" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{selectedAlert.userName}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>User ID: {selectedAlert.userId.substring(0, 12)}...</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        <Phone size={14} /> <span>{selectedAlert.phone || 'No phone provided'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        <Clock size={14} /> <span>Triggered: {new Date(selectedAlert.time).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        <AlertTriangle size={14} /> <span>Alert Count: {selectedAlert.count}</span>
                      </div>
                    </div>
                  </div>

                  {/* SOS Status Controls */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>Manage Incident</h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => updateStatus(selectedAlert.userId, 'in_progress')}
                        disabled={selectedAlert.status !== 'pending'}
                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: selectedAlert.status === 'pending' ? '#3b82f6' : '#1e293b', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Respond
                      </button>
                      <button 
                        onClick={() => updateStatus(selectedAlert.userId, 'resolved')}
                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>

                  {/* Incident Chat */}
                  <div style={{ height: '300px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8' }}>Emergency Channel</div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                      {(chats[selectedAlert.userId] || []).map((msg, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: msg.from === 'admin' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                          <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: '12px', background: msg.from === 'admin' ? '#3b82f6' : '#1e293b', fontSize: '0.85rem' }}>
                            {msg.type === 'text' ? msg.text : <audio controls src={msg.audioSrc} style={{ width: '100%', minWidth: '160px' }} />}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div style={{ padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {recordingFor === selectedAlert.userId ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                          <div className="pulse-icon" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '700', flex: 1 }}>{isPaused ? 'Paused' : 'Recording...'}</span>
                          <button onClick={pauseResumeRecording} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>{isPaused ? <Play size={16} /> : <Pause size={16} />}</button>
                          <button onClick={() => stopRecording(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          <button onClick={() => stopRecording(true)} style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>Send</button>
                        </div>
                      ) : (
                        <>
                          <input 
                            value={chatInput} 
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendAdminChat()}
                            placeholder="Type response..." 
                            style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: 'white', fontSize: '0.8rem' }} 
                          />
                          <button onClick={() => startRecording(selectedAlert.userId)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', color: '#94a3b8', cursor: 'pointer' }}><Mic size={16} /></button>
                          <button onClick={sendAdminChat} style={{ background: '#3b82f6', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'white', cursor: 'pointer' }}><MessageSquare size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : focusUserId ? (
              <motion.div 
                key="chat-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Chat Support</h3>
                    <button onClick={() => setFocusUserId(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><XCircle size={20} /></button>
                  </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <div style={{ background: 'rgba(59,130,246,0.05)', borderRadius: '16px', padding: '15px', border: '1px solid rgba(59,130,246,0.1)', marginBottom: '20px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#3b82f6' }}>Direct communication with {users.find(u => u._id === focusUserId)?.name || 'Tourist'}</p>
                  </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {(chats[focusUserId] || []).map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.from === 'admin' ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  maxWidth: '80%', 
                  padding: '10px 14px', 
                  borderRadius: '15px', 
                  background: msg.from === 'admin' ? '#3b82f6' : '#1e293b', 
                  fontSize: '0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}>
                  {msg.type === 'text' ? (
                    <p style={{ margin: 0 }}>{msg.text}</p>
                  ) : (
                    <div style={{ minWidth: '200px' }}>
                      <audio controls src={msg.audioSrc} style={{ width: '100%', height: '35px' }} />
                    </div>
                  )}
                  <div style={{ fontSize: '0.65rem', opacity: 0.6, textAlign: 'right' }}>
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {recordingFor === focusUserId ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 16px', borderRadius: '16px' }}>
                        <div className="pulse-icon" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
                        <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: '700', flex: 1 }}>{isPaused ? 'Paused' : 'Recording Audio...'}</span>
                        <button onClick={pauseResumeRecording} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>{isPaused ? <Play size={18} /> : <Pause size={18} />}</button>
                        <button onClick={() => stopRecording(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        <button onClick={() => stopRecording(true)} style={{ background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '8px 16px', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Send</button>
                      </div>
                    ) : (
                      <>
                        <input 
                          value={chatInput} 
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendAdminChat()}
                          placeholder="Type a message..." 
                          style={{ flex: 1, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }} 
                        />
                        <button onClick={() => startRecording(focusUserId)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', padding: '12px', color: '#94a3b8', cursor: 'pointer' }}><Mic size={20} /></button>
                        <button onClick={sendAdminChat} style={{ background: '#3b82f6', border: 'none', borderRadius: '12px', padding: '12px 20px', color: 'white', cursor: 'pointer' }}>Send</button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <Shield size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
                <h3 style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Incident Selection Required</h3>
                <p style={{ fontSize: '0.85rem' }}>Select an SOS alert or a tourist from the sidebar to view details and take actions.</p>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* Mobile Alert Modal */}
      {isMobile && alertModalOpen && modalAlert && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.8)', 
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => { setAlertModalOpen(false); setModalAlert(null); }}
        >
          <div 
            style={{ 
              background: '#0f172a', 
              borderRadius: '20px', 
              padding: '24px', 
              maxWidth: '400px',
              width: '100%',
              border: '2px solid rgba(239,68,68,0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#ef4444', padding: '12px', borderRadius: '12px' }}>
                  <Siren size={24} color="white" className="pulse-icon" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ef4444', fontWeight: '700' }}>EMERGENCY ALERT</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Immediate Response Required</p>
                </div>
              </div>
              <button 
                onClick={() => { setAlertModalOpen(false); setModalAlert(null); }} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* User Info */}
            <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: '16px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
                {modalAlert.userName || users.find(u => u._id === modalAlert.userId)?.name || users.find(u => u._id === modalAlert.userId)?.username || 'Unknown User'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={14} color="#ef4444" />
                  <span>{modalAlert.phone || 'No phone provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={14} color="#ef4444" />
                  <span>{new Date(modalAlert.time).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={14} color="#ef4444" />
                  <span>{modalAlert.area || modalAlert.location || 'Unknown Location'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <span style={{ 
                    textTransform: 'uppercase', 
                    fontWeight: '700',
                    color: modalAlert.status === 'pending' ? '#ef4444' : '#f59e0b'
                  }}>
                    Status: {modalAlert.status}
                  </span>
                </div>
                {modalAlert.count > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Siren size={14} color="#ef4444" />
                    <span style={{ color: '#ef4444', fontWeight: '700' }}>
                      Multiple alerts: {modalAlert.count} times
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => handleRespondToAlert(modalAlert)}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: '#3b82f6', 
                  color: 'white', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <MessageSquare size={18} />
                Open Chat & Respond
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    updateStatus(modalAlert.userId, 'in_progress');
                    setAlertModalOpen(false);
                    setModalAlert(null);
                  }}
                  disabled={modalAlert.status !== 'pending'}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    background: modalAlert.status === 'pending' ? '#1e293b' : '#0f172a', 
                    color: modalAlert.status === 'pending' ? 'white' : '#64748b', 
                    fontWeight: '600', 
                    cursor: modalAlert.status === 'pending' ? 'pointer' : 'not-allowed', 
                    fontSize: '0.85rem',
                    opacity: modalAlert.status === 'pending' ? 1 : 0.5
                  }}
                >
                  Mark In Progress
                </button>
                <button 
                  onClick={() => {
                    updateStatus(modalAlert.userId, 'resolved');
                    setAlertModalOpen(false);
                    setModalAlert(null);
                  }}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    background: '#10b981', 
                    color: 'white', 
                    fontWeight: '600', 
                    cursor: 'pointer', 
                    fontSize: '0.85rem'
                  }}
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
