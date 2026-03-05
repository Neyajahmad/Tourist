import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      position: 'relative', 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background Image with Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")', // Chicago skyline
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 20, 40, 0.6)', 
        zIndex: -1
      }} />

      {/* Header / Nav */}
      <nav style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '24px 40px',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 10
      }}>
      </nav>

      {/* Hero Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '0 20px'
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
              background: '#3B82F6', // Bright blue
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
