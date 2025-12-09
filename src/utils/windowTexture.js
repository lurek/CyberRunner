import * as THREE from "three";

export function getWindowTexture(baseColorHex, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; // Higher resolution width
    canvas.height = 512; // Taller
    const ctx = canvas.getContext('2d');

    const baseColor = new THREE.Color('#' + baseColorHex);
    const darkColor = '#020202'; // Pitch black base
    const glowColor = baseColor.getStyle();

    // Background
    ctx.fillStyle = darkColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const windowWidth = 6;
    const windowHeight = 12;
    const spacingX = 14;
    const spacingY = 24;

    const litProbability = options.litProbability || 0.4;

    // Draw Windows
    for (let y = 10; y < canvas.height; y += spacingY) {
        for (let x = 10; x < canvas.width; x += spacingX) {
            
            // Skip columns for "Neon Strip" effect if enabled
            if (options.hasNeonStrip && x > 200) continue;

            if (Math.random() < litProbability) {
                // Lit window
                ctx.fillStyle = glowColor;
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 5;
                ctx.fillRect(x, y, windowWidth, windowHeight);
                ctx.shadowBlur = 0; // Reset
            } else {
                // Reflection (Fake glass)
                ctx.fillStyle = '#111122';
                ctx.fillRect(x, y, windowWidth, windowHeight);
            }
        }
    }
    
    // ✅ NEW: Draw Vertical Neon Strip (Tech Trim)
    if (options.hasNeonStrip) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = glowColor;
        
        // Solid strip on the right edge
        ctx.fillRect(230, 0, 10, canvas.height);
        
        // Thin accents
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(233, 0, 4, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping; // Prevent wrapping horizontally to keep strip on edge
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4); 
    texture.anisotropy = 16;
    
    return texture;
}