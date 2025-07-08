// src/data/LidarPointCloud.ts

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
  numberOfPointRecords_1_4?: bigint;
}

// Public metadata interface
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

// Structure of Arrays data format for efficient storage and rendering
interface PointCloudData {
  positions: Float32Array;
  classifications: Uint8Array;
  intensities: Uint16Array;
}

export class LidarPointCloud {
  private header: LASHeader;
  private metadata: LidarMetadata;
  private pointData: PointCloudData;

  private constructor(header: LASHeader, pointData: PointCloudData) {
    this.header = header;
    this.pointData = pointData;
    this.metadata = this.extractMetadata();
  }

  static async fromLAZFile(file: File): Promise<LidarPointCloud> {
    let lazPerf: any = null;
    let dataPointer: number = 0;
    let pointDataPointer: number = 0;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      lazPerf = await createLazPerf();
      const laszip = new lazPerf.LASZip();

      dataPointer = lazPerf._malloc(uint8Array.length);
      lazPerf.HEAPU8.set(uint8Array, dataPointer);

      laszip.open(dataPointer, uint8Array.length);

      const header = this.parseLASHeader(arrayBuffer);
      this.validateHeader(header);

      const pointCount = header.numberOfPointRecords;
      const pointRecordLength = header.pointDataRecordLength;

      // Allocate our final JavaScript TypedArrays
      const positions = new Float32Array(pointCount * 3);
      const classifications = new Uint8Array(pointCount);
      const intensities = new Uint16Array(pointCount);

      // Allocate a small buffer in WASM memory for just ONE point
      pointDataPointer = lazPerf._malloc(pointRecordLength);

      // Create a DataView that we will reuse to read from that WASM buffer
      const pointView = new DataView(lazPerf.HEAPU8.buffer, pointDataPointer, pointRecordLength);

      // Loop and decompress one point at a time
      for (let i = 0; i < pointCount; i++) {
        // Decompress the next point's data into our WASM buffer
        laszip.getPoint(pointDataPointer);

        // Read attributes directly from the WASM buffer using our DataView
        // Note: Offsets are for Point Data Record Format 6 (adjust if different format is needed)
        const rawX = pointView.getInt32(0, true);
        const rawY = pointView.getInt32(4, true);
        const rawZ = pointView.getInt32(8, true);
        const intensity = pointView.getUint16(12, true);
        const classification = pointView.getUint8(15);

        // Apply original LAS scale and offset, then apply new scene offset
        // AND PERFORM AXIS REMAPPING HERE!
        positions[i * 3 + 0] = rawX * header.xScaleFactor + header.xOffset - header.minX; // X -> X
        positions[i * 3 + 1] = rawZ * header.zScaleFactor + header.zOffset - header.minZ; // Z (height) -> Y
        positions[i * 3 + 2] = (rawY * header.yScaleFactor + header.yOffset - header.minY) * -1; // Y -> -Z

        classifications[i] = classification;
        intensities[i] = intensity;
      }

      const pointData: PointCloudData = { positions, classifications, intensities };
      return new LidarPointCloud(header, pointData); // Pass the calculated offset

    } catch (error) {
      throw new Error(`Failed to load LAZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Final cleanup of all allocated WASM memory
      if (lazPerf) {
        if (dataPointer) lazPerf._free(dataPointer);
        if (pointDataPointer) lazPerf._free(pointDataPointer);
      }
    }
  }

  static async fromLASFile(file: File): Promise<LidarPointCloud> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const header = this.parseLASHeader(arrayBuffer);
      this.validateHeader(header);

      // Calculate the scene offset based on the header's min bounds
      const sceneOffsetX = header.minX;
      const sceneOffsetY = header.minY;
      const sceneOffsetZ = header.minZ;
      const sceneOffset = { x: sceneOffsetX, y: sceneOffsetY, z: sceneOffsetZ };

      const pointDataBuffer = arrayBuffer.slice(header.offsetToPointData);
      const pointData = this.parsePointData(header, pointDataBuffer, sceneOffset); // Pass sceneOffset
      
      return new LidarPointCloud(header, pointData); // Pass the calculated offset

    } catch (error) {
      throw new Error(`Failed to load LAS file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static parsePointData(header: LASHeader, pointDataBuffer: ArrayBuffer, sceneOffset: { x: number; y: number; z: number }): PointCloudData {
    const pointCount = header.numberOfPointRecords;
    const pointRecordLength = header.pointDataRecordLength;
    const view = new DataView(pointDataBuffer);

    const positions = new Float32Array(pointCount * 3);
    const classifications = new Uint8Array(pointCount);
    const intensities = new Uint16Array(pointCount);

    for (let i = 0; i < pointCount; i++) {
      const offset = i * pointRecordLength;

      const rawX = view.getInt32(offset + 0, true);
      const rawY = view.getInt32(offset + 4, true);
      const rawZ = view.getInt32(offset + 8, true);
      const intensity = view.getUint16(offset + 12, true);
      const classification = view.getUint8(offset + 15);

      // Apply original LAS scale and offset, then apply new scene offset
      // AND PERFORM AXIS REMAPPING HERE!
      positions[i * 3 + 0] = (rawX * header.xScaleFactor + header.xOffset) - sceneOffset.x; // X -> X
      positions[i * 3 + 1] = (rawZ * header.zScaleFactor + header.zOffset) - sceneOffset.z; // Z (height) -> Y
      positions[i * 3 + 2] = ((rawY * header.yScaleFactor + header.yOffset) - sceneOffset.y) * -1; // Y -> -Z

      classifications[i] = classification;
      intensities[i] = intensity;
    }

    return { positions, classifications, intensities };
  }

  private static parseLASHeader(data: ArrayBuffer): LASHeader {
    const view = new DataView(data);
    const decoder = new TextDecoder('ascii');

    const fileSignature = decoder.decode(new Uint8Array(data, 0, 4));
    if (fileSignature !== 'LASF') {
      throw new Error('Invalid LAS file signature');
    }

    const header: Partial<LASHeader> = {
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
      pointDataRecordFormat: view.getUint8(104) & 0x7F,
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

    if (header.versionMajor === 1 && header.versionMinor === 4 && header.headerSize >= 375 && view.buffer.byteLength >= 255) {
      const numPoints64 = view.getBigUint64(247, true);
      header.numberOfPointRecords_1_4 = numPoints64;
      header.numberOfPointRecords = Number(numPoints64);
    }

    return header as LASHeader;
  }

  private static parseGUID(view: DataView, offset: number): string {
    const guid = [];
    for (let i = 0; i < 16; i++) {
      guid.push(view.getUint8(offset + i).toString(16).padStart(2, '0'));
    }
    return guid.join('');
  }

  private static validateHeader(header: LASHeader): void {
    if (header.versionMajor !== 1) {
      throw new Error(`Unsupported LAS version: ${header.versionMajor}.${header.versionMinor}`);
    }
    // Updated to support up to format 10, common in modern LAS files.
    // Point Data Record Format 6 is common for modern files (includes extra attributes).
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

  private extractMetadata(): LidarMetadata {
    const creationDate = this.header.creationYear > 0
      ? `${this.header.creationYear}-${this.header.creationDayOfYear.toString().padStart(3, '0')}`
      : 'Unknown';

    return {
      pointCount: this.header.numberOfPointRecords,
      bounds: {
        minX: this.header.minX, maxX: this.header.maxX,
        minY: this.header.minY, maxY: this.header.maxY,
        minZ: this.header.minZ, maxZ: this.header.maxZ
      },
      pointFormat: this.header.pointDataRecordFormat,
      version: `${this.header.versionMajor}.${this.header.versionMinor}`,
      creationDate,
      systemIdentifier: this.header.systemIdentifier,
      generatingSoftware: this.header.generatingSoftware,
      scaleFactor: {
        x: this.header.xScaleFactor, y: this.header.yScaleFactor, z: this.header.zScaleFactor
      },
      offset: { // This is the original LAS file offset
        x: this.header.xOffset, y: this.header.yOffset, z: this.header.zOffset
      }
    };
  }

  getMetadata(): LidarMetadata {
    return this.metadata;
  }

  getHeader(): LASHeader {
    return this.header;
  }

  getPoints(): Float32Array {
    return this.pointData.positions;
  }

  getClassifications(): Uint8Array {
    return this.pointData.classifications;
  }

  getFilteredPoints(filter: any): Float32Array {
    throw new Error('Point filtering not yet implemented. This will be added in Step 3.');
  }
}