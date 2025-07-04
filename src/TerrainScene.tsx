import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Grid System Constants and Utilities
const PATCH_SIZE = 64;

function worldToGrid(worldX, worldZ) {
  return {
    gridX: Math.floor(worldX / PATCH_SIZE),
    gridZ: Math.floor(worldZ / PATCH_SIZE)
  };
}

function gridToWorld(gridX, gridZ) {
  return {
    worldX: gridX * PATCH_SIZE,
    worldZ: gridZ * PATCH_SIZE
  };
}

function calculateVisiblePatches(playerPosition, tileRange) {
  const { gridX, gridZ } = worldToGrid(playerPosition[0], playerPosition[2]);
  const visiblePatches = [];
  
  for (let x = gridX - tileRange; x <= gridX + tileRange; x++) {
    for (let z = gridZ - tileRange; z <= gridZ + tileRange; z++) {
      visiblePatches.push(`${x}:${z}`);
    }
  }
  
  return visiblePatches;
}

// usePatchPolling Hook
function usePatchPolling(playerPosition, tileRange) {
  return calculateVisiblePatches(playerPosition, tileRange);
}

function Player({ position, onPositionChange }) {
  const meshRef = useRef();
  const controlsRef = useRef();
  const keys = useRef({ KeyW: false, KeyA: false, KeyS: false, KeyD: false });
  const velocity = useRef([0, 0]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code in keys.current) {
        keys.current[e.code] = true;
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code in keys.current) {
        keys.current[e.code] = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useFrame((state, delta) => {
    if (!meshRef.current || !controlsRef.current) return;
    
    // Calculate movement relative to camera direction
    const speed = 10;
    let moveX = 0;
    let moveZ = 0;
    
    // Get camera direction (normalized)
    const camera = state.camera;
    const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
    const cameraRight = new THREE.Vector3().crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
    
    // Calculate movement vectors
    const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
    const right = new THREE.Vector3(cameraRight.x, 0, cameraRight.z).normalize();
    
    let moveVector = new THREE.Vector3(0, 0, 0);
    
    if (keys.current.KeyW) moveVector.add(forward);
    if (keys.current.KeyS) moveVector.sub(forward);
    if (keys.current.KeyA) moveVector.sub(right);
    if (keys.current.KeyD) moveVector.add(right);
    
    // Normalize and apply speed
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(speed * delta);
    }
    
    const newX = position[0] + moveVector.x;
    const newZ = position[2] + moveVector.z;
    
    // Get terrain height at new position
    const height = getTerrainHeight(newX, newZ);
    
    const newPosition = [newX, height + 1, newZ];
    onPositionChange(newPosition);
    
    // Camera always follows player position as target
    controlsRef.current.setTarget(newPosition[0], newPosition[1], newPosition[2], true);
  });
  
  return (
    <>
      <CameraControls ref={controlsRef} />
      <mesh ref={meshRef} position={position}>
        <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>
    </>
  );
}

function getTerrainHeight(x, z) {
  // Match the terrain height function from TerrainPatch
  return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 + 
         Math.sin(x * 0.05) * 2;
}

function TerrainPatch({ patchId }) {
  const meshRef = useRef();
  
  // Derive position from patchId
  const [gridX, gridZ] = patchId.split(':').map(Number);
  const { worldX, worldZ } = gridToWorld(gridX, gridZ);
  const position = [worldX, 0, worldZ];
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const geometry = meshRef.current.geometry;
    const vertices = geometry.attributes.position.array;
    
    // Apply height displacement
    for (let i = 0; i < vertices.length; i += 3) {
      const localX = vertices[i];
      const localY = vertices[i + 1];
      
      // Convert local coordinates to world coordinates
      const worldX = position[0] + localX;
      const worldZ = position[2] + localY;
      
      // Sine wave height function
      const height = Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3 + 
                    Math.sin(worldX * 0.05) * 2;
      
      vertices[i + 2] = height; // Z coordinate
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [patchId, position]);
  
  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PATCH_SIZE, PATCH_SIZE, 32, 32]} />
      <meshStandardMaterial color="#4a7c59" wireframe={false} />
    </mesh>
  );
}

export const TerrainScene = ()=> {
  const [playerPosition, setPlayerPosition] = useState([0, 0, 0]);
  const tileRange = 2; // Show patches 2 tiles around player
  
  const visiblePatchIds = usePatchPolling(playerPosition, tileRange);
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Canvas
        camera={{ position: [0, 20, 30], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
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
}

export default function TerrainApp() {
  return <TerrainScene />;
}