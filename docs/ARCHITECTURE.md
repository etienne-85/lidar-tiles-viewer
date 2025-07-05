# ARCHITECTURE.md

## Current Implementation Status
**Stage 1: Dynamic patch based terrain - NEARLY COMPLETE**

### File Structure (Current)
```
src/
├── TerrainScene.tsx          # Main R3F scene + orchestration
├── Player.tsx                # Cylinder + movement controls  
├── TerrainPatch.tsx          # Individual terrain patch mesh
├── hooks/
│   └── usePatchPolling.tsx   # Hook for patch visibility logic
└── utils/
    └── gridSystem.ts         # Grid system utilities
```

## Components: Roles & Responsibilities

### TerrainScene (Main Container)
**File**: `src/TerrainScene.tsx`

**Role**: Main scene orchestrator and React Three Fiber canvas container

**Responsibilities**:
- Fullscreen scene canvas  
- CameraControls (third-person camera)
- State management: player position, ..
- Dynamic tiles handling: call `usePatchPolling` with player position and tileRange and renders all visible patches returned by hook

**Input/Output**:
```typescript
// Component Props: None (top-level component)

// Outputs:
// - Renders Canvas with all child components
// - Manages playerPosition state shared across components
```

---

### Player
**File**: `src/Player.tsx`

**Role**: Player character with movement controls and camera management

**Responsibilities**:
- Basic character represented as moving cylinder
- Third-person camera system with orbiting capability
- Camera always follows player position as target
- Surface-following movement with terrain height sampling
- Camera-relative movement (W/S forward/backward, A/D left/right)
- Adaptive camera distance control during zoom operations

**Input/Output**:
```typescript
interface PlayerProps {
  position: [number, number, number];
  onPositionChange: (position: [number, number, number]) => void;
}
```
---

### TerrainPatch
**File**: `src/TerrainPatch.tsx`

**Role**: Individual terrain patch with geometry and texture

**Responsibilities**:
- Generate BufferGeometry from height data
- Apply texture per patch 
- Position patch in world space based on grid coordinates

**Input/Output**:
```typescript
interface TerrainPatchProps {
  patchId: string; // Format: "gridX:gridZ" (e.g., "0:0", "-1:2")
}
```

**Technical considerations**:
- **Patch Size**: 64x64 world units
- **Subdivisions**: 32x32 geometry segments
- **Coordinates**: Integer grid coordinates (e.g., patch "1:2" is at world [64,128])
---

### usePatchPolling (React Hook)
**File**: `src/hooks/usePatchPolling.tsx`

**Role**: Calculate visible patches around player position

**Responsibilities**:
- Determine which patches should be visible based on player position
- Generate and return array of visible patch IDs within center and tile range

**Input/Output**:
```typescript
function usePatchPolling(
  playerPosition: [number, number, number],
  tileRange: number
): string[]
```

---

### Grid System Utilities
**File**: `src/utils/gridSystem.ts`

**Role**: Core grid mathematics and terrain height calculations

**Responsibilities**:
Global purpose toolbox for other componentes

**Features**
- Convert between world and grid coordinate systems
- Calculate visible patches within a given range
- Provide consistent terrain height function
- Define grid system constants

**Exported Types & Functions**:
```typescript
// Constants
export const PATCH_SIZE = 64; // World units per patch

// Types
export interface GridCoordinates {
  gridX: number;
  gridZ: number;
}

export interface WorldCoordinates {
  worldX: number;
  worldZ: number;
}

// Features
// Convert between world and grid coordinate systems
export function worldToGrid(worldX: number, worldZ: number): GridCoordinates; 
export function gridToWorld(gridX: number, gridZ: number): WorldCoordinates;
//  Calculate visible patches within a given range
export function calculateVisiblePatches(
  playerPosition: [number, number, number], 
  tileRange: number
): string[];
// Temporary procedural height function
export function getTerrainHeight(x: number, z: number): number;
```
---

## Data Flow

```
TerrainScene
├── playerPosition state: [x, y, z]
├── calls usePatchPolling(playerPosition, tileRange=2)
├── renders Player(position, onPositionChange)
└── renders TerrainPatch[] for each visible patchId

Player
├── receives position from TerrainScene
├── handles WASD input + camera controls
├── calculates new position using getTerrainHeight()
└── calls onPositionChange() to update TerrainScene

usePatchPolling
├── receives playerPosition + tileRange
├── uses worldToGrid() to get player grid position
├── uses calculateVisiblePatches() to get patch IDs
└── returns array of patchIds: ["gridX:gridZ", ...]

TerrainPatch
├── receives patchId string
├── parses to gridX, gridZ coordinates
├── uses gridToWorld() to get world position
├── uses getTerrainHeight() for vertex displacement
└── renders mesh with procedural texture
```