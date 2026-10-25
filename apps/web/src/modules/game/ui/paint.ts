import { HEIGHT, mouthX, PLAYER_Y, WIDTH, type Food, type Game } from '../domain/game';
import { biteEnvelope } from '../domain/score';

export type Artwork = { terrain: HTMLCanvasElement; wolverine: HTMLImageElement };

export async function loadArtwork(): Promise<Artwork> {
  const load = async (path: string) => {
    const image = new Image(); image.src = path; await image.decode(); return image;
  };
  const [slope, wolverine] = await Promise.all([
    load('/game/halsingland-slope.webp'), load('/game/wolverine-dive.webp'),
  ]);
  // One ground plane: roots, crowns, fallen trunks and shadows all share the
  // same translation. Feather the repeating edge once, never move trees alone.
  const overlap = 256;
  const terrain = document.createElement('canvas');
  terrain.width = slope.naturalWidth; terrain.height = slope.naturalHeight - overlap;
  const c = terrain.getContext('2d')!;
  c.drawImage(slope, 0, overlap, terrain.width, terrain.height, 0, 0, terrain.width, terrain.height);
  const seam = document.createElement('canvas'); seam.width = terrain.width; seam.height = overlap;
  const s = seam.getContext('2d')!;
  s.drawImage(slope, 0, 0, seam.width, overlap, 0, 0, seam.width, overlap);
  s.globalCompositeOperation = 'destination-in';
  const fade = s.createLinearGradient(0, 0, 0, overlap);
  fade.addColorStop(0, 'transparent'); fade.addColorStop(1, '#000');
  s.fillStyle = fade; s.fillRect(0, 0, seam.width, overlap);
  c.drawImage(seam, 0, terrain.height - overlap);
  return { terrain, wolverine };
}

function sausage(c: CanvasRenderingContext2D, x: number, y: number, color: string, points: number, spin: number) {
  c.save(); c.translate(x, y); c.rotate(spin);
  c.shadowColor = '#17201477'; c.shadowBlur = 9; c.shadowOffsetY = 7;
  c.lineCap = 'round'; c.lineWidth = 18; c.strokeStyle = '#382015';
  c.beginPath(); c.moveTo(-17,-3); c.quadraticCurveTo(0,9,17,-3); c.stroke();
  c.shadowColor = 'transparent';
  const casing = c.createLinearGradient(0,-10,0,11);
  casing.addColorStop(0,'#f2cb8c'); casing.addColorStop(0.3,color); casing.addColorStop(1,'#70361f');
  c.lineWidth = 14; c.strokeStyle = casing; c.stroke();
  c.strokeStyle = '#f7dba17a'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-13,-5); c.quadraticCurveTo(-4,0,6,-2); c.stroke();
  c.strokeStyle = '#74452c'; c.lineWidth = 2;
  for (let i=0;i<3;i++) { c.beginPath(); c.moveTo(-8+i*8,-4); c.lineTo(-10+i*8,5); c.stroke(); }
  c.fillStyle = '#c08951';
  for (const direction of [-1,1]) { c.beginPath(); c.moveTo(direction*22,-3); c.lineTo(direction*27,-7); c.lineTo(direction*27,1); c.fill(); }
  c.rotate(-spin);
  c.font = '600 11px monospace'; c.textAlign = 'center';
  c.strokeStyle = '#202b23'; c.lineWidth = 3; c.strokeText(`${points}`,0,28);
  c.fillStyle = '#ffebba'; c.fillText(`${points}`,0,28); c.restore();
}

export function paint(c: CanvasRenderingContext2D, game: Game, foods: readonly Food[], art: Artwork, reduced: boolean) {
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const backgroundWidth = WIDTH + 32;
  const tileHeight = art.terrain.height / art.terrain.width * backgroundWidth;
  const travel = reduced ? 190 : 190 + game.time * 100;
  const top = -(travel % tileHeight);
  // The entire hillside moves uphill beneath the descending animal.
  for (let y = top; y < HEIGHT; y += tileHeight) c.drawImage(art.terrain,-16,y,backgroundWidth,tileHeight + 0.5);
  // Cool atmospheric veil separates the airborne animal from the ground.
  c.fillStyle = '#132c363b'; c.fillRect(0,0,WIDTH,HEIGHT);
  const haze = c.createLinearGradient(0,0,0,HEIGHT);
  haze.addColorStop(0,'#c6d7c72e'); haze.addColorStop(0.6,'#c6d7c700'); haze.addColorStop(1,'#172c312e');
  c.fillStyle=haze; c.fillRect(0,0,WIDTH,HEIGHT);
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
  const cellWidth = art.wolverine.naturalWidth / 2;
  const bodyWidth = 150, bodyHeight = 200;
  const bodyY = -150;
  c.shadowColor = '#12201b55'; c.shadowBlur = 12; c.shadowOffsetY = 7;
  c.drawImage(art.wolverine,0,0,cellWidth,art.wolverine.naturalHeight,-bodyWidth/2,bodyY,bodyWidth,bodyHeight);
  c.shadowColor = 'transparent';
  if (bite > 0) {
    c.globalAlpha = bite;
    c.drawImage(art.wolverine,cellWidth,0,cellWidth,art.wolverine.naturalHeight,-bodyWidth/2,bodyY,bodyWidth,bodyHeight);
  }
  c.restore();
  if (dash && !reduced) {
    c.save(); c.strokeStyle='#f3dfad99'; c.lineWidth=1.5;
    for (let i=0;i<3;i++) { c.beginPath(); c.moveTo(centerX-game.facing*(58+i*9),PLAYER_Y-45+i*16); c.lineTo(centerX-game.facing*(76+i*9),PLAYER_Y-45+i*16); c.stroke(); }
    c.restore();
  }
  const catchAge = game.time-game.lastCatch;
  if (catchAge < 0.4 && !reduced) {
    c.fillStyle='#e9c68a';
    for(let i=0;i<6;i++) { const angle=i*Math.PI/3; c.beginPath(); c.arc(centerX+Math.cos(angle)*catchAge*85, PLAYER_Y+Math.sin(angle)*catchAge*65,2*(1-catchAge/0.4),0,Math.PI*2); c.fill(); }
  }
  if(game.toastUntil>game.time) {
    c.save(); c.font='600 13px sans-serif'; c.textAlign='center';
    const width=Math.min(410,c.measureText(game.toast).width+30);
    c.fillStyle='#162d28e8'; c.beginPath(); c.roundRect((WIDTH-width)/2,255,width,32,16); c.fill();
    c.fillStyle='#ffdf9f'; c.fillText(game.toast,WIDTH/2,276,390); c.restore();
  }
}
