import { PATCH_SIZE } from "./constants";
import proj4 from "proj4";

// Define Lambert-93 (EPSG:2154)
proj4.defs("EPSG:2154", "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs");


// Convert grid coordinates to world position
export function gridToWorld(gridX: number, gridZ: number): { worldX: number; worldZ: number } {
  return {
    worldX: gridX * PATCH_SIZE,
    worldZ: gridZ * PATCH_SIZE
  };
}

// Generate terrain height at world coordinates
export function getTerrainHeight(worldX: number, worldZ: number): number {
  const amplitude = 10;
  const frequency = 0.05;
  return 120//amplitude * Math.sin(worldX * frequency) * Math.cos(worldZ * frequency);
}

// Convert world position to tile coordinates
export function worldToTilePosition(worldX: number, worldZ: number): [number, number] {
  const tileCol = Math.floor(worldX / PATCH_SIZE);
  const tileRow = Math.floor(worldZ / PATCH_SIZE);
  return [tileCol, tileRow];
}

// Convert tile coordinates to world position
export function tileToWorldPosition(tileCol: number, tileRow: number): [number, number] {
  const worldX = tileCol * PATCH_SIZE;
  const worldZ = tileRow * PATCH_SIZE;
  return [worldX, worldZ];
}

// Calculate current patch from player position
export function calculateCurrentPatch(playerPosition: [number, number, number]): string {
  const [worldX, , worldZ] = playerPosition;
  const [tileCol, tileRow] = worldToTilePosition(worldX, worldZ);
  return `${tileCol}:${tileRow}`;
}