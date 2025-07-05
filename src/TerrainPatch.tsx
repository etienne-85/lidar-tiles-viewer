import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, PATCH_SIZE, tileToWorldPosition } from './utils/grid';
import { usePatchProceduralTexture } from './hooks/usePatchProceduralTexture';

interface TerrainPatchProps {
  patchId: string;
}

export function TerrainPatch({ patchId }: TerrainPatchProps) {
  // Parse tile coordinates from patchId
  const [tileCol, tileRow] = patchId.split(':').map(Number);
  
  // Convert tile coordinates to world position
  const [worldX, worldZ] = tileToWorldPosition(tileCol, tileRow);

  // Use hook-based texture system
  const patchTexture = usePatchProceduralTexture(patchId);

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