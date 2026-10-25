import { biteTime } from './score.ts';
// SPEL-001–004. Coordinates are in a fixed 480 × 640 logical canvas. The
// wolverine runs downhill near the top; the ground, with everything lying on
// it, moves up past it at SPEED.
export const WIDTH = 480;
export const HEIGHT = 640;
export const PLAYER_Y = 188;
export const SPEED = 170;
export const JUMP_TIME = 0.62;
export const CRAWL_TIME = 0.72;
export const STUMBLE_TIME = 1;
export const STUMBLE_PENALTY = 10;
export type Food = { id: string; name: string; points: number; color: string };
export type Sausage = { x: number; y: number; arrival: number; food: number; caught: boolean };
export type Obstacle = { kind: 'stone' | 'log'; x: number; y: number; arrival: number; size: number; tilt: number; passed: boolean };
export type Game = {
  time: number; x: number; velocity: number; facing: number;
  dashUntil: number; lastTap: number; lastDirection: number;
  jumpUntil: number; crawlUntil: number; stumbleUntil: number;
  score: number; caught: number; stumbles: number;
  sausages: Sausage[]; obstacles: Obstacle[];
  nextCue: number; nextSausage: number; placed: number; seed: number;
  toast: string; toastUntil: number; lastCatch: number;
};
export function createGame(): Game {
  return { time: 0, x: WIDTH / 2, velocity: 0, facing: 1, dashUntil: 0,
    lastTap: -1, lastDirection: 0, jumpUntil: 0, crawlUntil: 0, stumbleUntil: 0,
    score: 0, caught: 0, stumbles: 0, sausages: [], obstacles: [],
    nextCue: 6, nextSausage: 0.9, placed: 0, seed: 20261025,
    toast: '', toastUntil: 0, lastCatch: -10 };
}
// Seeded, so a run is the same however the frames fall (and testable).
function random(game: Game) {
  game.seed = (game.seed + 0x6d2b79f5) | 0;
  let t = Math.imul(game.seed ^ (game.seed >>> 15), 1 | game.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const jumping = (game: Game) => game.time < game.jumpUntil;
export const crawling = (game: Game) => game.time < game.crawlUntil;
export const stumbling = (game: Game) => game.time < game.stumbleUntil;
const busy = (game: Game) => jumping(game) || crawling(game) || stumbling(game);

export function tap(game: Game, direction: number) {
  if (stumbling(game)) return;
  if (game.lastDirection === direction && game.time - game.lastTap < 0.3) {
    game.velocity = direction * 690;
    game.dashUntil = game.time + 0.48;
    game.lastTap = -1;
  } else game.lastTap = game.time;
  game.lastDirection = direction;
  game.facing = direction;
}
// SPEL-002: up jumps over a stone, down crawls under a fallen tree.
export function jump(game: Game) {
  if (!busy(game)) game.jumpUntil = game.time + JUMP_TIME;
}
export function crawl(game: Game) {
  if (!busy(game)) game.crawlUntil = game.time + CRAWL_TIME;
}
export function mouthX(game: Game) {
  return game.x + (game.time < game.dashUntil ? game.facing * 28 : 0);
}
const screenY = (game: Game, arrival: number) => PLAYER_Y + (arrival - game.time) * SPEED;

function spawn(game: Game, foods: readonly Food[]) {
  // Everything that will scroll into view before the next step is laid out now.
  const horizon = game.time + (HEIGHT + 60 - PLAYER_Y) / SPEED;
  // SPEL-003: obstacles reach the wolverine on the recording's beats.
  while (biteTime(game.nextCue) <= horizon) {
    const arrival = biteTime(game.nextCue);
    // The first two teach both moves: a stone, then a fallen tree.
    const chance = random(game);
    const stone = game.placed === 0 || (game.placed > 1 && chance < 0.6);
    game.placed++;
    game.obstacles.push(stone
      ? { kind: 'stone', x: 95 + random(game) * 290, y: screenY(game, arrival), arrival, size: 28 + random(game) * 10, tilt: random(game) * Math.PI, passed: false }
      : { kind: 'log', x: WIDTH / 2, y: screenY(game, arrival), arrival, size: 13, tilt: (random(game) - 0.5) * 0.1, passed: false });
    game.nextCue += 3 + Math.floor(random(game) * 3);
  }
  // SPEL-001: sausages lie here and there, off the beat.
  while (game.nextSausage <= horizon && foods.length) {
    game.sausages.push({ x: 80 + random(game) * 320, y: screenY(game, game.nextSausage), arrival: game.nextSausage,
      food: Math.floor(random(game) * foods.length), caught: false });
    game.nextSausage += 0.5 + random(game) * 0.9;
  }
}

function stumble(game: Game, toast: string) {
  game.stumbleUntil = game.time + STUMBLE_TIME;
  game.jumpUntil = 0; game.crawlUntil = 0; game.dashUntil = 0; game.velocity = 0;
  game.score = Math.max(0, game.score - STUMBLE_PENALTY); game.stumbles++;
  game.toast = toast; game.toastUntil = game.time + 1.3;
}

export function step(game: Game, dt: number, direction: number, foods: readonly Food[]) {
  game.time += dt;
  spawn(game, foods);
  const dashing = game.time < game.dashUntil;
  const steer = stumbling(game) ? 0 : direction * (crawling(game) ? 120 : 220);
  game.velocity += (steer - game.velocity) * Math.min(1, dt * (dashing ? 2 : 12));
  game.x = Math.max(70, Math.min(WIDTH - 70, game.x + game.velocity * dt));
  if (direction && !dashing && !stumbling(game)) game.facing = direction;
  for (const obstacle of game.obstacles) {
    obstacle.y = screenY(game, obstacle.arrival);
    if (obstacle.passed || game.time < obstacle.arrival) continue;
    obstacle.passed = true;
    // A fallen tree spans the whole slope; a stone only its own width.
    if (obstacle.kind === 'log' ? !crawling(game) : !jumping(game) && Math.abs(obstacle.x - game.x) < obstacle.size + 22)
      stumble(game, obstacle.kind === 'log' ? 'Aj! Rakt in i stocken' : 'Aj! Stenen tog emot');
  }
  for (const sausage of game.sausages) {
    const previousY = sausage.y;
    // Absolute ground time prevents drift from frame rate or repeated pauses.
    sausage.y = screenY(game, sausage.arrival);
    if (!sausage.caught && !stumbling(game) && sausage.y <= PLAYER_Y + 8 && previousY >= PLAYER_Y - 20
      && Math.abs(sausage.x - mouthX(game)) < 35) {
      const food = foods[sausage.food];
      if (!food) continue;
      sausage.caught = true;
      game.score += food.points; game.caught++; game.lastCatch = game.time;
      game.toast = `${food.name} +${food.points}`;
      game.toastUntil = game.time + 1.3;
    }
  }
  game.sausages = game.sausages.filter(s => !s.caught && s.y > -40);
  game.obstacles = game.obstacles.filter(o => o.y > -90);
}
// Audio time drives simulation, including low-frame-rate catch-up. Small steps
// keep steering/collisions stable; mute and pause never create a second clock.
export function advanceTo(game: Game, time: number, direction: number, foods: readonly Food[]) {
  while (time - game.time > 0.000001) step(game, Math.min(1 / 120, time - game.time), direction, foods);
}
