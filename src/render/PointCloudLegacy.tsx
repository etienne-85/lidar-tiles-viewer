import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { BufferGeometry, BufferAttribute, Color, Vector3, Points } from 'three';
import { LidarPointCloud } from '../data/LidarPointCloud';
import { EntityType } from '../common/types';
import { useThree, useFrame, extend } from '@react-three/fiber';
import { calculateGroupPosition, calculateGroupScale } from '../utils/proj';

interface PointCloudProps {
  pointCloud: LidarPointCloud;
  selectedItem: { type: EntityType; coords: { x: number; y: number; z: number } } | null;
  setSelectedItem: (item: { type: EntityType; coords: { x: number; y: number; z: number } } | null) => void;
}

const SCALE_METERS_TO_SCENE_UNITS = 0.1;

import { memo } from 'react';

export const PointCloudLegacy: React.FC<PointCloudProps> = memo(({
  pointCloud,
  selectedItem,
  setSelectedItem
}) => {
  console.log("PointCloud render")
  const pointsRef = useRef<Points>(null);
  const { raycaster, camera, gl } = useThree();

  const originalColors = useRef<Float32Array | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (raycaster.params.Points) {
      raycaster.params.Points.threshold = 0.1; // Experiment with 0.005, 0.01, 0.05, 0.1
      console.log('Raycaster Points threshold set to:', raycaster.params.Points.threshold);
    }
  }, [raycaster]);

  const { geometry, groupPosition } = useMemo(() => {
    console.log("PointCloud debug")
    const positions = pointCloud.getPoints();
    const classifications = pointCloud.getClassifications();
    const metadata = pointCloud.getMetadata();

    console.log('PointCloud - Point count:', positions.length / 3);
    console.log('PointCloud - First 10 relative positions (in meters, reprojected):', positions.slice(0, 30));
    console.log('PointCloud - Original LiDAR Bounds:', metadata.originalBounds);
    console.log('PointCloud - Reprojected LiDAR Bounds (in target CRS meters):', metadata.targetBounds);

    const groupPosition = calculateGroupPosition(pointCloud);
    console.log('PointCloud - Calculated Scene Group Position (Three.js units):', groupPosition);

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));

    const colorArray = new Float32Array(positions.length);
    const color = new Color();
    for (let i = 0; i < classifications.length; i++) {
      const classification = classifications[i];
      switch (classification) {
        case 1: color.setHex(0x808080); break; case 2: color.setHex(0x8B4513); break;
        case 3: color.setHex(0x90EE90); break; case 4: color.setHex(0x32CD32); break;
        case 5: color.setHex(0x228B22); break; case 6: color.setHex(0xFF4500); break;
        case 7: color.setHex(0x800080); break; case 9: color.setHex(0x0000FF); break;
        case 10: color.setHex(0x000000); break; case 11: color.setHex(0x696969); break;
        case 12: color.setHex(0xFFFFFF); break; case 13: color.setHex(0xFFD700); break;
        case 14: color.setHex(0xFFA500); break; case 15: color.setHex(0x8B0000); break;
        case 16: color.setHex(0xDC143C); break; case 17: color.setHex(0x4B0082); break;
        case 18: color.setHex(0xFF1493); break; default: color.setHex(0x404040); break;
      }
      color.setHex(0xFFFFFF);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new BufferAttribute(colorArray, 3));

    originalColors.current = new Float32Array(colorArray);

    return { geometry, groupPosition };
  }, [pointCloud]);

  const onClick = useCallback((event: any) => {
    console.log("PointCloud onClick callback")
    if (!pointsRef.current) return;

    // ** CRITICAL CHANGE: Be more explicit with intersections **
    // Get the array of all intersected objects/points
    const intersections = event.intersections;

    // Filter for the closest intersection that is *actually* our points object
    const closestIntersection = intersections.find(
      (intersect: any) => intersect.object === pointsRef.current && typeof intersect.index === 'number'
    );

    if (closestIntersection) {
      const index = closestIntersection.index;
      const positions = pointCloud.getPoints();
      const x = positions[index * 3];
      const y = positions[index * 3 + 1];
      const z = positions[index * 3 + 2];

      console.log('Clicked point original relative coords (meters):', { x, y, z }, 'Index:', index);
      console.log('Intersection distance:', closestIntersection.distance); // Useful for debugging distance
      setSelectedItem({ type: EntityType.Point, coords: { x, y, z } });
    } else {
      // If no valid point on *this* specific Points object was hit
      console.log('No point on this PointCloud component was hit, or intersection was invalid.');
      setSelectedItem(null);
    }
    // Crucial to stop propagation to prevent other R3F objects or the canvas from also reacting
    event.stopPropagation();
  }, [pointCloud, setSelectedItem]);

  const groupScale = useMemo(() => calculateGroupScale(), []);

  useEffect(() => {
    console.log("PointCloud debug")
  }, [selectedItem])

  if (selectedItem) {
    console.log(selectedItem)
    if (!pointsRef.current || !originalColors.current) return;

    const geom = pointsRef.current.geometry as BufferGeometry;
    const colorAttr = geom.getAttribute('color') as BufferAttribute;
    if (!colorAttr) return;

    let newSelectedIndex: number | null = null;

    if (selectedItem && selectedItem.type === EntityType.Point) {
      const positions = pointCloud.getPoints();
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        if (
          Math.abs(x - selectedItem.coords.x) < 1e-6 &&
          Math.abs(y - selectedItem.coords.y) < 1e-6 &&
          Math.abs(z - selectedItem.coords.z) < 1e-6
        ) {
          newSelectedIndex = i / 3;
          break;
        }
      }
    }

    if (newSelectedIndex !== lastSelectedIndex) {
      if (lastSelectedIndex !== null && originalColors.current) {
        colorAttr.setX(lastSelectedIndex, originalColors.current[lastSelectedIndex * 3]);
        colorAttr.setY(lastSelectedIndex, originalColors.current[lastSelectedIndex * 3 + 1]);
        colorAttr.setZ(lastSelectedIndex, originalColors.current[lastSelectedIndex * 3 + 2]);
      }

      if (newSelectedIndex !== null) {
        colorAttr.setX(newSelectedIndex, 1);
        colorAttr.setY(newSelectedIndex, 0);
        colorAttr.setZ(newSelectedIndex, 0);
      }

      colorAttr.needsUpdate = true;
      setLastSelectedIndex(newSelectedIndex);
    }
  }

  return (
    <group position={groupPosition} scale={groupScale}>
      <points
        ref={pointsRef}
        geometry={geometry}
        onClick={onClick}
      >
        <pointsMaterial
          vertexColors={true}
          size={0.2} // Adjust if points are too small to click
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
}, () => {
  // TEMPORARY: Force no re-renders to test memoization
  console.log('PointCloud memo comparison - forcing no update');
  return false;
});
