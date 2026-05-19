import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { MediaStoreProvider } from './context/MediaStoreContext';
import { AudioProvider } from './context/AudioContext';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <MediaStoreProvider>
        <AudioProvider>
          <App />
        </AudioProvider>
      </MediaStoreProvider>
    </React.StrictMode>
  );
}
