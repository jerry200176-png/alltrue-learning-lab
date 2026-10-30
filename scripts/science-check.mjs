import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto(`${origin}#lesson/projectile-step`);
  await page.locator('iframe').waitFor();
  const frame = page.frames()[1];
  await frame.waitForFunction(() => Number(document.querySelector('#right .kpi .vv')?.textContent) > 0, null, { timeout: 30000 });
  const v = Number(await frame.locator('#right .kpi .vv').innerText());
  const xs = [];
  for (const height of [20, 80, 180, 320]) {
    await frame.getByRole('button', { name: String(height), exact: true }).click();
    const expected = 1000 * v * Math.sqrt(2 * height / 1000 / 9.8);
    await frame.waitForFunction(expectedValue => {
      const value = Number(document.querySelector('#right .sub[data-k=x] b')?.textContent);
      return Number.isFinite(value) && Math.abs(value - expectedValue) < 0.15;
    }, expected, { timeout: 15000 });
    const x = Number(await frame.locator('#right .sub[data-k=x] b').innerText());
    assert.ok(Math.abs(x - expected) < 0.15, `height ${height}: x=${x}, expected=${expected}`);
    xs.push(x);
  }
  // Heights 20, 80, 180, 320 mm correspond to t, 2t, 3t, 4t.
  for (let i = 1; i < xs.length; i++) assert.ok(Math.abs(xs[i] / xs[0] - (i + 1)) < 0.01);
  const k = Number(await frame.locator('#right .sub[data-k=k] b').innerText());
  assert.ok(Math.abs(k - 9.8 / (2 * v * v)) < 0.001);
  console.log('PASS: projectile controls and x=v₀√(2y/g), equal-time horizontal intervals, y=kx²');
} finally { await browser.close(); }
