import { BufferGeometry, BufferAttribute } from 'three';
import { memo, useMemo } from 'react';
import { LidarPointCloud } from '../data/LidarPointCloud';
import { calculateGroupPosition, calculateGroupScale } from '../utils/proj';

interface PointCloudProps {
  pointCloud: LidarPointCloud;
}


export const PointCloud = memo(({ pointCloud }: PointCloudProps) => {
  console.log("PointCloud component rerendered");

  const groupPosition = useMemo(() => calculateGroupPosition(pointCloud), [pointCloud]);
  const groupScale = useMemo(() => calculateGroupScale(), []);
// 17177302, y: 122.51, z: 11634395

  console.log("PointCloud - Group Position:", groupPosition);
  console.log("PointCloud - Group Scale:", groupScale);

  const geometry = new BufferGeometry();
  const positions = pointCloud.getPoints();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  return (
    <group position={groupPosition} scale={groupScale}>
      <points geometry={geometry}>
        <pointsMaterial color="white" size={0.1} />
      </points>
    </group>
  );
}, (prevProps, nextProps) => {
  return prevProps.pointCloud === nextProps.pointCloud;
});
