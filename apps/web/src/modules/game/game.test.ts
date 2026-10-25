import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceTo, createGame, PLAYER_Y, SPEED, step, tap } from './domain/game.ts';
import { BITE_CUES, biteEnvelope, biteTime, RECORDING_DURATION } from './domain/score.ts';
const foods = [{ id: 'test', name: 'Korv', points: 20, color: '#aa6633' }];

test('SPEL-001/003: pair arrives on consecutive recorded accents', () => {
  const game = createGame();
  advanceTo(game, biteTime(6)-3, 0, foods);
  assert.equal(game.sausages.length, 2);
  for (let i=0;i<2;i++) {
    const sausage=game.sausages[i]!;
    assert.equal(sausage.arrival,biteTime(6+i));
    assert.ok(Math.abs((sausage.y-PLAYER_Y)/SPEED+game.time-biteTime(6+i))<1e-8);
  }
});

test('SPEL-003: score follows variable tempo and wraps without resetting game time', () => {
  assert.ok(BITE_CUES.every((cue,i)=>cue>=0 && cue<RECORDING_DURATION && (!i || cue>BITE_CUES[i-1]!)));
  const intervals=BITE_CUES.slice(1).map((cue,i)=>cue-BITE_CUES[i]!);
  assert.ok(Math.max(...intervals)-Math.min(...intervals)>0.1);
  assert.equal(biteTime(BITE_CUES.length+6),RECORDING_DURATION+biteTime(6));
  for (const index of [0,6,50,100,199,206]) assert.ok(biteEnvelope(biteTime(index))>0.99);
});

test('SPEL-001/003: catches between musical accents award exactly once; misses do not', () => {
  const game = createGame(); game.nextPair = 100; game.time=0.6;
  game.sausages=[{ x:game.x,y:PLAYER_Y+12,arrival:0.65,food:0,caught:false },
    { x:30,y:PLAYER_Y,arrival:0.65,food:0,caught:false }];
  step(game,0.05,0,foods);
  assert.equal(game.score,20); assert.equal(game.caught,1);
  step(game,0.05,0,foods); assert.equal(game.score,20);
});

test('SPEL-002: double tap extends sideways and resists immediate reversal', () => {
  const game=createGame(); tap(game,1); step(game,0.1,1,foods); tap(game,1);
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
  const game=createGame(); game.nextPair=100;
  tap(game,1); game.time=0.1; tap(game,1);
  game.sausages=[{ x:game.x+60,y:PLAYER_Y,arrival:0.1,food:0,caught:false }];
  step(game,0,0,foods); assert.equal(game.score,20);
});

test('SPEL-003: dropped frames catch up to audio time with the same catch result', () => {
  const regular=createGame(), stalled=createGame(); regular.x=85; stalled.x=85;
  const end=biteTime(6)+0.1;
  for(let t=0;t<end;t+=1/60) advanceTo(regular,Math.min(t,end),0,foods);
  advanceTo(regular,end,0,foods); advanceTo(stalled,end,0,foods);
  assert.equal(stalled.caught,1); assert.equal(stalled.score,regular.score);
  assert.ok(Math.abs(stalled.time-end)<1e-6);
  const y=stalled.sausages[0]!.y;
  advanceTo(stalled,end,0,foods); assert.equal(stalled.sausages[0]!.y,y);
});
