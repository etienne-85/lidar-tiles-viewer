import { TILE_SIZE } from "./constants";

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