# STAGE 3: LIDAR Data Point Cloud Display

## Context

This stage introduces LIDAR point cloud visualization capabilities to the existing terrain visualization system.

## Requirements

- Import, load and parse LAZ local files extracting point cloud data and classifications
- Visualize point cloud data alongside existing terrain patches
- Basic interactions with point cloud directly or from UI: select, filter, ..+ Basic info displayed

## Specs

### Lidar datasource and format
LIDAR tiles from IGN covering 1 sq.km each as LAZ files (compressed LAS format) of approximately 100MB size.

Tile url example: https://storage.sbg.cloud.ovh.net/v1/AUTH_63234f509d6048bca3c9fd7928720ca1/ppk-lidar/NF/LHD_FXX_0796_6792_PTS_C_LAMB93_IGN69.copc.laz
### Scope clarification


**Lidar LAZ file loading**

Due to the added complexity of loading and caching large LIDAR tiles in the browser, the current scope is **limited to manual import of local LAZ files**.

The longer-term goal is to support LIDAR data fetching similar to satellite imagery tiles.

***Point cloud rendering***

To keep the implementation simple for now and avoid unnecessary complexity, the current technical choice is to use existing R3F components such as `InstancedPoints`.
A custom full-GPU implementation is planned for a later stage.

### Pending questions
***LAZ file parsing*** 

Should we have separate data structure for storing point clouds like `PointCloudData` and utility class like `LAZFileParser` with static method like
 `parseLAZFile` that will return filled data structure

Or should we have unique `LidarPointCloud` with methods like `fromLAZfile`, `fromLASfile` to parse file and populate itself with point cloud data

***Point cloud rendering***

Should point clouds follow same tile-based approach as terrain?
e.g. rendered at once, or split as chunks and rendered progressively as player moves?

## Components proposal

### FileImporter
- **File**: `src/UI/FileImporter.tsx`
- **Role**: import local file at 
- **input**: local file at `LAZ`/`LAS` format
- **output**: `File`
- **Suggested interface**:
```typescript
interface FileImporter {
  // TODO
}
```

### LAZFileParser
- **File**: `src/tools/LAZFileParser.ts`
- **Role**: parse LAZ/LAS file
- **input**: `File`
- **output** parsed lidar data
- **Suggested interface**:
```typescript
interface LAZFileParser {
  // TODO
}
```

### PointCloudData
- **File**: `src/data/PointCloudData.ts`
- **Role**: Data structure for storing point cloud data extracted from parsed Lidar file
- **Input**: parsed lidar file
- **Output**: point cloud data
- **Suggested interface**:
```typescript
interface PointCloudData {
  // TODO
}
```

### PointCloudRenderer
- **File**: `src/render/PointCloudRenderer.ts`
- **Role**: R3F component for rendering point cloud 
- **Input**: `PointCloudData` + filtering criteria
- **Output**: 3D visualization of point cloud
- **Responsibilities** Render points using R3F instanced points approach, handle point selection
- **Suggested interface**:
```typescript
interface PointCloudRenderer {
  // TODO
}
```

### ControlPanel
- **File**: `src/UI/ControlPanel.tsx`
- **Input**: Available classifications from loaded LAZ data
- **Output**: Filter criteria for point cloud display
- **Responsibilities**: Provide UI controls for classification-based filtering

### InfoPanel
- **File**: `src/UI/InfoPanel.tsx`
- **Input**: Selected point data
- **Output**: Display point-specific information
- **Responsibilities**: Show coordinates, classification, and other point attributes

### Sidebar
- **File**: `src/UI/Sidebar.tsx`
- **Input**: LAZ file metadata
- **Output**: Summary information display
- **Responsibilities**: Show file stats, point count, available classifications


### Architectural
***dependancies***

this plan doesn't require any other components to work

***interactions***
- File Import → LAZ Parser → Point Cloud Renderer
- Point Cloud Renderer → Point Info Panel (on point selection)
- LAZ Parser → Control Panel (for classification options)
- LAZ Parser → File Info Panel (for metadata display)

***impact***

No changes required on existing componennt.
Point cloud data will be rendered semalessly alongside terrain patches

***integration***
- component will be used from `TerrainScene`
- additional ui elements will be added to `OverlayUI`

## Incremental Implementation Steps

### STEP #1: Local LAZ file import and parsing
**Components**
- `FileImporter.tsx`
- `LazFileParser.ts`
- `Sidebar.tsx`

**Tasks:**
- Task 1: add import button accepting LAZ, LAS file formats
- Task 2: decompress and parse file content
- Task 3: create basic UI sidebar to show information about file content 

**Success Criteria:**
- ability to import LAZ file from UI and see its basic info displayed

### STEP #2: Point cloud visualization

**Components**
- `PointCloudData`
- `PointCloudRenderer`

**Tasks:**
- populate `PointCloudData` from parsed data
- render point clouds data using Instanced Points

**Success Criteria:**
- see point clouds appear 

### STEP #3: User interactivity
**Components:**
- `ControlPanel`
- `InfoPanel`

**Tasks:**
- allow selecting point from point cloud
- create `InfoPanel` shoing selected point infos 
- create `ControlPanel` allowing to filter points displayed in PointCloud from various criteria

**Success Criteria:**
- can select point from scene and show basic info
- can control point cloud rendering 

### Final Step 
***list remaining bugs, refactoring tasks, improvements, optimizations, required to complete current stage  ... here***

## Result & Comments
***provide screenshots and final comments here***