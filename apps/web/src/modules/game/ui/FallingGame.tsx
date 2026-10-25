'use client';

import { useEffect, useRef, useState } from 'react';
import { createGame, crawl, HEIGHT, advanceTo, jump, tap, WIDTH, type Food } from '../domain/game';
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
  // SPEL-002: up jumps over a stone, down crawls under a fallen tree.
  function act(kind: 'jump' | 'crawl') {
    if (!running.current) return;
    if (kind === 'jump') jump(game.current); else crawl(game.current);
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
      <div><span className={styles.eyebrow}>GULO GULO · ETT HÄLSINGEÄVENTYR</span><h1 id="game-title">Full fart. <em>Full aptit.</em></h1></div>
      <p>En järv. Ett berg. Alldeles för mycket korv.</p>
    </header>
    <div className={styles.layout}>
      <div ref={area} className={styles.machine} tabIndex={0} aria-label="Spelområde. Styr med vänster- och högerpil eller A och D, hoppa med uppåtpil eller W och kryp med nedåtpil eller S. Escape pausar."
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) pause(); }}
        onKeyDown={e => {
          const key = e.key.toLowerCase();
          const d = key === 'arrowleft' || key === 'a' ? -1 : key === 'arrowright' || key === 'd' ? 1 : 0;
          if (d) { e.preventDefault(); if (!e.repeat) press(d); }
          if (key === 'arrowup' || key === 'w') { e.preventDefault(); if (!e.repeat) act('jump'); }
          if (key === 'arrowdown' || key === 's') { e.preventDefault(); if (!e.repeat) act('crawl'); }
          if (key === 'escape') pause();
        }}
        onKeyUp={e => {
          const key = e.key.toLowerCase();
          const d = key === 'arrowleft' || key === 'a' ? -1 : key === 'arrowright' || key === 'd' ? 1 : 0;
          if (d) { e.preventDefault(); if (direction.current === d) direction.current = 0; }
        }}>
        <div className={styles.hud}><span><small>POÄNG</small><strong data-testid="game-score">{String(score).padStart(5, '0')}</strong></span><span><small>STRÄCKA</small><strong>{distance} m</strong></span><button disabled={!ready || (phase !== 'playing' && phase !== 'loading')} onClick={pause}>Pausa</button></div>
        <div className={styles.screen}>
          <canvas ref={canvas} width={WIDTH * 2} height={HEIGHT * 2} aria-label="Järven springer nedför en skogsklädd bergssluttning i Hälsingland, hoppar över stenar, kryper under fallna träd och fångar korvar." />
          {phase !== 'playing' && <div className={styles.overlay}><span className={styles.tag}>HÄLSINGLAND, PÅ VÄG NEDFÖR BERGET</span><h2>{phase === 'ready' ? 'Nu hugger vi in.' : phase === 'loading' ? 'Orkestern gör sig redo.' : 'En liten andningspaus.'}</h2><p>{phase === 'ready' ? 'Korvarna ligger utspridda nedför berget. Spring efter och fånga så många du kan.' : phase === 'loading' ? 'Snart bär det utför, till tonerna av Strauss.' : `${caught} korvar fångade · ${score} poäng`}</p><button className={styles.start} disabled={!ready || phase === 'loading'} onClick={() => void start()}>{!ready ? 'Laddar skogen…' : phase === 'ready' ? 'Spring efter korven' : phase === 'loading' ? 'Laddar musiken…' : 'Fortsätt springa'} <span aria-hidden="true">↓</span></button>{phase === 'paused' && <button className={styles.restart} onClick={() => void start(true)}>Börja om</button>}</div>}
        </div>
        {artError && <p className={styles.assetError} role="alert">Bilderna kunde inte laddas. <button onClick={() => window.location.reload()}>Försök igen</button></p>}
        <div className={styles.controls}>
          {([
            { key: 'left', label: 'Styr vänster', icon: '←', hint: 'A' },
            { key: 'jump', label: 'Hoppa', icon: '↑', hint: 'W' },
            { key: 'crawl', label: 'Kryp', icon: '↓', hint: 'S' },
            { key: 'right', label: 'Styr höger', icon: '→', hint: 'D' },
          ] as const).map(control => {
            const steer = control.key === 'left' ? -1 : control.key === 'right' ? 1 : 0;
            const down = () => { if (steer) press(steer); else act(control.key as 'jump' | 'crawl'); };
            const up = () => { if (steer && direction.current === steer) direction.current = 0; };
            return <button key={control.key} disabled={!ready || phase !== 'playing'} aria-label={control.label}
              onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); down(); }}
              onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up}
              onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down(); } }}
              onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') up(); }}>
              <span aria-hidden="true">{control.icon}</span><small>{control.hint}</small></button>;
          })}
        </div>
      </div>
      <aside className={styles.notes}>
        <span className={styles.eyebrow}>01 / NEDFÖR BERGET</span>
        <h2>Spring fort.<br />Behåll aptiten.</h2>
        <p>Styr järven i sidled med <strong>← →</strong> eller <strong>A / D</strong>. På mobilen håller du nere knapparna under spelet.</p>
        <p><strong>↑ eller W</strong> hoppar över en sten. <strong>↓ eller S</strong> kryper under ett fallet träd, och det ligger alltid tvärs över hela stigen.</p>
        <p>Krockar du snubblar järven en stund och tappar 10 poäng. <strong>Dubbeltryck åt samma håll</strong> ger ett snabbt hugg åt sidan efter en korv.</p>
        <div className={styles.music}><span aria-hidden="true">♫</span><div><strong>En vals på vägen ner</strong><p>An der schönen blauen Donau<br />Johann Strauss II · orkesterinspelning</p></div><button disabled={!ready} aria-pressed={muted} onClick={() => { music.current?.mute(!muted); setMuted(!muted); }}>{muted ? 'Slå på ljud' : 'Tysta'}</button></div>
        {audioError && <p role="status">Ljudet kunde inte starta i webbläsaren. Du kan fortsätta spela utan musik.</p>}
        <p className={styles.credit}>Inspelning: European Archive via Musopen / <a href="https://commons.wikimedia.org/wiki/File:Strauss,_An_der_sch%C3%B6nen_blauen_Donau.ogg" target="_blank" rel="noreferrer">Wikimedia Commons</a> · CC0.</p>
        <p className={styles.hint}>Stenarna och stockarna kommer i valsens takt. Lyssna, så vet du när det är dags.</p>
        <details><summary>Vad står på menyn?</summary><ul>{foods.map(food => <li key={food.id}><span style={{ color: food.color }}>●</span> {food.name}<strong>{food.points} p</strong></li>)}</ul></details>
        <p className={styles.footnote}>Första kapitlet. Berget tar aldrig slut — pausa för att se din fångst eller börja om.</p>
      </aside>
    </div>
  </section>;
}
