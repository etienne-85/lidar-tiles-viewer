# STAGE 3: LIDAR Data Point Cloud Display - Updated Plan

## Context

This stage introduces LIDAR point cloud visualization capabilities to the existing terrain visualization system.

## Requirements

- Import, load and parse LAZ local files extracting point cloud data and classifications
- Visualize point cloud data alongside existing terrain patches
- Basic interactions with point cloud directly or from UI: select, filter, and display basic info

## Specs

### Lidar datasource and format
LIDAR tiles from IGN covering 1 sq.km each as LAZ files (compressed LAS format) of approximately 100MB size.

Tile url example: https://storage.sbg.cloud.ovh.net/v1/AUTH_63234f509d6048bca3c9fd7928720ca1/ppk-lidar/NF/LHD_FXX_0796_6792_PTS_C_LAMB93_IGN69.copc.laz

### Scope clarification

**Lidar LAZ file loading**

Due to the added complexity of loading and caching large LIDAR tiles in the browser, the current scope is **limited to manual import of local LAZ files**.

The longer-term goal is to support LIDAR data fetching similar to satellite imagery tiles.

**Point cloud rendering**

To keep the implementation simple for now and avoid unnecessary complexity, the current technical choice is to use existing R3F components such as `InstancedPoints`.
A custom full-GPU implementation is planned for a later stage.

### Coordinate System
- LIDAR coordinates will be aligned with existing terrain coordinate system
- Coordinate transformation handled within `LidarPointCloud` class

### Error Handling
- File format validation
- Parsing error handling

## Components Proposal

### LidarPointCloud
- **File**: `src/data/LidarPointCloud.ts`
- **Role**: Unified point cloud data structure with parsing capabilities
- **Responsibilities**: Parse LAZ/LAS files, store point data, provide basic data access and filtering
- **Interface**:
```typescript
class LidarPointCloud {
  static fromLAZFile(file: File): Promise<LidarPointCloud>
  static fromLASFile(file: File): Promise<LidarPointCloud>
  
  // Basic data access
  getPoints(): Float32Array
  getClassifications(): number[]
  getMetadata(): LidarMetadata
  
  // Filtering (Step 3 only)
  getFilteredPoints(filter: PointFilter): Float32Array
}
```

### FileImporter
- **File**: `src/UI/FileImporter.tsx`
- **Role**: Local file import interface
- **Input**: User file selection
- **Output**: `File` object
- **Interface**:
```typescript
interface FileImporterProps {
  onFileLoaded: (pointCloud: LidarPointCloud) => void;
  onError: (error: string) => void;
}
```

### PointCloudRenderer
- **File**: `src/render/PointCloudRenderer.tsx`
- **Role**: R3F component for rendering point cloud
- **Input**: `LidarPointCloud` + optional filtering criteria
- **Output**: 3D visualization using InstancedPoints
- **Interface**:
```typescript
interface PointCloudRendererProps {
  pointCloud: LidarPointCloud;
  filter?: PointFilter; // Step 3 only
  onPointSelect?: (point: PointData) => void; // Step 3 only
}
```

### ControlPanel
- **File**: `src/UI/ControlPanel.tsx`
- **Input**: Available classifications from `LidarPointCloud`
- **Output**: Filter criteria for point cloud display
- **Interface**:
```typescript
interface ControlPanelProps {
  pointCloud: LidarPointCloud;
  onFilterChange: (filter: PointFilter) => void;
}
```

### InfoPanel
- **File**: `src/UI/InfoPanel.tsx`
- **Input**: Selected point data
- **Output**: Display point-specific information
- **Interface**:
```typescript
interface InfoPanelProps {
  selectedPoint: PointData | null;
  pointCloud: LidarPointCloud;
}
```

### Sidebar
- **File**: `src/UI/Sidebar.tsx`
- **Input**: `LidarPointCloud` metadata
- **Output**: Summary information display
- **Interface**:
```typescript
interface SidebarProps {
  pointCloud: LidarPointCloud | null;
}
```

## Architectural Integration

### Dependencies
This plan doesn't require any changes to existing components to work.

### Interactions
- Step 1: File Import → LidarPointCloud → Sidebar Display
- Step 2: LidarPointCloud → PointCloudRenderer → TerrainScene
- Step 3: LidarPointCloud → ControlPanel → PointCloudRenderer (filtered)
           LidarPointCloud → InfoPanel ← PointCloudRenderer (selection)

### Impact
No changes required on existing components.
Point cloud data will be rendered seamlessly alongside terrain patches.

### Integration Points
- `PointCloudRenderer` will be added to `TerrainScene` at Step 2
- Additional UI elements will be added to `OverlayUI` at Step 3

## Implementation Steps

### **STEP #1: Basic Point Cloud Class and File Import**

**Components:**
- `LidarPointCloud.ts`
- `FileImporter.tsx`
- `Sidebar.tsx`

**Tasks:**
- Task 1: Implement `LidarPointCloud` class with basic LAZ parsing capabilities
- Task 2: Create file import UI with drag-and-drop support
- Task 3: Display file metadata and basic statistics in sidebar

**Success Criteria:**
- Can import LAZ file and see parsed metadata
- Point cloud data is accessible through unified interface
- Basic file information displayed in sidebar (point count, classifications, bounds)

**Out of Scope:**
- Filtering, spatial queries, LOD optimization
- Performance optimization for large datasets

### **STEP #2: Basic Point Cloud Visualization**

**Components:**
- `PointCloudRenderer.tsx`
- Integration with `TerrainScene`

**Tasks:**
- Task 1: Create `PointCloudRenderer` component using R3F InstancedPoints
- Task 2: Render all points from `LidarPointCloud` without filtering
- Task 3: Add `PointCloudRenderer` to `TerrainScene` component

**Success Criteria:**
- Point cloud renders in 3D scene alongside terrain
- Points appear at correct world coordinates
- Basic visualization is functional and stable

**Out of Scope:**
- Point selection, filtering, or user interactions
- Performance optimization or chunking

### **STEP #3: User Interactivity and Filtering**

**Components:**
- `ControlPanel.tsx`
- `InfoPanel.tsx`
- Enhanced `PointCloudRenderer` with selection
- Enhanced `LidarPointCloud` with filtering methods
- Enhanced `OverlayUI` with point cloud controls

**Tasks:**
- Task 1: Add basic filtering methods to `LidarPointCloud` (by classification)
- Task 2: Add point selection capability to `PointCloudRenderer` using raycasting
- Task 3: Create control panel for classification-based filtering
- Task 4: Implement info panel showing selected point details
- Task 5: Add point cloud UI controls to `OverlayUI`

**Success Criteria:**
- Can select individual points and see their properties (coordinates, classification, intensity)
- Can filter point cloud by classification types
- All UI controls are accessible and functional
- Point cloud controls integrated into main UI

**Implementation Details:**
- Classification filtering: show/hide points by LAS classification codes
- Point selection: click on point to see detailed information
- UI integration: add point cloud section to existing overlay UI

## Success Criteria

### Complete Implementation Success:
- LAZ files can be imported through drag-and-drop interface
- Point cloud data is parsed and accessible
- Points render correctly in 3D scene alongside terrain
- Users can filter points by classification
- Users can select individual points and view their properties
- UI provides clear feedback and controls for all interactions

### Visual Integration:
- Point clouds appear seamlessly with existing terrain patches
- Coordinate systems are properly aligned
- Performance remains acceptable for typical LAZ file sizes

### Final Step 
***list remaining bugs, refactoring tasks, improvements, optimizations, required to complete current stage  ... here***

## Result & Comments
***provide screenshots and final comments here***

