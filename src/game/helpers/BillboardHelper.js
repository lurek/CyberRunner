import * as THREE from "three";

export function createBillboardTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  canvas.userData = { text: text, animOffset: Math.random() * 100 };
  
  // ✅ PERF: Create a static canvas to hold the pre-rendered text
  const staticCanvas = document.createElement('canvas');
  staticCanvas.width = canvas.width;
  staticCanvas.height = canvas.height;
  const staticCtx = staticCanvas.getContext('2d');

  // ✅ PERF: Draw the static text *once*
  staticCtx.fillStyle = '#100818';
  staticCtx.fillRect(0, 0, canvas.width, canvas.height);
  staticCtx.font = 'bold 48px Orbitron, sans-serif'; // Always use high-quality for static
  staticCtx.fillStyle = '#5b8fc7';
  staticCtx.textAlign = 'center';
  staticCtx.textBaseline = 'middle';
  staticCtx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Store the pre-rendered canvas
  canvas.userData.staticTextCanvas = staticCanvas;
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function updateBillboardTexture(texture, time, forceDraw, isHighQuality, updateFunction) {
  updateFunction(texture, time, texture.image.userData.text, isHighQuality);
}