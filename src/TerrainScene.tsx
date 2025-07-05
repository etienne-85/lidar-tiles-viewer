import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Player } from './Player';
import { TerrainPatch } from './TerrainPatch';
import { OverlayUI } from './UI/Overlay';
import { usePatchPolling } from './hooks/usePatchPolling';
import { calculateCurrentPatch, tileToWorldPosition } from './utils/grid';
import { TILE_RANGE, TILE_SIZE } from './utils/constants';

// Default start tile 
const TILE_COL = 0;
const TILE_ROW = 0;

export const TerrainScene = () => {
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

  // Update currentPatch when player moves
  useEffect(() => {
    const newPatch = calculateCurrentPatch(playerPosition);
    if (newPatch !== currentPatch) {
      setCurrentPatch(newPatch);
    }
  }, [playerPosition]);

  // Optimized patch polling - only when currentPatch changes
  const visiblePatchIds = usePatchPolling(currentPatch, TILE_RANGE);
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Canvas
        camera={{ position: [initialPlayerX, 20, initialPlayerZ + 30], fov: 60 }}
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

      {/* UI Overlay - positioned outside Canvas */}
      <OverlayUI
        playerPosition={playerPosition}
        currentPatch={currentPatch}
      />
    </div>
  );
};

export default function TerrainApp() {
  return <TerrainScene />;
}