import { TILE_SIZE } from "./constants";
import proj4 from "proj4";

// Define Lambert-93 (EPSG:2154)
proj4.defs("EPSG:2154", "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs");


// Convert grid coordinates to world position
export function gridToWorld(gridX: number, gridZ: number): { worldX: number; worldZ: number } {
  return {
    worldX: gridX * TILE_SIZE,
    worldZ: gridZ * TILE_SIZE
  };
}

// Generate terrain height at world coordinates
export function getTerrainHeight(worldX: number, worldZ: number): number {
  const amplitude = 10;
  const frequency = 0.05;
  return 0//amplitude * Math.sin(worldX * frequency) * Math.cos(worldZ * frequency);
}

// Convert world position to tile coordinates
export function worldToTilePosition(worldX: number, worldZ: number): [number, number] {
  const tileCol = Math.floor(worldX / TILE_SIZE);
  const tileRow = Math.floor(worldZ / TILE_SIZE);
  return [tileCol, tileRow];
}

// Convert tile coordinates to world position
export function tileToWorldPosition(tileCol: number, tileRow: number): [number, number] {
  const worldX = tileCol * TILE_SIZE;
  const worldZ = tileRow * TILE_SIZE;
  return [worldX, worldZ];
}

// Calculate current patch from player position
export function calculateCurrentPatch(playerPosition: [number, number, number]): string {
  const [worldX, , worldZ] = playerPosition;
  const [tileCol, tileRow] = worldToTilePosition(worldX, worldZ);
  return `${tileCol}:${tileRow}`;
}

/**
 * Converts Lambert93 coordinates to WMTS tile indices and offset
 * @param {number} x - Lambert93 X (easting)
 * @param {number} y - Lambert93 Y (northing)
 * @param {number} zoom - WMTS zoom level (default: 19)
 * @returns {{
*   tileCol: number,
*   tileRow: number,
*   tilePos: { x: number, y: number }
* }}
*/
function lambert93ToTileCoords(x: number, y: number, zoom = 19) {
  const TILE_SIZE = 256;
  const ORIGIN_X = -20037508.3427892;
  const ORIGIN_Y = 20037508.3427892;
  const resolution = 156543.033928 / (2 ** zoom);

  // Convert Lambert93 → EPSG:3857
  const [mercX, mercY] = proj4("EPSG:2154", "EPSG:3857", [x, y]);

  // Mercator → pixel coordinates
  const pixelX = (mercX - ORIGIN_X) / resolution;
  const pixelY = (ORIGIN_Y - mercY) / resolution;

  // Tile indices
  const tileCol = Math.floor(pixelX / TILE_SIZE);
  const tileRow = Math.floor(pixelY / TILE_SIZE);

  // Pixel offset inside tile
  const tilePos = {
    x: pixelX % TILE_SIZE,
    y: pixelY % TILE_SIZE
  };

  return { tileCol, tileRow, tilePos };
}

/**
 * Apply transformation to an array of positions (Float32Array format)
 * Converts Lambert 93 coordinates to scene coordinates:
 * Lambert93 X -> Scene X
 * Lambert93 Y -> Scene Z
 * Lambert93 Z -> Scene Y
 */
export function transformLidarPositions(
  positions: Float32Array
): Float32Array {
  const transformedPositions = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    // Lambert 93 coordinates: [X, Y, Z]
    const x = positions[i];
    const y = positions[i + 1];
    const h = positions[i + 2];

    const { tileCol, tileRow, tilePos } = lambert93ToTileCoords(x, y)
    const x2 = tileCol * TILE_SIZE + tilePos.x
    const y2 = tileRow * TILE_SIZE + tilePos.y
    // temporary fix harcoded translation
    const x3 = x + 16381700; 
    const y3 = y + 4842500;
    // Transform to scene coordinates with axis mapping
    transformedPositions[i] = x3;     // X -> X
    transformedPositions[i + 1] = h; // Z -> Y (height)
    transformedPositions[i + 2] = y3; // Y -> Z
  }

  return transformedPositions;
}