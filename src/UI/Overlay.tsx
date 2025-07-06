import { useState, useEffect } from 'react';
import { FileImporter } from './FileImporter';

interface OverlayUIProps {
  playerPosition: [number, number, number];
  currentPatch: string;
  onFileLoaded: (file: File) => void;
  onFileError: (error: string) => void;
  selectedFile: File | null;
  fileError: string | null;
}

export const OverlayUI = ({ 
  playerPosition, 
  currentPatch, 
  onFileLoaded, 
  onFileError, 
  selectedFile, 
  fileError 
}: OverlayUIProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPositionExpanded, setIsPositionExpanded] = useState(true);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [isLidarExpanded, setIsLidarExpanded] = useState(true);

  // Toggle visibility with 'U' key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'u') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.4',
      minWidth: '280px',
      maxWidth: '400px',
      zIndex: 1000,
      userSelect: 'none'
    }}>
      {/* Position Panel */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '8px'
          }}
          onClick={() => setIsPositionExpanded(!isPositionExpanded)}
        >
          <span style={{ marginRight: '8px' }}>
            {isPositionExpanded ? '−' : '+'}
          </span>
          <strong>Position</strong>
        </div>
        {isPositionExpanded && (
          <div style={{ marginLeft: '20px' }}>
            <div>XYZ: {playerPosition[0].toFixed(2)}, {playerPosition[1].toFixed(2)}, {playerPosition[2].toFixed(2)}</div>
            <div>Patch: {currentPatch}</div>
          </div>
        )}
      </div>

      {/* LIDAR Panel */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '8px'
          }}
          onClick={() => setIsLidarExpanded(!isLidarExpanded)}
        >
          <span style={{ marginRight: '8px' }}>
            {isLidarExpanded ? '−' : '+'}
          </span>
          <strong>LIDAR Data</strong>
        </div>
        {isLidarExpanded && (
          <div style={{ marginLeft: '20px' }}>
            {selectedFile ? (
              <div>
                <div style={{ marginBottom: '8px', color: '#4CAF50' }}>
                  ✓ File loaded: {selectedFile.name}
                </div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '4px' }}>
                  <FileImporter onFileLoaded={onFileLoaded} onError={onFileError} />
                </div>
                {fileError && (
                  <div style={{ marginTop: '8px', color: '#ff6b6b', fontSize: '12px' }}>
                    Error: {fileError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '8px'
          }}
          onClick={() => setIsControlsExpanded(!isControlsExpanded)}
        >
          <span style={{ marginRight: '8px' }}>
            {isControlsExpanded ? '−' : '+'}
          </span>
          <strong>Controls</strong>
        </div>
        {isControlsExpanded && (
          <div style={{ marginLeft: '20px' }}>
            <div>U: Toggle UI</div>
            <div>WASD: Move player</div>
            <div>Mouse: Look around</div>
          </div>
        )}
      </div>
    </div>
  );
};