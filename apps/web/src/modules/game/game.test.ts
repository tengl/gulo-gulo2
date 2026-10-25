import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceTo, crawl, createGame, jump, PLAYER_Y, SPEED, step, STUMBLE_PENALTY, tap, type Game, type Obstacle } from './domain/game.ts';
import { BITE_CUES, biteEnvelope, biteTime, RECORDING_DURATION } from './domain/score.ts';
const foods = [{ id: 'test', name: 'Korv', points: 20, color: '#aa6633' }];

// A game with nothing scheduled, so a test can place exactly what it needs.
function quiet(): Game {
  const game = createGame(); game.nextCue = 10_000; game.nextSausage = 1e9; return game;
}
function obstacle(game: Game, kind: Obstacle['kind'], x = game.x): Obstacle {
  const item: Obstacle = { kind, x, y: PLAYER_Y + 0.05 * SPEED, arrival: game.time + 0.05, size: 26, tilt: 0, passed: false };
  game.obstacles.push(item); return item;
}

test('SPEL-003: stones and fallen trees reach the wolverine on recorded beats', () => {
  const game = createGame(); advanceTo(game, 12, 0, foods);
  assert.ok(game.obstacles.length > 0);
  for (const item of game.obstacles) {
    assert.ok(BITE_CUES.some(cue => Math.abs(cue - item.arrival) < 1e-9), `${item.arrival} is a beat`);
    assert.ok(Math.abs((item.y - PLAYER_Y) / SPEED + game.time - item.arrival) < 1e-8);
  }
  const kinds = new Set<string>();
  for (let t = 0; t < 120; t += 2) { advanceTo(game, t, 0, foods); game.obstacles.forEach(o => kinds.add(o.kind)); }
  assert.deepEqual([...kinds].sort(), ['log', 'stone']);
});

test('SPEL-001/003: sausages lie here and there, not on the beat or in one lane', () => {
  const game = createGame(); const seen = new Map<number, number>();
  for (let t = 0; t < 30; t += 0.5) { advanceTo(game, t, 0, foods); for (const s of game.sausages) seen.set(s.arrival, s.x); }
  assert.ok(seen.size >= 15);
  assert.ok(new Set([...seen.values()].map(x => Math.round(x / 40))).size >= 5);
  assert.ok([...seen.keys()].filter(arrival => BITE_CUES.every(cue => Math.abs(cue - arrival) > 0.05)).length > seen.size / 2);
});

test('SPEL-002: jumping clears a stone; running into it stumbles and costs points', () => {
  const cleared = quiet(); cleared.score = 30; obstacle(cleared, 'stone'); jump(cleared);
  step(cleared, 0.1, 0, foods);
  assert.equal(cleared.stumbles, 0); assert.equal(cleared.score, 30);
  const hit = quiet(); hit.score = 30; obstacle(hit, 'stone');
  step(hit, 0.1, 0, foods);
  assert.equal(hit.stumbles, 1); assert.equal(hit.score, 30 - STUMBLE_PENALTY);
  const beside = quiet(); obstacle(beside, 'stone', beside.x + 120);
  step(beside, 0.1, 0, foods); assert.equal(beside.stumbles, 0);
  const poor = quiet(); obstacle(poor, 'stone'); step(poor, 0.1, 0, foods); assert.equal(poor.score, 0);
});

test('SPEL-002: a fallen tree must be crawled under, wherever the wolverine is', () => {
  const cleared = quiet(); obstacle(cleared, 'log', 240); cleared.x = 90; crawl(cleared);
  step(cleared, 0.1, 0, foods); assert.equal(cleared.stumbles, 0);
  const jumped = quiet(); obstacle(jumped, 'log', 240); jumped.x = 390; jump(jumped);
  step(jumped, 0.1, 0, foods); assert.equal(jumped.stumbles, 1);
  const stone = quiet(); obstacle(stone, 'stone'); crawl(stone);
  step(stone, 0.1, 0, foods); assert.equal(stone.stumbles, 1);
});

test('SPEL-002: a stumbling wolverine cannot steer, act or catch for a moment', () => {
  const game = quiet(); obstacle(game, 'stone'); step(game, 0.1, 0, foods);
  const x = game.x; step(game, 0.1, 1, foods); assert.equal(game.x, x);
  jump(game); crawl(game); assert.equal(game.jumpUntil, 0); assert.equal(game.crawlUntil, 0);
  game.sausages = [{ x: game.x, y: PLAYER_Y + 5, arrival: game.time + 0.02, food: 0, caught: false }];
  step(game, 0.05, 0, foods); assert.equal(game.caught, 0);
  advanceTo(game, game.time + 1.1, 0, foods);
  jump(game); assert.ok(game.jumpUntil > game.time);
});

test('SPEL-003: score follows variable tempo and wraps without resetting game time', () => {
  assert.ok(BITE_CUES.every((cue,i)=>cue>=0 && cue<RECORDING_DURATION && (!i || cue>BITE_CUES[i-1]!)));
  const intervals=BITE_CUES.slice(1).map((cue,i)=>cue-BITE_CUES[i]!);
  assert.ok(Math.max(...intervals)-Math.min(...intervals)>0.1);
  assert.equal(biteTime(BITE_CUES.length+6),RECORDING_DURATION+biteTime(6));
  for (const index of [0,6,50,100,199,206]) assert.ok(biteEnvelope(biteTime(index))>0.99);
});

test('SPEL-001: catches award exactly once; misses do not', () => {
  const game = quiet(); game.time=0.6;
  game.sausages=[{ x:game.x,y:PLAYER_Y+12,arrival:0.65,food:0,caught:false },
    { x:30,y:PLAYER_Y,arrival:0.65,food:0,caught:false }];
  step(game,0.05,0,foods);
  assert.equal(game.score,20); assert.equal(game.caught,1);
  step(game,0.05,0,foods); assert.equal(game.score,20);
});

test('SPEL-002: double tap extends sideways and resists immediate reversal', () => {
  const game=quiet(); tap(game,1); step(game,0.1,1,foods); tap(game,1);
  assert.equal(game.velocity,690); const before=game.x;
  step(game,0.05,-1,foods); assert.ok(game.x>before);
  for(let i=0;i<30;i++) step(game,0.05,-1,foods);
  assert.ok(game.velocity<0); assert.ok(game.x>=70);
});

test('SPEL-002: single taps, key changes and slow double taps do not dash', () => {
  const game=createGame(); tap(game,1); tap(game,-1); assert.equal(game.dashUntil,0);
  game.time=1; tap(game,-1); assert.equal(game.dashUntil,0);
});

test('SPEL-002: visible extended muzzle catches beyond normal reach', () => {
  const game=quiet();
  tap(game,1); game.time=0.1; tap(game,1);
  game.sausages=[{ x:game.x+60,y:PLAYER_Y,arrival:0.1,food:0,caught:false }];
  step(game,0,0,foods); assert.equal(game.score,20);
});

test('SPEL-003: dropped frames catch up to audio time with the same result', () => {
  const regular=createGame(), stalled=createGame();
  const end=30;
  for(let t=0;t<end;t+=1/60) advanceTo(regular,Math.min(t,end),-1,foods);
  advanceTo(regular,end,-1,foods); advanceTo(stalled,end,-1,foods);
  assert.ok(stalled.caught > 0 && stalled.stumbles > 0);
  assert.equal(stalled.caught,regular.caught); assert.equal(stalled.stumbles,regular.stumbles);
  assert.equal(stalled.score,regular.score);
  assert.ok(Math.abs(stalled.time-end)<1e-6);
  const y=stalled.sausages[0]!.y;
  advanceTo(stalled,end,-1,foods); assert.equal(stalled.sausages[0]!.y,y);
});
