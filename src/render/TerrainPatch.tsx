import React, { useMemo } from 'react';
import * as THREE from 'three';
import { tileToWorldPosition } from '../utils/grid';
import { usePatchProceduralTexture } from '../hooks/usePatchProceduralTexture';
import { useImageryTiles } from '../hooks/useImageryTiles';
import { PATCH_SIZE, TERRAIN_HEIGHT } from '../common/constants';

interface TerrainPatchProps {
    patchId: string;
    transparency: number;
    isTileSelectionActive: boolean;
    isHighlighted: boolean;
    onTileHover: (tileId: string | null) => void;
}

function TerrainPatch({ 
    patchId, 
    transparency,
    isTileSelectionActive, 
    isHighlighted, 
    onTileHover 
}: TerrainPatchProps) {
    console.log('TerrainPatch render for:', patchId);

    // Parse tile coordinates from patchId
    const [tileCol, tileRow] = patchId.split(':').map(Number);

    // Convert tile coordinates to world position (corner of patch)
    const worldCoords = tileToWorldPosition(tileCol, tileRow);

    // Dual texture system: satellite imagery with procedural fallback
    const satelliteTexture = useImageryTiles(patchId);
    const proceduralTexture = usePatchProceduralTexture(patchId);

    // Use satellite texture when available, fallback to procedural during loading
    const finalTexture = satelliteTexture || proceduralTexture;

    // Create custom BufferGeometry
    const geometry = useMemo(() => {
        console.log(`build geometry for patch ${patchId}`)
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
                // Calculate local coordinates from 0 to PATCH_SIZE (corner-based)
                const localX = (x / segments) * PATCH_SIZE;
                const localZ = (z / segments) * PATCH_SIZE;

                // Set position using local coordinates (X, Y, Z) - Y is up
                positions[vertexIndex * 3] = localX;
                positions[vertexIndex * 3 + 1] = TERRAIN_HEIGHT;
                positions[vertexIndex * 3 + 2] = localZ;

                // Set UVs
                uvs[vertexIndex * 2] = x / segments;
                // FIX: to match triangles rewinding order 
                uvs[vertexIndex * 2 + 1] = 1 - (z / segments);

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
    }, [patchId]);

    // Handle tile hover events
    const handlePointerEnter = () => {
        if (isTileSelectionActive) {
            onTileHover(patchId);
        }
    };

    const handlePointerLeave = () => {
        if (isTileSelectionActive) {
            onTileHover(null);
        }
    };

    return (
        <mesh 
            position={[worldCoords.x, 0, worldCoords.y]} 
            geometry={geometry}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
        >
            <meshStandardMaterial 
                map={finalTexture} 
                color={isHighlighted ? 0xff6666 : 0xffffff} // Red tint when highlighted
                wireframe={false} 
                side={THREE.DoubleSide} 
                transparent={true}
                opacity={transparency}
            />
        </mesh>
    );
}

// Export memoized version to prevent unnecessary re-renders
export const MemoizedTerrainPatch = React.memo(TerrainPatch);
export { MemoizedTerrainPatch as TerrainPatch };
