import React, { useState } from 'react';
import { FileImporter } from './FileImporter';
import { FileInfo } from './FileInfo';
import { LidarPointCloud } from '../data/LidarPointCloud';

interface SidebarOverlayProps {
  onFileLoaded: (file: File) => void;
  onFileError: (error: string) => void;
  selectedFile: File | null;
  fileError: string | null;
  pointCloud: LidarPointCloud | null;
  isProcessingFile: boolean;
}

export const SidebarOverlay: React.FC<SidebarOverlayProps> = ({
  onFileLoaded,
  onFileError,
  selectedFile,
  fileError,
  pointCloud,
  isProcessingFile
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 1001,
          userSelect: 'none'
        }}
      >
        ☰
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '360px',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: 'white',
          padding: '80px 20px 20px 20px',
          overflowY: 'auto',
          zIndex: 1000,
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {/* File Importer Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              paddingBottom: '8px'
            }}>
              Import LIDAR Data
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              padding: '12px', 
              borderRadius: '4px',
              marginBottom: '12px'
            }}>
              <FileImporter onFileLoaded={onFileLoaded} onError={onFileError} />
            </div>
            
            {fileError && (
              <div style={{ 
                color: '#ff6b6b', 
                fontSize: '12px',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                padding: '8px',
                borderRadius: '4px'
              }}>
                Error: {fileError}
              </div>
            )}
          </div>

          {/* File Info Section */}
          <div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              paddingBottom: '8px'
            }}>
              File Information
            </div>
            
            <FileInfo 
              selectedFile={selectedFile}
              pointCloud={pointCloud}
              isProcessingFile={isProcessingFile}
            />
          </div>
        </div>
      )}
    </>
  );
};