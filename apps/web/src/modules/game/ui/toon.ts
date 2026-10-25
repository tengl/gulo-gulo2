// SPEL-004: cartoon art in the inked, cel-shaded style of 1990s adventure
// games. Everything is drawn here, so there are no image files to keep in sync.
// Bold ink outlines, flat fills and hard-edged shadows; light comes from the
// upper left and shadows fall to the lower right.

const INK = '#1a1110';
const SHADOW = 'rgba(40, 22, 52, 0.42)';

type Ctx = CanvasRenderingContext2D;

function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(width: number, height: number) {
  const element = document.createElement('canvas');
  element.width = width; element.height = height;
  return element;
}

// A closed shape through the points, with rounded corners.
function blob(points: readonly (readonly [number, number])[]) {
  const path = new Path2D();
  const mid = (a: readonly [number, number], b: readonly [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  const start = mid(points.at(-1)!, points[0]!);
  path.moveTo(start[0], start[1]);
  points.forEach((point, index) => {
    const next = mid(point, points[(index + 1) % points.length]!);
    path.quadraticCurveTo(point[0], point[1], next[0], next[1]);
  });
  path.closePath();
  return path;
}

function ring(x: number, y: number, radius: number, count: number, jitter: number, next: () => number, spikes = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = radius * (1 - jitter / 2 + next() * jitter) * (spikes && i % 2 ? spikes : 1);
    return [x + Math.cos(angle) * r, y + Math.sin(angle) * r] as const;
  });
}

function inked(c: Ctx, path: Path2D, fill: string, width: number, shade?: { color: string; dx: number; dy: number }) {
  c.fillStyle = fill; c.fill(path);
  if (shade) {
    // Cel shading: the shape's own outline, offset towards the light, cuts the
    // lit part out of a darker copy, leaving a hard shadow on the far side.
    c.save(); c.clip(path);
    c.fillStyle = shade.color; c.fill(path);
    c.translate(-shade.dx, -shade.dy); c.fillStyle = fill; c.fill(path);
    c.restore();
  }
  c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = INK; c.stroke(path);
}

function castShadow(c: Ctx, path: Path2D, dx: number, dy: number) {
  c.save(); c.translate(dx, dy); c.fillStyle = SHADOW; c.fill(path); c.restore();
}

// ---------------------------------------------------------------- terrain

const TILE_W = 512;
const TILE_H = 768;

type Thing = { y: number; draw: (c: Ctx) => void; shadow?: (c: Ctx) => void };

function spruce(x: number, y: number, size: number, next: () => number): Thing {
  const layers = [1, 0.74, 0.5, 0.26].map((scale, i) =>
    blob(ring(x - i * size * 0.05, y - i * size * 0.05, size * scale, 16, 0.18, next, 0.68)));
  const colors = ['#24402a', '#2f5631', '#3f6e36', '#5f8c3c'];
  return {
    y,
    shadow: c => castShadow(c, layers[0]!, size * 0.55, size * 0.75),
    draw: c => layers.forEach((layer, i) => inked(c, layer, colors[i]!, i ? 1.6 : 2.6,
      i ? undefined : { color: '#1b3022', dx: size * 0.18, dy: size * 0.22 })),
  };
}

function pine(x: number, y: number, size: number, next: () => number): Thing {
  // Scots pine from above: loose clusters of needle tufts on red branches.
  const clumps = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + next() * 0.6;
    const distance = size * (0.35 + next() * 0.25);
    return { x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance, r: size * (0.34 + next() * 0.12), angle };
  });
  const tufts = clumps.map(clump => blob(ring(clump.x, clump.y, clump.r, 14, 0.25, next, 0.72)));
  const top = blob(ring(x - size * 0.06, y - size * 0.06, size * 0.36, 12, 0.25, next, 0.72));
  return {
    y,
    shadow: c => { for (const tuft of tufts) castShadow(c, tuft, size * 0.6, size * 0.8); },
    draw: c => {
      c.save(); c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 4.4;
      for (const clump of clumps) { c.beginPath(); c.moveTo(x, y); c.lineTo(clump.x, clump.y); c.stroke(); }
      c.strokeStyle = '#a2502c'; c.lineWidth = 2.2; c.stroke();
      for (const clump of clumps) { c.beginPath(); c.moveTo(x, y); c.lineTo(clump.x, clump.y); c.stroke(); }
      c.restore();
      for (const tuft of tufts) inked(c, tuft, '#4d6f37', 2, { color: '#2c4428', dx: size * 0.14, dy: size * 0.18 });
      inked(c, top, '#6f8f42', 1.6);
    },
  };
}

function birch(x: number, y: number, size: number, next: () => number): Thing {
  const crown = blob(ring(x, y, size, 12, 0.35, next));
  const leaves = Array.from({ length: 4 }, () =>
    blob(ring(x - size * (0.1 + next() * 0.4), y - size * (0.1 + next() * 0.4), size * (0.22 + next() * 0.12), 8, 0.35, next)));
  return {
    y,
    shadow: c => castShadow(c, crown, size * 0.6, size * 0.8),
    draw: c => {
      inked(c, crown, '#df9f2c', 2.4, { color: '#a8611f', dx: size * 0.22, dy: size * 0.26 });
      for (const leaf of leaves) { c.fillStyle = '#f5cf5c'; c.fill(leaf); }
      // White bark glimpsed through the leaves, with black marks.
      c.save(); c.clip(crown); c.lineCap = 'round';
      c.strokeStyle = INK; c.lineWidth = 5.6; c.beginPath(); c.moveTo(x + size * 0.15, y + size * 0.1); c.lineTo(x + size * 0.45, y + size * 0.5); c.stroke();
      c.strokeStyle = '#f4eee0'; c.lineWidth = 3.2; c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + size * 0.25, y + size * 0.22); c.lineTo(x + size * 0.31, y + size * 0.2); c.stroke();
      c.restore();
    },
  };
}

function boulder(x: number, y: number, size: number, next: () => number): Thing {
  const stone = blob(ring(x, y, size, 9, 0.35, next).map(([px, py]) => [px, y + (py - y) * 0.78] as const));
  const lichen = Array.from({ length: 3 }, () =>
    blob(ring(x + (next() - 0.6) * size, y + (next() - 0.6) * size * 0.6, size * (0.12 + next() * 0.12), 6, 0.4, next)));
  return {
    y,
    shadow: c => castShadow(c, stone, size * 0.35, size * 0.45),
    draw: c => {
      inked(c, stone, '#9b9a9c', 2.6, { color: '#5d5a6e', dx: size * 0.3, dy: size * 0.3 });
      c.save(); c.clip(stone);
      for (const spot of lichen) { c.fillStyle = '#b9b56a'; c.fill(spot); }
      c.strokeStyle = '#ece7d5'; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(x - size * 0.7, y - size * 0.05); c.quadraticCurveTo(x - size * 0.5, y - size * 0.62, x + size * 0.05, y - size * 0.65); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(x - size * 0.1, y - size * 0.2); c.lineTo(x + size * 0.15, y + size * 0.1); c.lineTo(x + size * 0.1, y + size * 0.35); c.stroke();
      c.restore();
    },
  };
}

function log(x: number, y: number, length: number, angle: number): Thing {
  const path = new Path2D();
  path.roundRect(-length / 2, -6, length, 12, 6);
  const draw = (c: Ctx, shadowOnly: boolean) => {
    c.save(); c.translate(x, y); c.rotate(angle);
    if (shadowOnly) { c.translate(6, 8); c.fillStyle = SHADOW; c.fill(path); c.restore(); return; }
    inked(c, path, '#8a6040', 2.4, { color: '#5b3a2a', dx: 0, dy: 5 });
    c.fillStyle = '#d8b07a'; c.beginPath(); c.ellipse(length / 2 - 2, 0, 4, 6, 0, 0, Math.PI * 2); c.fill();
    c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(-length / 3, -2); c.lineTo(length / 5, -2); c.stroke();
    c.restore();
  };
  return { y, shadow: c => draw(c, true), draw: c => draw(c, false) };
}

function fern(c: Ctx, x: number, y: number, color: string, next: () => number) {
  c.strokeStyle = color; c.lineWidth = 2; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.45 + (next() - 0.5) * 0.2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(angle) * 9, y + Math.sin(angle) * 9); c.stroke();
  }
}

// The open corridor wanders down the slope; whole sine cycles per tile keep
// the edges seamless when the tile repeats.
function corridor(y: number, side: number) {
  const t = (y / TILE_H) * Math.PI * 2;
  const centre = TILE_W / 2 + Math.sin(t) * 38 + Math.sin(t * 3 + 1) * 14;
  const half = 118 + Math.sin(t * 2 + side) * 22 + Math.sin(t * 5 + side * 2) * 9;
  return centre + side * half;
}

export function toonTerrain(scale = 2): HTMLCanvasElement {
  const tile = canvas(TILE_W * scale, TILE_H * scale);
  const c = tile.getContext('2d')!;
  c.scale(scale, scale);
  const next = random(20261025);
  // Woodland floor with flat patches of moss and heather.
  c.fillStyle = '#7b6a35'; c.fillRect(0, 0, TILE_W, TILE_H);
  const patches: Path2D[] = [];
  for (let i = 0; i < 26; i++) {
    const x = next() * TILE_W, y = next() * TILE_H, r = 30 + next() * 50;
    const color = ['#5e6b2e', '#866a3a', '#6e4f52'][i % 3]!;
    for (const dy of [-TILE_H, 0, TILE_H]) {
      const patch = blob(ring(x, y + dy, r, 10, 0.4, next));
      c.fillStyle = color; c.fill(patch); patches.push(patch);
    }
  }
  // Sunlit grassy corridor down the middle, inked along its edges.
  const edge = new Path2D();
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * TILE_H;
    if (i) edge.lineTo(corridor(y, -1), y); else edge.moveTo(corridor(y, -1), y - 1);
  }
  for (let i = steps; i >= 0; i--) { const y = (i / steps) * TILE_H; edge.lineTo(corridor(y, 1), i === steps ? y + 1 : y); }
  edge.closePath();
  c.fillStyle = '#c99a4c'; c.fill(edge);
  c.save(); c.clip(edge);
  for (let i = 0; i < 14; i++) {
    const x = TILE_W * (0.3 + next() * 0.4), y = next() * TILE_H;
    for (const dy of [-TILE_H, 0, TILE_H]) { c.fillStyle = '#ddb565'; c.fill(blob(ring(x, y + dy, 22 + next() * 26, 8, 0.45, next))); }
  }
  c.restore();
  c.lineWidth = 2.4; c.strokeStyle = '#3b2a17';
  for (const side of [-1, 1]) {
    c.beginPath();
    for (let i = 0; i <= steps; i++) { const y = (i / steps) * TILE_H; if (i) c.lineTo(corridor(y, side), y); else c.moveTo(corridor(y, side), y); }
    c.stroke();
  }
  // Grass ticks and bracken, a few strokes of ink texture.
  for (let i = 0; i < 160; i++) {
    const x = next() * TILE_W, y = next() * TILE_H;
    const open = x > corridor(y, -1) && x < corridor(y, 1);
    if (open && next() < 0.5) { c.strokeStyle = '#8c6a30'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y - 6); c.moveTo(x + 4, y); c.lineTo(x + 8, y - 5); c.stroke(); }
    else if (!open) fern(c, x, y, next() < 0.5 ? '#b5592c' : '#4f6a2d', next);
  }
  // Rooted things: shadows first, then everything back to front.
  const things: Thing[] = [];
  const place = (x: number, y: number, make: (x: number, y: number) => Thing) => {
    for (const dy of [-TILE_H, 0, TILE_H]) things.push(make(x, y + dy));
  };
  for (let i = 0; i < 46; i++) {
    const y = next() * TILE_H;
    const left = next() < 0.5;
    const x = left ? next() * (corridor(y, -1) - 10) : corridor(y, 1) + 10 + next() * (TILE_W - corridor(y, 1));
    const size = 24 + next() * 18;
    const kind = next();
    const seed = Math.floor(next() * 1e9);
    place(x, y, (px, py) => (kind < 0.55 ? spruce : kind < 0.85 ? pine : birch)(px, py, size, random(seed)));
  }
  for (let i = 0; i < 9; i++) {
    const y = next() * TILE_H;
    const x = corridor(y, -1) + next() * (corridor(y, 1) - corridor(y, -1));
    const size = 12 + next() * 22, seed = Math.floor(next() * 1e9);
    place(x, y, (px, py) => boulder(px, py, size, random(seed)));
  }
  for (let i = 0; i < 4; i++) {
    const y = next() * TILE_H, x = next() < 0.5 ? 40 + next() * 70 : TILE_W - 40 - next() * 70;
    const length = 60 + next() * 40, angle = (next() - 0.5) * 1.2;
    place(x, y, (px, py) => log(px, py, length, angle));
  }
  things.sort((a, b) => a.y - b.y);
  for (const thing of things) thing.shadow?.(c);
  for (const thing of things) thing.draw(c);
  return tile;
}

// -------------------------------------------------------------- wolverine

// Two cells of 150 × 200 units: mouth closed, mouth open. The mouth sits at
// (75, 150) in both, which paint.ts places on the collision point.
export const CELL = { width: 150, height: 200, mouthX: 75, mouthY: 150 };

const FUR = '#4a2a1a';
const FUR_DARK = '#25140d';
const TAN = '#d9a866';
const TAN_DARK = '#a8743f';

type Point = readonly [number, number];

// Ragged fur: each edge of the outline gets small angular tufts, the way inked
// adventure-game characters are drawn, instead of smooth balloon shapes.
function furry(points: readonly Point[], tuft: number, skip: readonly number[] = []) {
  const path = new Path2D();
  const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  points.forEach((point, index) => {
    const following = points[(index + 1) % points.length]!;
    if (index === 0) path.moveTo(point[0], point[1]);
    const length = Math.hypot(following[0] - point[0], following[1] - point[1]);
    const count = skip.includes(index) ? 1 : Math.max(1, Math.round(length / (tuft * 2.4)));
    for (let i = 1; i <= count; i++) {
      const t = i / count, half = (i - 0.5) / count;
      const mx = point[0] + (following[0] - point[0]) * half, my = point[1] + (following[1] - point[1]) * half;
      if (count > 1 || !skip.includes(index)) {
        const ox = mx - cx, oy = my - cy, d = Math.hypot(ox, oy) || 1;
        path.lineTo(mx + (ox / d) * tuft, my + (oy / d) * tuft);
      }
      path.lineTo(point[0] + (following[0] - point[0]) * t, point[1] + (following[1] - point[1]) * t);
    }
  });
  path.closePath();
  return path;
}

const mirror = (side: number, points: readonly Point[]) => points.map(([x, y]) => [75 + side * (x - 75), y] as const);

function wolverineCell(c: Ctx, open: boolean) {
  const shade = { color: FUR_DARK, dx: 7, dy: 5 };
  // Hind legs splay out behind, towards the top, with pale-clawed feet.
  for (const side of [-1, 1]) {
    const leg = furry(mirror(side, [[96, 46], [118, 30], [130, 36], [126, 52], [108, 64]]), 2.6);
    inked(c, leg, FUR, 3, shade);
    for (let i = 0; i < 3; i++) {
      const [x, y] = mirror(side, [[121 + i * 4, 31 + i * 5]])[0]!;
      c.strokeStyle = '#efe4c8'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * 4, y - 4); c.stroke();
    }
  }
  // A short, bushy tail.
  const tail = furry([[75, 2], [88, 8], [90, 24], [82, 36], [68, 36], [60, 24], [62, 8]], 3.4);
  inked(c, tail, FUR, 3, shade);
  c.strokeStyle = '#7b4a2b'; c.lineWidth = 2;
  for (const x of [69, 75, 81]) { c.beginPath(); c.moveTo(x, 10); c.lineTo(x + (x - 75) * 0.3, 26); c.stroke(); }
  // Long, low body: narrow hips, powerful humped shoulders.
  const bodyPoints: Point[] = [[75, 26], [94, 32], [104, 56], [114, 86], [120, 112], [106, 132], [75, 136], [44, 132], [30, 112], [36, 86], [46, 56], [56, 32]];
  const body = furry(bodyPoints, 3.2, [5, 6]);
  inked(c, body, FUR, 3.6, { color: FUR_DARK, dx: 13, dy: 6 });
  // The pale flank bands that run from shoulder to tail on every wolverine.
  c.save(); c.clip(body);
  for (const side of [-1, 1]) {
    const band = furry(mirror(side, [[82, 30], [98, 42], [108, 72], [114, 102], [104, 104], [96, 74], [86, 46]]), 1.8);
    c.fillStyle = side < 0 ? TAN : TAN_DARK; c.fill(band);
  }
  // Darker saddle down the spine.
  c.fillStyle = '#2f1a10';
  c.fill(furry([[75, 30], [84, 44], [86, 90], [75, 110], [64, 90], [66, 44]], 1.6));
  c.restore();
  c.lineWidth = 3.6; c.strokeStyle = INK; c.stroke(body);
  // Thick forelegs reach past the head; oversized paws and long claws.
  for (const side of [-1, 1]) {
    const arm = furry(mirror(side, [[98, 98], [120, 104], [126, 140], [124, 168], [104, 170], [100, 140], [94, 118]]), 2.6, [3, 4]);
    inked(c, arm, FUR, 3.4, shade);
    const paw = blob(mirror(side, [[100, 160], [126, 158], [132, 176], [116, 184], [98, 178]]));
    inked(c, paw, '#3a2016', 3, { color: FUR_DARK, dx: 4, dy: 4 });
    for (let i = 0; i < 4; i++) {
      const [x] = mirror(side, [[102 + i * 8, 0]])[0]!;
      const claw = new Path2D();
      claw.moveTo(x - 2.4, 180); claw.quadraticCurveTo(x - side, 190, x + side * 2, 195); claw.quadraticCurveTo(x + 1.4, 188, x + 2.4, 180); claw.closePath();
      inked(c, claw, '#efe4c8', 1.6);
    }
  }
  // Broad, flat head with small rounded ears set low and wide.
  for (const side of [-1, 1]) {
    const [x] = mirror(side, [[101, 0]])[0]!;
    inked(c, blob([[x - 6, 112], [x + side * 2, 104], [x + side * 8, 108], [x + side * 6, 117]]), FUR, 2.6);
    c.fillStyle = TAN; c.beginPath(); c.arc(x + side * 2, 110, 2.6, 0, Math.PI * 2); c.fill();
  }
  const head = furry([[75, 106], [94, 108], [106, 120], [104, 136], [92, 150], [75, 158], [58, 150], [46, 136], [44, 120], [56, 108]], 2.4, [3, 4, 5, 6]);
  inked(c, head, '#33190f', 3.6, { color: FUR_DARK, dx: 8, dy: 5 });
  // Light brow band from ear to ear, the dark mask below it.
  c.save(); c.clip(head);
  c.fillStyle = TAN;
  c.fill(furry([[48, 116], [62, 110], [75, 113], [88, 110], [102, 116], [104, 126], [92, 121], [75, 125], [58, 121], [46, 126]], 1.6));
  c.restore();
  c.lineWidth = 3.6; c.strokeStyle = INK; c.stroke(head);
  // Small, fierce eyes under one heavy, angry brow.
  for (const side of [-1, 1]) {
    const [x] = mirror(side, [[86, 0]])[0]!;
    const eye = blob([[x - 5, 131], [x + 5, 129], [x + 6, 134], [x - 3, 136]]);
    inked(c, eye, '#f0c64c', 1.6);
    c.fillStyle = INK; c.beginPath(); c.arc(x + side * 0.5, 133, 2.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(75 + side * 3, 129); c.lineTo(x + side * 7, 125); c.stroke();
  }
  // Short blunt muzzle with a big glossy nose; the open frame bares teeth.
  inked(c, blob([[75, 137], [87, 141], [89, 152], [75, 159], [61, 152], [63, 141]]), '#8f5a33', 2.4, { color: '#5e3a22', dx: 3, dy: 4 });
  if (open) {
    const mouth = blob([[75, 144], [89, 148], [86, 162], [75, 167], [64, 162], [61, 148]]);
    inked(c, mouth, '#6e1616', 2.8);
    c.save(); c.clip(mouth);
    c.fillStyle = '#cf4648'; c.beginPath(); c.ellipse(75, 165, 8, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff8e8';
    for (const x of [68, 72, 78, 82]) { c.beginPath(); c.moveTo(x - 1.6, 146); c.lineTo(x, 149.5); c.lineTo(x + 1.6, 146); c.fill(); }
    c.restore();
    for (const x of [66, 84]) {
      const fang = new Path2D(); fang.moveTo(x - 2.6, 147); fang.lineTo(x, 155); fang.lineTo(x + 2.6, 147); fang.closePath();
      inked(c, fang, '#fff8e8', 1.2);
    }
  } else {
    c.strokeStyle = INK; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(65, 151); c.quadraticCurveTo(75, 155, 85, 151); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(83, 150); c.lineTo(86, 147); c.stroke();
  }
  inked(c, blob([[75, 138], [83, 140], [81, 146], [75, 147.5], [69, 146], [67, 140]]), '#141010', 1.6);
  c.fillStyle = '#f2ece0'; c.beginPath(); c.ellipse(72, 140.5, 2, 1.1, -0.3, 0, Math.PI * 2); c.fill();
  // Whisker ticks.
  c.strokeStyle = '#e8dcc0'; c.lineWidth = 1;
  for (const side of [-1, 1]) for (const dy of [0, 3]) {
    c.beginPath(); c.moveTo(75 + side * 13, 149 + dy); c.lineTo(75 + side * 22, 147 + dy * 1.6); c.stroke();
  }
}

export function toonWolverine(scale = 4): HTMLCanvasElement {
  const sheet = canvas(CELL.width * 2 * scale, CELL.height * scale);
  const c = sheet.getContext('2d')!;
  for (const open of [false, true]) {
    c.save(); c.scale(scale, scale); if (open) c.translate(CELL.width, 0);
    wolverineCell(c, open);
    c.restore();
  }
  return sheet;
}

// ---------------------------------------------------------------- sausage

export function toonSausage(c: Ctx, color: string) {
  const body = new Path2D();
  body.moveTo(-18, -6); body.quadraticCurveTo(0, 4, 18, -6);
  body.quadraticCurveTo(25, -2, 19, 4); body.quadraticCurveTo(0, 16, -19, 4);
  body.quadraticCurveTo(-25, -2, -18, -6); body.closePath();
  c.save(); c.translate(5, 7); c.fillStyle = SHADOW; c.fill(body); c.restore();
  inked(c, body, color, 2.8, { color: '#6b2f1c', dx: 0, dy: 5 });
  c.strokeStyle = '#fff3d6'; c.lineWidth = 2.4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-11, -2); c.quadraticCurveTo(-2, 3, 7, -1); c.stroke();
  for (const side of [-1, 1]) {
    const knot = new Path2D(); knot.moveTo(side * 21, -1); knot.lineTo(side * 28, -6); knot.lineTo(side * 28, 4); knot.closePath();
    inked(c, knot, '#c99561', 1.8);
  }
}
