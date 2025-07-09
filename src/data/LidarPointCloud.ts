import { createLazPerf } from 'laz-perf';
import { transformCoordinates } from '../utils/proj'; // Import the new transformCoordinates function

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
  // Original bounds from LAS header
  originalBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  // Bounds after reprojection to the target CRS (e.g., Web Mercator)
  reprojectedBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number; // Z remains the same, but we track its min/max
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
  // Add EPSG codes for clarity
  sourceEpsg: string;
  targetEpsg: string;
}

// Structure of Arrays data format for efficient storage and rendering
interface PointCloudData {
  positions: Float32Array; // These will now be relative to reprojectedBounds.minX/Y/Z
  classifications: Uint8Array;
  intensities: Uint16Array;
}

export class LidarPointCloud {
  private header: LASHeader;
  private metadata: LidarMetadata;
  private pointData: PointCloudData;

  private constructor(header: LASHeader, pointData: PointCloudData, metadata: LidarMetadata) {
    this.header = header;
    this.pointData = pointData;
    this.metadata = metadata; // Use the calculated metadata
  }

  static async fromLAZFile(file: File, sourceEpsg: string = 'EPSG:2154', targetEpsg: string = 'EPSG:3857'): Promise<LidarPointCloud> {
    let lazPerf: any = null;
    let dataPointer: number = 0;
    let pointDataPointer: number = 0;
    let laszip: any = null; // Declare laszip here, outside the try block

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      lazPerf = await createLazPerf();
      laszip = new lazPerf.LASZip(); // Initialize laszip here

      dataPointer = lazPerf._malloc(uint8Array.length);
      lazPerf.HEAPU8.set(uint8Array, dataPointer);

      laszip.open(dataPointer, uint8Array.length);

      const header = this.parseLASHeader(arrayBuffer);
      this.validateHeader(header);

      const pointCount = header.numberOfPointRecords;
      const pointRecordLength = header.pointDataRecordLength;

      // Allocate temporary arrays to store all data in the first (and only) pass
      const tempReprojectedPositions = new Float64Array(pointCount * 2); // X, Y in target CRS
      const tempAltitudes = new Float64Array(pointCount); // Z (altitude)
      const tempClassifications = new Uint8Array(pointCount); // Store classifications
      const tempIntensities = new Uint16Array(pointCount); // Store intensities

      pointDataPointer = lazPerf._malloc(pointRecordLength);
      const pointView = new DataView(lazPerf.HEAPU8.buffer, pointDataPointer, pointRecordLength);

      let minX_reproj = Infinity, maxX_reproj = -Infinity;
      let minY_reproj = Infinity, maxY_reproj = -Infinity;
      let minZ_reproj = Infinity, maxZ_reproj = -Infinity;

      // Single pass: Decompress, apply LAS scale/offset, reproject, find reprojected bounds, and store all attributes
      for (let i = 0; i < pointCount; i++) {
        laszip.getPoint(pointDataPointer);

        const rawX = pointView.getInt32(0, true);
        const rawY = pointView.getInt32(4, true);
        const rawZ = pointView.getInt32(8, true);
        const intensity = pointView.getUint16(12, true);
        const classification = pointView.getUint8(15);

        // Calculate real-world coordinates in the original LAS CRS (e.g., Lambert 93)
        const originalX = rawX * header.xScaleFactor + header.xOffset;
        const originalY = rawY * header.yScaleFactor + header.yOffset;
        const originalZ = rawZ * header.zScaleFactor + header.zOffset;

        // Reproject X, Y to the target CRS (e.g., Web Mercator)
        const [reprojX, reprojY] = transformCoordinates(sourceEpsg, targetEpsg, originalX, originalY);

        // Store reprojected X, Y and original Z (altitude)
        tempReprojectedPositions[i * 2 + 0] = reprojX;
        tempReprojectedPositions[i * 2 + 1] = reprojY;
        tempAltitudes[i] = originalZ;

        // Store classification and intensity
        tempClassifications[i] = classification;
        tempIntensities[i] = intensity;

        // Update reprojected bounds
        minX_reproj = Math.min(minX_reproj, reprojX);
        maxX_reproj = Math.max(maxX_reproj, reprojX);
        minY_reproj = Math.min(minY_reproj, reprojY);
        maxY_reproj = Math.max(maxY_reproj, reprojY);
        minZ_reproj = Math.min(minZ_reproj, originalZ);
        maxZ_reproj = Math.max(maxZ_reproj, originalZ);
      }

      // Final positions array with offset and axis remapping
      const positions = new Float32Array(pointCount * 3);
      for (let i = 0; i < pointCount; i++) {
        const reprojX = tempReprojectedPositions[i * 2 + 0];
        const reprojY = tempReprojectedPositions[i * 2 + 1];
        const originalZ = tempAltitudes[i];

        // Apply offset (relative to reprojected min bounds) and axis remapping
        // X -> X (relative to reprojected minX)
        positions[i * 3 + 0] = reprojX - minX_reproj;
        // Z (altitude) -> Y (relative to original minZ)
        positions[i * 3 + 1] = originalZ - minZ_reproj;
        // Y -> -Z (relative to reprojected minY, and then inverted for Three.js Z-axis)
        positions[i * 3 + 2] = -(reprojY - minY_reproj);
      }

      const pointData: PointCloudData = {
        positions,
        classifications: tempClassifications,
        intensities: tempIntensities
      };

      const metadata = this.extractMetadata(header, { minX: minX_reproj, maxX: maxX_reproj, minY: minY_reproj, maxY: maxY_reproj, minZ: minZ_reproj, maxZ: maxZ_reproj }, sourceEpsg, targetEpsg);
      
      return new LidarPointCloud(header, pointData, metadata);

    } catch (error) {
      throw new Error(`Failed to load LAZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Ensure laszip is closed if it was opened
      if (laszip && laszip.close) { // Check if close function exists before calling
          laszip.close();
      }
      if (lazPerf) {
        if (dataPointer) lazPerf._free(dataPointer);
        if (pointDataPointer) lazPerf._free(pointDataPointer);
      }
    }
  }

  static async fromLASFile(file: File, sourceEpsg: string = 'EPSG:2154', targetEpsg: string = 'EPSG:3857'): Promise<LidarPointCloud> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const header = this.parseLASHeader(arrayBuffer);
      this.validateHeader(header);

      const pointCount = header.numberOfPointRecords;
      const pointRecordLength = header.pointDataRecordLength;
      const view = new DataView(arrayBuffer, header.offsetToPointData);

      const tempReprojectedPositions = new Float64Array(pointCount * 2); // X, Y in target CRS
      const tempAltitudes = new Float64Array(pointCount); // Z (altitude)
      const tempClassifications = new Uint8Array(pointCount);
      const tempIntensities = new Uint16Array(pointCount);

      let minX_reproj = Infinity, maxX_reproj = -Infinity;
      let minY_reproj = Infinity, maxY_reproj = -Infinity;
      let minZ_reproj = Infinity, maxZ_reproj = -Infinity;

      // First pass: Read, apply LAS scale/offset, reproject, and find reprojected bounds
      for (let i = 0; i < pointCount; i++) {
        const offset = i * pointRecordLength;

        const rawX = view.getInt32(offset + 0, true);
        const rawY = view.getInt32(offset + 4, true);
        const rawZ = view.getInt32(offset + 8, true);
        const intensity = view.getUint16(offset + 12, true);
        const classification = view.getUint8(offset + 15);

        const originalX = rawX * header.xScaleFactor + header.xOffset;
        const originalY = rawY * header.yScaleFactor + header.yOffset;
        const originalZ = rawZ * header.zScaleFactor + header.zOffset;

        const [reprojX, reprojY] = transformCoordinates(sourceEpsg, targetEpsg, originalX, originalY);

        tempReprojectedPositions[i * 2 + 0] = reprojX;
        tempReprojectedPositions[i * 2 + 1] = reprojY;
        tempAltitudes[i] = originalZ;
        tempClassifications[i] = classification;
        tempIntensities[i] = intensity;

        minX_reproj = Math.min(minX_reproj, reprojX);
        maxX_reproj = Math.max(maxX_reproj, reprojX);
        minY_reproj = Math.min(minY_reproj, reprojY);
        maxY_reproj = Math.max(maxY_reproj, reprojY);
        minZ_reproj = Math.min(minZ_reproj, originalZ);
        maxZ_reproj = Math.max(maxZ_reproj, originalZ);
      }

      // Second pass: Create final positions array with offset and axis remapping
      const positions = new Float32Array(pointCount * 3);
      for (let i = 0; i < pointCount; i++) {
        const reprojX = tempReprojectedPositions[i * 2 + 0];
        const reprojY = tempReprojectedPositions[i * 2 + 1];
        const originalZ = tempAltitudes[i];

        positions[i * 3 + 0] = reprojX - minX_reproj;
        positions[i * 3 + 1] = originalZ - minZ_reproj;
        positions[i * 3 + 2] = -(reprojY - minY_reproj);
      }

      const pointData: PointCloudData = {
        positions,
        classifications: tempClassifications, // Use the temporarily stored arrays
        intensities: tempIntensities
      };

      const metadata = this.extractMetadata(header, { minX: minX_reproj, maxX: maxX_reproj, minY: minY_reproj, maxY: maxY_reproj, minZ: minZ_reproj, maxZ: maxZ_reproj }, sourceEpsg, targetEpsg);
      
      return new LidarPointCloud(header, pointData, metadata);

    } catch (error) {
      throw new Error(`Failed to load LAS file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static parsePointData(header: LASHeader, pointDataBuffer: ArrayBuffer, sourceEpsg: string, targetEpsg: string): PointCloudData {
    // This function is no longer called directly by fromLASFile.
    // Its logic has been integrated into fromLASFile for the two-pass approach.
    // You can remove this function if it's not used elsewhere.
    throw new Error("parsePointData is deprecated. Use fromLASFile directly for reprojection logic.");
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

  private static extractMetadata(header: LASHeader, reprojectedBounds: LidarMetadata['reprojectedBounds'], sourceEpsg: string, targetEpsg: string): LidarMetadata {
    const creationDate = header.creationYear > 0
      ? `${header.creationYear}-${header.creationDayOfYear.toString().padStart(3, '0')}`
      : 'Unknown';

    return {
      pointCount: header.numberOfPointRecords,
      originalBounds: {
        minX: header.minX, maxX: header.maxX,
        minY: header.minY, maxY: header.maxY,
        minZ: header.minZ, maxZ: header.maxZ
      },
      reprojectedBounds: reprojectedBounds, // Store the calculated reprojected bounds
      pointFormat: header.pointDataRecordFormat,
      version: `${header.versionMajor}.${header.versionMinor}`,
      creationDate,
      systemIdentifier: header.systemIdentifier,
      generatingSoftware: header.generatingSoftware,
      scaleFactor: {
        x: header.xScaleFactor, y: header.yScaleFactor, z: header.zScaleFactor
      },
      offset: { // This is the original LAS file offset
        x: header.xOffset, y: header.yOffset, z: header.zOffset
      },
      sourceEpsg: sourceEpsg,
      targetEpsg: targetEpsg,
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
