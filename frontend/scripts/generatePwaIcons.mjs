import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

function crc32(buffer) {
  // Standard CRC32 (IEEE 802.3)
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function pngSolid(size, rgba) {
  const [r, g, b, a] = rgba;

  // PNG scanlines: each row starts with filter byte 0 then RGBA pixels.
  const row = Buffer.alloc(1 + size * 4);
  row[0] = 0;
  for (let x = 0; x < size; x++) {
    const o = 1 + x * 4;
    row[o + 0] = r;
    row[o + 1] = g;
    row[o + 2] = b;
    row[o + 3] = a;
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function parseHexColor(hex) {
  const cleaned = String(hex).trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return [230, 57, 70, 255]; // fallback
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return [r, g, b, 255];
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

// Support running from either repo root or the frontend folder.
const cwd = process.cwd();
const candidates = [
  path.join(cwd, 'public', 'manifest.json'),
  path.join(cwd, 'frontend', 'public', 'manifest.json'),
  path.join(scriptDir, '..', 'public', 'manifest.json'),
  path.join(scriptDir, '..', '..', 'public', 'manifest.json'),
];

const manifestPath = candidates.find((p) => fs.existsSync(p));
if (!manifestPath) {
  console.error('Could not locate manifest.json. Tried:');
  for (const p of candidates) console.error(' -', p);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const rgba = parseHexColor(manifest.theme_color);

const outDir = path.join(path.dirname(manifestPath), 'icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-192.png'), pngSolid(192, rgba));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), pngSolid(512, rgba));

console.log('Generated:', path.join(outDir, 'icon-192.png'));
console.log('Generated:', path.join(outDir, 'icon-512.png'));
