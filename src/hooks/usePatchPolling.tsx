import { useMemo } from 'react';

export function usePatchPolling(currentPatch: string, tileRange: number): string[] {
  return useMemo(() => {
    const [centerTileCol, centerTileRow] = currentPatch.split(':').map(Number);
    const visiblePatchIds: string[] = [];

    // Generate grid of visible patches around current patch
    for (let dRow = -tileRange; dRow <= tileRange; dRow++) {
      for (let dCol = -tileRange; dCol <= tileRange; dCol++) {
        const tileCol = centerTileCol + dCol;
        const tileRow = centerTileRow + dRow;
        visiblePatchIds.push(`${tileCol}:${tileRow}`);
      }
    }

    return visiblePatchIds;
  }, [currentPatch, tileRange]);
}