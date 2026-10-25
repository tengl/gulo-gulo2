import { CRAWL_TIME, HEIGHT, JUMP_TIME, mouthX, PLAYER_Y, SPEED, STUMBLE_TIME, WIDTH, type Food, type Game } from '../domain/game';
import { biteEnvelope } from '../domain/score';
import { drawLog, drawStone, drawWolverine, toonSausage, toonTerrain } from './toon';

export type Artwork = { terrain: HTMLCanvasElement };

// SPEL-004: the cartoon art is drawn in code (toon.ts). The slope is one
// seamless ground tile; roots, crowns, fallen trunks and shadows all share it,
// so trees never move on their own.
export async function loadArtwork(): Promise<Artwork> {
  return { terrain: toonTerrain() };
}

function sausage(c: CanvasRenderingContext2D, x: number, y: number, color: string, points: number, spin: number) {
  c.save(); c.translate(x, y); c.rotate(spin);
  toonSausage(c, color);
  c.rotate(-spin);
  c.font = '900 13px Impact, "Arial Black", sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round';
  c.strokeStyle = '#1a1110'; c.lineWidth = 4; c.strokeText(`${points}`,0,30);
  c.fillStyle = '#ffd25e'; c.fillText(`${points}`,0,30); c.restore();
}

// A small comic cue next to an approaching obstacle: which key gets you past.
function cue(c: CanvasRenderingContext2D, x: number, y: number, text: string) {
  c.save(); c.font = '900 13px Impact, "Arial Black", sans-serif'; c.textAlign = 'center';
  const width = c.measureText(text).width + 16;
  c.fillStyle = '#1a1110'; c.fillRect(x - width / 2 + 3, y - 13, width, 22);
  c.fillStyle = '#fff3d6'; c.fillRect(x - width / 2, y - 16, width, 22);
  c.lineWidth = 2.5; c.strokeStyle = '#1a1110'; c.strokeRect(x - width / 2, y - 16, width, 22);
  c.fillStyle = '#1a1110'; c.fillText(text, x, y); c.restore();
}

export function paint(c: CanvasRenderingContext2D, game: Game, foods: readonly Food[], art: Artwork, reduced: boolean) {
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const backgroundWidth = WIDTH + 32;
  const tileHeight = art.terrain.height / art.terrain.width * backgroundWidth;
  // The ground moves at the same speed as the stones, trees and sausages on it.
  const travel = 190 + game.time * SPEED;
  const top = -(travel % tileHeight);
  for (let y = top; y < HEIGHT; y += tileHeight) c.drawImage(art.terrain,-16,y,backgroundWidth,tileHeight + 0.5);
  // A dusky violet veil with darker edges, the adventure-game evening light.
  c.fillStyle = '#3a1f4a1c'; c.fillRect(0,0,WIDTH,HEIGHT);
  const vignette = c.createRadialGradient(WIDTH/2,HEIGHT*0.4,HEIGHT*0.3,WIDTH/2,HEIGHT*0.4,HEIGHT*0.75);
  vignette.addColorStop(0,'#24123000'); vignette.addColorStop(1,'#24123066');
  c.fillStyle=vignette; c.fillRect(0,0,WIDTH,HEIGHT);

  const visible = (y: number) => y > -80 && y < HEIGHT + 60;
  for (const stone of game.obstacles) if (stone.kind === 'stone' && visible(stone.y)) drawStone(c, stone.x, stone.y, stone.size, stone.tilt);
  for (const food of game.sausages) {
    if (!visible(food.y)) continue;
    const kind = foods[food.food]; if (!kind) continue;
    sausage(c, food.x, food.y, kind.color, kind.points, Math.sin(food.arrival*7)*0.5);
  }

  const now = game.time;
  const lift = now < game.jumpUntil ? Math.sin(Math.PI * (1 - (game.jumpUntil - now) / JUMP_TIME)) : 0;
  const crawlLeft = game.crawlUntil - now;
  const crawl = crawlLeft > 0 ? Math.min(1, (CRAWL_TIME - crawlLeft) / 0.1, crawlLeft / 0.1) : 0;
  const dizzy = Math.max(0, (game.stumbleUntil - now) / STUMBLE_TIME);
  const logs = game.obstacles.filter(item => item.kind === 'log' && visible(item.y));
  // Fallen trees lie above the ground: the wolverine crawls beneath them.
  if (lift > 0) for (const log of logs) drawLog(c, log.y, log.tilt, WIDTH);

  const centerX = mouthX(game);
  // Its shadow stays on the ground and falls further behind during a jump.
  c.save(); c.fillStyle = 'rgba(40, 22, 52, 0.42)';
  c.beginPath(); c.ellipse(centerX + 9 + lift * 24, PLAYER_Y - 60 + lift * 30, 44 * (1 - lift * 0.2), 70 * (1 - lift * 0.2), 0, 0, Math.PI * 2); c.fill();
  c.restore();
  c.save(); c.translate(centerX,PLAYER_Y);
  // Every transform is about the mouth, so the visible bite and the collision
  // point always agree.
  const bank = reduced ? 0 : Math.max(-0.16,Math.min(0.16,game.velocity / 1900));
  const wobble = reduced ? 0 : Math.sin(now * 28) * 0.18 * dizzy;
  c.rotate(-bank + wobble);
  // The figure is drawn a little smaller than its units, leaving room to see ahead.
  const grow = 0.84 * (1 + lift * 0.24);
  c.scale(grow * (1 + crawl * 0.1), grow * (1 - crawl * 0.2));
  const bite = Math.max(biteEnvelope(now), now - game.lastCatch < 0.14 ? 1 : 0);
  drawWolverine(c, { stride: reduced ? 0 : now * Math.PI * 2 * (crawl ? 1.6 : 3.2), mouth: bite,
    crawl, lift, dizzy, time: now });
  c.restore();
  if (!lift) for (const log of logs) drawLog(c, log.y, log.tilt, WIDTH);

  for (const item of game.obstacles) {
    const ahead = item.arrival - now;
    if (ahead < 0.15 || ahead > 1.5) continue;
    if (item.kind === 'log') cue(c, WIDTH - 70, item.y - 26, '↓ KRYP');
    else if (Math.abs(item.x - game.x) < item.size + 40) cue(c, item.x, item.y - item.size - 14, '↑ HOPPA');
  }
  if (game.time < game.dashUntil && !reduced) {
    c.save(); c.strokeStyle='#1a1110'; c.lineWidth=2.5; c.lineCap='round';
    for (let i=0;i<3;i++) { c.beginPath(); c.moveTo(centerX-game.facing*(70+i*9),PLAYER_Y-60+i*16); c.lineTo(centerX-game.facing*(88+i*9),PLAYER_Y-60+i*16); c.stroke(); }
    c.restore();
  }
  const catchAge = now-game.lastCatch;
  if (catchAge < 0.4 && !reduced) {
    c.fillStyle='#ffd25e'; c.strokeStyle='#1a1110'; c.lineWidth=1.5;
    for(let i=0;i<6;i++) { const angle=i*Math.PI/3; c.beginPath(); c.arc(centerX+Math.cos(angle)*catchAge*85, PLAYER_Y+Math.sin(angle)*catchAge*65,3.5*(1-catchAge/0.4),0,Math.PI*2); c.fill(); c.stroke(); }
  }
  if(game.toastUntil>now) {
    // A comic caption box, slightly tilted, below the runner.
    c.save(); c.font='900 15px Impact, "Arial Black", sans-serif'; c.textAlign='center';
    const width=Math.min(410,c.measureText(game.toast).width+34);
    c.translate(WIDTH/2,PLAYER_Y+70); c.rotate(-0.03);
    c.fillStyle='#1a1110'; c.fillRect(-width/2+4,-16+4,width,34);
    c.fillStyle='#ffd25e'; c.fillRect(-width/2,-16,width,34);
    c.lineWidth=3; c.strokeStyle='#1a1110'; c.strokeRect(-width/2,-16,width,34);
    c.fillStyle='#1a1110'; c.fillText(game.toast.toUpperCase(),0,7,390); c.restore();
  }
}
