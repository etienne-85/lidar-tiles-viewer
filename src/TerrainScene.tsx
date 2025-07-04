import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Grid } from '@react-three/drei';

function TerrainPatch({ patchId, position, size }) {
  const meshRef = useRef();
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const geometry = meshRef.current.geometry;
    const vertices = geometry.attributes.position.array;
    
    // Apply height displacement
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      
      // Sine wave height function
      const height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3 + 
                    Math.sin(x * 0.05) * 2;
      
      vertices[i + 2] = height; // Z coordinate
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, []);
  
  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size, 32, 32]} />
      <meshStandardMaterial color="#4a7c59" wireframe={false} />
    </mesh>
  );
}

export const TerrainScene = ()=> {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Canvas
        camera={{ position: [0, 20, 30], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Grid args={[100, 100]} />
        <axesHelper args={[5]} />
        <TerrainPatch 
          patchId="patch-0-0" 
          position={[0, 0, 0]} 
          size={20} 
        />
      </Canvas>
    </div>
  );
}

export default function TerrainApp() {
  return <TerrainScene />;
}