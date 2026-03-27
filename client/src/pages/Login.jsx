import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Shield, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setVideoLoaded(true);
      video.play().catch(err => {
        if (err.name === 'NotAllowedError') {
          setNeedsInteraction(true);
        } else {
          setVideoError(true);
        }
      });
    };

    const handleError = () => {
      setVideoError(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setNeedsInteraction(false);
      }).catch(() => {
        setVideoError(true);
      });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('role', 'user');

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            localStorage.setItem('initialLat', position.coords.latitude);
            localStorage.setItem('initialLng', position.coords.longitude);
            navigate('/dashboard');
          },
          (err) => {
            console.warn("Location permission denied");
            navigate('/dashboard');
          }
        );
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {/* Background Video */}
      <video 
        ref={videoRef}
        autoPlay 
        muted 
        loop 
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1,
          backgroundColor: '#0f172a',
          opacity: videoLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
      >
        <source src="/userlogin.mp4" type="video/mp4" />
      </video>

      {/* Loading State */}
      {!videoLoaded && !videoError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#0f172a',
          zIndex: 1
        }} />
      )}

      {/* Click to Play Overlay */}
      {needsInteraction && (
        <div 
          onClick={handlePlayClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{
            background: 'white',
            color: '#0f172a',
            padding: '20px 40px',
            borderRadius: '12px',
            fontSize: '1.2rem',
            fontWeight: 600
          }}>
            ▶ Click to Play Video
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {videoError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: 1
        }} />
      )}

      {/* Dark Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.85)',
        zIndex: 2
      }} />

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.25)' }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '12px 20px',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          fontWeight: '600',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <ArrowLeft size={18} /> <span style={{ whiteSpace: 'nowrap' }}>Back to Home</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '40px',
          width: '100%',
          maxWidth: '440px',
          margin: '0 16px',
          borderRadius: '24px',
          background: 'rgba(51, 65, 85, 0.75)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.2)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Shield size={34} color="#60a5fa" strokeWidth={2.5} />
          </div>
          <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '10px', fontWeight: '700', letterSpacing: '-0.02em' }}>Net2Vision</h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', fontWeight: '500' }}>Login to access your safety dashboard</p>
        </div>

        {error && <div style={{ color: '#fca5a5', marginBottom: '24px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '14px', border: '2px solid rgba(255, 255, 255, 0.1)', transition: 'all 0.2s' }}>
              <Mail size={20} color="#94a3b8" style={{ marginRight: '14px', flexShrink: 0 }} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem', fontWeight: '500' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '14px', border: '2px solid rgba(255, 255, 255, 0.1)', transition: 'all 0.2s' }}>
              <Lock size={20} color="#94a3b8" style={{ marginRight: '14px', flexShrink: 0 }} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem', fontWeight: '500' }}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            style={{
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 6px 24px rgba(59, 130, 246, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            Login <ArrowRight size={20} strokeWidth={2.5} />
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', color: '#cbd5e1', fontSize: '0.95rem', fontWeight: '500' }}>
          New to User Dashboard? <Link to="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '600' }}>Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
