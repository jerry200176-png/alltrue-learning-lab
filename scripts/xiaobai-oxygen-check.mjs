import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';

const engine = process.env.LAB_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
for (const mobile of [false, true]) {
  // Each device gets a fresh browser process so GPU state does not leak between sessions.
  const browser = engine === 'webkit' ? await webkit.launch({ headless: process.env.WEBKIT_HEADED !== '1' }) : await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
  try {
    const device = engine === 'webkit' && mobile ? Object.fromEntries(Object.entries(devices['iPhone 13']).filter(([key]) => key !== 'defaultBrowserType')) : { viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 850 }, ...(mobile ? { isMobile: true, hasTouch: true } : {}) };
    const context = await browser.newContext(device); const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}#lesson/xiaobai-oxygen`);
    assert.equal(await page.getByRole('heading', { name: '空氣與氧氣', exact: true }).count(), 1);
    const outer = page.frameLocator('#simulation iframe');
    const child = outer.frameLocator('#stage-host iframe');
    await child.locator('#interpretation').getByText(/氮氣約 78%.*氧氣約 21%/u).waitFor({ timeout: 90000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (mobile) assert.equal(await outer.locator('#xb-quality-toggle').getAttribute('aria-pressed'), 'true', 'touch devices start in low quality');
    assert.equal(await child.locator('body').evaluate(element => { try { return !!element.ownerDocument.defaultView.top.document; } catch { return false; } }), false);
    assert.equal(await child.locator('body').evaluate(async element => { try { await element.ownerDocument.defaultView.fetch('data:text/plain,alltrue-csp-check'); return true; } catch { return false; } }), false, 'nested frame connect-src blocks even a data URL');
    const press = async locator => {
      if (!mobile) return locator.click({ timeout: 90000 });
      // Check actionability first, then send a real touch without waiting on
      // the child srcdoc navigation that the chapter button starts.
      await locator.tap({ trial: true, timeout: 90000 });
      const box = await locator.boundingBox(); assert.ok(box);
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    };
    console.log(`Oxygen ${engine} ${mobile ? 'mobile' : 'desktop'}: composition and sandbox passed`);
    await press(outer.getByRole('button', { name: /催化製氧/u }));
    await child.locator('#guide h1').getByText('過氧化氫分解', { exact: true }).waitFor({ timeout: 90000 });
    assert.match(await child.locator('body').innerText(), /2H₂O₂/u);
    assert.match(await child.locator('body').innerText(), /MnO₂/u);
    if (mobile) {
      // Wait for the first 3D frames to position both labels before checking their layout.
      const layout = await child.locator('body').evaluate(element => new Promise(resolve => {
        const win = element.ownerDocument.defaultView; const start = Date.now();
        const check = () => {
          const a = element.querySelector('#label-a')?.getBoundingClientRect();
          const b = element.querySelector('#label-b')?.getBoundingClientRect();
          const separated = !!a && !!b && a.width > 0 && b.width > 0 && (a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
          if (separated || Date.now() - start > 60000) resolve({ separated, a: a?.toJSON(), b: b?.toJSON() });
          else win.setTimeout(check, 250);
        };
        check();
      }), null, { timeout: 75000 });
      assert.equal(layout.separated, true, `mobile tube labels must not overlap: ${JSON.stringify(layout)}`);
    }
    if (!mobile) {
      const canvas = child.locator('canvas').first(); await canvas.scrollIntoViewIfNeeded();
      let positions = await child.locator('body').evaluate(element => element.ownerDocument.defaultView.__CHEM02_CATALYST__.elements());
      const box = await canvas.boundingBox(); assert.ok(box);
      await page.mouse.move(box.x + positions.powder.x, box.y + positions.powder.y);
      await page.mouse.down(); await page.mouse.move(box.x + positions.mouths[1].x, box.y + positions.mouths[1].y, { steps: 15 }); await page.mouse.up();
      await child.getByText(/已配對 B 管/u).waitFor({ timeout: 60000 });
      positions = await child.locator('body').evaluate(element => element.ownerDocument.defaultView.__CHEM02_CATALYST__.elements());
      await page.mouse.move(box.x + positions.powder.x, box.y + positions.powder.y);
      await page.mouse.down(); await page.mouse.move(box.x + positions.powder.x, box.y + positions.powder.y - 180, { steps: 15 });
      await child.locator('#label-b b').getByText('已加入二氧化錳', { exact: true }).waitFor({ timeout: 90000 });
      await page.mouse.up();
      const tubes = await child.locator('body').evaluate(element => element.ownerDocument.defaultView.__CHEM02_CATALYST__.state().tubes);
      assert.ok(tubes[1].catalystG > 0, 'a real drag delivers catalyst into tube B');
      assert.ok(tubes[1].rateML > tubes[0].rateML, 'catalysed tube produces oxygen faster');
    }
    console.log(`Oxygen ${engine} ${mobile ? 'mobile' : 'desktop'}: catalyst passed`);
    await press(outer.getByRole('button', { name: /氧氣的性質/u }));
    await child.getByText('木炭燃燒', { exact: true }).waitFor({ timeout: 90000 });
    assert.match(await child.locator('body').innerText(), /比較空氣與氧氣/u);
    assert.equal(await page.locator('.lesson-content details').count(), 3);
    await child.locator('canvas').first().evaluate(canvas => canvas.dispatchEvent(new canvas.ownerDocument.defaultView.Event('webglcontextlost', { bubbles: true, cancelable: true })));
    await page.locator('#simulation .sim-message').getByText('無法啟動 3D 模擬').waitFor({ timeout: 30000 });
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: Xiaobai oxygen ${engine} ${mobile ? 'mobile' : 'desktop'} controls, chemistry and isolation`);
  } finally { await browser.close(); }
}
