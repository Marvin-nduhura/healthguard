/**
 * Generate PWA icons as PNG files using pure Node.js (no canvas library needed).
 * Uses a simple BMP-to-PNG approach with raw pixel data.
 * Developed by NDUHURA MARVIN for ANGEL TECHNOLOGIES LTD
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── PNG encoder (pure Node.js, no deps) ──────────────────────────────────────
function createPNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA values, row by row
  function adler32(data) {
    let s1 = 1, s2 = 0;
    for (let i = 0; i < data.length; i++) {
      s1 = (s1 + data[i]) % 65521;
      s2 = (s2 + s1) % 65521;
    }
    return (s2 << 16) | s1;
  }

  function crc32(data, seed = 0xffffffff) {
    const table = crc32.table || (crc32.table = (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        t[i] = c;
      }
      return t;
    })());
    let c = seed;
    for (let i = 0; i < data.length; i++) c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function writeU32(v) {
    return Buffer.from([(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]);
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const lenBuf = writeU32(data.length);
    const crcData = Buffer.concat([typeBytes, data]);
    const crcBuf = writeU32(crc32(crcData));
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
  }

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB (we'll use 6 for RGBA)
  ihdr[9] = 6;
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw image data (filter byte 0 before each scanline)
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (width * 4 + 1) + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

// ── Draw the HealthGuard icon ────────────────────────────────────────────────
function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
  }

  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

  // Background: gradient from #0f172a to #1e293b
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const r = lerp(15, 30, t);
    const g = lerp(23, 41, t);
    const b = lerp(42, 59, t);
    for (let x = 0; x < size; x++) setPixel(x, y, r, g, b);
  }

  // Rounded rectangle clipping (radius = size * 0.2)
  const radius = Math.round(size * 0.2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Check corners
      const inCorner = (
        (x < radius && y < radius && Math.sqrt((x-radius)**2 + (y-radius)**2) > radius) ||
        (x > size-radius-1 && y < radius && Math.sqrt((x-(size-radius-1))**2 + (y-radius)**2) > radius) ||
        (x < radius && y > size-radius-1 && Math.sqrt((x-radius)**2 + (y-(size-radius-1))**2) > radius) ||
        (x > size-radius-1 && y > size-radius-1 && Math.sqrt((x-(size-radius-1))**2 + (y-(size-radius-1))**2) > radius)
      );
      if (inCorner) {
        const i = (y * size + x) * 4;
        pixels[i+3] = 0; // transparent
      }
    }
  }

  // Gradient overlay: sky-500 to purple-600 diagonal
  // #0ea5e9 = 14,165,233  #7c3aed = 124,58,237
  const cx = size / 2, cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (pixels[i+3] === 0) continue;
      const t = (x + y) / (size * 2);
      const r = lerp(14, 124, t);
      const g = lerp(165, 58, t);
      const b = lerp(233, 237, t);
      // Blend with existing bg
      const alpha = 0.85;
      pixels[i]   = Math.round(pixels[i]   * (1 - alpha) + r * alpha);
      pixels[i+1] = Math.round(pixels[i+1] * (1 - alpha) + g * alpha);
      pixels[i+2] = Math.round(pixels[i+2] * (1 - alpha) + b * alpha);
    }
  }

  // Draw shield shape (simplified)
  const sw = Math.round(size * 0.5);
  const sh = Math.round(size * 0.55);
  const sx = Math.round((size - sw) / 2);
  const sy = Math.round(size * 0.22);

  for (let y = 0; y < sh; y++) {
    const progress = y / sh;
    let width;
    if (progress < 0.15) {
      // Top rounded part
      width = sw * (0.7 + progress / 0.15 * 0.3);
    } else if (progress < 0.75) {
      width = sw;
    } else {
      // Bottom taper to point
      const t = (progress - 0.75) / 0.25;
      width = sw * (1 - t * 0.9);
    }
    const xStart = Math.round(cx - width / 2);
    const xEnd = Math.round(cx + width / 2);
    for (let x = xStart; x <= xEnd; x++) {
      const py = sy + y;
      if (py >= size) break;
      // Shield is white with some transparency
      const i = (py * size + x) * 4;
      if (pixels[i+3] === 0) continue;
      pixels[i]   = Math.min(255, pixels[i]   + 60);
      pixels[i+1] = Math.min(255, pixels[i+1] + 60);
      pixels[i+2] = Math.min(255, pixels[i+2] + 60);
    }
  }

  // Draw cross / plus sign inside shield
  const crossSize = Math.round(size * 0.22);
  const crossThick = Math.max(2, Math.round(size * 0.06));
  const crossX = Math.round(cx - crossSize / 2);
  const crossY = Math.round(cy - crossSize / 2 - size * 0.02);

  for (let y = crossY; y < crossY + crossSize; y++) {
    for (let x = crossX; x < crossX + crossSize; x++) {
      const inH = Math.abs(y - (crossY + crossSize/2)) < crossThick;
      const inV = Math.abs(x - (crossX + crossSize/2)) < crossThick;
      if ((inH || inV) && x >= 0 && x < size && y >= 0 && y < size) {
        const i = (y * size + x) * 4;
        if (pixels[i+3] === 0) continue;
        pixels[i] = 255; pixels[i+1] = 255; pixels[i+2] = 255;
      }
    }
  }

  return pixels;
}

// ── Generate all required sizes ──────────────────────────────────────────────
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '..', 'public', 'icons');

fs.mkdirSync(outDir, { recursive: true });

for (const size of SIZES) {
  const pixels = drawIcon(size);
  const png = createPNG(size, size, pixels);
  const filePath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`✓ Generated icon-${size}.png (${png.length} bytes)`);
}

// Generate og-image placeholder (1200x630)
function drawOgImage() {
  const w = 1200, h = 630;
  const pixels = new Uint8Array(w * h * 4);
  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

  // Dark bg gradient
  for (let y = 0; y < h; y++) {
    const t = y / h;
    for (let x = 0; x < w; x++) {
      const tx = x / w;
      const r = lerp(15, lerp(30, 10, tx), t);
      const g = lerp(23, lerp(41, 20, tx), t);
      const b = lerp(42, lerp(59, 50, tx), t);
      const i = (y * w + x) * 4;
      pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = 255;
    }
  }

  // Diagonal gradient overlay
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = (x / w + y / h) / 2;
      if (t < 0.5) {
        const blend = t * 0.3;
        const i = (y * w + x) * 4;
        pixels[i]   = Math.min(255, Math.round(pixels[i]   + 14 * blend));
        pixels[i+1] = Math.min(255, Math.round(pixels[i+1] + 165 * blend));
        pixels[i+2] = Math.min(255, Math.round(pixels[i+2] + 233 * blend));
      }
    }
  }

  const ogPath = path.join(__dirname, '..', 'public', 'og-image.png');
  const png = createPNG(w, h, pixels);
  fs.writeFileSync(ogPath, png);
  console.log(`✓ Generated og-image.png (${png.length} bytes)`);
}

// Generate simple screenshot placeholders (same approach)
function drawScreenshot(w, h, label) {
  const pixels = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const t = y / h;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      pixels[i] = Math.round(15 + 15 * t);
      pixels[i+1] = Math.round(23 + 18 * t);
      pixels[i+2] = Math.round(42 + 17 * t);
      pixels[i+3] = 255;
    }
  }
  return createPNG(w, h, pixels);
}

drawOgImage();

const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });
fs.writeFileSync(path.join(screenshotsDir, 'dashboard.png'), drawScreenshot(1280, 720, 'Dashboard'));
console.log('✓ Generated screenshots/dashboard.png');
fs.writeFileSync(path.join(screenshotsDir, 'mobile.png'), drawScreenshot(390, 844, 'Mobile'));
console.log('✓ Generated screenshots/mobile.png');

console.log('\n✅ All PWA assets generated successfully!');
