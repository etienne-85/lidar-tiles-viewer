import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';

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
    const targetDistance = useRef(20); // Target camera distance
  const isZooming = useRef(false);
  const zoomTimeout = useRef(null);
  
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
    
    const handleWheel = (e) => {
      // Detect zoom activity
      isZooming.current = true;
      
      // Clear existing timeout
      if (zoomTimeout.current) {
        clearTimeout(zoomTimeout.current);
      }
      
      // Set timeout to detect when zooming stops
      zoomTimeout.current = setTimeout(() => {
        isZooming.current = false;
      }, 200); // 200ms delay after last scroll event
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      if (zoomTimeout.current) {
        clearTimeout(zoomTimeout.current);
      }
    };
  }, []);
  
  useFrame((state, delta) => {
    if (!meshRef.current || !controlsRef.current) return;
    
    // Calculate movement relative to camera direction
    const speed = 20;
    
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
    
    // Adaptive camera distance control
    const currentDistance = controlsRef.current.distance;
    
    if (isZooming.current) {
      // User is zooming, update target distance to current distance
      targetDistance.current = currentDistance;
    } else {
      // User is not zooming, maintain target distance
      if (Math.abs(currentDistance - targetDistance.current) > 0.1) {
        controlsRef.current.distance = targetDistance.current;
      }
    }
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

function generatePatchTexture(gridX, gridZ) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background color based on patch coordinates
  const hue = ((gridX * 73 + gridZ * 37) % 360);
  ctx.fillStyle = `hsl(${hue}, 40%, 85%)`;
  ctx.fillRect(0, 0, 512, 512);

  // Grid lines (subdivisions matching 32x32 geometry)
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1;

  // Draw internal grid
  for (let i = 0; i <= 32; i++) {
    const pos = (i / 32) * 512;
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, 512);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(512, pos);
    ctx.stroke();
  }

  // Bold border lines
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 512, 512);

  // Patch coordinates text
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const coordText = `${gridX}:${gridZ}`;
  ctx.fillText(coordText, 256, 256);

  // Additional info text
  ctx.font = '16px Arial';
  ctx.fillText(`World: ${gridX * PATCH_SIZE}, ${gridZ * PATCH_SIZE}`, 256, 300);

  return new THREE.CanvasTexture(canvas);
}

function TerrainPatch({ patchId }) {
  const meshRef = useRef();

  // Derive position from patchId
  const [gridX, gridZ] = patchId.split(':').map(Number);
  const { worldX, worldZ } = gridToWorld(gridX, gridZ);
  const patchOrigin = new Vector3(worldX, 0, worldZ);

  // Generate texture for this patch
  const patchTexture = generatePatchTexture(gridX, gridZ);

  useEffect(() => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry;
    const vertices = geometry.attributes.position.array;

    // Apply height displacement
    for (let i = 0; i < vertices.length; i += 3) {
      const localX = vertices[i];
      const localY = vertices[i + 1];

      // Convert local coordinates to world coordinates
      const worldX = patchOrigin.x + localX;
      const worldZ = patchOrigin.z + localY;

      // Sine wave height function
      let height = Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3 +
        Math.sin(worldX * 0.05) * 2;
      height = Math.sin(worldZ * 0.05) * 10;
      vertices[i + 2] = Math.round(height*10)/10; // Z coordinate
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [patchId, patchOrigin]);

  return (
    <mesh ref={meshRef} position={patchOrigin} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PATCH_SIZE, PATCH_SIZE, 32, 32]} />
      <meshStandardMaterial map={patchTexture} wireframe={false} />
    </mesh>
  );
}

export const TerrainScene = () => {
  const [playerPosition, setPlayerPosition] = useState([0, 0, 0]);
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
}

export default function TerrainApp() {
  return <TerrainScene />;
}