import React from 'react';

interface ControlPanelProps {
  isCameraTracking: boolean;
  onRestoreTracking: () => void;
  cameraProjection: 'perspective' | 'orthographic';
  onCameraProjectionChange: (projection: 'perspective' | 'orthographic') => void;
  terrainTransparency: number;
  onTerrainTransparencyChange: (transparency: number) => void;
  isTileSelectionActive: boolean;
  onTileSelectionChange: (active: boolean) => void;
  hoveredTileId: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isCameraTracking,
  onRestoreTracking,
  cameraProjection,
  onCameraProjectionChange,
  terrainTransparency,
  onTerrainTransparencyChange,
  isTileSelectionActive,
  onTileSelectionChange,
  hoveredTileId
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
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Controls</h3>
      
      {/* Tile Selection Tool */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <button
          onClick={() => onTileSelectionChange(!isTileSelectionActive)}
          style={{
            background: isTileSelectionActive ? '#FF6B6B' : '#666',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: isTileSelectionActive ? 'bold' : 'normal'
          }}
        >
          {isTileSelectionActive ? '🎯 Tile Selection: ON' : '🎯 Tile Selection: OFF'}
        </button>
        
        {/* Show hovered tile info when selection is active */}
        {isTileSelectionActive && (
          <div style={{ 
            fontSize: '11px', 
            color: hoveredTileId ? '#FFD700' : '#ccc',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px'
          }}>
            {hoveredTileId ? `Hovering: ${hoveredTileId}` : 'Hover over a tile'}
          </div>
        )}
      </div>
      
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

      {/* Terrain Transparency Control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '12px' }}>Terrain Transparency:</label>
        <input
          type="range"
          min="0"
          max="100"
          value={terrainTransparency * 100}
          onChange={(e) => onTerrainTransparencyChange(parseInt(e.target.value) / 100)}
          style={{
            width: '100%',
            height: '4px',
            background: '#666',
            outline: 'none',
            borderRadius: '2px'
          }}
        />
        <div style={{ fontSize: '11px', color: '#ccc', textAlign: 'center' }}>
          {Math.round(terrainTransparency * 100)}%
        </div>
      </div>
    </div>
  );
};