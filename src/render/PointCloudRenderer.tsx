import React, { useMemo } from 'react';
import { Points, PointMaterial } from '@react-three/drei';
import { BufferGeometry, BufferAttribute, Color } from 'three';
import { LidarPointCloud } from '../data/LidarPointCloud';

interface PointCloudRendererProps {
  pointCloud: LidarPointCloud;
}

export const PointCloudRenderer: React.FC<PointCloudRendererProps> = ({ pointCloud }) => {
  const { geometry, colors } = useMemo(() => {
    const positions = pointCloud.getPoints();
    const classifications = pointCloud.getClassifications();
    
    // Create geometry
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    
    // Create colors based on classification
    const colorArray = new Float32Array(positions.length); // Same length as positions (x,y,z per point)
    const tempColor = new Color();
    
    for (let i = 0; i < classifications.length; i++) {
      const classification = classifications[i];
      
      // Color mapping based on LAS classification codes
      switch (classification) {
        case 1: // Unclassified
          tempColor.setHex(0x808080); // Gray
          break;
        case 2: // Ground
          tempColor.setHex(0x8B4513); // Brown
          break;
        case 3: // Low vegetation
          tempColor.setHex(0x90EE90); // Light green
          break;
        case 4: // Medium vegetation
          tempColor.setHex(0x32CD32); // Lime green
          break;
        case 5: // High vegetation
          tempColor.setHex(0x228B22); // Forest green
          break;
        case 6: // Building
          tempColor.setHex(0xFF4500); // Orange red
          break;
        case 7: // Low point (noise)
          tempColor.setHex(0x800080); // Purple
          break;
        case 9: // Water
          tempColor.setHex(0x0000FF); // Blue
          break;
        case 10: // Rail
          tempColor.setHex(0x000000); // Black
          break;
        case 11: // Road surface
          tempColor.setHex(0x696969); // Dim gray
          break;
        case 12: // Reserved
          tempColor.setHex(0xFFFFFF); // White
          break;
        case 13: // Wire - guard
          tempColor.setHex(0xFFD700); // Gold
          break;
        case 14: // Wire - conductor
          tempColor.setHex(0xFFA500); // Orange
          break;
        case 15: // Transmission tower
          tempColor.setHex(0x8B0000); // Dark red
          break;
        case 16: // Wire-structure connector
          tempColor.setHex(0xDC143C); // Crimson
          break;
        case 17: // Bridge deck
          tempColor.setHex(0x4B0082); // Indigo
          break;
        case 18: // High noise
          tempColor.setHex(0xFF1493); // Deep pink
          break;
        default:
          tempColor.setHex(0x404040); // Dark gray for unknown
          break;
      }
      
      // Set RGB values for this point
      colorArray[i * 3] = tempColor.r;
      colorArray[i * 3 + 1] = tempColor.g;
      colorArray[i * 3 + 2] = tempColor.b;
    }
    
    geometry.setAttribute('color', new BufferAttribute(colorArray, 3));
    
    return { geometry, colors: colorArray };
  }, [pointCloud]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        vertexColors={true}
        size={0.1}
        sizeAttenuation={true}
      />
    </points>
  );
};