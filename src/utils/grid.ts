export const PATCH_SIZE = 100;

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
  return amplitude * Math.sin(worldX * frequency) * Math.cos(worldZ * frequency);
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