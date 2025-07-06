# Project Architecture Overview

## System Architecture

The terrain visualization system is built around a tile-based approach where the world is divided into discrete patches that are dynamically loaded based on player position.

```
┌─────────────────────────────────────────────────────────────--┐
│                    TerrainScene (Root)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │     Player      │  │   TerrainPatch  │  │    OverlayUI    ││
│  │   Component     │  │   Components    │  │   Component     ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────--┘
```

## Core Components

### TerrainScene
- **Role**: Central coordinator and state manager
- **Responsibilities**:
  - Manages global player position state
  - Calculates current patch based on player location
  - Orchestrates patch loading/unloading
  - Provides 3D canvas context

### Player
- **Role**: Interactive player entity with movement and camera controls
- **Responsibilities**:
  - Handles keyboard input (WASD movement)
  - Manages camera positioning and following
  - Reports position changes to parent
  - Terrain height collision detection

### TerrainPatch
- **Role**: Individual terrain tile renderer
- **Responsibilities**:
  - Generates 3D geometry for specific world coordinates
  - Handles texture loading and application
  - Manages procedural height generation
  - Optimizes rendering through memoization

### OverlayUI
- **Role**: Information display and user interface
- **Responsibilities**:
  - Shows real-time player coordinates
  - Displays current patch information
  - Provides controls help
  - Handles UI visibility toggling

## Data Flow

```
Player Position Change
        ↓
TerrainScene State Update
        ↓
Current Patch Calculation
        ↓
Visible Patches Determination
        ↓
TerrainPatch Rendering
        ↓
Texture Loading & Geometry Generation
```

## Coordinate Systems

### World Coordinates
- Continuous coordinate system where player moves
- Used for precise positioning and movement calculations
- Origin at (0, 0, 0)

### Tile Coordinates
- Discrete grid system dividing world into patches
- Each tile represents a TILE_SIZE × TILE_SIZE world area
- Used for patch identification and texture fetching

### Patch Identification
- Format: `"tileCol:tileRow"` (e.g., "0:0", "1:-1")
- Unique identifier for each terrain patch
- Calculated from world coordinates via floor division

## Dynamic Loading Strategy

### Patch Visibility
- Calculates visible patches in a square grid around player
- Range determined by TILE_RANGE constant
- Only renders patches within visibility range

### Texture Loading
- Dual-texture approach: satellite imagery with procedural fallback
- Satellite textures loaded asynchronously from IGN WMTS service
- Procedural textures generated immediately as placeholders

### Memory Management
- Components use React.memo() for render optimization
- Patches automatically unmount when outside visibility range
- Texture resources cleaned up through React lifecycle


## Sequential Diagrams

### 1. Terrain dynamic updating
***TODO: mermaid sequence diagram showing how terrain patches are dynamially processed on player move***

