import React, { useState, useEffect } from 'react';
import { TextOverlay } from './TextOverlay';
import { SidebarOverlay } from './SidebarOverlay';
import { ControlPanel } from './ControlPanel';
import { LidarPointCloud } from '../data/LidarPointCloud';

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
  onCameraProjectionChange
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
      <TextOverlay 
        playerPosition={playerPosition}
        currentPatch={currentPatch}
      />
      
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
      />
    </>
  );
};