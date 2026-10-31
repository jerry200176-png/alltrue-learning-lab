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
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}#lesson/xiaobai-nuclear`);
    assert.equal(await page.getByRole('heading', { name: '核裂變與核電廠', exact: true }).count(), 1);
    const frame = page.frameLocator('#simulation iframe');
    await frame.locator('canvas').first().waitFor({ timeout: 90000 });
    // The canvas is inserted before the scene has finished initialising.
    await frame.locator('body').evaluate(element => new Promise((resolve, reject) => {
      const win = element.ownerDocument.defaultView; const started = Date.now();
      const check = () => { if (win.__nuclear?.ready) resolve(true); else if (Date.now() - started > 90000) reject(new Error('Nuclear scene failed to initialise')); else win.setTimeout(check, 100); };
      check();
    }), null, { timeout: 120000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await frame.locator('body').evaluate(element => { try { return !!element.ownerDocument.defaultView.parent.document; } catch { return false; } }), false);
    await frame.getByText('核能', { exact: true }).first().waitFor();
    assert.match(await frame.locator('body').innerText(), /核電廠/u);
    const press = async locator => mobile ? locator.tap({ timeout: 60000 }) : locator.click({ timeout: 60000 });
    if (mobile) await press(frame.locator('#restore-panel'));
    await press(frame.locator('[data-module="fission"]'));
    assert.equal(await frame.locator('#single-count').innerText(), '0');
    await frame.locator('#fire').evaluate(el => { el.dataset.received = '0'; el.addEventListener('click', () => { el.dataset.received = String(Number(el.dataset.received) + 1); }); });
    await press(frame.locator('#fire'));
    console.log('DIAGNOSTIC', await frame.locator('body').evaluate(el => { const d = el.ownerDocument; const state = d.defaultView.__nuclear?.getState(); return { module: state?.module, singleStarted: state?.singleStarted, clicks: d.querySelector('#fire')?.dataset.received, fireText: d.querySelector('#fire')?.textContent, stepDisabled: d.querySelector('#step')?.disabled }; }));
    // Use the lesson's own single-step control; software rendering can run too slowly for real-time playback.
    for (let step = 0; step < 4; step++) await press(frame.locator('#step'));
    await frame.locator('#single-count').filter({ hasText: /^1$/u }).waitFor({ timeout: 60000 });
    assert.equal(await frame.locator('#neutron-count').innerText(), '3');
    await press(frame.locator('[data-module="chain"]'));
    await frame.locator('#absorption').fill('100');
    assert.equal(await frame.locator('#absorption-value').innerText(), '100%');
    await press(frame.locator('#chain-fire'));
    await press(frame.locator('#step'));
    await frame.locator('#chain-active').filter({ hasText: /^0$/u }).waitFor({ timeout: 60000 });
    assert.equal(await frame.locator('#chain-count').innerText(), '0', '100% absorption stops the initial neutron in the model');
    assert.equal(await page.locator('.lesson-content details').count(), 3);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: Xiaobai nuclear ${engine} ${mobile ? 'mobile' : 'desktop'} fission and neutron control`);
  }
} finally { await browser.close(); }
