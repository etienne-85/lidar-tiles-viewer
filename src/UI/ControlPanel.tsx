import React from 'react';

interface ControlPanelProps {
  isCameraTracking: boolean;
  onRestoreTracking: () => void;
  cameraProjection: 'perspective' | 'orthographic';
  onCameraProjectionChange: (projection: 'perspective' | 'orthographic') => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isCameraTracking,
  onRestoreTracking,
  cameraProjection,
  onCameraProjectionChange
}) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      minWidth: '200px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      color: 'white',
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Camera Controls</h3>
      
      {/* Restore Camera Tracking Button */}
      {!isCameraTracking && (
        <button
          onClick={onRestoreTracking}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Restore Camera Tracking
        </button>
      )}
      
      {/* Camera Projection Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '12px' }}>Camera Projection:</label>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => onCameraProjectionChange('perspective')}
            style={{
              background: cameraProjection === 'perspective' ? '#2196F3' : '#666',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              flex: 1
            }}
          >
            Perspective
          </button>
          <button
            onClick={() => onCameraProjectionChange('orthographic')}
            style={{
              background: cameraProjection === 'orthographic' ? '#2196F3' : '#666',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              flex: 1
            }}
          >
            Orthographic
          </button>
        </div>
      </div>
      
      {/* Camera Status Indicator */}
      <div style={{ fontSize: '11px', color: '#ccc' }}>
        Tracking: {isCameraTracking ? 'ON' : 'OFF'}
      </div>
    </div>
  );
};