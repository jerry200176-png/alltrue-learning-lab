import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const engine = process.env.LAB_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = engine === 'webkit' ? await webkit.launch({ headless: process.env.WEBKIT_HEADED !== '1' }) : await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const tile = readFileSync('public/logo.jpg');
const lods = Array.from({ length: 20 }, (_, level) => ({ level, resolution: 156543.03392804097 / 2 ** level, scale: 591657527.591555 / 2 ** level }));
const metadata = { currentVersion: 11.3, tileInfo: { rows: 256, cols: 256, dpi: 96, format: 'JPEG', origin: { x: -20037508.342787, y: 20037508.342787 }, spatialReference: { wkid: 102100 }, lods }, fullExtent: { xmin: -20037508, ymin: -20037508, xmax: 20037508, ymax: 20037508, spatialReference: { wkid: 102100 } }, copyrightText: 'Test Esri attribution' };
try {
  for (const mobile of [false, true]) {
    const device = engine === 'webkit' && mobile ? Object.fromEntries(Object.entries(devices['iPhone 13']).filter(([key]) => key !== 'defaultBrowserType')) : { viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 850 }, ...(mobile ? { isMobile: true, hasTouch: true } : {}) };
    const context = await browser.newContext(device); const page = await context.newPage(); const errors = []; const tileLevels = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://terrain.reearth.land/**', route => route.abort());
    await page.route('https://services.arcgisonline.com/**', route => {
      const match = route.request().url().match(/\/tile\/(\d+)\/(\d+)\/(\d+)/u);
      if (!match) return route.fulfill({ json: metadata, headers: { 'access-control-allow-origin': '*' } });
      if (match[1] === '19' && match[2] === '0' && match[3] === '0') return route.abort();
      tileLevels.push(Number(match[1])); return route.fulfill({ status: 200, contentType: 'image/jpeg', headers: { 'access-control-allow-origin': '*' }, body: tile });
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(origin);
    const canvas = page.locator('#home-simulation canvas'); await canvas.waitFor({ timeout: 90000 });
    await page.waitForFunction(() => document.querySelector('#home-simulation canvas')?.dataset.map === 'satellite', null, { timeout: 90000 });
    await page.waitForFunction(() => document.querySelector('#home-simulation canvas')?.dataset.texture !== undefined, null, { timeout: 90000 });
    await canvas.scrollIntoViewIfNeeded();
    if (mobile && engine === 'chromium') {
      const box = await canvas.boundingBox(); assert.ok(box);
      const cdp = await context.newCDPSession(page); const x = box.x + box.width / 2; const y = box.y + box.height / 2;
      for (let i = 0; i < 4; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 8, y }, { x: x + 8, y }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 70, y }, { x: x + 70, y }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await cdp.detach();
    } else if (mobile) {
      // Playwright's mobile WebKit does not implement mouse.wheel. Exercise the
      // same zoom handler with wheel events; Chromium above tests actual pinch.
      await canvas.evaluate(element => {
        for (let i = 0; i < 6; i++) element.dispatchEvent(new element.ownerDocument.defaultView.WheelEvent('wheel', { deltaY: -10000, bubbles: true, cancelable: true }));
      });
    } else {
      const box = await canvas.boundingBox(); assert.ok(box); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -10000);
    }
    for (let i = 0; i < 30 && !tileLevels.some(level => level >= 11 && level < 19); i++) await page.waitForTimeout(1000);
    assert.ok(tileLevels.some(level => level >= 11 && level < 19), `zoom requests detailed satellite tiles: ${tileLevels.join(',')}`);
    assert.equal(await page.locator('.globe-attribution').getByRole('link', { name: 'Esri' }).count(), 1);
    const attributionBounds = await page.locator('.globe-attribution').boundingBox();
    const cesiumBounds = await page.locator('.cesium-credit-logoContainer').boundingBox();
    assert.ok(attributionBounds && cesiumBounds && attributionBounds.x + attributionBounds.width <= cesiumBounds.x, 'map credits remain legible without overlapping');
    const sourceButton = page.getByRole('button', { name: '查看地圖資料來源' });
    await sourceButton.focus(); await page.keyboard.press('Enter');
    const sources = page.locator('.cesium-credit-lightbox');
    assert.equal(await sources.isVisible(), true, 'map source details open with the keyboard');
    assert.match(await sources.innerText(), /Vantor/u);
    assert.match(await sources.innerText(), /OpenStreetMap/u);
    assert.match(await sources.innerText(), /CC BY 4\.0/u);
    const closeSources = page.getByRole('button', { name: '關閉地圖資料來源' });
    await closeSources.focus(); await page.keyboard.press('Enter');
    assert.equal(await sources.isVisible(), false, 'map source details close with the keyboard');
    if (!mobile) {
      const scale = await canvas.evaluate(element => element.width / element.clientWidth);
      assert.ok(scale >= 1.2, `desktop globe renders above CSS resolution: ${scale}`);
    }
    assert.deepEqual(errors, []);
    await context.close(); console.log(`PASS: ${engine} ${mobile ? 'mobile' : 'desktop'} satellite tile zoom and attribution`);
  }
  const page = await browser.newPage();
  await page.route('https://services.arcgisonline.com/**', route => route.abort());
  await page.route('https://terrain.reearth.land/**', route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(origin);
  await page.waitForFunction(() => document.querySelector('#home-simulation canvas')?.dataset.map === 'fallback', null, { timeout: 90000 });
  assert.match(await page.locator('.globe-map-status').innerText(), /衛星地圖暫時無法載入/u);
  assert.equal(await page.locator('#home-simulation canvas').getAttribute('data-ready'), 'true');
  const brightness = () => page.locator('#home-simulation canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl2'); if (!gl) throw new Error('WebGL 2 unavailable');
    const width = 32; const height = 32; const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(Math.floor(canvas.width / 2 - width / 2), Math.floor(canvas.height / 2 - height / 2), width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let total = 0; for (let i = 0; i < pixels.length; i += 4) total += pixels[i] + pixels[i + 1] + pixels[i + 2];
    return total / (width * height);
  });
  await page.getByRole('button', { name: '正午', exact: true }).click(); const noon = await brightness();
  await page.getByRole('button', { name: '深夜', exact: true }).click(); const night = await brightness();
  assert.ok(noon > night * 1.15, `Taipei is brighter at noon than midnight: ${noon} vs ${night}`);
  await page.close(); console.log(`PASS: ${engine} unavailable satellite map falls back to NASA globe`);
  const failedTiles = await browser.newPage();
  await failedTiles.route('https://terrain.reearth.land/**', route => route.abort());
  await failedTiles.route('https://services.arcgisonline.com/**', route => route.request().url().includes('/tile/') ? route.abort() : route.fulfill({ json: metadata, headers: { 'access-control-allow-origin': '*' } }));
  await failedTiles.goto(origin);
  await failedTiles.waitForFunction(() => document.querySelector('#home-simulation canvas')?.dataset.map === 'fallback', null, { timeout: 90000 });
  assert.match(await failedTiles.locator('.globe-map-status').innerText(), /衛星地圖暫時無法載入/u);
  await failedTiles.close(); console.log(`PASS: ${engine} satellite tile failures restore the NASA globe`);
  const lesson = await browser.newPage();
  await lesson.goto(`${origin}#lesson/xiaobai-mirror`);
  await lesson.getByRole('heading', { name: '平面鏡成像', exact: true }).waitFor();
  assert.equal(await lesson.locator('script[src*="cesium/Cesium.js"]').count(), 0, 'course pages do not load the homepage globe runtime');
  await lesson.close(); console.log(`PASS: ${engine} course pages load the globe runtime only when needed`);
} finally { await browser.close(); }
