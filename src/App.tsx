import { useState, useEffect } from 'react';
import { TerrainScene } from './TerrainScene';
import { OverlayUI } from './UI/Overlay';
import { calculateCurrentPatch, tileToWorldPosition } from './utils/grid';
import { TILE_COL, TILE_ROW, TILE_SIZE } from './utils/constants';
import { LidarPointCloud } from './data/LidarPointCloud';
import './App.css';

function App() {
  // Calculate initial world position from default tile coordinates
  const [patchCornerX, patchCornerZ] = tileToWorldPosition(TILE_COL, TILE_ROW);

  // Position player slightly inside the patch to avoid boundary issues
  const initialPlayerX = patchCornerX + TILE_SIZE / 2;
  const initialPlayerZ = patchCornerZ + TILE_SIZE / 2;

  // Global state management
  const [currentPatch, setCurrentPatch] = useState<string>(`${TILE_COL}:${TILE_ROW}`);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([
    initialPlayerX,
    0,
    initialPlayerZ
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pointCloud, setPointCloud] = useState<LidarPointCloud | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <TerrainScene 
        playerPosition={playerPosition} 
        onPlayerPositionChange={setPlayerPosition}
        currentPatch={currentPatch}
        pointCloud={pointCloud}
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
      />
    </div>
  );
}

export default App;