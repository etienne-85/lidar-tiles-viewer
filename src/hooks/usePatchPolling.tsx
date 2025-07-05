import { calculateVisiblePatches } from '../utils/grid';

// usePatchPolling Hook
export function usePatchPolling(playerPosition: [number, number, number], tileRange: number): string[] {
  return calculateVisiblePatches(playerPosition, tileRange);
}