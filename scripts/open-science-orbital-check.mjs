import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';
const engine = process.env.LAB_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = engine === 'webkit' ? await webkit.launch({ headless: process.env.WEBKIT_HEADED !== '1' }) : await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const mobile of [false, true]) {
    const device = engine === 'webkit' && mobile ? Object.fromEntries(Object.entries(devices['iPhone 13']).filter(([key]) => key !== 'defaultBrowserType')) : { viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 850 }, ...(mobile ? { isMobile: true, hasTouch: true } : {}) };
    const context = await browser.newContext(device); const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${origin}#lesson/atomic-orbitals`);
    assert.equal(await page.getByRole('heading', { name: '原子軌域與電子組態', exact: true }).count(), 1);
    const frame = page.frameLocator('#simulation iframe'); const canvas = frame.locator('canvas');
    await canvas.waitFor({ timeout: 90000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await frame.locator('body').evaluate(element => element.ownerDocument.documentElement.scrollWidth <= element.ownerDocument.defaultView.innerWidth), true);
    assert.equal(await frame.locator('body').evaluate(element => { try { return !!element.ownerDocument.defaultView.parent.document; } catch { return false; } }), false);
    assert.equal(await frame.locator('body').evaluate(async element => { try { await element.ownerDocument.defaultView.fetch('data:text/plain,blocked'); return true; } catch { return false; } }), false);
    const sums = await frame.locator('body').evaluate(element => {
      const win = element.ownerDocument.defaultView;
      return Array.from({ length: 36 }, (_, index) => win.getOrbitalsForZ(index + 1).reduce((sum, orbital) => sum + orbital.electrons, 0));
    });
    assert.deepEqual(sums, Array.from({ length: 36 }, (_, index) => index + 1), 'all displayed subshells contain the correct number of electrons');
    const slider = frame.getByLabel('選擇元素的原子序');
    for (const [z, symbol, expected] of [[2,'He','1s2'], [19,'K','[Ar] 4s1'], [20,'Ca','[Ar] 4s2'], [24,'Cr','[Ar] 3d5 4s1'], [29,'Cu','[Ar] 3d10 4s1']]) {
      await slider.fill(String(z));
      assert.equal(await frame.locator('#display-symbol').innerText(), symbol);
      assert.equal(await frame.locator('#display-config').innerText(), expected);
    }
    for (const [z, fourS, threeD] of [[19,1,0], [20,2,0], [24,1,5], [29,1,10]]) {
      const orbitals = await frame.locator('body').evaluate((element, value) => element.ownerDocument.defaultView.getOrbitalsForZ(value), z);
      assert.equal(orbitals.find(orbital => orbital.type === 's' && orbital.n === 4)?.electrons ?? 0, fourS);
      assert.equal(orbitals.find(orbital => orbital.type === 'd' && orbital.n === 3)?.electrons ?? 0, threeD);
    }
    await slider.fill('8');
    assert.equal(await page.locator('.lesson-content details').count(), 3);
    await canvas.scrollIntoViewIfNeeded();
    const before = await canvas.screenshot(); const box = await canvas.boundingBox(); assert.ok(box);
    if (mobile) {
      if (engine === 'chromium') {
        const cdp = await context.newCDPSession(page); const x = box.x + box.width / 2; const y = box.y + box.height / 2;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 60, y: y + 12 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
      } else {
        // WebKit's desktop pointer exercises the same Pointer Events handlers.
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 12, { steps: 4 }); await page.mouse.up();
      }
    } else {
      await frame.locator('#canvas-container').focus(); await page.keyboard.press('ArrowRight');
    }
    assert.equal(before.equals(await canvas.screenshot()), false, 'rotation changes the 3D image');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: atomic orbitals ${engine} ${mobile ? 'mobile' : 'desktop'} configuration, rotation and sandbox`);
  }
} finally { await browser.close(); }
