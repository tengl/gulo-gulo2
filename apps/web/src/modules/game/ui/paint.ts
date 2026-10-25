import { HEIGHT, mouthX, PLAYER_Y, WIDTH, type Food, type Game } from '../domain/game';
import { biteEnvelope } from '../domain/score';
import { CELL, toonSausage, toonTerrain, toonWolverine } from './toon';

export type Artwork = { terrain: HTMLCanvasElement; wolverine: HTMLCanvasElement };

// SPEL-004: the cartoon art is drawn once in code (toon.ts). The slope is one
// seamless ground tile; roots, crowns, fallen trunks and shadows all share it,
// so trees never move on their own.
export async function loadArtwork(): Promise<Artwork> {
  return { terrain: toonTerrain(), wolverine: toonWolverine() };
}

function sausage(c: CanvasRenderingContext2D, x: number, y: number, color: string, points: number, spin: number) {
  c.save(); c.translate(x, y); c.rotate(spin);
  toonSausage(c, color);
  c.rotate(-spin);
  c.font = '900 13px Impact, "Arial Black", sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round';
  c.strokeStyle = '#1a1110'; c.lineWidth = 4; c.strokeText(`${points}`,0,30);
  c.fillStyle = '#ffd25e'; c.fillText(`${points}`,0,30); c.restore();
}

export function paint(c: CanvasRenderingContext2D, game: Game, foods: readonly Food[], art: Artwork, reduced: boolean) {
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const backgroundWidth = WIDTH + 32;
  const tileHeight = art.terrain.height / art.terrain.width * backgroundWidth;
  const travel = reduced ? 190 : 190 + game.time * 100;
  const top = -(travel % tileHeight);
  // The entire hillside moves uphill beneath the descending animal.
  for (let y = top; y < HEIGHT; y += tileHeight) c.drawImage(art.terrain,-16,y,backgroundWidth,tileHeight + 0.5);
  // A dusky violet veil with darker edges lifts the airborne animal off the ground.
  c.fillStyle = '#3a1f4a26'; c.fillRect(0,0,WIDTH,HEIGHT);
  const vignette = c.createRadialGradient(WIDTH/2,HEIGHT*0.4,HEIGHT*0.3,WIDTH/2,HEIGHT*0.4,HEIGHT*0.75);
  vignette.addColorStop(0,'#24123000'); vignette.addColorStop(1,'#24123066');
  c.fillStyle=vignette; c.fillRect(0,0,WIDTH,HEIGHT);
  for (const food of game.sausages) {
    if (food.y > HEIGHT+35) continue;
    const kind = foods[food.food]; if (!kind) continue;
    sausage(c, food.x, food.y, kind.color, kind.points, Math.sin(game.time*1.5+food.food)*0.23);
  }
  const dash = game.time < game.dashUntil;
  const bite = Math.max(biteEnvelope(game.time), game.time - game.lastCatch < 0.12 ? 0.9 : 0);
  const centerX = mouthX(game);
  c.save(); c.translate(centerX,PLAYER_Y);
  // Rotate about the mouth, so the visible bite and collision position agree.
  const bank = reduced ? 0 : Math.max(-0.16,Math.min(0.16,game.velocity / 1900));
  c.rotate(-bank);
  const cellWidth = art.wolverine.width / 2;
  // The cell's mouth lands exactly on the collision point.
  const bodyX = -CELL.mouthX, bodyY = -CELL.mouthY;
  c.shadowColor = '#24123066'; c.shadowBlur = 0; c.shadowOffsetX = 10; c.shadowOffsetY = 14;
  c.drawImage(art.wolverine,0,0,cellWidth,art.wolverine.height,bodyX,bodyY,CELL.width,CELL.height);
  c.shadowColor = 'transparent';
  if (bite > 0) {
    c.globalAlpha = bite;
    c.drawImage(art.wolverine,cellWidth,0,cellWidth,art.wolverine.height,bodyX,bodyY,CELL.width,CELL.height);
  }
  c.restore();
  if (dash && !reduced) {
    c.save(); c.strokeStyle='#1a1110'; c.lineWidth=2.5; c.lineCap='round';
    for (let i=0;i<3;i++) { c.beginPath(); c.moveTo(centerX-game.facing*(58+i*9),PLAYER_Y-45+i*16); c.lineTo(centerX-game.facing*(76+i*9),PLAYER_Y-45+i*16); c.stroke(); }
    c.restore();
  }
  const catchAge = game.time-game.lastCatch;
  if (catchAge < 0.4 && !reduced) {
    c.fillStyle='#ffd25e'; c.strokeStyle='#1a1110'; c.lineWidth=1.5;
    for(let i=0;i<6;i++) { const angle=i*Math.PI/3; c.beginPath(); c.arc(centerX+Math.cos(angle)*catchAge*85, PLAYER_Y+Math.sin(angle)*catchAge*65,3.5*(1-catchAge/0.4),0,Math.PI*2); c.fill(); c.stroke(); }
  }
  if(game.toastUntil>game.time) {
    // A comic caption box, slightly tilted.
    c.save(); c.font='900 15px Impact, "Arial Black", sans-serif'; c.textAlign='center';
    const width=Math.min(410,c.measureText(game.toast).width+34);
    c.translate(WIDTH/2,271); c.rotate(-0.03);
    c.fillStyle='#1a1110'; c.fillRect(-width/2+4,-16+4,width,34);
    c.fillStyle='#ffd25e'; c.fillRect(-width/2,-16,width,34);
    c.lineWidth=3; c.strokeStyle='#1a1110'; c.strokeRect(-width/2,-16,width,34);
    c.fillStyle='#1a1110'; c.fillText(game.toast.toUpperCase(),0,7,390); c.restore();
  }
}
