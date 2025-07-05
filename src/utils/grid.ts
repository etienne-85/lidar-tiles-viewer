// Grid System Constants and Utilities
export const PATCH_SIZE = 64;

export interface GridCoordinates {
  gridX: number;
  gridZ: number;
}

export interface WorldCoordinates {
  worldX: number;
  worldZ: number;
}

export function worldToGrid(worldX: number, worldZ: number): GridCoordinates {
  return {
    gridX: Math.floor(worldX / PATCH_SIZE),
    gridZ: Math.floor(worldZ / PATCH_SIZE)
  };
}

export function gridToWorld(gridX: number, gridZ: number): WorldCoordinates {
  return {
    worldX: gridX * PATCH_SIZE,
    worldZ: gridZ * PATCH_SIZE
  };
}

export function calculateVisiblePatches(playerPosition: [number, number, number], tileRange: number): string[] {
  const { gridX, gridZ } = worldToGrid(playerPosition[0], playerPosition[2]);
  const visiblePatches: string[] = [];

  for (let x = gridX - tileRange; x <= gridX + tileRange; x++) {
    for (let z = gridZ - tileRange; z <= gridZ + tileRange; z++) {
      visiblePatches.push(`${x}:${z}`);
    }
  }

  return visiblePatches;
}

export function getTerrainHeight(x: number, z: number): number {
  // Match the terrain height function used across components
  return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 +
    Math.sin(x * 0.05) * 2;
}