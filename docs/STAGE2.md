# STAGE 2 Satellite Imagery Tile Integration

## Assumptions
- 1:1 correspondence between terrain patches and satellite tiles
- **Tile service** Use French IGN WMTS with TileMatrix=19 (zoom level 19)

### Architecture Changes
- **Coordinate system**: Use WMTS tile coordinates (tileCol:tileRow) as primary patch identifiers
- **State management**: Global currentPatch state tracking for optimized patch polling

### Component Modifications

**TerrainScene (Global State Management)**
- **NEW**: `currentPatch` state with `tileCol:tileRow` format
- **NEW**: Watch `playerPosition` changes to update `currentPatch` when crossing patch boundaries
- **NEW**: Call `usePatchPolling` only when `currentPatch` changes (optimization)

**TerrainPatch (Texture System Refactor)**
- **NEW**: Use texture hook for patch-specific textures

**usePatchPolling (Optimized Triggering)**
- **Input**: currentPatch, tileRange
- **Output**: Array of visible patchIds in format `"tileCol:tileRow"`
- **Behavior**: Only recalculates when currentPatch changes (not every frame)

### New Components

**hooks/usePatchProceduralTexture.tsx**
```typescript
function usePatchProceduralTexture(patchId: string): THREE.CanvasTexture;
// Moved from TerrainPatch component
// Takes patchId in "tileCol:tileRow" format
// Returns customized procedural texture
```

**hooks/useImageryTiles.tsx**
```typescript
function useImageryTiles(patchId: string): THREE.Texture | null;
// Parses patchId to tileCol:tileRow
// Builds IGN WMTS URL
// Fetches satellite imagery
// Returns texture when loaded, null during loading
```

## Incremental Implementation Steps

### STEP #1: Global State Refactor ⏳ **NEXT**

**TerrainScene modifications**:
```typescript
// NEW state management
const [currentPatch, setCurrentPatch] = useState<string>("tileCol:tileRow");
const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);

// NEW effect to update currentPatch when player moves
useEffect(() => {
  const newPatch = calculateCurrentPatch(playerPosition);
  if (newPatch !== currentPatch) {
    setCurrentPatch(newPatch);
  }
}, [playerPosition]);

// UPDATED patch polling - only when currentPatch changes
const visiblePatchIds = usePatchPolling(currentPatch, tileRange);
```

**TerrainPatch refactor**:
```typescript
// NEW hook-based texture system
const patchTexture = usePatchProceduralTexture(patchId);

// KEEP existing geometry generation
// UPDATE position calculation to use tile coordinates
```

**New hook: usePatchProceduralTexture**:
```typescript
// Move generatePatchTexture logic to dedicated hook
function usePatchProceduralTexture(patchId: string): THREE.CanvasTexture {
  const [tileCol, tileRow] = patchId.split(':').map(Number);
  // Generate procedural texture based on tile coordinates
}
```

**Expected result**: Player spawns at patch labeled "tileCol:tileRow"

### STEP #2: Basic useImageryTiles Hook ⏳ **PENDING**

**New hook implementation**:
```typescript
function useImageryTiles(patchId: string): THREE.Texture | null {
  const [tileCol, tileRow] = patchId.split(':').map(Number);
  
  const url = `https://data.geopf.fr/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=19&TileCol=${tileCol}&TileRow=${tileRow}`;
  
  // Fetch and return texture
}
```

**Testing integration in TerrainScene**:
```typescript
// TEMPORARY: Test tile fetching alongside existing system
const testTileTexture = useImageryTiles(currentPatch);

// Monitor network activity as player moves
useEffect(() => {
  console.log('Fetching tile for patch:', currentPatch);
}, [currentPatch]);
```

**Expected result**: Network requests visible in browser DevTools as player moves

### STEP #3: Integration with Patch System ⏳ **PENDING**

**TerrainPatch final integration**:
```typescript
// REPLACE procedural texture with satellite imagery
const patchTexture = useImageryTiles(patchId);

// FALLBACK: Use procedural texture during loading
const proceduralTexture = usePatchProceduralTexture(patchId);
const finalTexture = patchTexture || proceduralTexture;
```

**Expected result**: All patches display satellite imagery with procedural fallback

### STEP #4: Coordinate System Integration ⏳ **PENDING**

**New utilities**: `utils/tileSystem.ts`
```typescript
export function calculateCurrentPatch(playerPosition: [number, number, number]): string;
export function tileToWorldPosition(tileCol: number, tileRow: number): [number, number];
export function worldToTilePosition(worldX: number, worldZ: number): [number, number];
```

**Updated grid system**: Use tile coordinates throughout

### STEP #5: Performance Optimization ⏳ **PENDING**

**Optimizations**:
- Tile caching to avoid re-fetching
- Preloading adjacent tiles
- Error handling for failed tile loads
- Loading state management

### Final Step 
***TODO: list remaining tasks, bugs, ... here***


## Expected Final Result
- Real French IGN satellite imagery on all terrain patches
- Perfect alignment between satellite tiles and terrain geometry
- Optimized patch polling (only when crossing patch boundaries)
- Seamless integration with existing player movement
- Robust error handling and loading states

## Key Technical Decisions
- **Initial location**: Ask "tileCol:tileRow" as spawn point
- **State optimization**: currentPatch-based patch polling
- **Fallback strategy**: Procedural textures during tile loading
- **Performance baseline**: Start with current 32x32 geometry