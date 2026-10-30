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
    await page.goto(`${origin}#lesson/xiaobai-terrain`);
    assert.equal(await page.getByRole('heading', { name: '等高線與地形圖', exact: true }).count(), 1);
    const frame = page.frameLocator('#simulation iframe');
    await frame.locator('canvas').first().waitFor({ timeout: 30000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await frame.locator('body').evaluate(element => { try { return !!element.ownerDocument.defaultView.parent.document; } catch { return false; } }), false);
    const press = async locator => mobile ? locator.tap() : locator.click();
    if (!await frame.locator('#pointMode').isVisible()) await press(frame.locator('#xb-controls-toggle'));
    await frame.locator('#pointMode').waitFor({ state: 'visible' });
    const read = async text => Number.parseFloat(await frame.getByText(text, { exact: true }).locator('..').locator('strong').innerText());
    assert.equal(await read('A 點海拔'), 152.5);
    assert.equal(await read('B 點海拔'), 742.3);
    assert.equal(await read('兩點相對高度'), 589.8);
    await frame.locator('#pointMode').selectOption('B');
    const map = frame.locator('#map');
    if (mobile) await map.tap({ position: { x: 90, y: 100 } });
    else await map.click({ position: { x: 90, y: 100 } });
    await frame.getByText('B 點海拔', { exact: true }).locator('..').locator('strong').getByText('742.3 m', { exact: true }).waitFor({ state: 'hidden', timeout: 5000 });
    const heightA = await read('A 點海拔');
    const heightB = await read('B 點海拔');
    const difference = await read('兩點相對高度');
    assert.notEqual(heightB, 742.3, 'map selection changes the observation point');
    assert.ok(Math.abs(difference - Math.abs(heightB - heightA)) < 0.11, 'relative height agrees with displayed elevations');
    await press(frame.locator('#xb-controls-toggle'));
    await press(frame.locator('#next'));
    await press(frame.locator('#xb-controls-toggle'));
    await frame.locator('#level').fill('600');
    await frame.getByText('截線海拔 600 m', { exact: true }).waitFor();
    assert.equal(await page.locator('.lesson-content details').count(), 3);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: Xiaobai terrain ${engine} ${mobile ? 'mobile' : 'desktop'} map and elevation`);
  }
} finally { await browser.close(); }
