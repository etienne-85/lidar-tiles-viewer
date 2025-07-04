# Dynamic Terrain Patch Loading System

## Core Architecture
```
TerrainApp/
├── TerrainScene           # Main R3F scene + orchestration
├── Player                 # Cylinder + movement controls  
├── usePatchPolling        # Hook for patch visibility logic
└── TerrainPatch           # Individual terrain patch mesh
```


## Data Flow
Player Position → usePatchPolling → TerrainScene → TerrainPatch[]

## Component Responsibilities

**TerrainScene (Main Container)**
- Fixed fullscreen Canvas with proper positioning
- CameraControls integration for third-person camera
- Grid and axesHelper for reference (kept throughout phases)
- Player position state management
- Renders active patches from usePatchPolling hook
- Scene orchestration
- **Exported as arrow function**

**Player**
- Cylinder mesh with WASD controls (using KeyCode for French AZERTY support)
- Third-person camera system: orbits around player, movement relative to camera direction
- Camera always follows player position as target
- Surface-following movement with terrain height sampling
- **Camera-relative movement**: W/S forward/backward, A/D left/right relative to camera view
- **Full orbiting**: Mouse drag rotates camera around player, scroll zooms

**usePatchPolling (React Hook)**
- Input: Player position, view radius
- Maintains patch index map (patchId → patchData)
- Returns array of active patches to render
- Handles patch creation/removal based on visibility

**TerrainPatch**
- Props: { patchId, position, size, heightData, textureUrl }
- PlaneGeometry with height displacement
- Grid-aligned positioning
- Texture mapping
- **Proper plane orientation with rotation={[-Math.PI / 2, 0, 0]}**

## Implementation Phases

**Phase 1: Basic Setup** ✅ **COMPLETE**
- TerrainScene with fixed fullscreen Canvas (position: fixed)
- CameraControls integration
- Built-in Grid component from @react-three/drei
- Built-in axesHelper for coordinate reference

**Phase 2: Single Terrain Patch** ✅ **COMPLETE**
- TerrainPatch component with sine wave height displacement
- PlaneGeometry with 32x32 subdivisions
- **Plane orientation fix**: rotation={[-Math.PI / 2, 0, 0]} to align with grid
- Vertex manipulation with proper normals calculation
- **TerrainScene exported as arrow function**

**Phase 3: Player Movement** ✅ **COMPLETE**
- Player cylinder with WASD controls using KeyCode (French AZERTY compatible)
- Third-person camera system with orbiting capability
- Camera always follows player as target with smooth tracking
- Movement relative to camera direction (not fixed world axes)
- Position tracking and terrain height following
- Grid and axesHelper remain for reference

**Phase 4: Dynamic Patch System** (NEXT)
- Implement usePatchPolling hook
- Multiple patches based on player position
- Dynamic loading/unloading
- Grid and axesHelper stay for debugging/reference

## Key Technical Decisions
- Fixed positioning for true fullscreen Canvas
- Keep Grid and axesHelper throughout all phases for reference
- Use built-in R3F/drei components where available (Grid, axesHelper)
- React state for player position (simple and reactive)
- Patch index map for efficient patch management
- Proper plane orientation for terrain alignment
- **KeyCode-based input for international keyboard support**
- **Third-person camera with player-centric orbiting and camera-relative movement**
- **Camera target always locked to player position**