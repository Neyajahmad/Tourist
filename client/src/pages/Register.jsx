import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Shield, Fingerprint, Phone } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const identityHash = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const res = await axios.post(`${API_BASE}/api/auth/register`, { ...formData, identityHash });
      const u = res.data?.user;
      alert(`Registration Successful!\nName: ${u?.name || formData.name}\nPhone: ${u?.phone || formData.phone}`);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: 'url("https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.75)',
        zIndex: 0
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel auth-panel"
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Shield size={32} color="#34d399" />
          </div>
          <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '8px' }}>Join Guardian Angel</h2>
          <p style={{ color: '#cbd5e1' }}>Create your secure identity</p>
        </div>

        {error && <div style={{ color: '#fca5a5', marginBottom: '20px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <User size={20} color="#94a3b8" style={{ marginRight: '12px' }} />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Phone size={20} color="#94a3b8" style={{ marginRight: '12px' }} />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Mail size={20} color="#94a3b8" style={{ marginRight: '12px' }} />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Lock size={20} color="#94a3b8" style={{ marginRight: '12px' }} />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '30px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px dashed rgba(16, 185, 129, 0.3)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Fingerprint size={20} color="#34d399" />
            <div style={{ fontSize: '0.8rem', color: '#a7f3d0', lineHeight: 1.4 }}>
              Blockchain Identity will be generated and secured automatically.
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: '#10b981',
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
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            Create Account <ArrowRight size={18} />
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#cbd5e1' }}>
          Already have an account? <Link to="/login" style={{ color: '#34d399', textDecoration: 'none', fontWeight: 'bold' }}>Login here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
