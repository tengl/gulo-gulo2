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
  const centre = TILE_W / 2 + Math.sin(t) * 22 + Math.sin(t * 3 + 1) * 8;
  const half = 152 + Math.sin(t * 2 + side) * 16 + Math.sin(t * 5 + side * 2) * 6;
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
  for (let i = 0; i < 56; i++) {
    const y = next() * TILE_H;
    const left = next() < 0.5;
    const x = left ? next() * (corridor(y, -1) - 10) : corridor(y, 1) + 10 + next() * (TILE_W - corridor(y, 1));
    const size = 24 + next() * 18;
    const kind = next();
    const seed = Math.floor(next() * 1e9);
    place(x, y, (px, py) => (kind < 0.5 ? spruce : kind < 0.88 ? pine : birch)(px, py, size, random(seed)));
  }
  // Decorative stones stay in the forest, so they are never taken for the
  // stones the game places on the open slope.
  for (let i = 0; i < 9; i++) {
    const y = next() * TILE_H;
    const x = next() < 0.5 ? next() * (corridor(y, -1) - 30) : corridor(y, 1) + 30 + next() * (TILE_W - corridor(y, 1) - 30);
    const size = 12 + next() * 22, seed = Math.floor(next() * 1e9);
    place(x, y, (px, py) => boulder(px, py, size, random(seed)));
  }
  for (let i = 0; i < 4; i++) {
    const y = next() * TILE_H, x = next() < 0.5 ? 20 + next() * 40 : TILE_W - 20 - next() * 40;
    const length = 50 + next() * 30, angle = Math.PI / 2 + (next() - 0.5) * 0.8;
    place(x, y, (px, py) => log(px, py, length, angle));
  }
  things.sort((a, b) => a.y - b.y);
  for (const thing of things) thing.shadow?.(c);
  for (const thing of things) thing.draw(c);
  return tile;
}

// -------------------------------------------------------------- wolverine

// SPEL-001: an exaggerated cartoon of the logo's wolverine, seen from above
// while it runs head first down the slope: a huge black head with the logo's
// peach brow band, cheeks and ears, a snarl full of teeth, a stocky body and
// short legs. It is drawn every frame in local units with the mouth at (0, 0),
// which paint.ts places on the collision point.
const BLACK = '#1f1613';
const BLACK_SHADE = '#0d0807';
const PEACH = '#ebb89b';
const PEACH_SHADE = '#c98c6e';
const FUR_BROWN = '#3b2519';

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
    if (skip.includes(index)) { path.lineTo(following[0], following[1]); return; }
    const length = Math.hypot(following[0] - point[0], following[1] - point[1]);
    const count = Math.max(1, Math.round(length / (tuft * 2.4)));
    for (let i = 1; i <= count; i++) {
      const t = i / count, half = (i - 0.5) / count;
      const mx = point[0] + (following[0] - point[0]) * half, my = point[1] + (following[1] - point[1]) * half;
      const ox = mx - cx, oy = my - cy, d = Math.hypot(ox, oy) || 1;
      path.lineTo(mx + (ox / d) * tuft, my + (oy / d) * tuft);
      path.lineTo(point[0] + (following[0] - point[0]) * t, point[1] + (following[1] - point[1]) * t);
    }
  });
  path.closePath();
  return path;
}

const mirror = (side: number, points: readonly Point[]) => points.map(([x, y]) => [side * x, y] as const);

export type WolverinePose = {
  stride: number;  // running cycle in radians
  mouth: number;   // 0 closed snarl, 1 wide open bite
  crawl: number;   // 0 running, 1 flat on the belly
  lift: number;    // 0 on the ground, 1 at the top of a jump
  dizzy: number;   // 0 fine, 1 just stumbled
  time: number;
};

function leg(c: Ctx, side: number, shoulder: Point, paw: Point, width: number) {
  const [sx, sy] = shoulder, [px, py] = paw;
  const angle = Math.atan2(py - sy, px - sx), nx = -Math.sin(angle) * width, ny = Math.cos(angle) * width;
  const limb = furry([[sx + nx, sy + ny], [px + nx * 0.8, py + ny * 0.8], [px - nx * 0.8, py - ny * 0.8], [sx - nx, sy - ny]], 2.2, [1, 2]);
  inked(c, limb, BLACK, 3, { color: BLACK_SHADE, dx: side * 3, dy: 2 });
  const foot = blob(ring(px, py, width * 1.15, 8, 0.15, () => 0.5));
  inked(c, foot, FUR_BROWN, 2.8);
  // Long pale claws pointing the way the paw reaches.
  for (let i = -1; i <= 1; i++) {
    const a = angle + i * 0.38, x = px + Math.cos(a) * width, y = py + Math.sin(a) * width;
    const claw = new Path2D();
    claw.moveTo(x - Math.sin(a) * 2, y + Math.cos(a) * 2);
    claw.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
    claw.lineTo(x + Math.sin(a) * 2, y - Math.cos(a) * 2);
    claw.closePath();
    inked(c, claw, '#f4e6cc', 1.4);
  }
}

function star(c: Ctx, x: number, y: number, r: number, spin: number) {
  const path = new Path2D();
  for (let i = 0; i < 10; i++) {
    const a = spin + (i / 10) * Math.PI * 2, rr = i % 2 ? r * 0.45 : r;
    if (i) path.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else path.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  path.closePath();
  inked(c, path, '#ffd25e', 1.8);
}

export function drawWolverine(c: Ctx, pose: WolverinePose) {
  const { stride, crawl, lift } = pose;
  const run = 1 - crawl;
  const swing = Math.sin(stride), counter = Math.sin(stride + Math.PI);
  const reach = lift > 0 ? 1 : run;
  const splay = 12 * crawl;
  // Tail and hind legs trail behind, up the slope.
  const tail = furry([[0, -176], [13, -168], [15, -150], [8, -138], [-8, -138], [-15, -150], [-13, -168]], 3.6);
  c.save(); c.translate(0, -150); c.rotate(Math.sin(stride * 0.5) * 0.25 * run); c.translate(0, 150);
  inked(c, tail, BLACK, 3, { color: BLACK_SHADE, dx: 5, dy: 4 });
  c.restore();
  for (const side of [-1, 1]) {
    const phase = side < 0 ? counter : swing;
    leg(c, side, [side * 26, -128], [side * (40 + splay), -150 - (lift ? 10 : phase * 11 * reach)], 9);
  }
  // Stocky body with the pale flank bands, humped at the shoulders.
  const body = furry([[0, -152], [22, -146], [34, -122], [42, -92], [40, -66], [0, -58], [-40, -66], [-42, -92], [-34, -122], [-22, -146]], 3.2, [4, 5]);
  inked(c, body, BLACK, 3.6, { color: BLACK_SHADE, dx: 10, dy: 5 });
  c.save(); c.clip(body);
  for (const side of [-1, 1]) {
    c.fillStyle = side < 0 ? PEACH : PEACH_SHADE;
    c.fill(furry(mirror(side, [[10, -148], [26, -138], [36, -110], [38, -82], [28, -84], [24, -112], [14, -136]]), 1.8));
  }
  c.restore();
  c.lineWidth = 3.6; c.strokeStyle = INK; c.stroke(body);
  // Front legs reach forward beside the head.
  for (const side of [-1, 1]) {
    const phase = side < 0 ? swing : counter;
    leg(c, side, [side * 40, -70], [side * (72 + splay), (lift ? 14 : -2 + phase * 16 * reach) - crawl * 10], 10);
  }
  // The huge head, drawn last so it overlaps the body like the logo's mask.
  const bob = Math.sin(stride * 2) * 1.6 * run;
  c.save(); c.translate(0, bob);
  const earDrop = crawl * 7;
  for (const side of [-1, 1]) {
    const ear = blob(ring(side * 38, -70 + earDrop, 13, 10, 0.08, () => 0.5));
    inked(c, ear, BLACK, 3);
    c.fillStyle = PEACH; c.fill(blob(ring(side * 38, -68 + earDrop, 7, 8, 0.1, () => 0.5)));
  }
  const head = furry([[0, -76], [26, -74], [44, -64], [52, -44], [64, -28], [54, -22], [62, -10], [46, -2], [26, 10], [0, 14], [-26, 10], [-46, -2], [-62, -10], [-54, -22], [-64, -28], [-52, -44], [-44, -64], [-26, -74]], 2.8, [3, 4, 5, 6, 11, 12, 13, 14]);
  inked(c, head, BLACK, 4, { color: BLACK_SHADE, dx: 9, dy: 4 });
  c.save(); c.clip(head);
  // As in the logo: a peach band arches from the forehead, split by the dark
  // stripe down the middle, over each eye and down the side of the face to
  // the cheek, leaving the eyes in the dark mask.
  c.fillStyle = PEACH;
  for (const side of [-1, 1]) c.fill(blob(mirror(side, [[5, -66], [26, -72], [46, -62], [56, -44], [64, -26], [52, -14], [40, -18], [36, -32], [32, -44], [20, -50], [5, -52]])));
  c.restore();
  c.lineWidth = 4; c.strokeStyle = INK; c.stroke(head);
  // Fierce eyes under heavy black brows.
  for (const side of [-1, 1]) {
    const eye = blob(mirror(side, [[9, -38], [26, -42], [30, -33], [14, -29]]));
    inked(c, eye, '#f3d2a0', 2);
    c.fillStyle = '#b8743c'; c.beginPath(); c.arc(side * 19, -35, 4.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(side * 19, -35, 2.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(side * 18, -36.5, 0.9, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 4.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(side * 6, -38); c.lineTo(side * 30, -47); c.stroke();
  }
  // Wrinkled peach muzzle and a big glossy nose.
  inked(c, blob([[0, -28], [16, -24], [24, -10], [16, 2], [0, 6], [-16, 2], [-24, -10], [-16, -24]]), PEACH, 2.6, { color: PEACH_SHADE, dx: 4, dy: 4 });
  c.strokeStyle = INK; c.lineWidth = 1.6;
  for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * 12, -22); c.quadraticCurveTo(side * 17, -18, side * 15, -13); c.stroke(); }
  inked(c, blob([[0, -26], [11, -23], [10, -16], [0, -13], [-10, -16], [-11, -23]]), '#120c0b', 2);
  c.fillStyle = '#f2ece0'; c.beginPath(); c.ellipse(-4, -22, 3, 1.4, -0.3, 0, Math.PI * 2); c.fill();
  // The snarl: always fangs, wide open with rows of teeth when biting.
  const open = Math.max(0, Math.min(1, pose.mouth));
  const drop = 3 + open * 11;
  const mouth = blob([[0, -10], [15, -8], [19, -2], [13, drop], [0, drop + 3], [-13, drop], [-19, -2], [-15, -8]]);
  inked(c, mouth, '#5a1214', 2.8);
  c.save(); c.clip(mouth);
  c.fillStyle = '#c63f43'; c.beginPath(); c.ellipse(0, drop + 2, 9, 4 + open * 2, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff6e4';
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 4.4 - 2.2, -10); c.lineTo(i * 4.4, -5); c.lineTo(i * 4.4 + 2.2, -10); c.fill(); }
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 4.6 - 2.2, drop + 4); c.lineTo(i * 4.6, drop - 1); c.lineTo(i * 4.6 + 2.2, drop + 4); c.fill(); }
  c.restore();
  for (const side of [-1, 1]) {
    const fang = new Path2D();
    fang.moveTo(side * 14 - 3, -9); fang.lineTo(side * 12.5, -1 + open * 3); fang.lineTo(side * 14 + 3, -9); fang.closePath();
    inked(c, fang, '#fff6e4', 1.6);
  }
  c.restore();
  // Cartoon stars circle the head after a crash.
  if (pose.dizzy > 0) {
    for (let i = 0; i < 3; i++) {
      const a = pose.time * 6 + (i / 3) * Math.PI * 2;
      c.globalAlpha = Math.min(1, pose.dizzy * 2);
      star(c, Math.cos(a) * 52, -46 + Math.sin(a) * 18, 10, a);
    }
    c.globalAlpha = 1;
  }
}

// -------------------------------------------------------------- obstacles

// SPEL-002/004: a granite boulder to jump over, rooted in the ground.
export function drawStone(c: Ctx, x: number, y: number, size: number, tilt: number) {
  const next = random(Math.floor(tilt * 1e6));
  const stone = blob(ring(x, y, size, 9, 0.3, next).map(([px, py]) => [px, y + (py - y) * 0.8] as const));
  castShadow(c, stone, size * 0.4, size * 0.5);
  inked(c, stone, '#9a98a0', 3.2, { color: '#5c586e', dx: size * 0.32, dy: size * 0.3 });
  c.save(); c.clip(stone);
  c.fillStyle = '#b9b56a';
  for (let i = 0; i < 3; i++) c.fill(blob(ring(x + (next() - 0.6) * size, y + (next() - 0.6) * size * 0.6, size * (0.14 + next() * 0.1), 6, 0.4, next)));
  c.strokeStyle = '#efe9d8'; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - size * 0.7, y - size * 0.05); c.quadraticCurveTo(x - size * 0.5, y - size * 0.6, x + size * 0.05, y - size * 0.62); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(x - size * 0.1, y - size * 0.25); c.lineTo(x + size * 0.15, y + size * 0.1); c.lineTo(x + size * 0.08, y + size * 0.35); c.stroke();
  c.restore();
}

// A fallen pine across the whole slope, resting on its branches with a gap
// beneath it: the shadow on the ground shows how high it lies.
export function drawLog(c: Ctx, y: number, tilt: number, width: number) {
  c.save(); c.translate(width / 2, y); c.rotate(tilt);
  const half = width / 2 + 40;
  const trunk = new Path2D(); trunk.roundRect(-half, -17, half * 2, 34, 8);
  c.save(); c.translate(10, 26); c.fillStyle = SHADOW; c.fill(trunk); c.restore();
  // Dead branch stubs it rests on.
  for (const bx of [-170, -60, 80, 190]) {
    const stub = new Path2D(); stub.moveTo(bx - 4, 10); stub.lineTo(bx + 10, 28); stub.lineTo(bx + 16, 24); stub.lineTo(bx + 4, 8); stub.closePath();
    inked(c, stub, '#6e4430', 2);
  }
  inked(c, trunk, '#8a5636', 3.2, { color: '#5b3424', dx: 0, dy: 9 });
  // Flaking red pine bark and a lighter top where the sun falls.
  c.save(); c.clip(trunk);
  c.fillStyle = '#b8683d'; c.fillRect(-half, -17, half * 2, 9);
  c.strokeStyle = INK; c.lineWidth = 1.4;
  for (let bx = -half + 12; bx < half; bx += 26) {
    c.beginPath(); c.moveTo(bx, -8); c.lineTo(bx + 9, -4); c.moveTo(bx + 14, 3); c.lineTo(bx + 22, 6); c.stroke();
  }
  c.restore();
  for (const bx of [-120, 30, 150]) {
    const knot = blob(ring(bx, -2, 4, 6, 0.2, () => 0.5));
    inked(c, knot, '#5b3424', 1.4);
  }
  c.restore();
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
