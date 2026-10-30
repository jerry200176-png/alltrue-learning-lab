import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';

const engine = process.env.LAB_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const browser = engine === 'webkit'
  ? await webkit.launch({ headless: process.env.WEBKIT_HEADED !== '1' })
  : await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
try {
  for (const mobile of [false, true]) {
    const device = engine === 'webkit' && mobile
      ? Object.fromEntries(Object.entries(devices['iPhone 13']).filter(([key]) => key !== 'defaultBrowserType'))
      : { viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 850 }, ...(mobile ? { isMobile: true, hasTouch: true } : {}) };
    const context = await browser.newContext(device);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}#lesson/xiaobai-mirror`);
    assert.equal(await page.getByRole('heading', { name: '平面鏡成像', exact: true }).count(), 1);
    const frame = page.frameLocator('#simulation iframe');
    await frame.locator('canvas').first().waitFor({ timeout: 30000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await frame.locator('body').evaluate(element => { try { return !!element.ownerDocument.defaultView.parent.document; } catch { return false; } }), false, 'lesson cannot access the host document');
    await frame.getByText('教材製作者：小小小白').first().waitFor();
    if (mobile) await frame.locator('#xb-mirror-panel-toggle').tap();
    await frame.locator('#chapterSelect').selectOption('1');
    await frame.locator('#distance').fill('120');
    await frame.locator('#height').fill('80');
    await frame.locator('#imageDistance').getByText('120 cm').waitFor();
    await frame.locator('#imageHeight').getByText('80 cm').waitFor();
    assert.equal(await frame.locator('#dValue').innerText(), '120');
    assert.equal(await frame.locator('#hValue').innerText(), '80');
    await frame.locator('#chapterSelect').selectOption('4');
    await frame.locator('#incidentAngle').fill('60');
    assert.ok((await frame.locator('body').innerText()).includes('60°'));
    assert.equal(await page.locator('.lesson-content details').count(), 3);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: Xiaobai mirror ${engine} ${mobile ? 'mobile' : 'desktop'} controls and image geometry`);
  }
} finally { await browser.close(); }
