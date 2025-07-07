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
}

export const TerrainScene = ({ 
  playerPosition, 
  onPlayerPositionChange, 
  currentPatch,
  pointCloud 
}: TerrainSceneProps) => {
  // Calculate initial camera position from player position
  const initialCameraX = playerPosition[0];
  const initialCameraZ = playerPosition[2] + 30;

  // Optimized patch polling - only when currentPatch changes
  const visiblePatchIds = usePatchPolling(currentPatch, TILE_RANGE);
  
  return (
    <Canvas
      camera={{ position: [initialCameraX, 20, initialCameraZ], fov: 60 }}
      style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
    >
      <Player position={playerPosition} onPositionChange={onPlayerPositionChange} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Grid args={[100, 100]} />
      <axesHelper args={[5]} />
      
      {/* Terrain patches */}
      {visiblePatchIds.map(patchId => (
        <TerrainPatch key={patchId} patchId={patchId} />
      ))}
      
      {/* Point cloud rendering */}
      {pointCloud && <PointCloudRenderer pointCloud={pointCloud} />}
    </Canvas>
  );
};