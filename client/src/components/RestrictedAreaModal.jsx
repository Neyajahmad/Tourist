import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MapPinOff, PhoneCall, Info, Navigation, ExternalLink, X } from 'lucide-react';

const RestrictedAreaModal = ({ isOpen, onClose, allowedAreas }) => {
  const emergencyContacts = [
    { name: 'Police', number: '100', icon: '👮' },
    { name: 'Ambulance', number: '102 / 108', icon: '🚑' },
    { name: 'Women Helpline', number: '1091', icon: '👩' },
    { name: 'Emergency', number: '112', icon: '🆘' },
  ];

  const safetyTips = [
    { text: 'Download offline maps for this region', icon: <Navigation size={18} /> },
    { text: 'Keep emergency contacts saved on speed dial', icon: <PhoneCall size={18} /> },
    { text: 'Stay in well-lit, public areas', icon: <ShieldAlert size={18} /> },
    { text: 'Contact local authorities for immediate help', icon: <Info size={18} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10001,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: 'relative',
              backgroundColor: '#1e293b',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              zIndex: 10002,
              padding: '32px'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                width: '80px',
                height: '80px',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                transform: 'rotate(-5deg)'
              }}>
                <MapPinOff size={40} color="#f87171" />
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '12px', color: '#f8fafc', letterSpacing: '-0.025em' }}>
                Service Not Available
              </h2>
              <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '1.05rem' }}>
                This area is not covered yet. Our team is currently working to expand services. Sorry for the inconvenience.
              </p>
            </div>

            {/* Supported Areas Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExternalLink size={14} /> Supported Locations
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {allowedAreas.map(area => (
                  <span key={area.name} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    {area.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Emergency Contacts Grid */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Indian Helpline Numbers
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {emergencyContacts.map(contact => (
                  <div key={contact.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{contact.icon}</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>{contact.name}</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc' }}>{contact.number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Tips */}
            <div style={{ marginBottom: '32px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Safety Guidance
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {safetyTips.map((tip, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px' }}>
                      {tip.icon}
                    </div>
                    <span style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.4' }}>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                width: '100%',
                padding: '16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)',
              }}
            >
              Got it, Stay Safe
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RestrictedAreaModal;
