import { expect, test } from '@playwright/test';

test('SPEL-001–003: start, steer, pause, mute and restart the fall', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/spel');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Full aptit');
  await page.getByRole('button', { name: 'Spring efter korven' }).click();
  await expect(page.getByRole('button', { name: 'Styr vänster' })).toBeEnabled();
  if (info.project.name === 'mobile') {
    const left = page.getByRole('button', { name: 'Styr vänster' });
    await left.tap();
    await left.tap();
    await page.waitForTimeout(600);
  } else {
    await page.keyboard.down('a'); await page.waitForTimeout(600); await page.keyboard.up('a');
    await page.keyboard.press('d'); await page.keyboard.press('d');
  }
  // SPEL-002: up and down are game moves, not page scrolling.
  await expect(page.getByRole('button', { name: 'Hoppa', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Kryp', exact: true })).toBeEnabled();
  const scroll = await page.evaluate(() => window.scrollY);
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Hoppa', exact: true }).tap();
    await page.getByRole('button', { name: 'Kryp', exact: true }).tap();
  } else {
    await page.keyboard.press('ArrowUp'); await page.waitForTimeout(700); await page.keyboard.press('ArrowDown');
  }
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  await page.getByRole('button', { name: 'Pausa', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'En liten andningspaus.' })).toBeVisible();
  const distance = await page.locator('[class*="hud"]').innerText();
  await page.waitForTimeout(300);
  expect(await page.locator('[class*="hud"]').innerText()).toEqual(distance);
  await page.getByRole('button', { name: 'Tysta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Slå på ljud' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Börja om' }).click();
  await expect(page.getByRole('button', { name: 'Styr vänster' })).toBeEnabled();
  await expect(page.getByTestId('game-score')).toHaveText('00000');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Fortsätt springa' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


test('SPEL-001/003: actual catch, decoded orchestra, pause/resume and mute', async ({ page }, info) => {
  await page.addInitScript(() => {
    const original = AudioBufferSourceNode.prototype.start;
    const stop = AudioBufferSourceNode.prototype.stop;
    Object.assign(window, { gameAudio: { starts: [] as { offset: number; duration: number; loop: boolean }[], stops: 0 } });
    AudioBufferSourceNode.prototype.start = function (...args) {
      const state = window as unknown as { gameAudio: { starts: unknown[] } };
      state.gameAudio.starts.push({ offset: args[1] ?? 0, duration: this.buffer?.duration ?? 0, loop: this.loop });
      return original.apply(this, args);
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      (window as unknown as { gameAudio: { stops: number } }).gameAudio.stops++;
      return stop.apply(this, args);
    };
  });
  await page.goto('/spel');
  await page.getByRole('button', { name: 'Spring efter korven' }).click();
  await expect(page.getByRole('button', { name: 'Styr vänster' })).toBeEnabled();
  // The seeded slope puts sausages in the path of a wolverine running straight.
  await expect(page.getByTestId('game-score')).not.toHaveText('00000', { timeout: 9000 });
  const audio = () => page.evaluate(() => (window as unknown as { gameAudio: { starts: { offset:number; duration:number; loop:boolean }[]; stops:number } }).gameAudio);
  const playing = await audio();
  expect(playing.starts).toHaveLength(1);
  expect(playing.starts[0]!.duration).toBeCloseTo(177.5328, 1);
  expect(playing.starts[0]!.loop).toBe(true);
  await page.screenshot({ path: `/tmp/gulo-game-v2-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Pausa', exact: true }).click();
  expect((await audio()).stops).toBe(1);
  await page.getByRole('button', { name: 'Tysta', exact: true }).click();
  await page.getByRole('button', { name: 'Fortsätt springa' }).click();
  await expect(page.getByRole('button', { name: 'Styr vänster' })).toBeEnabled();
  const resumed=await audio();
  expect(resumed.starts).toHaveLength(2);
  expect(resumed.starts[1]!.offset).toBeGreaterThan(5);
  await expect(page.getByRole('button', { name: 'Slå på ljud' })).toHaveAttribute('aria-pressed','true');
});

test('SPEL-003: cancelling loading cannot start a late recording or game', async ({ page }) => {
  await page.route('**/game/blue-danube.ogg',async route=>{
    await new Promise(resolve=>setTimeout(resolve,1000)); await route.continue();
  });
  await page.goto('/spel');
  await page.getByRole('button', { name: 'Spring efter korven' }).click();
  await expect(page.getByRole('heading', { name:'Orkestern gör sig redo.' })).toBeVisible();
  await page.getByRole('button', { name:'Pausa',exact:true }).click();
  await page.waitForTimeout(1400);
  await expect(page.getByRole('button',{name:'Fortsätt springa'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Styr vänster'})).toBeDisabled();
  await page.getByRole('button',{name:'Fortsätt springa'}).click();
  await expect(page.getByRole('button',{name:'Styr vänster'})).toBeEnabled();
});

test('SPEL-003: failed audio has a visible silent-play fallback', async ({ page }) => {
  await page.route('**/game/blue-danube.*', route=>route.abort());
  await page.goto('/spel');
  await page.getByRole('button',{name:'Spring efter korven'}).click();
  await expect(page.getByRole('status')).toContainText('Ljudet kunde inte starta');
  await expect(page.getByRole('button',{name:'Styr vänster'})).toBeEnabled();
});
