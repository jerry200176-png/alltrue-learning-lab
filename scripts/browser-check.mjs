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
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(origin); assert.equal(await page.locator('.lesson-card').count(), 54);
  assert.equal(await page.title(), '台北全真一對一');
  assert.ok((await page.locator('.hero h1').innerText()).replace(/\s/gu, '').includes('台北全真一對一'));
  assert.equal(await page.locator('header').getByRole('link', { name: '台北全真一對一首頁' }).count(), 1);
  assert.equal(await page.locator('.subject-tile img').count(), 4);
  const homeCanvas = page.locator('#home-simulation canvas');
  await homeCanvas.waitFor({ timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('#home-simulation canvas')?.dataset.ready === 'true');
  const rotationToggle = page.getByRole('button', { name: '自動旋轉' });
  assert.equal(await rotationToggle.getAttribute('aria-pressed'), 'false', 'reduced motion starts with rotation paused');
  await homeCanvas.evaluate(canvas => {
    canvas.dataset.pointerCount = '0';
    canvas.addEventListener('pointermove', () => { canvas.dataset.pointerCount = String(Number(canvas.dataset.pointerCount) + 1); });
  });
  const homeBox = await homeCanvas.boundingBox();
  assert.ok(homeBox);
  const homeX = homeBox.x + homeBox.width * 0.5; const homeY = homeBox.y + homeBox.height * 0.55;
  await page.mouse.move(homeX, homeY); await page.mouse.down();
  await page.mouse.move(homeX + 35, homeY + 15, { steps: 3 }); await page.mouse.up();
  assert.ok(Number(await homeCanvas.getAttribute('data-pointer-count')) > 0, 'homepage drag reaches 3D canvas');
  const initial = await homeCanvas.screenshot();
  await page.getByRole('button', { name: '向右旋轉地球' }).focus();
  await page.keyboard.press('Enter');
  const afterButton = await homeCanvas.screenshot();
  assert.equal(initial.equals(afterButton), false, 'homepage Earth responds to the keyboard control');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.querySelector('[data-earth-toggle]')?.getAttribute('aria-pressed') === 'true');
  await page.waitForTimeout(1500);
  const afterAnimation = await homeCanvas.screenshot();
  assert.equal(afterButton.equals(afterAnimation), false, 'homepage Earth animates');
  await rotationToggle.click();
  assert.equal(await rotationToggle.getAttribute('aria-pressed'), 'false', 'rotation can be paused');
  const paused = await homeCanvas.screenshot();
  await page.waitForTimeout(400);
  assert.equal(paused.equals(await homeCanvas.screenshot()), true, 'paused globe stays still');
  const noonAltitude = Number.parseFloat(await page.locator('#sun-altitude').innerText());
  assert.ok(noonAltitude > 80, 'Taipei summer noon has a high sun');
  assert.equal(await page.locator('#sun-state').innerText(), '白天');
  await page.getByLabel('臺北時間').focus(); await page.keyboard.press('Home');
  assert.equal(await page.locator('#sun-state').innerText(), '夜晚');
  assert.ok(Number.parseFloat(await page.locator('#sun-altitude').innerText()) < 0);
  assert.equal(paused.equals(await homeCanvas.screenshot()), false, 'time control changes 3D sunlight');
  await page.getByLabel('臺北時間').evaluate(input => { input.value = '12'; input.dispatchEvent(new input.ownerDocument.defaultView.Event('input', { bubbles: true })); });
  await page.getByLabel('日期').evaluate(input => { input.value = '355'; input.dispatchEvent(new input.ownerDocument.defaultView.Event('input', { bubbles: true })); });
  assert.ok(Number.parseFloat(await page.locator('#sun-altitude').innerText()) < noonAltitude - 40, 'winter noon sun is lower');
  await rotationToggle.click();
  assert.equal(await rotationToggle.getAttribute('aria-pressed'), 'true', 'rotation can resume');
  await page.locator('header').getByRole('link', { name: '關於本站' }).click();
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
      const slider = frame.locator('#right input[type=range]').first();
      await slider.focus(); await page.keyboard.press('Home');
      const initialValue = await slider.inputValue();
      await slider.focus(); await page.keyboard.press('ArrowRight');
      assert.notEqual(await slider.inputValue(), initialValue, 'lesson Earth slider responds to keyboard');
      await frame.locator('a.home').click();
      await page.locator('#catalog').waitFor();
      assert.equal(await page.locator('.lesson-card').count(), 54);
    }
    console.log(`PASS: ${slug} loads a translated 3D lesson`);
  }
  assert.deepEqual(errors, []);
  const mobileGlobePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobileGlobePage.emulateMedia({ reducedMotion: 'reduce' });
  await mobileGlobePage.goto(origin); assert.equal(await mobileGlobePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const mobileGlobe = mobileGlobePage.locator('#home-simulation canvas');
  await mobileGlobePage.waitForFunction(() => document.querySelector('#home-simulation canvas')?.dataset.ready === 'true');
  const mobileTime = mobileGlobePage.getByLabel('臺北時間');
  await mobileTime.scrollIntoViewIfNeeded();
  const timeRect = await mobileTime.boundingBox(); assert.ok(timeRect);
  await mobileGlobePage.touchscreen.tap(timeRect.x + 2, timeRect.y + timeRect.height / 2);
  assert.equal(await mobileGlobePage.locator('#sun-state').innerText(), '夜晚', 'time slider responds to touch');
  await mobileGlobe.scrollIntoViewIfNeeded();
  const mobileBefore = await mobileGlobe.screenshot();
  const globeRect = await mobileGlobe.boundingBox(); assert.ok(globeRect);
  const globeTouch = await mobileGlobePage.context().newCDPSession(mobileGlobePage);
  const globeX = globeRect.x + globeRect.width * 0.5; const globeY = globeRect.y + globeRect.height * 0.5;
  await globeTouch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: globeX, y: globeY }] });
  await globeTouch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: globeX + 65, y: globeY + 5 }] });
  await globeTouch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const mobileAfter = await mobileGlobe.screenshot();
  assert.equal(mobileBefore.equals(mobileAfter), false, 'homepage Earth responds to touch drag');
  await globeTouch.detach();
  // Chromium's CDP-synthesized drag suppresses the next tap even in a minimal
  // touch-action:none fixture. Use a fresh page for the separate navigation check.
  await mobileGlobePage.close();
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(origin); assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await mobile.getByRole('link', { name: '關於本站' }).count(), 1);
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
  await noWebGL.goto(origin); await noWebGL.getByText('無法啟動 3D 地球').waitFor(); assert.equal(await noWebGL.locator('#home-simulation canvas').count(), 0);
  await noWebGL.goto(`${origin}#lesson/projectile-step`); await noWebGL.getByText('無法啟動 3D 模擬').waitFor(); assert.equal(await noWebGL.locator('iframe').count(),0); console.log('PASS: WebGL fallback');
  const failedLesson = await browser.newPage();
  await failedLesson.addInitScript(() => {
    if (globalThis.parent === globalThis) return;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (type === 'webgl2') return null; return original.call(this, type, ...args); };
  });
  await failedLesson.goto(`${origin}#lesson/projectile-step`);
  await failedLesson.getByText('無法啟動 3D 模擬').waitFor({ timeout: 30000 });
  assert.equal(await failedLesson.locator('iframe').count(), 0, 'lesson WebGL initialization failure shows fallback');
  const lostContext = await browser.newPage();
  await lostContext.goto(`${origin}#lesson/projectile-step`);
  const lostCanvas = lostContext.frameLocator('iframe').locator('#gl');
  await lostCanvas.waitFor({ timeout: 30000 });
  await lostCanvas.evaluate(canvas => canvas.dispatchEvent(new canvas.ownerDocument.defaultView.Event('webglcontextlost')));
  await lostContext.getByText('無法啟動 3D 模擬').waitFor();
  assert.equal(await lostContext.locator('iframe').count(), 0, 'lost WebGL context shows fallback');
  console.log('PASS: lesson WebGL initialization and context loss fallbacks');
} finally { await browser.close(); }
