import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { TERRAIN_HEIGHT } from '../common/constants';
interface PlayerProps {
  position: Vector3;
  onPositionChange: (position: Vector3) => void;
  isCameraTracking: boolean;
  onCameraTrackingChange: (tracking: boolean) => void;
}

export function Player({ position, onPositionChange, isCameraTracking, onCameraTrackingChange }: PlayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<CameraControls>(null);
  const keys = useRef({ KeyW: false, KeyA: false, KeyS: false, KeyD: false });
  const targetDistance = useRef(20); // Target camera distance
  const isZooming = useRef(false);
  const zoomTimeout = useRef<any>(null);
  const lastReportedPosition = useRef<Vector3>(position);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keys.current) {
        keys.current[e.code as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keys.current) {
        keys.current[e.code as keyof typeof keys.current] = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
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

  // Add camera control event listener
  useEffect(() => {
    if (!controlsRef.current) return;

    const handleControlChange = () => {
      const controls = controlsRef.current;
      if (!controls) return;

      // Check if user is dragging the camera (currentAction === 2)
      if (controls.currentAction === 2 && isCameraTracking) {
        onCameraTrackingChange(false);
      }
    };

    controlsRef.current.addEventListener('control', handleControlChange);

    return () => {
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('control', handleControlChange);
      }
    };
  }, [isCameraTracking, onCameraTrackingChange]);

  useFrame((state, delta) => {
    if (!meshRef.current || !controlsRef.current) return;

    const camControls = controlsRef.current

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

    const targetPos = position.clone().add(moveVector) 
    targetPos.y = TERRAIN_HEIGHT + 1

    // Only call onPositionChange if position changed significantly
    const threshold = 0.01; // Minimum movement threshold
    const lastPos = lastReportedPosition.current;

    if (targetPos.distanceTo(lastPos) > threshold) {
      onPositionChange(targetPos);
      lastReportedPosition.current = targetPos;
    }

    // Camera tracking: only follow player if tracking is enabled
    if (isCameraTracking) {
      camControls.moveTo(targetPos.x, targetPos.y, targetPos.z, true)
      camControls.setTarget(targetPos.x, targetPos.y, targetPos.z, true)
    }

    // Adaptive camera distance control
    const currentDistance = camControls.distance;

    if (isZooming.current) {
      // User is zooming, update target distance to current distance
      targetDistance.current = currentDistance;
    } else {
      // User is not zooming, maintain target distance
      if (Math.abs(currentDistance - targetDistance.current) > 0.1) {
        camControls.distance = targetDistance.current;
      }
    }
  });

  return (
    <>
      <CameraControls ref={controlsRef} />
      <mesh ref={meshRef} position={position}>
        <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>
    </>
  );
}