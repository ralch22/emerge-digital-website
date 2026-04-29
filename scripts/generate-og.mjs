/**
 * Generates public/og-default.png — a 1200×630 branded OG share image.
 * Uses only Node.js built-ins (zlib + fs). No external deps.
 *
 * Run: node scripts/generate-og.mjs
 */

import { deflateRawSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const W = 1200;
const H = 630;

// ── Brand colours (RGB) ──────────────────────────────────────
const INK  = [6,  18,  42];
const NAVY = [10, 31,  61];
const TEAL = [0,  194, 199];
const CYAN = [61, 220, 227];
const WHITE = [255, 255, 255];
const PLAT = [232, 238, 245];
const COOL = [107, 122, 144];

// ── PNG chunk helpers ────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function u32(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBytes, data]);
  return Buffer.concat([u32(data.length), body, u32(crc32(body))]);
}

// ── Pixel helpers ─────────────────────────────────────────────
const pixels = new Uint8Array(W * H * 3);

function set(x, y, r, g, b) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b;
}

function get(x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return [0,0,0];
  const i = (y * W + x) * 3;
  return [pixels[i], pixels[i+1], pixels[i+2]];
}

function lerp3(a, b, t) {
  return [
    Math.round(a[0] + (b[0]-a[0])*t),
    Math.round(a[1] + (b[1]-a[1])*t),
    Math.round(a[2] + (b[2]-a[2])*t),
  ];
}

function blend(x, y, col, alpha) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const [br, bg, bb] = get(x, y);
  set(x, y,
    Math.min(255, Math.round(br*(1-alpha) + col[0]*alpha)),
    Math.min(255, Math.round(bg*(1-alpha) + col[1]*alpha)),
    Math.min(255, Math.round(bb*(1-alpha) + col[2]*alpha)),
  );
}

function fillRect(x0, y0, w, h, col, alpha=1) {
  for (let y=y0; y<y0+h; y++) for (let x=x0; x<x0+w; x++) blend(x, y, col, alpha);
}

function orb(cx, cy, r, col, intensity=0.3) {
  for (let y=Math.max(0,cy-r); y<Math.min(H,cy+r); y++) {
    for (let x=Math.max(0,cx-r); x<Math.min(W,cx+r); x++) {
      const d = Math.sqrt((x-cx)**2+(y-cy)**2);
      if (d >= r) continue;
      const a = (1-d/r)**2.4 * intensity;
      blend(x, y, col, a);
    }
  }
}

// ── 5×7 bitmap font (3-bit rows) ─────────────────────────────
const GLYPHS = {
  ' ':[0,0,0,0,0,0,0],
  '.':[0,0,0,0,0,0,2],
  ',':[0,0,0,0,0,2,4],
  '-':[0,0,0,7,0,0,0],
  '+':[0,0,2,7,2,0,0],
  '/':[0,1,1,2,4,4,0],
  '0':[7,5,5,5,5,5,7],'1':[2,6,2,2,2,2,7],'2':[7,1,1,7,4,4,7],
  '3':[7,1,1,7,1,1,7],'4':[5,5,5,7,1,1,1],'5':[7,4,4,7,1,1,7],
  '6':[7,4,4,7,5,5,7],'7':[7,1,1,2,2,2,2],'8':[7,5,5,7,5,5,7],
  '9':[7,5,5,7,1,1,7],
  'A':[2,5,5,7,5,5,5],'B':[6,5,5,6,5,5,6],'C':[7,4,4,4,4,4,7],
  'D':[6,5,5,5,5,5,6],'E':[7,4,4,6,4,4,7],'F':[7,4,4,6,4,4,4],
  'G':[7,4,4,5,5,5,7],'H':[5,5,5,7,5,5,5],'I':[7,2,2,2,2,2,7],
  'J':[7,1,1,1,1,5,7],'K':[5,5,6,4,6,5,5],'L':[4,4,4,4,4,4,7],
  'M':[5,7,5,5,5,5,5],'N':[5,7,7,5,5,5,5],'O':[7,5,5,5,5,5,7],
  'P':[7,5,5,7,4,4,4],'Q':[7,5,5,5,5,7,1],'R':[7,5,5,7,6,5,5],
  'S':[7,4,4,7,1,1,7],'T':[7,2,2,2,2,2,2],'U':[5,5,5,5,5,5,7],
  'V':[5,5,5,5,5,2,2],'W':[5,5,5,5,7,7,5],'X':[5,5,2,2,2,5,5],
  'Y':[5,5,5,2,2,2,2],'Z':[7,1,2,2,4,4,7],
  'a':[0,0,7,1,7,5,7],'b':[4,4,6,5,5,5,6],'c':[0,0,7,4,4,4,7],
  'd':[1,1,7,5,5,5,7],'e':[0,0,7,5,7,4,7],'f':[3,2,7,2,2,2,2],
  'g':[0,0,7,5,7,1,7],'h':[4,4,6,5,5,5,5],'i':[2,0,2,2,2,2,2],
  'j':[1,0,1,1,1,5,7],'k':[4,5,6,4,6,5,5],'l':[6,2,2,2,2,2,7],
  'm':[0,0,7,7,5,5,5],'n':[0,0,6,5,5,5,5],'o':[0,0,7,5,5,5,7],
  'p':[0,0,6,5,6,4,4],'q':[0,0,7,5,7,1,1],'r':[0,0,7,4,4,4,4],
  's':[0,0,7,4,7,1,7],'t':[2,2,7,2,2,2,3],'u':[0,0,5,5,5,5,7],
  'v':[0,0,5,5,5,2,2],'w':[0,0,5,5,7,7,5],'x':[0,0,5,2,2,2,5],
  'y':[0,0,5,5,7,1,7],'z':[0,0,7,1,2,4,7],
};

function drawText(text, x0, y0, col, scale=4, alpha=1) {
  let cx = x0;
  for (const ch of text) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (let row=0; row<7; row++) {
      const bits = g[row] ?? 0;
      for (let col2=2; col2>=0; col2--) {
        if (bits & (1 << col2)) {
          fillRect(cx + (2-col2)*scale, y0 + row*scale, scale, scale, col, alpha);
        }
      }
    }
    cx += (3+1) * scale;
  }
  return cx - x0;
}

// ── Build image ───────────────────────────────────────────────

// 1. Background gradient
for (let y=0; y<H; y++) {
  for (let x=0; x<W; x++) {
    const t = Math.min(1, (x/W*0.35 + y/H*0.65) * 1.5);
    const [r,g,b] = lerp3(INK, NAVY, t);
    set(x, y, r, g, b);
  }
}

// 2. Glow orbs
orb(Math.round(W*0.82), Math.round(H*0.22), 300, TEAL, 0.25);
orb(Math.round(W*0.08), Math.round(H*0.88), 250, CYAN, 0.16);

// 3. Left accent bar
for (let y=70; y<H-70; y++) {
  const t = (y-70)/(H-140);
  fillRect(60, y, 3, 1, lerp3(TEAL, CYAN, t), 0.85);
}

// 4. Eyebrow
drawText('LOCAL PRIME  ·  DUBAI MAINLAND  ·  MEA', 80, 100, TEAL, 3, 0.80);

// 5. Wordmark — "EMERGE" large
drawText('EMERGE', 80, 175, WHITE, 9, 1.0);
// Teal accent dot
fillRect(80 + 6 * 4 * 9, 175, 9, 9, TEAL, 1);

// 6. "DIGITAL" slightly smaller
drawText('DIGITAL', 80, 295, PLAT, 8, 0.88);

// 7. Tagline
drawText('LOCAL PRIME. GLOBAL POWER. ENTERPRISE OUTCOMES.', 80, 415, PLAT, 3, 0.60);

// 8. Hairline + domain
fillRect(60, H-82, W-120, 1, TEAL, 0.30);
drawText('EMERGEDIGITAL.COM', 80, H-60, COOL, 3, 0.75);

// 9. Right-side stats
const stats = [['23', 'YRS'], ['80K+', 'ENG'], ['4', 'GMP']];
let sy = 185;
for (const [val, lbl] of stats) {
  drawText(val,  W-280, sy,    TEAL, 7, 0.9);
  drawText(lbl,  W-280, sy+58, COOL, 3, 0.6);
  sy += 115;
}

// ── Encode PNG ────────────────────────────────────────────────
const raw = Buffer.allocUnsafe(H * (1 + W * 3));
for (let y=0; y<H; y++) {
  raw[y*(1+W*3)] = 0; // filter: None
  for (let x=0; x<W; x++) {
    const si = (y*W+x)*3;
    const di = y*(1+W*3)+1+x*3;
    raw[di]   = pixels[si];
    raw[di+1] = pixels[si+1];
    raw[di+2] = pixels[si+2];
  }
}

const compressed = deflateRawSync(raw, { level: 6 });

const sig  = Buffer.from([137,80,78,71,13,10,26,10]);
const ihdr = chunk('IHDR', Buffer.concat([
  u32(W), u32(H),
  Buffer.from([8, 2, 0, 0, 0]), // 8bpc RGB
]));
const idat = chunk('IDAT', compressed);
const iend = chunk('IEND', Buffer.alloc(0));
const png  = Buffer.concat([sig, ihdr, idat, iend]);

// ── Write ─────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'public', 'og-default.png');
mkdirSync(join(__dirname, '..', 'public'), { recursive: true });
writeFileSync(outPath, png);
console.log(`✓ ${outPath}  (${(png.length/1024).toFixed(1)} KB, ${W}×${H})`);
