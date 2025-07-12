import { Vector3 } from 'three';
import proj4 from 'proj4';
import { LidarPointCloud } from '../data/LidarPointCloud';
import { PATCH_SIZE, ZOOM_LEVEL } from '../common/constants';

// Standard constants for Web Mercator (EPSG:3857) calculations
export const EARTH_RADIUS = 6378137; // Meters (WGS84 semi-major axis, used in Web Mercator)
export const MAX_WEB_MERCATOR = EARTH_RADIUS * Math.PI; // Max extent in meters from the prime meridian/equator

export const TILE_SIZE_PX = 256; // Standard tile pixel size for WMTS/OpenStreetMap
const SCALE_METERS_TO_SCENE_UNITS = 0.1;

/**
 * Initializes proj4 definitions for common coordinate systems.
 * Call this once at application startup or when importing this module.
 */
export function initializeProjections() {
  // Define Lambert 93 (EPSG:2154)
  // You can find these definitions on epsg.io (search for 2154)
  proj4.defs(
    'EPSG:2154',
    '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  );

  // Define Web Mercator (EPSG:3857) - used by most web maps (like PM tile sets)
  // This is often pre-defined in proj4js, but good to be explicit
  proj4.defs(
    'EPSG:3857',
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs'
  );
  // Add any other necessary projections here, e.g., WGS84 (EPSG:4326)
  // proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
}

// Call initialization immediately when the module is loaded
initializeProjections();

/**
 * Converts coordinates from a source CRS to a target CRS.
 * Assumes proj4 definitions for source and target are already loaded.
 * @param sourceEpsg EPSG code of the source coordinate system (e.g., 'EPSG:2154')
 * @param targetEpsg EPSG code of the target coordinate system (e.g., 'EPSG:3857')
 * @param x X coordinate in source CRS
 * @param y Y coordinate in source CRS
 * @returns [x_transformed, y_transformed] in target CRS
 */
export function transformCoordinates(sourceEpsg: string, targetEpsg: string, x: number, y: number): [number, number] {
  return proj4(sourceEpsg, targetEpsg, [x, y]);
}

/**
 * Converts a WMTS tile (col, row, zoom) to its Web Mercator (EPSG:3857) bounding box.
 * This function calculates the Web Mercator (meter) bounds based on standard XYZ tile scheme.
 * @param tileCol Tile Column
 * @param tileRow Tile Row
 * @param zoom Zoom Level
 * @returns {minX, minY, maxX, maxY} in Web Mercator meters
 */
export function getWebMercatorBoundsFromTile(
  tileCol: number,
  tileRow: number,
  zoom: number
): { minX: number; minY: number; maxX: number; maxY: number } {
  const n = Math.pow(2, zoom);
  // Resolution in meters per pixel at this zoom level
  const resolution = (2 * MAX_WEB_MERCATOR) / (n * TILE_SIZE_PX);

  // Calculate Web Mercator coordinates from tile indices and resolution
  const minX = -MAX_WEB_MERCATOR + tileCol * TILE_SIZE_PX * resolution;
  // Y-axis for tile rows is typically inverted compared to Web Mercator Y
  const maxY = MAX_WEB_MERCATOR - tileRow * TILE_SIZE_PX * resolution;

  const maxX = -MAX_WEB_MERCATOR + (tileCol + 1) * TILE_SIZE_PX * resolution;
  const minY = MAX_WEB_MERCATOR - (tileRow + 1) * TILE_SIZE_PX * resolution;

  return { minX, minY, maxX, maxY };
}

/**
 * Converts Web Mercator (EPSG:3857) coordinates to a WMTS tile (col, row) at a given zoom.
 * This is the more direct function we need.
 * @param webMercatorX Web Mercator X coordinate (meters)
 * @param webMercatorY Web Mercator Y coordinate (meters)
 * @param zoom Zoom Level
 * @returns {tileCol, tileRow}
 */
export function webMercatorToTile(
    webMercatorX: number,
    webMercatorY: number,
    zoom: number
  ): { tileCol: number; tileRow: number } {
    const n = Math.pow(2, zoom);
    // Total world width in Web Mercator at current zoom level in pixels (if it were one giant image)
    const worldPx = TILE_SIZE_PX * n;
  
    // X pixel coordinate (from left edge of Web Mercator world)
    const xPx = (webMercatorX + MAX_WEB_MERCATOR) / (2 * MAX_WEB_MERCATOR) * worldPx;
    // Y pixel coordinate (from top edge of Web Mercator world)
    // Note: Web Mercator Y is positive North, but tile rows increase downwards (South)
    const yPx = (MAX_WEB_MERCATOR - webMercatorY) / (2 * MAX_WEB_MERCATOR) * worldPx;
  
    const tileCol = Math.floor(xPx / TILE_SIZE_PX);
    const tileRow = Math.floor(yPx / TILE_SIZE_PX);
  
    return { tileCol, tileRow };
  }

/**
 * Calculates the scene position for a point cloud group based on its Web Mercator coordinates
 * @param pointCloud The point cloud data
 * @returns Vector3 position in scene units
 */
export function calculateGroupPosition(pointCloud: LidarPointCloud): Vector3 {
  const { targetBounds } = pointCloud.getMetadata();
  const minAltitude = targetBounds.min.z;

  const { tileCol, tileRow } = webMercatorToTile(targetBounds.min.x, targetBounds.min.y, ZOOM_LEVEL);
  const tileBounds = getWebMercatorBoundsFromTile(tileCol, tileRow, ZOOM_LEVEL);

  const offsetX_meters_within_tile = targetBounds.min.x - tileBounds.minX;
  const offsetY_meters_within_tile = tileBounds.maxY - targetBounds.min.y;

  const tileBaseX_sceneUnits = tileCol * PATCH_SIZE;
  const tileBaseY_sceneUnits = tileRow * PATCH_SIZE;

  const offsetX_sceneUnits = offsetX_meters_within_tile * SCALE_METERS_TO_SCENE_UNITS;
  const offsetY_sceneUnits = offsetY_meters_within_tile * SCALE_METERS_TO_SCENE_UNITS;

  const groupPositionX = tileBaseX_sceneUnits + offsetX_sceneUnits + 20;
  const groupPositionY = minAltitude;
  const groupPositionZ = tileBaseY_sceneUnits + offsetY_sceneUnits + 24;

  return new Vector3(groupPositionX, groupPositionY, groupPositionZ);
}

/**
 * Calculates the scale for a point cloud group
 * @returns Vector3 scale factors
 */
export function calculateGroupScale(): Vector3 {
  return new Vector3(
    SCALE_METERS_TO_SCENE_UNITS,
    1,
    SCALE_METERS_TO_SCENE_UNITS
  ).multiply(new Vector3(8.35, 1.2, 8.36));
}
