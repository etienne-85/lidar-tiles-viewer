import { useState, useEffect } from 'react';

interface OverlayUIProps {
  playerPosition: [number, number, number];
  currentPatch: string;
}

export const OverlayUI = ({ playerPosition, currentPatch }: OverlayUIProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPositionExpanded, setIsPositionExpanded] = useState(true);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

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