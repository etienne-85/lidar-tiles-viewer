# Component Architecture Documentation

## Core Components

### TerrainScene
**File**: `src/TerrainScene.tsx`

**Purpose**: Root component that orchestrates the entire terrain visualization system.

**State Management**:
- `currentPatch`: String identifier of the patch containing the player
- `playerPosition`: 3D coordinates `[x, y, z]` of player location

**Key Functions**:
- Initializes player at default tile position (0:0)
- Monitors player position changes and updates current patch
- Manages Canvas setup and lighting configuration
- Coordinates between Player, TerrainPatch, and UI components

**Dependencies**:
- Player component for movement handling
- TerrainPatch components for terrain rendering
- OverlayUI for user interface
- usePatchPolling hook for visibility calculations

---

### Player
**File**: `src/Player.tsx`

**Purpose**: Interactive player entity with movement controls and camera management.

**Key Features**:
- **Movement System**: WASD keyboard controls with camera-relative movement
- **Camera Control**: Third-person camera that follows player with zoom capabilities
- **Terrain Collision**: Positions player on terrain surface using height sampling
- **Input Handling**: Keyboard event listeners for movement and mouse for camera

**State Management**:
- `keys`: Real-time tracking of pressed movement keys
- `targetDistance`: Camera distance management for zoom behavior
- `isZooming`: Detects when user is actively zooming

**Props Interface**:
```typescript
interface PlayerProps {
  position: [number, number, number];
  onPositionChange: (position: [number, number, number]) => void;
}
```

---

### TerrainPatch
**File**: `src/TerrainPatch.tsx`

**Purpose**: Renders individual terrain tiles with procedural geometry and texture mapping.

**Key Features**:
- **Geometry Generation**: Creates 32x32 subdivision mesh with height sampling
- **Dual Texture System**: Satellite imagery with procedural fallback
- **Position Mapping**: Converts tile coordinates to world positions
- **Performance Optimization**: Memoized component to prevent unnecessary re-renders

**Props Interface**:
```typescript
interface TerrainPatchProps {
  patchId: string; // Format: "tileCol:tileRow"
}
```

**Geometry Details**:
- 32x32 vertex grid for smooth terrain
- Height calculated via `getTerrainHeight()` function
- UV mapping for texture application
- Automatic normal calculation for lighting

---

## UI Components

### OverlayUI
**File**: `src/UI/Overlay.tsx`

**Purpose**: Provides real-time information display and user interface controls.

**Features**:
- **Position Display**: Real-time player coordinates and current patch
- **Collapsible Panels**: Expandable sections for position and controls
- **Toggle Visibility**: 'U' key to show/hide entire UI
- **Control Help**: Lists available keyboard shortcuts

**State Management**:
- `isVisible`: Overall UI visibility toggle
- `isPositionExpanded`: Position panel expansion state
- `isControlsExpanded`: Controls panel expansion state

**Props Interface**:
```typescript
interface OverlayUIProps {
  playerPosition: [number, number, number];
  currentPatch: string;
}
```

---

## Custom Hooks

### usePatchPolling
**File**: `src/hooks/usePatchPolling.tsx`

**Purpose**: Calculates visible patches around player position for dynamic loading.

**Implementation**:
- Takes current patch and tile range as parameters
- Generates grid of patch IDs in square pattern around player
- Memoized to prevent unnecessary recalculations
- Returns array of visible patch identifiers

**Usage Pattern**:
```typescript
const visiblePatchIds = usePatchPolling(currentPatch, TILE_RANGE);
```

---

### useImageryTiles
**File**: `src/hooks/useImageryTiles.tsx`

**Purpose**: Loads satellite imagery textures from IGN WMTS service.

**Implementation**:
- Constructs WMTS URL from patch coordinates
- Handles asynchronous texture loading
- Manages loading states and error handling
- Returns Three.js texture object or null

**URL Construction**:
- Uses IGN Géoportail WMTS service
- Zoom level 19 for high-resolution imagery
- JPEG format for optimal loading performance

---

### usePatchProceduralTexture
**File**: `src/hooks/usePatchProceduralTexture.tsx`

**Purpose**: Generates procedural textures as fallback for satellite imagery.

**Implementation**:
- Creates 512x512 canvas texture
- Color-coded by tile coordinates using HSL
- Includes coordinate labels and grid lines
- Memoized for performance optimization

**Visual Elements**:
- Background color based on tile coordinates
- 32x32 grid lines matching geometry subdivisions
- Bold border for patch boundaries
- Coordinate text and world position labels

---

## Utility Components

### Grid Utilities
**File**: `src/utils/grid.ts`

**Functions**:
- `getTerrainHeight()`: Procedural height generation using sine waves
- `worldToTilePosition()`: Converts world coordinates to tile coordinates
- `tileToWorldPosition()`: Converts tile coordinates to world coordinates
- `calculateCurrentPatch()`: Determines current patch from player position

### Constants
**File**: `src/utils/constants.ts`

**Configuration**:
- `PATCH_SIZE`: Size of each terrain patch (64 units)
- `TILE_RANGE`: Number of patches to render around player (2)

---

## Component Relationships

```
TerrainScene
├── Player
│   ├── CameraControls (from @react-three/drei)
│   └── Mesh (cylindrical player representation)
├── TerrainPatch[] (dynamic array based on visibility)
│   ├── useImageryTiles
│   ├── usePatchProceduralTexture
│   └── Custom BufferGeometry
└── OverlayUI
    └── Position/Controls panels
```
