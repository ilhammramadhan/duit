/**
 * Simple PWA Icon Generator Script
 * Run with: node scripts/generate-icons.js
 *
 * This creates simple colored square icons for PWA.
 * For a production app, replace with custom designed icons.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'static', 'icons');
const STATIC_DIR = join(__dirname, '..', 'static');

// Primary color from Tailwind config
const PRIMARY_COLOR = '#2563EB';

// CRC32 calculation
function makeCRCTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCRCTable();

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
  }
  return crc ^ 0xFFFFFFFF;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createIHDRChunk(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(8, 8);   // bit depth
  data.writeUInt8(2, 9);   // color type (RGB)
  data.writeUInt8(0, 10);  // compression
  data.writeUInt8(0, 11);  // filter
  data.writeUInt8(0, 12);  // interlace

  return createChunk('IHDR', data);
}

function createIDATChunk(width, height, r, g, b) {
  const rawData = [];

  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b);
    }
  }

  const compressed = deflateSync(Buffer.from(rawData));
  return createChunk('IDAT', compressed);
}

function createIENDChunk() {
  return createChunk('IEND', Buffer.alloc(0));
}

function createPNG(width, height, color) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = createIHDRChunk(width, height);
  const idat = createIDATChunk(width, height, r, g, b);
  const iend = createIENDChunk();

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Ensure directories exist
if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate icons
console.log('Generating PWA icons...');

const icon192 = createPNG(192, 192, PRIMARY_COLOR);
writeFileSync(join(ICONS_DIR, 'icon-192x192.png'), icon192);
console.log('Created: icon-192x192.png');

const icon512 = createPNG(512, 512, PRIMARY_COLOR);
writeFileSync(join(ICONS_DIR, 'icon-512x512.png'), icon512);
console.log('Created: icon-512x512.png');

// Create favicon (32x32)
const favicon = createPNG(32, 32, PRIMARY_COLOR);
writeFileSync(join(STATIC_DIR, 'favicon.png'), favicon);
console.log('Created: favicon.png');

console.log('\nPWA icons generated successfully!');
console.log('Note: For production, consider replacing with custom designed icons.');
