import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Player } from './Player';
import { TerrainPatch } from './TerrainPatch';
import { PointCloudRenderer } from './render/PointCloudRenderer';
import { usePatchPolling } from './hooks/usePatchPolling';

import { TILE_RANGE } from './utils/constants';
import { LidarPointCloud } from './data/LidarPointCloud';

interface TerrainSceneProps {
  playerPosition: [number, number, number];
  onPlayerPositionChange: (position: [number, number, number]) => void;
  currentPatch: string;
  pointCloud?: LidarPointCloud | null;
  isCameraTracking: boolean;
  onCameraTrackingChange: (tracking: boolean) => void;
  cameraProjection: 'perspective' | 'orthographic';
  terrainTransparency: number;
  isTileSelectionActive: boolean;
  hoveredTileId: string | null;
  onTileHover: (tileId: string | null) => void;
}

export const TerrainScene = ({ 
  playerPosition, 
  onPlayerPositionChange, 
  currentPatch,
  pointCloud,
  isCameraTracking,
  onCameraTrackingChange,
  cameraProjection,
  terrainTransparency,
  isTileSelectionActive,
  hoveredTileId,
  onTileHover
}: TerrainSceneProps) => {
  // Calculate initial camera position from player position
  const initialCameraX = playerPosition[0];
  const initialCameraZ = playerPosition[2] + 30;

  // Optimized patch polling - only when currentPatch changes
  const visiblePatchIds = usePatchPolling(currentPatch, TILE_RANGE);
  
  // Configure camera based on projection type
  const cameraConfig = cameraProjection === 'perspective' 
    ? { 
        position: [initialCameraX, 20, initialCameraZ] as [number, number, number],
        fov: 60,
        near: 0.1,
        far: 4000
      }
    : { 
        position: [initialCameraX, 20, initialCameraZ] as [number, number, number],
        zoom: 1,
        left: -50,
        right: 50,
        top: 50,
        bottom: -50,
        near: 0.1,
        far: 4000
      };
  
  return (
    <Canvas
      key={cameraProjection} // Force remount when camera projection changes
      orthographic={cameraProjection === 'orthographic'}
      camera={cameraConfig}
      style={{ width: '100%', height: '100%', backgroundColor: 'black' }}
    >
      <Player 
        position={playerPosition} 
        onPositionChange={onPlayerPositionChange}
        isCameraTracking={isCameraTracking}
        onCameraTrackingChange={onCameraTrackingChange}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Grid args={[100, 100]} />
      <axesHelper args={[5]} />
      
      {/* Terrain patches */}
      {visiblePatchIds.map(patchId => (
        <TerrainPatch 
          key={patchId} 
          patchId={patchId} 
          transparency={terrainTransparency}
          isTileSelectionActive={isTileSelectionActive}
          isHighlighted={hoveredTileId === patchId}
          onTileHover={onTileHover}
        />
      ))}
      
      {/* Point cloud rendering */}
      {pointCloud && <PointCloudRenderer pointCloud={pointCloud} />}
    </Canvas>
  );
};