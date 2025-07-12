import { Vector2 } from "three";
import type { Vector3 } from "three";
import { PATCH_SIZE } from "../common/constants";
import proj4 from "proj4";

// Define Lambert-93 (EPSG:2154)
proj4.defs("EPSG:2154", "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs");


// Convert grid coordinates to world position
export function gridToWorld(gridX: number, gridZ: number): Vector2 {
  return new Vector2(gridX * PATCH_SIZE, gridZ * PATCH_SIZE);
}

// Convert world position to tile coordinates
export function worldToTilePosition(worldX: number, worldZ: number): Vector2 {
  const tileCol = Math.floor(worldX / PATCH_SIZE);
  const tileRow = Math.floor(worldZ / PATCH_SIZE);
  return new Vector2(tileCol, tileRow);
}

// Convert tile coordinates to world position
export function tileToWorldPosition(tileCol: number, tileRow: number): Vector2 {
  return new Vector2(tileCol * PATCH_SIZE, tileRow * PATCH_SIZE);
}

// Calculate current patch from player position
export function calculateCurrentPatch(playerPosition: Vector3): string {
  const tileCoords = worldToTilePosition(playerPosition.x, playerPosition.z);
  return `${tileCoords.x}:${tileCoords.y}`;
}
