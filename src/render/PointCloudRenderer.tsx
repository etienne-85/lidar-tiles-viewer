import React, { useMemo } from 'react';
import { BufferGeometry, BufferAttribute, Color, Vector3 } from 'three';
import { LidarPointCloud } from '../data/LidarPointCloud';
import { webMercatorToTile, getWebMercatorBoundsFromTile, MAX_WEB_MERCATOR } from '../utils/proj'; // Updated imports
import { PATCH_SIZE, ZOOM_LEVEL } from '../utils/constants';

interface PointCloudRendererProps {
  pointCloud: LidarPointCloud;
}

// Define a global scale factor to convert meters (from reprojected data) to Three.js scene units
// If 1 Three.js unit = 1 meter, then SCALE_METERS_TO_SCENE_UNITS = 1.
// If 1 Three.js unit = 100 meters, then SCALE_METERS_TO_SCENE_UNITS = 0.01.
// Adjust this based on how large you want your scene units to be relative to real-world meters.
const SCALE_METERS_TO_SCENE_UNITS = 0.1; // Example: 1 meter = 0.1 Three.js units (1 Three.js unit = 10 meters)

export const PointCloudRenderer: React.FC<PointCloudRendererProps> = ({
  pointCloud
}) => {
  const { geometry, colors, groupPosition } = useMemo(() => {
    // These positions are now relative to the reprojected min bounds (in meters)
    // and are already axis-remapped (X, Z->Y, Y->-Z).
    const positions = pointCloud.getPoints();
    const classifications = pointCloud.getClassifications();
    const metadata = pointCloud.getMetadata();

    console.log('PointCloudRenderer - Point count:', positions.length / 3);
    console.log('PointCloudRenderer - First 10 relative positions (in meters, reprojected):', positions.slice(0, 30));
    console.log('PointCloudRenderer - Original LiDAR Bounds:', metadata.originalBounds);
    console.log('PointCloudRenderer - Reprojected LiDAR Bounds (in target CRS meters):', metadata.targetBounds);

    // The point cloud data is now relative to its reprojected min bounds.
    // We need to determine where this reprojected min bound sits in the global tile grid.

    // Get the reprojected min X, Y of the LiDAR data (these are in target CRS meters)
    const {targetBounds} = metadata
    const minAltitude = targetBounds.min.z

    // Determine the tile (col, row) that contains the reprojected minX, minY of the LiDAR data
    const { tileCol, tileRow } = webMercatorToTile(targetBounds.min.x, targetBounds.min.y, ZOOM_LEVEL);
    console.log('PointCloudRenderer - LiDAR Reprojected Min (target CRS) Tile (col, row):', tileCol, tileRow);

    // Calculate the Web Mercator bounds of this tile
    const tileBounds = getWebMercatorBoundsFromTile(tileCol, tileRow, ZOOM_LEVEL);
    console.log('PointCloudRenderer - Tile Bounds (target CRS meters):', tileBounds);

    // Calculate the offset of the LiDAR's reprojected min point *within* its tile, in meters
    const offsetX_meters_within_tile = targetBounds.min.x - tileBounds.minX;
    // For Y, tile rows increase downwards, but Web Mercator Y increases upwards.
    // So, we need to calculate distance from the *top* of the tile (maxY)
    const offsetY_meters_within_tile = tileBounds.maxY - targetBounds.min.y;
    console.log('PointCloudRenderer - Offset of LiDAR Min within Tile (meters):', offsetX_meters_within_tile, offsetY_meters_within_tile);

    // Calculate the base position of the tile's bottom-left corner in scene units.
    // Assuming PATCH_SIZE is the size of one tile in scene units.
    const tileBaseX_sceneUnits = tileCol * PATCH_SIZE;
    const tileBaseY_sceneUnits = tileRow * PATCH_SIZE; // Corresponds to Three.js Z-axis

    // Convert the offset within the tile from meters to scene units
    const offsetX_sceneUnits = offsetX_meters_within_tile * SCALE_METERS_TO_SCENE_UNITS;
    const offsetY_sceneUnits = offsetY_meters_within_tile * SCALE_METERS_TO_SCENE_UNITS;

    // The group's position should be:
    // 1. The base position of the tile in scene units.
    // 2. PLUS the offset of the LiDAR's reprojected min point *within* that tile, converted to scene units.
    // 3. PLUS the actual min Z altitude of the LiDAR data, converted to scene units, for the Y-axis.

    const groupPositionX = tileBaseX_sceneUnits + offsetX_sceneUnits + 20;
    const groupPositionY = minAltitude; // Z altitude becomes Y in Three.js
    const groupPositionZ = tileBaseY_sceneUnits + offsetY_sceneUnits + 24; // Tile Y becomes negative Z in Three.js

    const groupPosition = new Vector3(groupPositionX, groupPositionY, groupPositionZ);
    console.log('PointCloudRenderer - Calculated Scene Group Position (Three.js units):', groupPosition);
    console.log('PointCloudRenderer - Player Tile Coordinates (for comparison):', 268410, 181780);
    console.log('PointCloudRenderer - Player Scene Coordinates (for comparison):', 268410 * PATCH_SIZE, 181780 * PATCH_SIZE);


    // Create geometry using the already relative and axis-remapped positions
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));

    // Create colors based on classification
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

    return { geometry, colors: colorArray, groupPosition };
  }, [pointCloud]);

  // The scale will now be applied to the individual points within the geometry
  // or a uniform scale on the group if you want to scale the entire cloud.
  // Since positions are already in meters (relative to reprojected min),
  // we apply SCALE_METERS_TO_SCENE_UNITS directly to the group.
  const groupScale = new Vector3(SCALE_METERS_TO_SCENE_UNITS, 1, SCALE_METERS_TO_SCENE_UNITS)
  .multiply(new Vector3(8.35,1,8.36));

  return (
    // Apply the calculated position and uniform scale to the <group>
    <group position={groupPosition} scale={groupScale}>
      <points geometry={geometry}>
        <pointsMaterial
          vertexColors={true}
          size={0.25} // Adjust point size relative to scene units
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
};
