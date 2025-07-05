import { useEffect, useMemo, useRef, useState } from 'react';
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

// useVerticalOrbitPreservation Hook
function useVerticalOrbitPreservation(enabled, controlsRef, isMoving, isUserOrbiting, isZooming) {
  const preservedSpherical = useRef({ azimuth: 0, elevation: 0, distance: 20 });
  
  const updatePreservedCoordinates = (state) => {
    if (!controlsRef.current) return;
    
    const camera = state.camera;
    const target = controlsRef.current.getTarget(new THREE.Vector3());
    const cameraToTarget = new THREE.Vector3().subVectors(camera.position, target);
    
    // Calculate spherical coordinates
    const distance = cameraToTarget.length();
    const azimuth = Math.atan2(cameraToTarget.x, cameraToTarget.z);
    const elevation = Math.asin(cameraToTarget.y / distance);
    
    if (isUserOrbiting.current && isMoving) {
      // When orbiting while moving, only update angles, not distance
      preservedSpherical.current.azimuth = azimuth;
      preservedSpherical.current.elevation = elevation;
    } else {
      // When not moving or orbiting while stationary, update all coordinates
      preservedSpherical.current = { azimuth, elevation, distance };
    }
  };
  
  const getCameraPosition = (targetPos) => {
    const { azimuth, elevation, distance } = preservedSpherical.current;
    
    // Convert spherical to cartesian coordinates
    const x = distance * Math.sin(azimuth) * Math.cos(elevation);
    const y = distance * Math.sin(elevation);
    const z = distance * Math.cos(azimuth) * Math.cos(elevation);
    
    return new THREE.Vector3(
      targetPos.x + x,
      targetPos.y + y,
      targetPos.z + z
    );
  };
  
  const updateDistance = (currentDistance) => {
    if (isZooming.current) {
      // User is zooming, update preserved distance to current distance
      preservedSpherical.current.distance = currentDistance;
    } else {
      // User is not zooming, maintain preserved distance
      if (Math.abs(currentDistance - preservedSpherical.current.distance) > 0.1) {
        controlsRef.current.distance = preservedSpherical.current.distance;
      }
    }
  };
  
  return {
    enabled,
    updatePreservedCoordinates,
    getCameraPosition,
    updateDistance
  };
}

function Player({ position, onPositionChange }) {
  const meshRef = useRef();
  const controlsRef = useRef();
  const keys = useRef({ KeyW: false, KeyA: false, KeyS: false, KeyD: false });
  const isZooming = useRef(false);
  const zoomTimeout = useRef(null);
  const isUserOrbiting = useRef(false);
  const targetDistance = useRef(20); // Fallback distance tracking for original behavior
  
  // Toggle for vertical orbit preservation (set to false to restore original behavior)
  const PRESERVE_VERTICAL_ORBIT = true;
  
  const verticalOrbitPreservation = useVerticalOrbitPreservation(
    PRESERVE_VERTICAL_ORBIT,
    controlsRef,
    keys.current.KeyW || keys.current.KeyA || keys.current.KeyS || keys.current.KeyD,
    isUserOrbiting,
    isZooming
  );
  
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
    
    const handleMouseDown = () => {
      isUserOrbiting.current = true;
    };
    
    const handleMouseUp = () => {
      isUserOrbiting.current = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (zoomTimeout.current) {
        clearTimeout(zoomTimeout.current);
      }
    };
  }, []);
  
  useFrame((state, delta) => {
    if (!meshRef.current || !controlsRef.current) return;
    
    // Store current spherical coordinates when user is not moving
    const isMoving = keys.current.KeyW || keys.current.KeyA || keys.current.KeyS || keys.current.KeyD;
    
    // Update preserved coordinates if vertical orbit preservation is enabled
    if (verticalOrbitPreservation.enabled && (!isMoving || isUserOrbiting.current)) {
      verticalOrbitPreservation.updatePreservedCoordinates(state);
    }
    
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
    
    // Update camera position
    if (isMoving && !isUserOrbiting.current) {
      const targetPos = new THREE.Vector3(newPosition[0], newPosition[1], newPosition[2]);
      
      if (verticalOrbitPreservation.enabled) {
        // Use vertical orbit preservation
        const newCameraPos = verticalOrbitPreservation.getCameraPosition(targetPos);
        
        controlsRef.current.setLookAt(
          newCameraPos.x, newCameraPos.y, newCameraPos.z,
          targetPos.x, targetPos.y, targetPos.z,
          true
        );
      } else {
        // Original behavior: just follow target
        controlsRef.current.setTarget(targetPos.x, targetPos.y, targetPos.z, true);
      }
    } else {
      // When not moving, use normal target following
      controlsRef.current.setTarget(newPosition[0], newPosition[1], newPosition[2], true);
    }
    
    // Distance control
    const currentDistance = controlsRef.current.distance;
    
    if (verticalOrbitPreservation.enabled) {
      // Use vertical orbit preservation distance control
      verticalOrbitPreservation.updateDistance(currentDistance);
    } else {
      // Original distance control behavior
      if (isZooming.current) {
        targetDistance.current = currentDistance;
      } else {
        if (Math.abs(currentDistance - targetDistance.current) > 0.1) {
          controlsRef.current.distance = targetDistance.current;
        }
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
  // Derive position from patchId
  const [gridX, gridZ] = patchId.split(':').map(Number);
  const { worldX, worldZ } = gridToWorld(gridX, gridZ);

  // Generate texture for this patch
  const patchTexture = generatePatchTexture(gridX, gridZ);

  // Create custom BufferGeometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const segments = 32;
    const vertexCount = (segments + 1) * (segments + 1);
    
    // Arrays for geometry attributes
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = [];

    // Generate vertices
    let vertexIndex = 0;
    for (let z = 0; z <= segments; z++) {
      for (let x = 0; x <= segments; x++) {
        // Calculate world coordinates
        const worldPosX = worldX + (x / segments) * PATCH_SIZE - PATCH_SIZE / 2;
        const worldPosZ = worldZ + (z / segments) * PATCH_SIZE - PATCH_SIZE / 2;
        
        // Calculate height at this world position
        const height = getTerrainHeight(worldPosX, worldPosZ)
        
        // Set position (X, Y, Z) - Y is up
        positions[vertexIndex * 3] = worldPosX;
        positions[vertexIndex * 3 + 1] = height;
        positions[vertexIndex * 3 + 2] = worldPosZ;
        
        // Set UVs
        uvs[vertexIndex * 2] = x / segments;
        // FIX: to match triangles rewinding order 
        uvs[vertexIndex * 2 + 1] = 1 - (z / segments)
        
        vertexIndex++;
      }
    }

    // Generate indices for triangles
    for (let z = 0; z < segments; z++) {
      for (let x = 0; x < segments; x++) {
        const a = z * (segments + 1) + x;
        const b = z * (segments + 1) + x + 1;
        const c = (z + 1) * (segments + 1) + x;
        const d = (z + 1) * (segments + 1) + x + 1;

        // Two triangles per quad (correct winding for upward faces)
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    // Set geometry attributes
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
    // Calculate normals
    geo.computeVertexNormals();
    
    return geo;
  }, [patchId, worldX, worldZ]);

  return (
    <mesh position={[0, 0, 0]} geometry={geometry}>
      <meshStandardMaterial map={patchTexture} wireframe={false} side={THREE.DoubleSide} />
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