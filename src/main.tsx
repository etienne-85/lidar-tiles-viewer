import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { TerrainScene } from './TerrainScene.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TerrainScene />
  </StrictMode>
);
