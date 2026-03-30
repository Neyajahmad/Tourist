import { useEffect, useState } from 'react';

/**
 * Google Maps API Debug Component
 * Shows detailed diagnostic information about Google Maps API loading status
 */
const GoogleMapsDebug = () => {
  const [diagnostics, setDiagnostics] = useState({
    googleExists: false,
    mapsExists: false,
    mapClassExists: false,
    markerExists: false,
    errors: [],
    timestamp: null
  });

  useEffect(() => {
    const checkStatus = () => {
      const status = {
        googleExists: typeof window.google !== 'undefined',
        mapsExists: typeof window.google?.maps !== 'undefined',
        mapClassExists: typeof window.google?.maps?.Map !== 'undefined',
        markerExists: typeof window.google?.maps?.Marker !== 'undefined',
        errors: [],
        timestamp: new Date().toISOString()
      };

      // Check for common error indicators
      if (window.gm_authFailure) {
        status.errors.push('Authentication failure detected');
      }

      setDiagnostics(status);
    };

    // Check immediately
    checkStatus();

    // Check periodically
    const interval = setInterval(checkStatus, 1000);

    // Listen for errors
    const errorHandler = (event) => {
      if (event.message && event.message.includes('Google')) {
        setDiagnostics(prev => ({
          ...prev,
          errors: [...prev.errors, event.message]
        }));
      }
    };

    window.addEventListener('error', errorHandler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  const getStatusIcon = (status) => status ? '✓' : '✗';
  const getStatusColor = (status) => status ? '#10b981' : '#ef4444';

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1e293b',
      border: '2px solid #334155',
      borderRadius: '12px',
      padding: '16px',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
        🔍 Google Maps API Diagnostics
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>window.google:</span>
          <span style={{ color: getStatusColor(diagnostics.googleExists) }}>
            {getStatusIcon(diagnostics.googleExists)}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>google.maps:</span>
          <span style={{ color: getStatusColor(diagnostics.mapsExists) }}>
            {getStatusIcon(diagnostics.mapsExists)}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>google.maps.Map:</span>
          <span style={{ color: getStatusColor(diagnostics.mapClassExists) }}>
            {getStatusIcon(diagnostics.mapClassExists)}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>google.maps.Marker:</span>
          <span style={{ color: getStatusColor(diagnostics.markerExists) }}>
            {getStatusIcon(diagnostics.markerExists)}
          </span>
        </div>
      </div>

      {diagnostics.errors.length > 0 && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: 'rgba(239,68,68,0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(239,68,68,0.3)'
        }}>
          <div style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '4px' }}>
            Errors:
          </div>
          {diagnostics.errors.map((error, idx) => (
            <div key={idx} style={{ fontSize: '11px', color: '#fca5a5' }}>
              • {error}
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '12px', 
        paddingTop: '8px', 
        borderTop: '1px solid #334155',
        fontSize: '10px',
        color: '#94a3b8'
      }}>
        Last check: {diagnostics.timestamp ? new Date(diagnostics.timestamp).toLocaleTimeString() : 'N/A'}
      </div>

      <div style={{ 
        marginTop: '8px', 
        padding: '8px', 
        background: 'rgba(59,130,246,0.1)',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#93c5fd'
      }}>
        💡 If all checks fail, verify:
        <br />• API key is valid
        <br />• Billing is enabled
        <br />• Maps JavaScript API is enabled
        <br />• Check browser console for errors
      </div>
    </div>
  );
};

export default GoogleMapsDebug;
