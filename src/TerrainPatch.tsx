import { useMemo } from 'react';
import * as THREE from 'three';
import { gridToWorld, getTerrainHeight, PATCH_SIZE } from './utils/grid';

interface TerrainPatchProps {
  patchId: string;
}

function generatePatchTexture(gridX: number, gridZ: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background color based on patch coordinates
  const hue = ((gridX * 73 + gridZ * 37) % 360);
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

  const coordText = `${gridX}:${gridZ}`;
  ctx.fillText(coordText, 256, 256);

  // Additional info text
  ctx.font = '16px Arial';
  ctx.fillText(`World: ${gridX * PATCH_SIZE}, ${gridZ * PATCH_SIZE}`, 256, 300);

  return new THREE.CanvasTexture(canvas);
}

export function TerrainPatch({ patchId }: TerrainPatchProps) {
  // Derive position from patchId
  const [gridX, gridZ] = patchId.split(':').map(Number);
  const { worldX, worldZ } = gridToWorld(gridX, gridZ);

  // Generate texture for this patch
  const patchTexture = generatePatchTexture(gridX, gridZ);

  // Create custom BufferGeometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const segments = 32;
    const vertexCount = (segments + 1) * (segments + 1);
    
    // Arrays for geometry attributes
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = [];

    // Generate vertices
    let vertexIndex = 0;
    for (let z = 0; z <= segments; z++) {
      for (let x = 0; x <= segments; x++) {
        // Calculate world coordinates
        const worldPosX = worldX + (x / segments) * PATCH_SIZE - PATCH_SIZE / 2;
        const worldPosZ = worldZ + (z / segments) * PATCH_SIZE - PATCH_SIZE / 2;
        
        // Calculate height at this world position
        const height = getTerrainHeight(worldPosX, worldPosZ)
        
        // Set position (X, Y, Z) - Y is up
        positions[vertexIndex * 3] = worldPosX;
        positions[vertexIndex * 3 + 1] = height;
        positions[vertexIndex * 3 + 2] = worldPosZ;
        
        // Set UVs
        uvs[vertexIndex * 2] = x / segments;
        // FIX: to match triangles rewinding order 
        uvs[vertexIndex * 2 + 1] = 1 - (z / segments)
        
        vertexIndex++;
      }
    }

    // Generate indices for triangles
    for (let z = 0; z < segments; z++) {
      for (let x = 0; x < segments; x++) {
        const a = z * (segments + 1) + x;
        const b = z * (segments + 1) + x + 1;
        const c = (z + 1) * (segments + 1) + x;
        const d = (z + 1) * (segments + 1) + x + 1;

        // Two triangles per quad (correct winding for upward faces)
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    // Set geometry attributes
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
    // Calculate normals
    geo.computeVertexNormals();
    
    return geo;
  }, [patchId, worldX, worldZ]);

  return (
    <mesh position={[0, 0, 0]} geometry={geometry}>
      <meshStandardMaterial map={patchTexture} wireframe={false} side={THREE.DoubleSide} />
    </mesh>
  );
}