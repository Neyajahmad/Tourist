import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const DisclaimerModal = ({ isOpen, onClose }) => {
  const [agreed, setAgreed] = useState(false);

  const handleClose = () => {
    if (agreed) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          pointerEvents: 'auto'
        }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              backgroundColor: '#1e293b',
              borderRadius: '24px',
              padding: '40px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              textAlign: 'center',
              zIndex: 10001
            }}
          >
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={36} color="#f87171" />
            </div>

            <h2 style={{ 
              fontSize: '1.8rem', 
              fontWeight: '800', 
              marginBottom: '16px', 
              color: '#f8fafc',
              letterSpacing: '-0.025em'
            }}>
              Disclaimer
            </h2>

            <p style={{ 
              color: '#94a3b8', 
              lineHeight: '1.6', 
              marginBottom: '32px', 
              fontSize: '1.1rem' 
            }}>
              Any misleading information or false complaint will lead to strict action against the user.
            </p>

            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '32px',
                padding: '16px',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s'
              }} 
              onClick={() => setAgreed(!agreed)}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: `2px solid ${agreed ? '#3b82f6' : '#475569'}`,
                backgroundColor: agreed ? '#3b82f6' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}>
                {agreed && <CheckCircle2 size={16} color="white" />}
              </div>
              <span style={{ 
                fontSize: '1rem', 
                color: agreed ? '#f8fafc' : '#94a3b8', 
                userSelect: 'none',
                fontWeight: '500'
              }}>
                I agree to the terms
              </span>
            </div>

            <motion.button
              whileHover={agreed ? { scale: 1.02 } : {}}
              whileTap={agreed ? { scale: 0.98 } : {}}
              onClick={handleClose}
              disabled={!agreed}
              style={{
                width: '100%',
                padding: '16px 32px',
                backgroundColor: agreed ? '#3b82f6' : '#334155',
                color: agreed ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: agreed ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                boxShadow: agreed ? '0 10px 15px -3px rgba(59, 130, 246, 0.4)' : 'none',
              }}
            >
              I Understand
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DisclaimerModal;
