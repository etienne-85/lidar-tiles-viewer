import React, { useState, useEffect } from 'react';
import { SidebarOverlay } from './SidebarOverlay';
import { ControlPanel } from './ControlPanel';
import { LidarPointCloud } from '../data/LidarPointCloud';
import { StatusBar } from './StatusBar';

interface OverlayUIProps {
  playerPosition: [number, number, number];
  currentPatch: string;
  onFileLoaded: (file: File) => void;
  onFileError: (error: string) => void;
  selectedFile: File | null;
  fileError: string | null;
  pointCloud: LidarPointCloud | null;
  isProcessingFile: boolean;
  isCameraTracking: boolean;
  onRestoreTracking: () => void;
  cameraProjection: 'perspective' | 'orthographic';
  onCameraProjectionChange: (projection: 'perspective' | 'orthographic') => void;
  terrainTransparency: number;
  onTerrainTransparencyChange: (transparency: number) => void;
  isTileSelectionActive: boolean;
  onTileSelectionChange: (active: boolean) => void;
  hoveredTileId: string | null;
}

export const OverlayUI: React.FC<OverlayUIProps> = ({
  playerPosition,
  currentPatch,
  onFileLoaded,
  onFileError,
  selectedFile,
  fileError,
  pointCloud,
  isProcessingFile,
  isCameraTracking,
  onRestoreTracking,
  cameraProjection,
  onCameraProjectionChange,
  terrainTransparency,
  onTerrainTransparencyChange,
  isTileSelectionActive,
  onTileSelectionChange,
  hoveredTileId
}) => {
const [isVisible, setIsVisible] = useState(true);

  // Toggle visibility with 'U' key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'u') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <SidebarOverlay
        onFileLoaded={onFileLoaded}
        onFileError={onFileError}
        selectedFile={selectedFile}
        fileError={fileError}
        pointCloud={pointCloud}
        isProcessingFile={isProcessingFile}
      />

        <ControlPanel
          isCameraTracking={isCameraTracking}
          onRestoreTracking={onRestoreTracking}
          cameraProjection={cameraProjection}
          onCameraProjectionChange={onCameraProjectionChange}
          terrainTransparency={terrainTransparency}
          onTerrainTransparencyChange={onTerrainTransparencyChange}
          isTileSelectionActive={isTileSelectionActive}
          onTileSelectionChange={onTileSelectionChange}
          hoveredTileId={hoveredTileId}
        />
      <StatusBar
        playerPosition={playerPosition}
        currentPatch={currentPatch}
        highlightedTileId={hoveredTileId}
      />
    </>
  );
};