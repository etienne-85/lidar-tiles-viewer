import React from 'react';
import { LidarPointCloud } from '../data/LidarPointCloud';

interface FileInfoProps {
  selectedFile: File | null;
  pointCloud: LidarPointCloud | null;
  isProcessingFile: boolean;
}

export const FileInfo: React.FC<FileInfoProps> = ({
  selectedFile,
  pointCloud,
  isProcessingFile
}) => {
  if (isProcessingFile) {
    return (
      <div style={{ color: '#4CAF50', fontSize: '14px' }}>
        🔄 Processing LAZ file...
      </div>
    );
  }

  if (!pointCloud || !selectedFile) {
    return null;
  }

  return (
    <div>
      <div style={{ marginBottom: '12px', color: '#4CAF50', fontSize: '14px' }}>
        ✓ Point cloud loaded: {selectedFile.name}
      </div>
      
      <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '12px' }}>
        File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
      </div>
      
      {/* Point Cloud Metadata */}
      <div style={{ 
        fontSize: '12px', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        padding: '8px', 
        borderRadius: '4px',
        marginBottom: '12px'
      }}>
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Metadata:</div>
        <div>Points: {pointCloud.getMetadata().pointCount.toLocaleString()}</div>
        <div>Format: {pointCloud.getMetadata().pointFormat}</div>
        <div>Version: {pointCloud.getMetadata().version}</div>
        <div>Created: {pointCloud.getMetadata().creationDate}</div>
      </div>

      {/* Bounds Information */}
      <div style={{ 
        fontSize: '12px', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        padding: '8px', 
        borderRadius: '4px',
        marginBottom: '12px'
      }}>
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Bounds:</div>
        <div>X: {pointCloud.getMetadata().targetBounds.min.x.toFixed(2)} to {pointCloud.getMetadata().targetBounds.max.x.toFixed(2)}</div>
        <div>Y: {pointCloud.getMetadata().targetBounds.min.y.toFixed(2)} to {pointCloud.getMetadata().targetBounds.max.y.toFixed(2)}</div>
        <div>Z: {pointCloud.getMetadata().targetBounds.min.z.toFixed(2)} to {pointCloud.getMetadata().targetBounds.max.z?.toFixed(2)}</div>
      </div>

      {/* System Information */}
      <div style={{ 
        fontSize: '11px', 
        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
        padding: '6px', 
        borderRadius: '4px'
      }}>
        <div style={{ marginBottom: '2px', fontWeight: 'bold' }}>System:</div>
        {pointCloud.getMetadata().systemIdentifier && (
          <div>ID: {pointCloud.getMetadata().systemIdentifier}</div>
        )}
        {pointCloud.getMetadata().generatingSoftware && (
          <div>Software: {pointCloud.getMetadata().generatingSoftware}</div>
        )}
        <div>Scale: {pointCloud.getMetadata().scaleFactor.x}, {pointCloud.getMetadata().scaleFactor.y}, {pointCloud.getMetadata().scaleFactor.z}</div>
      </div>
    </div>
  );
};