import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      console.log('Video loaded successfully');
      setVideoLoaded(true);
      video.play().catch(err => {
        console.error('Video autoplay failed:', err);
        // Autoplay blocked - needs user interaction
        if (err.name === 'NotAllowedError') {
          setNeedsInteraction(true);
        } else {
          setVideoError(true);
        }
      });
    };

    const handleError = (e) => {
      console.error('Video loading error:', e);
      setVideoError(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    // Force load
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
      }).catch(err => {
        console.error('Manual play failed:', err);
        setVideoError(true);
      });
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh',
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background Video Layer */}
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
        <source src="/homescreen.mp4" type="video/mp4" />
        Your browser does not support the video tag.
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
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          Loading...
        </div>
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
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            ▶ Click to Play Video
          </div>
        </div>
      )}
      
      {/* Error Fallback - Static Background */}
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
      
      {/* Overlay Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2
      }} />

      {/* Header / Nav */}
      <nav style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '24px 40px',
        position: 'relative',
        zIndex: 10
      }}>
      </nav>

      {/* Hero Content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '0 20px',
        zIndex: 10
      }}>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-title"
        >
          Net2Vision
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hero-subtitle"
        >
          Your personal safety companion, powered by AI and Blockchain for unparalleled security on your adventures.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="btn-container"
        >
          {/* Tourist Login Button */}
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Tourist Login & Register <ArrowRight size={20} />
          </button>

          {/* Admin Login Button */}
          <button 
            onClick={() => navigate('/admin-login')}
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '16px 32px',
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
          >
            Admin Dashboard Login <Lock size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
