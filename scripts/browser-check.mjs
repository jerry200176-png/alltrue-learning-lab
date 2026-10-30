import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const lessons = JSON.parse(readFileSync('src/lessons.json', 'utf8'));
const titleFor = slug => lessons.find(lesson => lesson.slug === slug).title;
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin); assert.equal(await page.locator('.lesson-card').count(), 54);
  assert.equal(await page.locator('.earth svg').count(), 1);
  await page.getByRole('link', { name: '教材來源與授權' }).click();
  await page.getByRole('heading', { name: '教材來源與授權' }).waitFor();
  assert.equal(await page.getByRole('link', { name: '铜匠实验室（Tongjiang Lab）' }).getAttribute('href'), 'https://lab.tongjiang.app/');
  assert.ok(await page.getByRole('link', { name: 'CC BY-NC 4.0' }).getAttribute('href'));
  assert.equal(await page.getByRole('link', { name: '第三方授權聲明' }).count(), 1);
  await page.goto(origin); assert.equal(await page.locator('.lesson-card').count(), 54);
  await page.locator('[data-filter=bio]').click(); assert.equal(await page.locator('.lesson-card').count(), 5);
  await page.getByRole('searchbox').fill('酵素'); assert.equal(await page.locator('.lesson-card').count(), 1);
  for (const slug of ['projectile-step', 'rate-step', 'enzyme-step', 'earth-motion-step']) {
    await page.goto(`${origin}#lesson/${slug}`);
    await page.getByRole('heading', { name: titleFor(slug), exact: true }).waitFor();
    await page.locator('iframe').waitFor();
    const frame = page.frameLocator('iframe'); await frame.locator('canvas').first().waitFor({ timeout: 20000 });
    await frame.locator('body').getByText('目錄', { exact: true }).first().waitFor({ timeout: 20000 });
    assert.ok((await frame.locator('body').innerText()).length > 100, slug);
    const unnamed = await frame.locator('#right').evaluate(root => [...root.querySelectorAll('input[type=range], .sw:not(.multi) button')]
      .filter(el => !el.getAttribute('aria-label')?.trim() && !el.getAttribute('aria-labelledby')?.trim()).length);
    assert.equal(unnamed, 0, `${slug} controls need accessible names`);
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
    await mobile.getByRole('heading', { name: titleFor(slug), exact: true }).waitFor();
    await mobile.locator('#simulation').scrollIntoViewIfNeeded();
    const mobileFrame = mobile.frameLocator('iframe');
    await mobileFrame.locator('#tabL').waitFor({ state: 'visible', timeout: 20000 });
    await mobileFrame.locator('#tabR').waitFor({ state: 'visible', timeout: 20000 });
    if (slug === 'projectile-step') {
      const scene = mobileFrame.locator('#gl');
      const rect = await scene.boundingBox();
      assert.ok(rect);
      const child = mobile.frames()[1];
      await child.evaluate(() => {
        const canvas = document.querySelector('#gl');
        canvas.dataset.pointerCount = '0';
        canvas.addEventListener('pointermove', () => { canvas.dataset.pointerCount = String(Number(canvas.dataset.pointerCount) + 1); });
      });
      const client = await mobile.context().newCDPSession(mobile);
      const x = rect.x + rect.width * 0.5; const y = rect.y + rect.height * 0.65;
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 35, y: y + 15 }] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await child.waitForFunction(() => Number(document.querySelector('#gl')?.dataset.pointerCount) > 0, null, { timeout: 5000 });
      assert.ok(Number(await scene.getAttribute('data-pointer-count')) > 0, 'touch drag must reach 3D canvas');
      await client.detach();
    }
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
