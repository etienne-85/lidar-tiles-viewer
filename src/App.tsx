import { useState, useEffect, useCallback } from 'react';
import { Vector3 } from 'three';
import { TerrainScene } from './TerrainScene';
import { OverlayUI } from './UI/Overlay';
import { calculateCurrentPatch, tileToWorldPosition } from './utils/grid';
import { TILE_COL, TILE_ROW, PATCH_SIZE } from './common/constants';
import { LidarPointCloud } from './data/LidarPointCloud';
import './App.css';
import { EntityType } from './common/types';

function App() {
  // Calculate initial world position from default tile coordinates
  const { x: patchCornerX, y: patchCornerZ } = tileToWorldPosition(TILE_COL, TILE_ROW);

  // Position player slightly inside the patch to avoid boundary issues
  const playerPos = new Vector3(patchCornerX + PATCH_SIZE / 2, 0, patchCornerZ + PATCH_SIZE / 2)

  // Global state management
  const [currentPatch, setCurrentPatch] = useState<string>(`${TILE_COL}:${TILE_ROW}`);
  const [playerPosition, setPlayerPosition] = useState<Vector3>(playerPos);
  const [isCameraTracking, setIsCameraTracking] = useState(true);
  const [cameraProjection, setCameraProjection] = useState<'perspective' | 'orthographic'>('perspective');
const [terrainTransparency, setTerrainTransparency] = useState<number>(1.0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pointCloud, setPointCloud] = useState<LidarPointCloud | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // Tile selection tool state
  const [isTileSelectionActive, setIsTileSelectionActive] = useState(false);
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<
    | { type: EntityType; coords: { x: number; y: number; z: number } }
    | null
  >(null);

  // Update currentPatch when player moves
  useEffect(() => {
    const newPatch = calculateCurrentPatch(playerPosition);
    if (newPatch !== currentPatch) {
      setCurrentPatch(newPatch);
    }
  }, [playerPosition]);

  // Process file with LidarPointCloud when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      setIsProcessingFile(true);
      setFileError(null);
      
      console.log('Processing file:', selectedFile.name);
      
      LidarPointCloud.fromLAZFile(selectedFile)
        .then(loadedPointCloud => {
          setPointCloud(loadedPointCloud);
          setIsProcessingFile(false);
          console.log('Point cloud loaded successfully:', loadedPointCloud.getMetadata());
        })
        .catch(error => {
          console.error('Failed to load point cloud:', error);
          handleFileError(error.message);
          setIsProcessingFile(false);
          setPointCloud(null);
        });
    } else {
      setPointCloud(null);
      setIsProcessingFile(false);
    }
  }, [selectedFile]);

  const handleFileLoaded = (file: File) => {
    setSelectedFile(file);
    setFileError(null);
    console.log('File loaded:', file.name, file.size);
  };

  const handleFileError = (error: string) => {
    setFileError(error);
    setSelectedFile(null);
    setPointCloud(null);
    setIsProcessingFile(false);
    console.error('File error:', error);
  };

  const handleRestoreTracking = () => {
    setIsCameraTracking(true);
  };

  // Memoize handleTileHover to prevent unnecessary rerenders
  const handleTileHover = useCallback((tileId: string | null) => {
    if (isTileSelectionActive) {
      setHoveredTileId(tileId);
    }
  }, [isTileSelectionActive]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <TerrainScene 
        playerPos={playerPosition} 
        onPlayerPosChange={setPlayerPosition}
        currentPatch={currentPatch}
        pointCloud={pointCloud}
        isCameraTracking={isCameraTracking}
        onCameraTrackingChange={setIsCameraTracking}
        cameraProjection={cameraProjection}
        terrainTransparency={terrainTransparency}
        isTileSelectionActive={isTileSelectionActive}
        hoveredTileId={hoveredTileId}
        onTileHover={handleTileHover}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
      />
      
      <OverlayUI
        playerPosition={playerPosition}
        currentPatch={currentPatch}
        onFileLoaded={handleFileLoaded}
        onFileError={handleFileError}
        selectedFile={selectedFile}
        fileError={fileError}
        pointCloud={pointCloud}
        isProcessingFile={isProcessingFile}
        isCameraTracking={isCameraTracking}
        onRestoreTracking={handleRestoreTracking}
        cameraProjection={cameraProjection}
        onCameraProjectionChange={setCameraProjection}
        terrainTransparency={terrainTransparency}
        onTerrainTransparencyChange={setTerrainTransparency}
        isTileSelectionActive={isTileSelectionActive}
        onTileSelectionChange={setIsTileSelectionActive}
        hoveredTileId={hoveredTileId}
        selectedItem={selectedItem}
      />
    </div>
  );
}

export default App;
