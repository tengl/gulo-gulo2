'use client';

import { useEffect, useRef, useState } from 'react';
import { createGame, HEIGHT, advanceTo, tap, WIDTH, type Food } from '../domain/game';
import { loadArtwork, paint, type Artwork } from './paint';
import { Waltz } from './music';
import styles from './game.module.css';

type Phase = 'ready' | 'loading' | 'playing' | 'paused';
export function FallingGame({ foods }: { foods: Food[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const game = useRef(createGame());
  const music = useRef<Waltz | null>(null);
  const running = useRef(false);
  const starting = useRef(false);
  const request = useRef({ version: 0 });
  const silentClock = useRef<{ epoch: number | null; offset: number }>({ epoch: null, offset: 0 });
  const direction = useRef(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [artError, setArtError] = useState(false);
  const [score, setScore] = useState(0);
  const [caught, setCaught] = useState(0);
  const [distance, setDistance] = useState(0);
  const [ready, setReady] = useState(false);

  function pause() {
    if (!running.current && !starting.current) return;
    request.current.version++; starting.current = false;
    if (running.current && music.current) advanceTo(game.current, music.current.time(), direction.current, foods);
    running.current = false; direction.current = 0;
    music.current?.pause();
    setScore(game.current.score); setCaught(game.current.caught);
    setDistance(Math.floor(game.current.time * 18)); setPhase('paused');
  }
  async function start(reset = false) {
    const version = ++request.current.version;
    if (reset) { game.current = createGame(); setScore(0); setCaught(0); setDistance(0); }
    starting.current = true; setPhase('loading'); area.current?.focus();
    try {
      music.current ??= new Waltz();
      music.current.mute(muted);
      await music.current.resume(game.current.time);
      if (version === request.current.version) setAudioError(false);
    } catch {
      if (version !== request.current.version) return;
      music.current?.close(); music.current = null; setAudioError(true);
    }
    if (version !== request.current.version) return;
    silentClock.current = { epoch: null, offset: game.current.time };
    starting.current = false; running.current = true; setPhase('playing');
  }
  function press(value: number) {
    if (!running.current) return;
    direction.current = value; tap(game.current, value);
  }
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const lifecycle = request.current;
    let artwork: Artwork | null = null;
    let disposed = false, frame = 0, lastHud = 0;
    void loadArtwork().then(loaded => {
      if (!disposed) { artwork = loaded; setReady(true); }
    }).catch(() => { if (!disposed) setArtError(true); });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const draw = (now: number) => {
      if (running.current) {
        silentClock.current.epoch ??= now;
        const time = music.current?.time() ?? silentClock.current.offset + (now-silentClock.current.epoch)/1000;
        advanceTo(game.current, time, direction.current, foods);
        if (now-lastHud>100) {
          setScore(game.current.score); setCaught(game.current.caught);
          setDistance(Math.floor(game.current.time*18)); lastHud=now;
        }
      }
      if (artwork) {
        ctx.setTransform(2,0,0,2,0,0);
        paint(ctx, game.current, foods, artwork, reduced.matches);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const stop = () => {
      if (running.current || starting.current) {
        request.current.version++; starting.current = false;
        running.current = false; direction.current = 0;
        music.current?.pause(); setPhase('paused');
      }
    };
    const visibility = () => { if (document.hidden) stop(); };
    window.addEventListener('blur', stop); document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true; lifecycle.version++; cancelAnimationFrame(frame);
      window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', visibility);
      music.current?.close(); music.current = null; running.current = false; starting.current = false;
    };
  }, [foods]);

  return <section className={styles.game} aria-labelledby="game-title">
    <header className={styles.heading}>
      <div><span className={styles.eyebrow}>GULO GULO · ETT HÄLSINGEÄVENTYR</span><h1 id="game-title">Fritt fall. <em>Full aptit.</em></h1></div>
      <p>En järv. Ett stup. Alldeles för mycket korv.</p>
    </header>
    <div className={styles.layout}>
      <div ref={area} className={styles.machine} tabIndex={0} aria-label="Spelområde. Styr med piltangenter eller A och D. Escape pausar."
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) pause(); }}
        onKeyDown={e => {
          const key = e.key.toLowerCase();
          const d = key === 'arrowleft' || key === 'a' ? -1 : key === 'arrowright' || key === 'd' ? 1 : 0;
          if (d) { e.preventDefault(); if (!e.repeat) press(d); }
          if (key === 'escape') pause();
        }}
        onKeyUp={e => {
          const key = e.key.toLowerCase();
          const d = key === 'arrowleft' || key === 'a' ? -1 : key === 'arrowright' || key === 'd' ? 1 : 0;
          if (d) { e.preventDefault(); if (direction.current === d) direction.current = 0; }
        }}>
        <div className={styles.hud}><span><small>POÄNG</small><strong data-testid="game-score">{String(score).padStart(5, '0')}</strong></span><span><small>FALLET</small><strong>{distance} m</strong></span><button disabled={!ready || (phase !== 'playing' && phase !== 'loading')} onClick={pause}>Pausa</button></div>
        <div className={styles.screen}>
          <canvas ref={canvas} width={WIDTH * 2} height={HEIGHT * 2} aria-label="Järven dyker med huvud och framtassar först ovanför en skogsklädd bergssluttning och fångar korvar." />
          {phase !== 'playing' && <div className={styles.overlay}><span className={styles.tag}>HÄLSINGLAND, NÅGONSTANS OVANFÖR MARKEN</span><h2>{phase === 'ready' ? 'Nu hugger vi in.' : phase === 'loading' ? 'Orkestern gör sig redo.' : 'En liten andningspaus.'}</h2><p>{phase === 'ready' ? 'Korven är i luften. Följ efter och fånga så mycket du kan.' : phase === 'loading' ? 'Snart bär det utför, till tonerna av Strauss.' : `${caught} korvar fångade · ${score} poäng`}</p><button className={styles.start} disabled={!ready || phase === 'loading'} onClick={() => void start()}>{!ready ? 'Laddar skogen…' : phase === 'ready' ? 'Hoppa efter korven' : phase === 'loading' ? 'Laddar musiken…' : 'Fortsätt falla'} <span aria-hidden="true">↓</span></button>{phase === 'paused' && <button className={styles.restart} onClick={() => void start(true)}>Börja om</button>}</div>}
        </div>
        {artError && <p className={styles.assetError} role="alert">Bilderna kunde inte laddas. <button onClick={() => window.location.reload()}>Försök igen</button></p>}
        <div className={styles.controls}>
          {([-1, 1] as const).map(d => <button key={d} disabled={!ready || phase !== 'playing'} aria-label={d < 0 ? 'Styr vänster' : 'Styr höger'}
            onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); press(d); }}
            onPointerUp={() => { direction.current = 0; }} onPointerCancel={() => { direction.current = 0; }} onLostPointerCapture={() => { direction.current = 0; }}
            onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(d); } }}
            onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') direction.current = 0; }}>
            <span aria-hidden="true">{d < 0 ? '←' : '→'}</span><small>{d < 0 ? 'VÄNSTER / A' : 'HÖGER / D'}</small></button>)}
        </div>
      </div>
      <aside className={styles.notes}>
        <span className={styles.eyebrow}>01 / KORVFALLET</span>
        <h2>Släpp taget.<br />Behåll aptiten.</h2>
        <p>Styr järven i sidled med <strong>← →</strong> eller <strong>A / D</strong>. På mobilen håller du nere knapparna under spelet.</p>
        <p><strong>Dubbeltryck åt samma håll</strong> för ett snabbt hugg åt sidan. Du når längre, men det tar en stund att vända tillbaka.</p>
        <div className={styles.music}><span aria-hidden="true">♫</span><div><strong>En vals på vägen ner</strong><p>An der schönen blauen Donau<br />Johann Strauss II · orkesterinspelning</p></div><button disabled={!ready} aria-pressed={muted} onClick={() => { music.current?.mute(!muted); setMuted(!muted); }}>{muted ? 'Slå på ljud' : 'Tysta'}</button></div>
        {audioError && <p role="status">Ljudet kunde inte starta i webbläsaren. Du kan fortsätta spela utan musik.</p>}
        <p className={styles.credit}>Inspelning: European Archive via Musopen / <a href="https://commons.wikimedia.org/wiki/File:Strauss,_An_der_sch%C3%B6nen_blauen_Donau.ogg" target="_blank" rel="noreferrer">Wikimedia Commons</a> · CC0.</p>
        <p className={styles.hint}>Två korvar, två tuggor. Hitta valsens takt — men fånga gärna även mellan slagen.</p>
        <details><summary>Vad står på menyn?</summary><ul>{foods.map(food => <li key={food.id}><span style={{ color: food.color }}>●</span> {food.name}<strong>{food.points} p</strong></li>)}</ul></details>
        <p className={styles.footnote}>Första kapitlet. Fallet fortsätter så länge du vill — pausa för att se din fångst eller börja om.</p>
      </aside>
    </div>
  </section>;
}
