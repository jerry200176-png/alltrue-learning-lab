import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto(`${origin}#lesson/projectile-step`);
  await page.getByRole('heading', { name: '實驗：探究水平拋射運動的特點', exact: true }).waitFor();
  await page.locator('iframe[title^="實驗：探究水平拋射運動的特點"]').waitFor();
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
  await page.goto(`${origin}#lesson/earth-motion-step`);
  await page.getByRole('heading', { name: '地球運動的地理意義', exact: true }).waitFor();
  await page.locator('iframe[title^="地球運動的地理意義"]').waitFor();
  const earth = page.frames()[1];
  await earth.locator('#right input[data-key=lat]').waitFor();
  // Model date 172 is approximately the June solstice (declination +23.44°).
  for (const latitude of [0, 23, 40, -20]) {
    await earth.locator('#right input[data-key=lat]').fill(String(latitude));
    const expected = 90 - Math.abs(latitude - 23.44);
    await earth.waitForFunction(expectedValue => {
      const value = Number.parseFloat(document.querySelector('#right .sub[data-k=noonAlt] b')?.textContent || '');
      return Number.isFinite(value) && Math.abs(value - expectedValue) < 0.15;
    }, expected, { timeout: 15000 });
    const actual = Number.parseFloat(await earth.locator('#right .sub[data-k=noonAlt] b').innerText());
    assert.ok(Math.abs(actual - expected) < 0.15, `latitude ${latitude}: noon=${actual}, expected=${expected}`);
  }
  console.log('PASS: latitude control and June-solstice noon altitude 90−|φ−δ|');
  await page.goto(`${origin}#lesson/enzyme-step`);
  await page.getByRole('heading', { name: '影響酵素活性的條件', exact: true }).waitFor();
  await page.locator('iframe[title^="影響酵素活性的條件"]').waitFor();
  const enzyme = page.frames()[1];
  await enzyme.locator('#right input[data-key=T]').waitFor();
  for (const [temperature, minimum, maximum] of [[37, 80, 101], [0, 0, 50], [37, 80, 101], [70, 0, 50]]) {
    await enzyme.locator('#right input[data-key=T]').fill(String(temperature));
    await enzyme.waitForFunction(({ min, max }) => {
      const text = document.querySelector('#right .kpi .vv')?.textContent || '';
      const value = Number.parseFloat(text);
      return Number.isFinite(value) && value >= min && value < max;
    }, { min: minimum, max: maximum }, { timeout: 20000 });
  }
  console.log('PASS: enzyme activity changes with temperature in the upstream model');
  await page.goto(`${origin}#lesson/titration-step`);
  await page.getByRole('heading', { name: '強酸與強鹼的中和滴定', exact: true }).waitFor();
  await page.locator('iframe[title^="強酸與強鹼的中和滴定"]').waitFor();
  const titration = page.frames()[1];
  await titration.locator('#right input[data-key=V]').waitFor();
  // The upstream model uses 20.00 mL NaOH and 0.1000 M HCl, with equivalence at 21.04 mL.
  for (const volume of [0, 10, 20, 25, 40]) {
    await titration.locator('#right input[data-key=V]').fill(String(volume));
    const excess = 0.1 * (21.04 - volume) / (20 + volume);
    const expected = excess > 0 ? 14 + Math.log10(excess) : -Math.log10(-excess);
    await titration.waitForFunction(expectedValue => {
      const value = Number.parseFloat(document.querySelector('#right .kpi .vv')?.textContent || '');
      return Number.isFinite(value) && Math.abs(value - expectedValue) < 0.12;
    }, expected, { timeout: 25000 });
    const read = Number.parseFloat(await titration.locator('#right .sub[data-k=Vread] b').innerText());
    assert.ok(Math.abs(read - volume) < 0.01, `volume ${volume}: reading ${read}`);
  }
  await titration.locator('#right input[data-key=V]').fill('21');
  await titration.locator('#right input[data-key=dV]').fill('0.04');
  await titration.waitForFunction(() => Math.abs(Number.parseFloat(document.querySelector('#right .sub[data-k=cCalc] b')?.textContent || '') - 0.1052) < 0.00005, null, { timeout: 20000 });
  console.log('PASS: strong-acid/strong-base pH, burette readings and equivalence concentration');
} finally { await browser.close(); }
