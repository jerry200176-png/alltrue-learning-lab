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
    await page.goto(`${origin}#lesson/xiaobai-lens`);
    assert.equal(await page.getByRole('heading', { name: '凸透鏡與凹透鏡成像', exact: true }).count(), 1);
    const frame = page.frameLocator('#simulation iframe');
    await frame.locator('canvas').first().waitFor({ timeout: 90000 });
    await frame.locator('#loading').waitFor({ state: 'hidden', timeout: 90000 });
    assert.equal(await frame.locator('#creatorBrand > span').isVisible(), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await frame.locator('body').evaluate(element => { try { return !!element.ownerDocument.defaultView.parent.document; } catch { return false; } }), false);
    await frame.getByText('焦距 f = 10 cm', { exact: false }).first().waitFor();
    const body = await frame.locator('body').innerText();
    assert.match(body, /物距 u = 30 cm/u);
    assert.match(await frame.locator('body').textContent(), /光屏距離 = 25 cm/u);
    if (!mobile) assert.match(body, /光屏距離 = 25 cm/u);
    await page.locator('#simulation').scrollIntoViewIfNeeded();
    const button = frame.locator('#layerButton');
    const press = async () => mobile ? button.tap({ timeout: 60000 }) : button.click({ timeout: 60000 });
    await press();
    await frame.locator('#layerButton[data-layer="beam"]').waitFor();
    await press();
    await frame.locator('#layerButton[data-layer="rays"]').waitFor();
    await frame.getByText('理想像距 v = 15 cm', { exact: false }).first().waitFor();
    if (!mobile) {
      await frame.locator('#lessonSelect').selectOption('inside', { timeout: 60000 });
      await frame.locator('#taskHint').filter({ hasText: '正立、放大的虛像' }).waitFor({ timeout: 60000 });
      assert.match(await frame.locator('#taskHint').innerText(), /虛像不能承接在光屏上/u);
      await frame.locator('[data-section="concave"]').click({ timeout: 60000 });
      for (let i = 0; i < 2 && await button.getAttribute('data-layer') !== 'rays'; i++) await press();
      assert.equal(await button.getAttribute('data-layer'), 'rays');
      await frame.locator('#taskHint').filter({ hasText: '正立、縮小的虛像' }).waitFor({ timeout: 60000 });
      assert.match(await frame.locator('#taskHint').innerText(), /出射光發散/u);
    }

    assert.equal(await page.locator('.lesson-content details').count(), 3);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: Xiaobai lens ${engine} ${mobile ? 'mobile' : 'desktop'} controls and image distance`);
  }
} finally { await browser.close(); }
