import { useState, useEffect } from 'react';
import { FileImporter } from './FileImporter';
import { LidarPointCloud } from '../data/LidarPointCloud';

interface OverlayUIProps {
  playerPosition: [number, number, number];
  currentPatch: string;
  onFileLoaded: (file: File) => void;
  onFileError: (error: string) => void;
  selectedFile: File | null;
  fileError: string | null;
  pointCloud: LidarPointCloud | null;
  isProcessingFile: boolean;
}

export const OverlayUI = ({ 
  playerPosition, 
  currentPatch, 
  onFileLoaded, 
  onFileError, 
  selectedFile, 
  fileError,
  pointCloud,
  isProcessingFile
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
            {isProcessingFile ? (
              <div style={{ color: '#4CAF50' }}>
                🔄 Processing LAZ file...
              </div>
            ) : pointCloud ? (
              <div>
                <div style={{ marginBottom: '8px', color: '#4CAF50' }}>
                  ✓ Point cloud loaded: {selectedFile?.name}
                </div>
                <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '8px' }}>
                  File size: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB
                </div>
                
                {/* Point Cloud Metadata */}
                <div style={{ 
                  fontSize: '12px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  padding: '8px', 
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Metadata:</div>
                  <div>Points: {pointCloud.getMetadata().pointCount.toLocaleString()}</div>
                  <div>Format: {pointCloud.getMetadata().pointFormat}</div>
                  <div>Version: {pointCloud.getMetadata().version}</div>
                  <div>Created: {pointCloud.getMetadata().creationDate}</div>
                </div>

                {/* Bounds Information */}
                <div style={{ 
                  fontSize: '12px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  padding: '8px', 
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Bounds:</div>
                  <div>X: {pointCloud.getMetadata().bounds.minX.toFixed(2)} to {pointCloud.getMetadata().bounds.maxX.toFixed(2)}</div>
                  <div>Y: {pointCloud.getMetadata().bounds.minY.toFixed(2)} to {pointCloud.getMetadata().bounds.maxY.toFixed(2)}</div>
                  <div>Z: {pointCloud.getMetadata().bounds.minZ.toFixed(2)} to {pointCloud.getMetadata().bounds.maxZ.toFixed(2)}</div>
                </div>

                {/* System Information */}
                <div style={{ 
                  fontSize: '11px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                  padding: '6px', 
                  borderRadius: '4px'
                }}>
                  <div style={{ marginBottom: '2px', fontWeight: 'bold' }}>System:</div>
                  {pointCloud.getMetadata().systemIdentifier && (
                    <div>ID: {pointCloud.getMetadata().systemIdentifier}</div>
                  )}
                  {pointCloud.getMetadata().generatingSoftware && (
                    <div>Software: {pointCloud.getMetadata().generatingSoftware}</div>
                  )}
                  <div>Scale: {pointCloud.getMetadata().scaleFactor.x}, {pointCloud.getMetadata().scaleFactor.y}, {pointCloud.getMetadata().scaleFactor.z}</div>
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