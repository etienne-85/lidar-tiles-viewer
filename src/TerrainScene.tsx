import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Player } from './Player';
import { TerrainPatch } from './TerrainPatch';
import { usePatchPolling } from './hooks/usePatchPolling';
import { useImageryTiles } from './hooks/useImageryTiles';
import { calculateCurrentPatch, tileToWorldPosition } from './utils/grid';

// Default tile coordinates
const TILECOL = 0;
const TILEROW = 0;
// Number of patches showed around player
const TILERANGE = 2; 

export const TerrainScene = () => {
  // Calculate initial world position from default tile coordinates
  const [initialWorldX, initialWorldZ] = tileToWorldPosition(TILECOL, TILEROW);
  
  // Global state management
  const [currentPatch, setCurrentPatch] = useState<string>(`${TILECOL}:${TILEROW}`);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([
    initialWorldX, 
    0, 
    initialWorldZ
  ]);

  // Update currentPatch when player moves
  useEffect(() => {
    const newPatch = calculateCurrentPatch(playerPosition);
    if (newPatch !== currentPatch) {
      setCurrentPatch(newPatch);
    }
  }, [playerPosition, currentPatch]);

  // Optimized patch polling - only when currentPatch changes
  const visiblePatchIds = usePatchPolling(currentPatch, TILERANGE);

  // TEMPORARY: Test tile fetching alongside existing system
  const testTileTexture = useImageryTiles(currentPatch);

  // Monitor network activity as player moves
  useEffect(() => {
    console.log('Fetching tile for patch:', currentPatch);
  }, [currentPatch]);

  // Log when texture loads
  useEffect(() => {
    if (testTileTexture) {
      console.log('Tile texture loaded for patch:', currentPatch);
    }
  }, [testTileTexture, currentPatch]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Canvas
        camera={{ position: [initialWorldX, 20, initialWorldZ + 30], fov: 60 }}
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
      >
        <Player position={playerPosition} onPositionChange={setPlayerPosition} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Grid args={[100, 100]} />
        <axesHelper args={[5]} />
        {visiblePatchIds.map(patchId => (
          <TerrainPatch key={patchId} patchId={patchId} />
        ))}
      </Canvas>
    </div>
  );
};

export default function TerrainApp() {
  return <TerrainScene />;
}