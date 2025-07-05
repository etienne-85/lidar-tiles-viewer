import { useState, useEffect } from 'react';
import * as THREE from 'three';

export function useImageryTiles(patchId: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    const [tileCol, tileRow] = patchId.split(':').map(Number);
    
    // Build IGN WMTS URL
    const url = `https://data.geopf.fr/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=19&TileCol=${tileCol}&TileRow=${tileRow}`;
    
    // Create texture loader
    const loader = new THREE.TextureLoader();
    
    // Reset texture while loading
    setTexture(null);
    
    // Load texture
    loader.load(
      url,
      (loadedTexture) => {
        loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error(`Failed to load imagery tile for patch ${patchId}:`, error);
      }
    );
  }, [patchId]);
  
  return texture;
}