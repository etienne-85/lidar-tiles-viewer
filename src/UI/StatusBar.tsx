import React from 'react';

interface StatusBarProps {
  playerPosition: [number, number, number];
  currentPatch: string;
  highlightedTileId?: string | null;
  highlightedPoint?: { x: number; y: number; z: number } | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  playerPosition,
  currentPatch,
  highlightedTileId,
  highlightedPoint
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100vw',
        zIndex: 1002,
        background: 'rgba(30, 34, 43, 0.35)', // VSCode-like dark blue/gray
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        color: '#d4d4d4',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: '1px 16px 1px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        borderTop: '1px solid #222c37',
        boxShadow: '0 -1px 4px 0 rgba(0,0,0,0.12)',
        userSelect: 'none',
        minHeight: '26px',
        letterSpacing: '0.02em',
      }}
    >
      {/* Player position and patch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#9cdcfe' }}>{`XYZ: ${Math.round(playerPosition[0])}, ${Math.round(playerPosition[1])}, ${Math.round(playerPosition[2])}`}</span>
        <span style={{ color: '#b5cea8' }}>| Patch: {currentPatch}</span>
      </div>

      {/* Highlighted item details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {highlightedTileId && (
          <span style={{ color: '#ffd700' }}>{`Highlighted Tile: ${highlightedTileId}`}</span>
        )}
        {highlightedPoint && (
          <span style={{ color: '#ffd700' }}>{`Highlighted Point: X=${highlightedPoint.x.toFixed(2)}, Y=${highlightedPoint.y.toFixed(2)}, Z=${highlightedPoint.z.toFixed(2)}`}</span>
        )}
      </div>
    </div>
  );
}; 