import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Shield, UserCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log('AdminLogin mount - checking existing auth:', { token, role });
    
    if (token && role === 'admin') {
      console.log('Already logged in as admin, redirecting to dashboard');
      navigate('/admin-dashboard', { replace: true });
    }
  }, [navigate]);

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
    if (email === 'admin@gmail.com' && password === '12345678') {
      // Mock Admin Login Success
      const adminUser = {
        id: 'admin-001',
        name: 'System Admin',
        role: 'admin'
      };
      
      console.log('Admin login successful, setting localStorage');
      localStorage.setItem('token', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('role', 'admin');
      
      // Verify it was set
      console.log('Verification - localStorage after set:', {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role'),
        user: localStorage.getItem('user')
      });
      
      navigate('/admin-dashboard');
    } else {
      setError('Invalid Admin Credentials');
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
        <source src="/admin.mp4" type="video/mp4" />
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
        background: 'rgba(15, 23, 42, 0.65)',
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Shield size={32} color="#f59e0b" />
          </div>
          <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '8px' }}>Admin Portal</h2>
          <p style={{ color: '#94a3b8' }}>Secure Access Restricted</p>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '20px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleLogin} autoComplete="off">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Admin ID</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <UserCheck size={20} color="#64748b" style={{ marginRight: '10px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="new-email"
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Lock size={20} color="#64748b" style={{ marginRight: '10px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
            }}
          >
            Access Dashboard <ArrowRight size={18} />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
