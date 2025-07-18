import { Canvas, type CameraProps } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import type { Vector3 } from 'three';
import { Player } from './render/Player';
import { TerrainPatch } from './render/TerrainPatch';
import { usePatchPolling } from './hooks/usePatchPolling';
import { LidarPointCloud } from './data/LidarPointCloud';
import { PointCloud } from './render/PointCloud';
import { EntityType } from './common/types';
import { TILE_RANGE } from './common/constants';

interface TerrainSceneProps {
  playerPos: Vector3;
  onPlayerPosChange: (position: Vector3) => void;
  currentPatch: string;
  pointCloud?: LidarPointCloud | null;
  isCameraTracking: boolean;
  onCameraTrackingChange: (tracking: boolean) => void;
  cameraProjection: 'perspective' | 'orthographic';
  terrainTransparency: number;
  isTileSelectionActive: boolean;
  hoveredTileId: string | null;
  onTileHover: (tileId: string | null) => void;
  selectedItem: { type: EntityType; coords: { x: number; y: number; z: number } } | null;
  setSelectedItem: (item: { type: EntityType; coords: { x: number; y: number; z: number } } | null) => void;
}

export const TerrainScene = ({
  playerPos,
  onPlayerPosChange,
  currentPatch,
  pointCloud,
  isCameraTracking,
  onCameraTrackingChange,
  cameraProjection,
  terrainTransparency,
  isTileSelectionActive,
  hoveredTileId,
  onTileHover,
  selectedItem,
  setSelectedItem
}: TerrainSceneProps) => {
  // Calculate initial camera position from player position
  const camPos = playerPos.clone()
  camPos.y = 20
  camPos.z += 30

  // Optimized patch polling - only when currentPatch changes
  const visiblePatchIds = usePatchPolling(currentPatch, TILE_RANGE);

  // Configure camera based on projection type
  const camConf: CameraProps = cameraProjection === 'perspective' ? {
    position: camPos,
    near: 0.1,
    far: 4000,
    fov: 60,
  } : {
    position: camPos,
    near: 0.1,
    far: 4000,
    zoom: 1,
    left: -50,
    right: 50,
    top: 50,
    bottom: -50
  }

  return (
    <Canvas
      key={cameraProjection} // Force remount when camera projection changes
      orthographic={cameraProjection === 'orthographic'}
      camera={camConf}
      style={{ width: '100%', height: '100%', backgroundColor: 'black' }}
      onPointerMissed={() => setSelectedItem(null)}
    >

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Grid args={[100, 100]} />
      <axesHelper args={[5]} />

      {/* Terrain patches */}
      {visiblePatchIds.map(patchId => (
        <TerrainPatch
          key={patchId}
          patchId={patchId}
          transparency={terrainTransparency}
          isTileSelectionActive={isTileSelectionActive}
          isHighlighted={hoveredTileId === patchId}
          onTileHover={onTileHover}
        />
      ))}

      {/* Player */}
      <Player
        position={playerPos}
        onPositionChange={onPlayerPosChange}
        isCameraTracking={isCameraTracking}
        onCameraTrackingChange={onCameraTrackingChange}
      />

      {/* Point cloud rendering */}
      {/* {pointCloud && <PointCloudLegacy pointCloud={pointCloud} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />} */}

      {/* Debug visualization (temporarily replacing PointCloud) */}
      {pointCloud && <PointCloud pointCloud={pointCloud} />}
    </Canvas>
  );
};
