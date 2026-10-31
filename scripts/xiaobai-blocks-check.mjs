import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';
const engine = process.env.LAB_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const browser = engine === 'webkit' ? await webkit.launch({ headless: process.env.WEBKIT_HEADED !== '1' }) : await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
try {
  for (const mobile of [false, true]) {
    const device = engine === 'webkit' && mobile ? Object.fromEntries(Object.entries(devices['iPhone 13']).filter(([key]) => key !== 'defaultBrowserType')) : { viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 850 }, ...(mobile ? { isMobile: true, hasTouch: true } : {}) };
    const context = await browser.newContext(device); const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}#lesson/xiaobai-spatial-views`);
    assert.equal(await page.getByRole('heading', { name: '立體積木與不同視角', exact: true }).count(), 1);
    const frame = page.frameLocator('#simulation iframe'); const canvas = frame.locator('canvas').first();
    await canvas.waitFor({ timeout: 60000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await frame.locator('body').evaluate(element => { try { return !!element.ownerDocument.defaultView.parent.document; } catch { return false; } }), false);
    const press = async locator => mobile ? locator.tap({ timeout: 60000 }) : locator.click({ timeout: 60000 });
    await press(frame.locator('[data-view="front"]'));
    assert.equal(await frame.locator('[data-view="front"]').getAttribute('aria-pressed'), 'true');
    assert.match(await frame.locator('#cameraLabel').innerText(), /前面/u);
    await press(frame.locator('[data-view="top"]'));
    assert.equal(await frame.locator('[data-view="top"]').getAttribute('aria-pressed'), 'true');
    assert.match(await frame.locator('#cameraLabel').innerText(), /上面/u);
    await press(frame.getByRole('button', { name: '自由搭建', exact: true }));
    await frame.getByText('0 塊', { exact: true }).waitFor();
    const box = await canvas.boundingBox(); assert.ok(box);
    const x = box.x + box.width / 2; const y = box.y + box.height / 2;
    if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
    await frame.getByText('1 塊', { exact: true }).waitFor({ timeout: 30000 });
    assert.equal(await page.locator('.lesson-content details').count(), 3);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: Xiaobai spatial views ${engine} ${mobile ? 'mobile' : 'desktop'} projections and construction`);
  }
} finally { await browser.close(); }
