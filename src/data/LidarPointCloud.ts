import { createLazPerf } from 'laz-perf';

// LAS header structure based on LAS specification
interface LASHeader {
  fileSignature: string;
  fileSourceId: number;
  globalEncoding: number;
  projectId: string;
  versionMajor: number;
  versionMinor: number;
  systemIdentifier: string;
  generatingSoftware: string;
  creationDayOfYear: number;
  creationYear: number;
  headerSize: number;
  offsetToPointData: number;
  numberOfVariableLengthRecords: number;
  pointDataRecordFormat: number;
  pointDataRecordLength: number;
  numberOfPointRecords: number;
  numberOfPointsByReturn: number[];
  xScaleFactor: number;
  yScaleFactor: number;
  zScaleFactor: number;
  xOffset: number;
  yOffset: number;
  zOffset: number;
  maxX: number;
  minX: number;
  maxY: number;
  minY: number;
  maxZ: number;
  minZ: number;
}

// Metadata interface for public access
export interface LidarMetadata {
  pointCount: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  pointFormat: number;
  version: string;
  creationDate: string;
  systemIdentifier: string;
  generatingSoftware: string;
  scaleFactor: {
    x: number;
    y: number;
    z: number;
  };
  offset: {
    x: number;
    y: number;
    z: number;
  };
}

export class LidarPointCloud {
  private header: LASHeader;
  private decompressedData: ArrayBuffer;
  private metadata: LidarMetadata;
  private lazPerf: any;
  private laszip: any;
  private dataPointer: number;

  private constructor(header: LASHeader, decompressedData: ArrayBuffer) {
    this.header = header;
    this.decompressedData = decompressedData;
    this.metadata = this.extractMetadata();
  }

  /**
   * Factory method to create LidarPointCloud from LAZ file
   */
  static async fromLAZFile(file: File): Promise<LidarPointCloud> {
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Create LazPerf instance
      const LazPerf = await createLazPerf();
      
      // Create LASZip instance for file reading
      const laszip = new LazPerf.LASZip();
      
      // We need to allocate memory in Emscripten heap
      const dataPointer = LazPerf._malloc(uint8Array.length);
      LazPerf.HEAPU8.set(uint8Array, dataPointer);
      
      // Open the LAZ file
      laszip.open(dataPointer, uint8Array.length);
      
      // Parse LAS header from the original LAZ data (header is uncompressed)
      const header = this.parseLASHeader(arrayBuffer);
      
      // Validate header
      this.validateHeader(header);
      
      // Create point cloud instance
      const pointCloud = new LidarPointCloud(header, arrayBuffer);
      
      // Store LazPerf-related objects for later point extraction
      pointCloud.lazPerf = LazPerf;
      pointCloud.laszip = laszip;
      pointCloud.dataPointer = dataPointer;
      
      return pointCloud;
    } catch (error) {
      throw new Error(`Failed to load LAZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Factory method to create LidarPointCloud from LAS file
   */
  static async fromLASFile(file: File): Promise<LidarPointCloud> {
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse LAS header directly
      const header = this.parseLASHeader(arrayBuffer);
      
      // Validate header
      this.validateHeader(header);
      
      return new LidarPointCloud(header, arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to load LAS file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse LAS header from binary data
   */
  private static parseLASHeader(data: ArrayBuffer): LASHeader {
    const view = new DataView(data);
    const decoder = new TextDecoder('ascii');
    
    // Read file signature
    const fileSignature = decoder.decode(new Uint8Array(data, 0, 4));
    
    if (fileSignature !== 'LASF') {
      throw new Error('Invalid LAS file signature');
    }

    // Parse header fields according to LAS specification
    const header: LASHeader = {
      fileSignature,
      fileSourceId: view.getUint16(4, true),
      globalEncoding: view.getUint16(6, true),
      projectId: this.parseGUID(view, 8),
      versionMajor: view.getUint8(24),
      versionMinor: view.getUint8(25),
      systemIdentifier: decoder.decode(new Uint8Array(data, 26, 32)).replace(/\0/g, ''),
      generatingSoftware: decoder.decode(new Uint8Array(data, 58, 32)).replace(/\0/g, ''),
      creationDayOfYear: view.getUint16(90, true),
      creationYear: view.getUint16(92, true),
      headerSize: view.getUint16(94, true),
      offsetToPointData: view.getUint32(96, true),
      numberOfVariableLengthRecords: view.getUint32(100, true),
      pointDataRecordFormat: view.getUint8(104),
      pointDataRecordLength: view.getUint16(105, true),
      numberOfPointRecords: view.getUint32(107, true),
      numberOfPointsByReturn: [
        view.getUint32(111, true),
        view.getUint32(115, true),
        view.getUint32(119, true),
        view.getUint32(123, true),
        view.getUint32(127, true)
      ],
      xScaleFactor: view.getFloat64(131, true),
      yScaleFactor: view.getFloat64(139, true),
      zScaleFactor: view.getFloat64(147, true),
      xOffset: view.getFloat64(155, true),
      yOffset: view.getFloat64(163, true),
      zOffset: view.getFloat64(171, true),
      maxX: view.getFloat64(179, true),
      minX: view.getFloat64(187, true),
      maxY: view.getFloat64(195, true),
      minY: view.getFloat64(203, true),
      maxZ: view.getFloat64(211, true),
      minZ: view.getFloat64(219, true)
    };

    return header;
  }

  /**
   * Parse GUID from binary data
   */
  private static parseGUID(view: DataView, offset: number): string {
    const guid = [];
    for (let i = 0; i < 16; i++) {
      guid.push(view.getUint8(offset + i).toString(16).padStart(2, '0'));
    }
    return guid.join('');
  }

  /**
   * Validate LAS header
   */
  private static validateHeader(header: LASHeader): void {
    if (header.versionMajor !== 1) {
      throw new Error(`Unsupported LAS version: ${header.versionMajor}.${header.versionMinor}`);
    }

    if (header.pointDataRecordFormat > 10) {
      throw new Error(`Unsupported point data record format: ${header.pointDataRecordFormat}`);
    }

    if (header.numberOfPointRecords === 0) {
      throw new Error('No point records found in file');
    }

    if (header.headerSize < 227) {
      throw new Error('Invalid header size');
    }
  }

  /**
   * Extract metadata from header
   */
  private extractMetadata(): LidarMetadata {
    const creationDate = this.header.creationYear > 0 
      ? `${this.header.creationYear}-${this.header.creationDayOfYear.toString().padStart(3, '0')}`
      : 'Unknown';

    return {
      pointCount: this.header.numberOfPointRecords,
      bounds: {
        minX: this.header.minX,
        maxX: this.header.maxX,
        minY: this.header.minY,
        maxY: this.header.maxY,
        minZ: this.header.minZ,
        maxZ: this.header.maxZ
      },
      pointFormat: this.header.pointDataRecordFormat,
      version: `${this.header.versionMajor}.${this.header.versionMinor}`,
      creationDate,
      systemIdentifier: this.header.systemIdentifier,
      generatingSoftware: this.header.generatingSoftware,
      scaleFactor: {
        x: this.header.xScaleFactor,
        y: this.header.yScaleFactor,
        z: this.header.zScaleFactor
      },
      offset: {
        x: this.header.xOffset,
        y: this.header.yOffset,
        z: this.header.zOffset
      }
    };
  }

  /**
   * Get metadata
   */
  getMetadata(): LidarMetadata {
    return this.metadata;
  }

  /**
   * Get raw decompressed data (for future point parsing)
   */
  getRawData(): ArrayBuffer {
    return this.decompressedData;
  }

  /**
   * Get LAS header (for advanced use cases)
   */
  getHeader(): LASHeader {
    return this.header;
  }

  /**
   * Get point data offset (where point records start)
   */
  getPointDataOffset(): number {
    return this.header.offsetToPointData;
  }

  /**
   * Get point record length
   */
  getPointRecordLength(): number {
    return this.header.pointDataRecordLength;
  }

  /**
   * Get LazPerf instance (for LAZ files)
   */
  getLazPerf(): any {
    return this.lazPerf;
  }

  /**
   * Get LASZip instance (for LAZ files)
   */
  getLaszip(): any {
    return this.laszip;
  }

  /**
   * Cleanup method to free allocated memory
   */
  cleanup(): void {
    if (this.lazPerf && this.dataPointer) {
      this.lazPerf._free(this.dataPointer);
      this.dataPointer = 0;
    }
  }

  /**
   * Placeholder methods for future implementation (Task 2C)
   */
  getPoints(): Float32Array {
    throw new Error('Point parsing not yet implemented. This will be added in Task 2C.');
  }

  getClassifications(): number[] {
    throw new Error('Classification parsing not yet implemented. This will be added in Task 2C.');
  }

  getFilteredPoints(filter: any): Float32Array {
    throw new Error('Point filtering not yet implemented. This will be added in Step 3.');
  }
}