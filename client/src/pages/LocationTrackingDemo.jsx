import React from 'react';
import LiveLocationMap from '../components/LiveLocationMap';

/**
 * Demo page for testing the LiveLocationMap component
 * 
 * To use this page, add a route in your App.jsx:
 * <Route path="/location-demo" element={<LocationTrackingDemo />} />
 */
const LocationTrackingDemo = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📍 Live Location Tracking Demo</h1>
        <p style={styles.subtitle}>
          Google Maps-style real-time location tracking with accuracy radius
        </p>
      </div>

      {/* Map Component */}
      <div style={styles.mapContainer}>
        <LiveLocationMap />
      </div>

      {/* Info Panel */}
      <div style={styles.infoPanel}>
        <h3 style={styles.infoTitle}>Features</h3>
        <ul style={styles.featureList}>
          <li>✅ Blue dot marker (Google Maps style)</li>
          <li>✅ Accuracy radius circle</li>
          <li>✅ Real-time position updates</li>
          <li>✅ Auto-follow mode</li>
          <li>✅ High accuracy GPS tracking</li>
          <li>✅ Dark theme</li>
          <li>✅ Error handling</li>
          <li>✅ Mobile responsive</li>
        </ul>

        <h3 style={styles.infoTitle}>How to Use</h3>
        <ol style={styles.instructionList}>
          <li>Grant location permission when prompted</li>
          <li>Wait for GPS to acquire your location</li>
          <li>Watch the blue dot and accuracy circle</li>
          <li>Toggle auto-follow on/off</li>
          <li>Click "Recenter" to return to your location</li>
        </ol>

        <h3 style={styles.infoTitle}>Accuracy Levels</h3>
        <div style={styles.accuracyTable}>
          <div style={styles.accuracyRow}>
            <span style={styles.accuracyRange}>0-10m</span>
            <span style={styles.accuracyQuality}>Excellent (GPS)</span>
          </div>
          <div style={styles.accuracyRow}>
            <span style={styles.accuracyRange}>10-50m</span>
            <span style={styles.accuracyQuality}>Good (GPS/WiFi)</span>
          </div>
          <div style={styles.accuracyRow}>
            <span style={styles.accuracyRange}>50-100m</span>
            <span style={styles.accuracyQuality}>Fair (WiFi/Cell)</span>
          </div>
          <div style={styles.accuracyRow}>
            <span style={styles.accuracyRange}>100m+</span>
            <span style={styles.accuracyQuality}>Poor (Cell towers)</span>
          </div>
        </div>

        <div style={styles.note}>
          <strong>Note:</strong> For best accuracy, use this demo outdoors with clear sky view.
          Indoor accuracy may be reduced.
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0f172a',
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#94a3b8',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    minHeight: '400px',
  },
  infoPanel: {
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.95)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '20px',
    marginBottom: '10px',
    color: '#fff',
  },
  featureList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.8',
  },
  instructionList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.8',
  },
  accuracyTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '10px',
  },
  accuracyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '6px',
    fontSize: '12px',
  },
  accuracyRange: {
    fontWeight: '700',
    color: '#4285F4',
    fontFamily: 'monospace',
  },
  accuracyQuality: {
    color: '#94a3b8',
  },
  note: {
    marginTop: '20px',
    padding: '12px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#93c5fd',
    lineHeight: '1.6',
  },
};

export default LocationTrackingDemo;
