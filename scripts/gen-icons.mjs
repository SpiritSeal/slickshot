// Generates placeholder PWA icons (solid bg + simple camera shape) using Node's
// built-in zlib. No image libraries required.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
mkdirSync(PUBLIC_DIR, { recursive: true });

const BG = [0x0f, 0x17, 0x2a, 0xff]; // slate-900
const FG = [0x38, 0xbd, 0xf8, 0xff]; // sky-400
const FG_DEEP = [0xe0, 0xf2, 0xfe, 0xff]; // sky-50 ish (lens center)

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const checksum = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(checksum, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(width, height, pixelFn) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const off = y * (stride + 1) + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y);
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function cameraPixel(size, maskableSafeRatio = 1) {
  const cx = size / 2;
  const cy = size * 0.56;
  const safe = (size / 2) * maskableSafeRatio;
  const bodyW = safe * 1.4;
  const bodyH = safe * 1.05;
  const bodyR = bodyW / 2;
  const bodyTop = cy - bodyH / 2;
  const bodyBottom = cy + bodyH / 2;
  const cornerR = safe * 0.18;
  const lensR = safe * 0.45;
  const lensInnerR = safe * 0.22;
  const bumpW = safe * 0.55;
  const bumpH = safe * 0.18;
  const bumpTop = bodyTop - bumpH;
  const bumpLeft = cx - bumpW / 2;
  const bumpRight = cx + bumpW / 2;

  function insideRoundedRect(x, y, l, r, t, b, rad) {
    if (x < l || x > r || y < t || y > b) return false;
    const ix = x < l + rad ? l + rad : x > r - rad ? r - rad : x;
    const iy = y < t + rad ? t + rad : y > b - rad ? b - rad : y;
    const dx = x - ix;
    const dy = y - iy;
    return dx * dx + dy * dy <= rad * rad;
  }

  return (x, y) => {
    // bump on top
    if (insideRoundedRect(x, y, bumpLeft, bumpRight, bumpTop, bodyTop + 1, bumpH * 0.4)) {
      return FG;
    }
    // camera body
    if (
      insideRoundedRect(
        x,
        y,
        cx - bodyR,
        cx + bodyR,
        bodyTop,
        bodyBottom,
        cornerR,
      )
    ) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= lensInnerR) return FG_DEEP;
      if (dist <= lensR) return BG;
      if (dist <= lensR + Math.max(2, size * 0.012)) return FG_DEEP;
      return FG;
    }
    return BG;
  };
}

function writeIcon(name, size, maskableSafe = 1) {
  const buf = makePng(size, size, cameraPixel(size, maskableSafe));
  writeFileSync(join(PUBLIC_DIR, name), buf);
  console.log('wrote', name, size + 'x' + size);
}

writeIcon('icon-192.png', 192, 1);
writeIcon('icon-512.png', 512, 1);
// Maskable: keep design inside safe area (~80% of full size).
writeIcon('icon-maskable-512.png', 512, 0.8);
writeIcon('apple-touch-icon.png', 180, 1);
