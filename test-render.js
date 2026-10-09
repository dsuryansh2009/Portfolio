import React from 'react';
import { renderToString } from 'react-dom/server';
import FlipGallery from './components/common/flip-gallery.tsx';

try {
  const html = renderToString(React.createElement(FlipGallery));
  console.log(html);
} catch (e) {
  console.error("Render failed:", e);
}
