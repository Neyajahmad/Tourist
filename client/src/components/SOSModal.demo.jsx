/**
 * SOS Modal Demo Component
 * 
 * This is a standalone demo to showcase the compact SOS Modal.
 * You can use this to test the modal independently.
 * 
 * Usage:
 * 1. Import this component in your App.jsx or any test page
 * 2. Click the "Test SOS Modal" button to see the modal in action
 */

import React, { useState } from 'react';
import SOSModal from './SOSModal';

const SOSModalDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ 
      padding: '40px', 
      minHeight: '100vh', 
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '16px 32px',
          fontSize: '18px',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
        }}
      >
        🚨 Test SOS Modal
      </button>

      <SOSModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export default SOSModalDemo;
