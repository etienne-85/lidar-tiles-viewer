import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Player } from './Player';
import { TerrainPatch } from './TerrainPatch';
import { usePatchPolling } from './hooks/usePatchPolling';
import { tileToWorldPosition } from './utils/grid';
import { TILE_RANGE, TILE_SIZE } from './utils/constants';

interface TerrainSceneProps {
  playerPosition: [number, number, number];
  onPlayerPositionChange: (position: [number, number, number]) => void;
  currentPatch: string;
}

export const TerrainScene = ({ playerPosition, onPlayerPositionChange, currentPatch }: TerrainSceneProps) => {
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
      {visiblePatchIds.map(patchId => (
        <TerrainPatch key={patchId} patchId={patchId} />
      ))}
    </Canvas>
  );
};