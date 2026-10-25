import { biteTime } from './score.ts';
// SPEL-001–003. Coordinates are in a fixed 480 × 640 logical canvas.
export const WIDTH = 480;
export const HEIGHT = 640;
export const PLAYER_Y = 188;
export const SPEED = 155;
export type Food = { id: string; name: string; points: number; color: string };
export type Sausage = { x: number; y: number; arrival: number; food: number; caught: boolean };
export type Game = {
  time: number; x: number; velocity: number; facing: number;
  dashUntil: number; lastTap: number; lastDirection: number;
  score: number; caught: number; nextPair: number; sausages: Sausage[];
  toast: string; toastUntil: number; lastCatch: number;
};
export function createGame(): Game {
  return { time: 0, x: WIDTH / 2, velocity: 0, facing: 1, dashUntil: 0,
    lastTap: -1, lastDirection: 0, score: 0, caught: 0, nextPair: 0,
    sausages: [], toast: '', toastUntil: 0, lastCatch: -10 };
}
export function tap(game: Game, direction: number) {
  if (game.lastDirection === direction && game.time - game.lastTap < 0.3) {
    game.velocity = direction * 690;
    game.dashUntil = game.time + 0.48;
    game.lastTap = -1;
  } else game.lastTap = game.time;
  game.lastDirection = direction;
  game.facing = direction;
}
export function mouthX(game: Game) {
  return game.x + (game.time < game.dashUntil ? game.facing * 28 : 0);
}
export function step(game: Game, dt: number, direction: number, foods: readonly Food[]) {
  game.time += dt;
  const dashing = game.time < game.dashUntil;
  const target = direction * 220;
  game.velocity += (target - game.velocity) * Math.min(1, dt * (dashing ? 2 : 12));
  game.x = Math.max(70, Math.min(WIDTH - 70, game.x + game.velocity * dt));
  if (direction && !dashing) game.facing = direction;
  // Schedule two successive recorded accents, then leave two bars to travel.
  const travel = (HEIGHT + 40 - PLAYER_Y) / SPEED;
  while (biteTime(6 + game.nextPair * 4) - travel <= game.time && foods.length) {
    const pair = game.nextPair++;
    const x = 85 + ((pair * 137) % 310);
    for (let i = 0; i < 2; i++) {
      const arrival = biteTime(6 + pair * 4 + i);
      game.sausages.push({ x: x + (i ? (x > 240 ? -45 : 45) : 0),
        y: PLAYER_Y + (arrival - game.time + dt) * SPEED, arrival,
        food: (pair * 2 + i) % foods.length, caught: false });
    }
  }
  for (const sausage of game.sausages) {
    const previousY = sausage.y;
    // Absolute score time prevents drift from frame rate or repeated pauses.
    sausage.y = PLAYER_Y + (sausage.arrival - game.time) * SPEED;
    if (!sausage.caught && sausage.y <= PLAYER_Y + 8 && previousY >= PLAYER_Y - 20
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
}
// Audio time drives simulation, including low-frame-rate catch-up. Small steps
// keep steering/collisions stable; mute and pause never create a second clock.
export function advanceTo(game: Game, time: number, direction: number, foods: readonly Food[]) {
  while (time - game.time > 0.000001) step(game, Math.min(1 / 120, time - game.time), direction, foods);
}
