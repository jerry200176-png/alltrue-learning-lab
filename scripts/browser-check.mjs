import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin); assert.equal(await page.locator('.lesson-card').count(), 54);
  await page.locator('[data-filter=bio]').click(); assert.equal(await page.locator('.lesson-card').count(), 5);
  await page.getByRole('searchbox').fill('酵素'); assert.equal(await page.locator('.lesson-card').count(), 1);
  for (const slug of ['projectile-step', 'rate-step', 'enzyme-step', 'earth-motion-step']) {
    await page.goto(`${origin}#lesson/${slug}`);
    const frame = page.frameLocator('iframe'); await frame.locator('canvas').first().waitFor({ timeout: 20000 });
    await frame.locator('body').getByText('目錄', { exact: true }).first().waitFor({ timeout: 20000 });
    assert.ok((await frame.locator('body').innerText()).length > 100, slug);
    assert.equal(await page.locator('.lesson-content details').count(), 3, `${slug} concepts`);
    if (slug === 'projectile-step') {
      await frame.getByRole('button', { name: '›', exact: true }).click();
      await frame.getByText('兩球同時落地', { exact: false }).first().waitFor();
      await page.locator('.lesson-content details').first().locator('summary').click();
      assert.ok(await page.locator('.lesson-content details').first().getAttribute('open') !== null);
    }
    if (slug === 'earth-motion-step') {
      await frame.locator('a.home').click();
      await page.locator('#catalog').waitFor();
      assert.equal(await page.locator('.lesson-card').count(), 54);
    }
    console.log(`PASS: ${slug} loads a translated 3D lesson`);
  }
  assert.deepEqual(errors, []);
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(origin); assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.locator('[data-subject=phys]').tap(); assert.equal(await mobile.locator('.lesson-card').count(), 10);
  for (const slug of ['projectile-step', 'rate-step', 'enzyme-step', 'earth-motion-step']) {
    await mobile.goto(`${origin}#lesson/${slug}`);
    await mobile.locator('#simulation').scrollIntoViewIfNeeded();
    const mobileFrame = mobile.frameLocator('iframe');
    await mobileFrame.locator('#tabL').waitFor({ state: 'visible', timeout: 20000 });
    await mobileFrame.locator('#tabR').waitFor({ state: 'visible', timeout: 20000 });
    await mobileFrame.locator('#tabL').tap();
    assert.equal(await mobileFrame.locator('#left').evaluate(el => el.classList.contains('collapsed')), false);
    await mobileFrame.locator('#tabR').tap();
    assert.equal(await mobileFrame.locator('#left').evaluate(el => el.classList.contains('collapsed')), true);
    assert.equal(await mobileFrame.locator('#right').evaluate(el => el.classList.contains('collapsed')), false);
  }
  console.log('PASS: four mobile lessons and panel touch');
  const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true });
  await tablet.goto(`${origin}#lesson/projectile-step`);
  await tablet.locator('#simulation').scrollIntoViewIfNeeded();
  const tabletFrame = tablet.frameLocator('iframe');
  await tabletFrame.locator('#steps button').first().waitFor({ state: 'visible', timeout: 20000 });
  assert.equal(await tablet.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await tabletFrame.locator('#steps button').nth(1).tap();
  assert.equal(await tabletFrame.locator('#steps button').nth(1).evaluate(el => el.classList.contains('on')), true);
  console.log('PASS: tablet viewport and step touch');
  const noWebGL = await browser.newPage();
  await noWebGL.addInitScript(() => { const original=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (type === 'webgl2') return null; return original.call(this, type, ...args); }; });
  await noWebGL.goto(`${origin}#lesson/projectile-step`); await noWebGL.getByText('無法啟動 3D 模擬').waitFor(); assert.equal(await noWebGL.locator('iframe').count(),0); console.log('PASS: WebGL fallback');
} finally { await browser.close(); }
