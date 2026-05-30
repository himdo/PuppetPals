/** Script to generate minimal PNG placeholder assets for the default puppet */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(chunkType, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const type = Buffer.from(chunkType);
  const crcVal = crc32(Buffer.concat([type, data]));
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, type, data, crc]);
}

function createMinimalPNG(r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);  // width
  ihdrData.writeUInt32BE(1, 4);  // height
  ihdrData[8] = 8;    // bit depth
  ihdrData[9] = 2;    // color type RGB
  ihdrData[10] = 0;   // compression
  ihdrData[11] = 0;   // filter
  ihdrData[12] = 0;   // interlace

  // IDAT: filter byte 0 + R G B
  const raw = Buffer.from([0, r, g, b]);
  const compressed = zlib.deflateSync(raw);

  // IEND
  const iendData = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', iendData),
  ]);
}

// Puppet part colors
const parts = {
  'head.png': [200, 180, 160],
  'torso.png': [60, 100, 180],
  'upper-arm-l.png': [200, 180, 160],
  'upper-arm-r.png': [200, 180, 160],
  'lower-arm-l.png': [200, 180, 160],
  'lower-arm-r.png': [200, 180, 160],
  'upper-leg-l.png': [50, 50, 120],
  'upper-leg-r.png': [50, 50, 120],
  'lower-leg-l.png': [40, 30, 20],
  'lower-leg-r.png': [40, 30, 20],
};

const rootDir = path.resolve(__dirname, '..');
const puppetDir = path.join(rootDir, 'client', 'assets', 'default-puppets', 'basic-puppet');
fs.mkdirSync(puppetDir, { recursive: true });

for (const [name, [r, g, b]] of Object.entries(parts)) {
  const png = createMinimalPNG(r, g, b);
  fs.writeFileSync(path.join(puppetDir, name), png);
  console.log('Created ' + name + ' (' + png.length + ' bytes)');
}

// Default background
const bgDir = path.join(rootDir, 'client', 'assets', 'default-backgrounds');
fs.mkdirSync(bgDir, { recursive: true });
const bgPng = createMinimalPNG(40, 80, 40);
fs.writeFileSync(path.join(bgDir, 'default-stage.png'), bgPng);
console.log('Created default-stage.png (' + bgPng.length + ' bytes)');

console.log('Done creating PNG placeholders');