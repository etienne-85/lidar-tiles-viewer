import React from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Grid } from '@react-three/drei';

export const TerrainScene = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 20, 30], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Grid args={[100, 100]} />
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
};
