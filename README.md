## Dynamic Terrain Patch Loading System

### Core Architecture
```
TerrainApp/
├── TerrainScene           # Main R3F scene + orchestration
├── Player                 # Cylinder + movement controls  
├── usePatchPolling        # Hook for patch visibility logic
└── TerrainPatch           # Individual terrain patch mesh
```


### Data Flow
Player Position → usePatchPolling → TerrainScene → TerrainPatch[]

### Component Responsibilities

**TerrainScene (Main Container)**
- Fixed fullscreen Canvas with proper positioning
- CameraControls integration
- Grid and axesHelper for reference (kept throughout phases)
- Player position state management
- Renders active patches from usePatchPolling hook
- Scene orchestration
- **Exported as arrow function**

**Player**
- Cylinder mesh with keyboard/mouse controls
- Sends position updates to TerrainScene
- Surface-following movement

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

### Implementation Phases

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

**Phase 3: Player Movement**
- Add Player cylinder with controls
- Position tracking and terrain following
- Grid and axesHelper remain for reference

**Phase 4: Dynamic Patch System**
- Implement usePatchPolling hook
- Multiple patches based on player position
- Dynamic loading/unloading
- Grid and axesHelper stay for debugging/reference

### Key Technical Decisions
- Fixed positioning for true fullscreen Canvas
- Keep Grid and axesHelper throughout all phases for reference
- Use built-in R3F/drei components where available (Grid, axesHelper)
- React state for player position (simple and reactive)
- Patch index map for efficient patch management
- Proper plane orientation for terrain alignment