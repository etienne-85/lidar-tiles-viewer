import { useMemo } from 'react';
import * as THREE from 'three';
import { TILE_SIZE } from '../utils/constants';

export function usePatchProceduralTexture(patchId: string): THREE.CanvasTexture {
  return useMemo(() => {
    const [tileCol, tileRow] = patchId.split(':').map(Number);
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Background color based on tile coordinates
    const hue = ((tileCol * 73 + tileRow * 37) % 360);
    ctx.fillStyle = `hsl(${hue}, 40%, 85%)`;
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines (subdivisions matching 32x32 geometry)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;

    // Draw internal grid
    for (let i = 0; i <= 32; i++) {
      const pos = (i / 32) * 512;
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 512);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(512, pos);
      ctx.stroke();
    }

    // Bold border lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);

    // Patch coordinates text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const coordText = `${tileCol}:${tileRow}`;
    ctx.fillText(coordText, 256, 256);

    // Additional info text
    ctx.font = '16px Arial';
    ctx.fillText(`World: ${tileCol * TILE_SIZE}, ${tileRow * TILE_SIZE}`, 256, 300);

    return new THREE.CanvasTexture(canvas);
  }, [patchId]);
}