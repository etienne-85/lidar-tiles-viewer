import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, tileToWorldPosition } from './utils/grid';
import { usePatchProceduralTexture } from './hooks/usePatchProceduralTexture';
import { useImageryTiles } from './hooks/useImageryTiles';
import { TILE_SIZE } from './utils/constants';

interface TerrainPatchProps {
    patchId: string;
}

export function TerrainPatch({ patchId }: TerrainPatchProps) {
    // Parse tile coordinates from patchId
    const [tileCol, tileRow] = patchId.split(':').map(Number);

    // Convert tile coordinates to world position (corner of patch)
    const [worldX, worldZ] = tileToWorldPosition(tileCol, tileRow);

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
                const localX = (x / segments) * TILE_SIZE;
                const localZ = (z / segments) * TILE_SIZE;

                // Sample height at absolute world position
                const worldPosX = worldX + localX;
                const worldPosZ = worldZ + localZ;
                const height = getTerrainHeight(worldPosX, worldPosZ);

                // Set position using local coordinates (X, Y, Z) - Y is up
                positions[vertexIndex * 3] = localX;
                positions[vertexIndex * 3 + 1] = height;
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
    }, [patchId, worldX, worldZ]);

    return (
        <mesh position={[worldX, 0, worldZ]} geometry={geometry}>
            <meshStandardMaterial map={finalTexture} wireframe={false} side={THREE.DoubleSide} />
        </mesh>
    );
}