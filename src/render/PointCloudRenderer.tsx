// src/components/PointCloudRenderer.tsx

import React, { useMemo } from 'react';
import { BufferGeometry, BufferAttribute, Color, Vector3 } from 'three';
import { LidarPointCloud } from '../data/LidarPointCloud';
import { lambert93ToWebMercator, webMercatorToTile, MAX_WEB_MERCATOR, getWebMercatorBoundsFromTile } from '../utils/proj';
import { PATCH_SIZE, ZOOM_LEVEL } from '../utils/constants';

interface PointCloudRendererProps {
  pointCloud: LidarPointCloud;
}

export const PointCloudRenderer: React.FC<PointCloudRendererProps> = ({
  pointCloud
}) => {
  const { geometry, colors, groupPosition, groupScale } = useMemo(() => { // Added groupScale to memoized return
    const positions = pointCloud.getPoints(); // These are still in meters (relative to LiDAR min)
    const classifications = pointCloud.getClassifications();
    const metadata = pointCloud.getMetadata();

    console.log('PointCloudRenderer - Point count:', positions.length / 3);
    console.log('PointCloudRenderer - First 10 centered positions (in meters):', positions.slice(0, 30));
    console.log('PointCloudRenderer - Bounds from metadata:', metadata.bounds);
    //console.log('PointCloudRenderer - Calculated LiDAR (Lambert 93) min bounds:', metadata.sceneOffset);

    // Calculate the real-world meter extent of one WMTS tile at the given zoom level
    const n = Math.pow(2, ZOOM_LEVEL);
    const metersPerWmtsTile = (2 * MAX_WEB_MERCATOR) / n; // e.g., ~76.437 meters for zoom 19

    // Determine how many meters correspond to one of YOUR SCENE'S fundamental units (which is SCENE_PATCH_UNIT_SIZE / SCENE_PATCH_UNIT_SIZE)
    // Effectively, one "scene unit" is `metersPerWmtsTile / SCENE_PATCH_UNIT_SIZE` meters.
    const metersPerSceneUnit = metersPerWmtsTile / PATCH_SIZE; 
    console.log('PointCloudRenderer - Meters per WMTS tile at zoom', ZOOM_LEVEL, ':', metersPerWmtsTile);
    console.log('PointCloudRenderer - SCENE_PATCH_UNIT_SIZE (your scene units per patch):', PATCH_SIZE);
    console.log('PointCloudRenderer - Calculated Meters per Scene Unit:', metersPerSceneUnit);

    // The scale factor to apply to the group to convert from meters (LiDAR data) to scene units.
    // If 1 scene unit = 1.194 meters, then 1 meter = 1 / 1.194 scene units.
    let groupScale = new Vector3(1.067, 1, 1.035).multiplyScalar(metersPerSceneUnit);
    groupScale = new Vector3(1.067, 1, 1.035).multiplyScalar(metersPerSceneUnit);
        //groupScale = new Vector3(1, 1, 1)
    let groupOffset = new Vector3(-10, 8, 10)
    // groupOffset = new Vector3(0, 0, 0) 

    // 2. Reproject LiDAR's Lambert 93 origin to Web Mercator (EPSG:3857) (these are in meters)
    const [webMercatorX, webMercatorY] = lambert93ToWebMercator(metadata.bounds.minX, metadata.bounds.minY);
    console.log('PointCloudRenderer - LiDAR origin in Web Mercator (meters):', webMercatorX, webMercatorY);

    // 3. Determine the tile (col, row) at the given zoom level that contains this Web Mercator point
    const { tileCol, tileRow } = webMercatorToTile(webMercatorX, webMercatorY, ZOOM_LEVEL);

    // 4. Calculate the scene world coordinates for the bottom-left of this tile.
    // These are already in your scene's desired units (e.g., 64 units per patch)
    // We are setting the GROUP's position in scene units.
    const sceneTileBottomLeftX_units = tileCol * PATCH_SIZE;
    const sceneTileBottomLeftY_units = tileRow * PATCH_SIZE; // Corresponds to scene Z for Three.js

    // Now, determine the *offset within that tile* in meters.
    // This requires the getWebMercatorBoundsFromTile function
    const tileBounds = getWebMercatorBoundsFromTile(tileCol, tileRow, ZOOM_LEVEL);
    const offsetX_meters = webMercatorX - tileBounds.minX;
    const offsetY_meters = tileBounds.maxY - webMercatorY; // Y is inverted for tiles

    // Convert these offsets from meters to your scene units for the group's position
    const offsetX_units = offsetX_meters * groupScale.x; // Apply groupScale here
    const offsetY_units = -offsetY_meters * groupScale.y; // Apply groupScale here

    // The final group position should be the tile's scene unit origin + the offset within the tile in scene units
    // The Y (height) component for the group is the LiDAR's original minZ, also scaled to scene units.
    const groupPositionX = sceneTileBottomLeftX_units + offsetX_units + groupOffset.x;
    const groupPositionY = metadata.bounds.minZ + groupOffset.y; // Scale minZ to scene units for group's height
    const groupPositionZ = sceneTileBottomLeftY_units + offsetY_units + groupOffset.z; // Three.js Z is negative of scene Y

    const groupPosition = [groupPositionX, groupPositionY, groupPositionZ] as [number, number, number]; 
    console.log('PointCloudRenderer - LiDAR origin tile (col, row):', tileCol, tileRow);
    console.log('PointCloudRenderer - Offset within tile (meters):', offsetX_meters, offsetY_meters);
    console.log('PointCloudRenderer - Offset within tile (scene units):', offsetX_units, offsetY_units);
    console.log('PointCloudRenderer - Calculated Scene Group Position:', groupPosition);
    console.log('PointCloudRenderer - Player Tile Coordinates (for comparison):', 268410, 181780);
    console.log('PointCloudRenderer - Player Scene Coordinates (for comparison):', 268410 * PATCH_SIZE, 181780 * PATCH_SIZE);


    // Create geometry using the ORIGINAL positions (in meters)
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3)); // Use original positions (in meters)

    // Create colors based on classification
    // ... (color logic remains unchanged)
    const colorArray = new Float32Array(positions.length);
    const tempColor = new Color();
    for (let i = 0; i < classifications.length; i++) {
      const classification = classifications[i];
      switch (classification) {
        case 1: tempColor.setHex(0x808080); break; case 2: tempColor.setHex(0x8B4513); break;
        case 3: tempColor.setHex(0x90EE90); break; case 4: tempColor.setHex(0x32CD32); break;
        case 5: tempColor.setHex(0x228B22); break; case 6: tempColor.setHex(0xFF4500); break;
        case 7: tempColor.setHex(0x800080); break; case 9: tempColor.setHex(0x0000FF); break;
        case 10: tempColor.setHex(0x000000); break; case 11: tempColor.setHex(0x696969); break;
        case 12: tempColor.setHex(0xFFFFFF); break; case 13: tempColor.setHex(0xFFD700); break;
        case 14: tempColor.setHex(0xFFA500); break; case 15: tempColor.setHex(0x8B0000); break;
        case 16: tempColor.setHex(0xDC143C); break; case 17: tempColor.setHex(0x4B0082); break;
        case 18: tempColor.setHex(0xFF1493); break; default: tempColor.setHex(0x404040); break;
      }
      colorArray[i * 3] = tempColor.r;
      colorArray[i * 3 + 1] = tempColor.g;
      colorArray[i * 3 + 2] = tempColor.b;
    }
    geometry.setAttribute('color', new BufferAttribute(colorArray, 3));

    return { geometry, colors: colorArray, groupPosition, groupScale }; // Return groupScale
  }, [pointCloud]);

  return (
    // Apply the calculated scale to the <group>
    <group position={groupPosition} scale={groupScale}>
      <points geometry={geometry}>
        <pointsMaterial
          vertexColors={true}
          size={0.1} // Point size might need slight adjustment based on new scale
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
};