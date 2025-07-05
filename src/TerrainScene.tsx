import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Player } from './Player';
import { TerrainPatch } from './TerrainPatch';
import { usePatchPolling } from './hooks/usePatchPolling';

export const TerrainScene = () => {
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 0, 0]);
  const tileRange = 2; // Show patches 2 tiles around player

  const visiblePatchIds = usePatchPolling(playerPosition, tileRange);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Canvas
        camera={{ position: [0, 20, 30], fov: 60 }}
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