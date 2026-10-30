import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';

const engine = process.env.LAB_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const browser = engine === 'webkit'
  ? await webkit.launch({ headless: process.env.WEBKIT_HEADED !== '1' })
  : await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
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
    await page.goto(`${origin}#lesson/xiaobai-atom`);
    assert.equal(await page.getByRole('heading', { name: '原子結構與元素辨認', exact: true }).count(), 1);
    const frame = page.frameLocator('#simulation iframe');
    await frame.locator('canvas').first().waitFor({ timeout: 30000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await frame.locator('body').evaluate(element => { try { return !!element.ownerDocument.defaultView.parent.document; } catch { return false; } }), false);
    await frame.getByText('粒子計數組合不保證穩定存在。', { exact: false }).waitFor();
    const press = async locator => mobile ? locator.tap() : locator.click();
    await press(frame.locator('summary').filter({ hasText: '數量調節' }));
    assert.equal(await frame.locator('#symbol').innerText(), 'C');
    assert.equal(await frame.locator('#chargeReadout').innerText(), '0');
    assert.equal(await frame.locator('#massReadout').innerText(), '12');
    await press(frame.locator('[data-change="p"][data-delta="1"]'));
    assert.equal(await frame.locator('#symbol').innerText(), 'N');
    assert.equal(await frame.locator('#atomicBottom').innerText(), '7');
    assert.equal(await frame.locator('#chargeReadout').innerText(), '+1');
    assert.equal(await frame.locator('#massReadout').innerText(), '13');
    await press(frame.locator('[data-change="e"][data-delta="1"]'));
    assert.equal(await frame.locator('#chargeReadout').innerText(), '0');
    await press(frame.locator('[data-change="n"][data-delta="1"]'));
    assert.equal(await frame.locator('#symbol').innerText(), 'N');
    assert.equal(await frame.locator('#massReadout').innerText(), '14');
    assert.equal(await page.locator('.lesson-content details').count(), 3);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: Xiaobai atom ${engine} ${mobile ? 'mobile' : 'desktop'} element, charge, and mass`);
  }
} finally { await browser.close(); }
