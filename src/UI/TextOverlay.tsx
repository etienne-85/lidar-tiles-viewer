import React from 'react';

interface TextOverlayProps {
  playerPosition: [number, number, number];
  currentPatch: string;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ 
  playerPosition, 
  currentPatch 
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.4',
      zIndex: 1000,
      userSelect: 'none'
    }}>
      <div>XYZ: {Math.round(playerPosition[0])}, {Math.round(playerPosition[1])}, {Math.round(playerPosition[2])}</div>
      <div>Patch: {currentPatch}</div>
    </div>
  );
};