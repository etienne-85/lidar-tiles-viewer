import React, { useState, useCallback } from 'react';

interface FileImporterProps {
  onFileLoaded: (file: File) => void;
  onError: (error: string) => void;
}

export const FileImporter: React.FC<FileImporterProps> = ({ onFileLoaded, onError }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateFile = (file: File): boolean => {
    // Check file extension
    const validExtensions = ['.laz', '.las'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidExtension) {
      onError(`Invalid file type. Please select a LAZ or LAS file.`);
      return false;
    }

    // Check file size (reasonable limit for browser processing)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      onError(`File too large. Maximum size is 200MB.`);
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;
    
    setIsProcessing(true);
    
    // Simulate processing delay and then call onFileLoaded
    setTimeout(() => {
      onFileLoaded(file);
      setIsProcessing(false);
    }, 100);
  }, [onFileLoaded, onError]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div style={{
      border: `1px dashed ${isDragActive ? '#4CAF50' : '#666'}`,
      borderRadius: '4px',
      padding: '16px',
      textAlign: 'center',
      backgroundColor: isDragActive ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '12px'
    }}
    onDragEnter={handleDragEnter}
    onDragLeave={handleDragLeave}
    onDragOver={handleDragOver}
    onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".laz,.las"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        id="file-input"
        disabled={isProcessing}
      />
      
      {isProcessing ? (
        <div style={{ color: '#4CAF50' }}>Processing...</div>
      ) : (
        <>
          <div style={{ marginBottom: '8px' }}>
            {isDragActive ? 'Drop LAZ file here' : 'Drag LAZ file or click to browse'}
          </div>
          <label
            htmlFor="file-input"
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              backgroundColor: '#4CAF50',
              color: 'white',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Browse
          </label>
        </>
      )}
    </div>
  );
};