import React from 'react';
import { EntityType } from '../common/types';
import { Vector3 } from 'three';

interface StatusBarProps {
  playerPosition: Vector3;
  currentPatch: string;
  highlightedTileId?: string | null;
  selectedItemType?: EntityType;
  selectedItemCoords?: { x: number; y: number; z: number };
}

export const StatusBar: React.FC<StatusBarProps> = ({
  playerPosition,
  currentPatch,
  highlightedTileId,
  selectedItemType,
  selectedItemCoords
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
        <span style={{ color: '#9cdcfe' }}>{`XYZ: ${Math.round(playerPosition.x)}, ${Math.round(playerPosition.y)}, ${Math.round(playerPosition.z)}`}</span>
        <span style={{ color: '#b5cea8' }}>| Patch: {currentPatch}</span>
      </div>

      {/* Highlighted item details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {highlightedTileId && (
          <span style={{ color: '#ffd700' }}>{`Highlighted Tile: ${highlightedTileId}`}</span>
        )}
        {selectedItemType && selectedItemCoords && (
          <span style={{ color: '#ff6666' }}>{`${selectedItemType}: ${selectedItemCoords.x.toFixed(2)},${selectedItemCoords.y.toFixed(2)},${selectedItemCoords.z.toFixed(2)}`}</span>
        )}
      </div>
    </div>
  );
};
