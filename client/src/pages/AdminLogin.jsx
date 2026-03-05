import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Shield, UserCheck } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email === 'admin@gmail.com' && password === '12345678') {
      // Mock Admin Login Success
      const adminUser = {
        id: 'admin-001',
        name: 'System Admin',
        role: 'admin'
      };
      localStorage.setItem('token', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify(adminUser));
      navigate('/admin-dashboard');
    } else {
      setError('Invalid Admin Credentials');
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: 'url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")', // Tech/Cybersecurity background
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.85)',
        zIndex: 0
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel admin-auth-panel"
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

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Admin ID</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <UserCheck size={20} color="#64748b" style={{ marginRight: '10px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
