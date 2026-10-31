import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
const lessons = JSON.parse(readFileSync('src/lessons.json', 'utf8'));
const titleFor = slug => lessons.find(lesson => lesson.slug === slug).title;
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  // Keep pixel comparisons deterministic; the separate globe-map check
  // verifies satellite tile loading and high-resolution zoom with fixtures.
  await page.route('https://services.arcgisonline.com/**', route => route.abort());
  await page.route('https://terrain.reearth.land/**', route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(origin); assert.equal(await page.locator('.lesson-card').count(), 61);
  assert.equal(await page.locator('.hero').evaluate(element => element.ownerDocument.defaultView.getComputedStyle(element, '::before').animationName), 'none', 'reduced motion disables the star animation');
  const starImage = await page.locator('.hero').evaluate(element => element.ownerDocument.defaultView.getComputedStyle(element, '::before').backgroundImage);
  assert.match(starImage, /derived\/nasa-stars-4096\.jpg/u, 'star map resolves relative to the site root');
  const starResponse = await page.request.get(new URL('derived/nasa-stars-4096.jpg', origin).href);
  assert.equal(starResponse.status(), 200, 'NASA star map is available');
  assert.equal(await page.title(), '台北全真一對一');
  assert.ok((await page.locator('.hero h1').innerText()).replace(/\s/gu, '').includes('台北全真一對一'));
  assert.equal(await page.locator('header').getByRole('link', { name: '台北全真一對一首頁' }).count(), 1);
  assert.equal(await page.locator('.subject-tile img').count(), 5);
  const homeCanvas = page.locator('#home-simulation canvas');
  await homeCanvas.waitFor({ timeout: 30000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#home-simulation canvas');
    return canvas?.dataset.ready === 'true' && !canvas.dataset.detailLoading;
  });
  const textureDetails = await homeCanvas.evaluate(canvas => {
    const gl = canvas.getContext('webgl2');
    return { quality: canvas.dataset.texture, maxSize: gl?.getParameter(gl.MAX_TEXTURE_SIZE), coarse: canvas.ownerDocument.defaultView.matchMedia('(pointer: coarse)').matches };
  });
  if (!textureDetails.coarse && textureDetails.maxSize >= 4096) assert.equal(textureDetails.quality, 'detailed', 'capable desktop loads the detailed NASA texture');
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
  assert.equal(await page.locator('.hero').evaluate(element => element.ownerDocument.defaultView.getComputedStyle(element, '::before').animationName), 'space-twinkle', 'star animation follows the motion preference');
  await page.waitForFunction(() => document.querySelector('[data-earth-toggle]')?.getAttribute('aria-pressed') === 'true');
  await page.waitForTimeout(1500);
  const afterAnimation = await homeCanvas.screenshot();
  assert.equal(afterButton.equals(afterAnimation), false, 'homepage Earth animates');
  await rotationToggle.click();
  assert.equal(await rotationToggle.getAttribute('aria-pressed'), 'false', 'rotation can be paused');
  // A paused camera can still refine tiles or switch to the NASA fallback.
  // Require an uninterrupted quiet period before comparing exact pixels.
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#home-simulation canvas');
    if (!canvas) return false;
    if (canvas.dataset.map !== 'fallback' || canvas.dataset.tilesPending !== '0' || canvas.dataset.detailLoading) {
      delete canvas.dataset.testSettledSince; return false;
    }
    canvas.dataset.testSettledSince ||= String(performance.now());
    return performance.now() - Number(canvas.dataset.testSettledSince) >= 2000;
  }, null, { polling: 100, timeout: 30000 });
  const paused = await homeCanvas.screenshot();
  await page.waitForTimeout(400);
  assert.equal(paused.equals(await homeCanvas.screenshot()), true, 'paused globe stays still');
  let zoomBox = await homeCanvas.boundingBox(); assert.ok(zoomBox);
  await page.mouse.move(zoomBox.x + zoomBox.width / 2, zoomBox.y + zoomBox.height / 2);
  const scrollBeforeZoom = await page.evaluate(() => globalThis.scrollY);
  await page.mouse.wheel(0, -400);
  const zoomedIn = await homeCanvas.screenshot();
  assert.equal(paused.equals(zoomedIn), false, 'wheel zooms the globe in');
  assert.equal(await page.evaluate(() => globalThis.scrollY), scrollBeforeZoom, 'zooming does not scroll the page');
  await page.mouse.wheel(0, 400);
  const zoomedOut = await homeCanvas.screenshot();
  assert.equal(zoomedIn.equals(zoomedOut), false, 'wheel zooms the globe out');
  await homeCanvas.focus(); await page.keyboard.press('=');
  const keyboardZoom = await homeCanvas.screenshot();
  assert.equal(zoomedOut.equals(keyboardZoom), false, 'keyboard can zoom the globe in');
  await page.keyboard.press('-');
  assert.equal(keyboardZoom.equals(await homeCanvas.screenshot()), false, 'keyboard can zoom the globe out');
  zoomBox = await homeCanvas.boundingBox(); assert.ok(zoomBox);
  await page.mouse.move(zoomBox.x + zoomBox.width / 2, zoomBox.y + zoomBox.height / 2);
  // The map now zooms from orbit to a low-altitude map view.
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -10000);
  const closest = await homeCanvas.screenshot();
  await page.mouse.wheel(0, -10000);
  assert.equal(closest.equals(await homeCanvas.screenshot()), true, 'wheel zoom has a minimum distance');
  zoomBox = await homeCanvas.boundingBox(); assert.ok(zoomBox);
  await page.mouse.move(zoomBox.x + zoomBox.width / 2, zoomBox.y + zoomBox.height / 2);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 10000);
  const farthest = await homeCanvas.screenshot();
  zoomBox = await homeCanvas.boundingBox(); assert.ok(zoomBox);
  await page.mouse.move(zoomBox.x + zoomBox.width / 2, zoomBox.y + zoomBox.height / 2);
  const scrollAtLimit = await page.evaluate(() => globalThis.scrollY);
  await page.mouse.wheel(0, 400);
  await page.waitForFunction(previous => globalThis.scrollY > previous, scrollAtLimit);
  await page.evaluate(previous => globalThis.scrollTo(0, previous), scrollAtLimit);
  assert.equal(farthest.equals(await homeCanvas.screenshot()), true, 'wheel zoom has a maximum distance');
  const beforeNorth = await homeCanvas.screenshot();
  await page.getByRole('button', { name: '北極', exact: true }).click();
  const northView = await homeCanvas.screenshot();
  assert.equal(beforeNorth.equals(northView), false, 'north viewpoint changes the rendered globe');
  await page.getByRole('button', { name: '臺北', exact: true }).click();
  assert.equal(northView.equals(await homeCanvas.screenshot()), false, 'Taipei viewpoint restores another angle');
  await page.getByRole('button', { name: '深夜', exact: true }).click();
  assert.equal(await page.getByLabel('臺北時間').inputValue(), '0');
  assert.equal(await page.locator('#sun-state').innerText(), '夜晚');
  assert.equal(await page.getByRole('button', { name: '深夜', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: '正午', exact: true }).click();
  const beforeOverlay = await homeCanvas.screenshot();
  const overlay = page.locator('[data-earth-overlay]');
  assert.equal(await overlay.innerText(), '顯示日照線');
  await overlay.click();
  assert.equal(await overlay.getAttribute('aria-pressed'), 'true');
  assert.equal(beforeOverlay.equals(await homeCanvas.screenshot()), false, 'sunlight overlay changes the rendered globe');
  await page.getByRole('button', { name: '隱藏日照線', exact: true }).click();
  assert.equal(await overlay.getAttribute('aria-pressed'), 'false');
  const noonAltitude = Number.parseFloat(await page.locator('#sun-altitude').innerText());
  assert.ok(noonAltitude > 80, 'Taipei summer noon has a high sun');
  assert.equal(await page.locator('#sun-state').innerText(), '白天');
  const beforeNight = await homeCanvas.screenshot();
  await page.getByLabel('臺北時間').focus(); await page.keyboard.press('Home');
  assert.equal(await page.locator('#sun-state').innerText(), '夜晚');
  assert.ok(Number.parseFloat(await page.locator('#sun-altitude').innerText()) < 0);
  assert.equal(beforeNight.equals(await homeCanvas.screenshot()), false, 'time control changes 3D sunlight');
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
  await page.goto(origin); assert.equal(await page.locator('.lesson-card').count(), 61);
  await page.locator('[data-filter=math]').click(); assert.equal(await page.locator('.lesson-card').count(), 1);
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
      await frame.locator('#gl').evaluate(canvas => {
        const child = canvas.ownerDocument.defaultView;
        const context = canvas.getContext('webgl2');
        const release = child.__alltrueReleaseGraphics;
        child.__alltrueReleaseGraphics = () => {
          child.requestAnimationFrame(() => { child.parent.document.documentElement.dataset.lateLessonFrame = 'true'; });
          release();
          child.parent.document.documentElement.dataset.lessonContextReleased = String(context.isContextLost());
        };
      });
      await frame.locator('a.home').click();
      await page.locator('#catalog').waitFor();
      assert.equal(await page.locator('html').getAttribute('data-lesson-context-released'), 'true', 'lesson WebGL context is released on navigation');
      await page.waitForTimeout(100);
      assert.equal(await page.locator('html').getAttribute('data-late-lesson-frame'), null, 'pending lesson animation is cancelled on navigation');
      assert.equal(await page.locator('.lesson-card').count(), 61);
    }
    console.log(`PASS: ${slug} loads a translated 3D lesson`);
  }
  assert.deepEqual(errors, []);
  await page.close();
  const unavailableTexture = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await unavailableTexture.route('**/derived/nasa-earth-4096.jpg', route => route.abort());
  await unavailableTexture.goto(origin);
  await unavailableTexture.waitForFunction(() => {
    const canvas = document.querySelector('#home-simulation canvas');
    return canvas?.dataset.ready === 'true' && !canvas.dataset.detailLoading;
  });
  assert.equal(await unavailableTexture.locator('#home-simulation canvas').getAttribute('data-texture'), 'standard', 'standard globe remains available when the detailed texture fails');
  await unavailableTexture.close();
  const sharpMobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await sharpMobile.goto(origin);
  await sharpMobile.waitForFunction(() => document.querySelector('#home-simulation canvas')?.dataset.ready === 'true');
  assert.equal(await sharpMobile.locator('#home-simulation canvas').getAttribute('data-texture'), 'standard', 'touch devices retain the lower-memory texture');
  const resolution = await sharpMobile.locator('#home-simulation canvas').evaluate(canvas => ({ width: canvas.width, height: canvas.height, cssWidth: canvas.clientWidth }));
  assert.ok(resolution.width >= resolution.cssWidth * 2.4, 'high-density mobile globe uses a sharp drawing buffer');
  assert.ok(resolution.width * resolution.height <= 1_202_000, 'globe drawing buffer stays within its memory budget');
  await sharpMobile.close();
  const mobileGlobePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobileGlobePage.emulateMedia({ reducedMotion: 'reduce' });
  await mobileGlobePage.goto(origin); assert.equal(await mobileGlobePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const mobileGlobe = mobileGlobePage.locator('#home-simulation canvas');
  await mobileGlobePage.waitForFunction(() => document.querySelector('#home-simulation canvas')?.dataset.ready === 'true');
  const mobileOverlay = mobileGlobePage.locator('[data-earth-overlay]');
  await mobileOverlay.tap();
  assert.equal(await mobileOverlay.getAttribute('aria-pressed'), 'true', 'touch can show the sun and grid overlay');
  const mobileTime = mobileGlobePage.getByLabel('臺北時間');
  await mobileGlobePage.getByRole('button', { name: '傍晚', exact: true }).tap();
  assert.equal(await mobileTime.inputValue(), '18', 'sun preset responds to touch');
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
  await mobile.locator('[data-subject=phys]').tap(); assert.equal(await mobile.locator('.lesson-card').count(), 13);
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
  await mobile.close();
  const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true });
  await tablet.goto(`${origin}#lesson/projectile-step`);
  await tablet.locator('#simulation').scrollIntoViewIfNeeded();
  const tabletFrame = tablet.frameLocator('iframe');
  await tabletFrame.locator('#steps button').first().waitFor({ state: 'visible', timeout: 20000 });
  assert.equal(await tablet.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await tabletFrame.locator('#steps button').nth(1).tap();
  assert.equal(await tabletFrame.locator('#steps button').nth(1).evaluate(el => el.classList.contains('on')), true);
  console.log('PASS: tablet viewport and step touch');
  await tablet.close();
  const noWebGL = await browser.newPage();
  await noWebGL.addInitScript(() => { const original=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (type === 'webgl2') return null; return original.call(this, type, ...args); }; });
  await noWebGL.goto(origin); await noWebGL.getByText('無法啟動 3D 地球').waitFor(); assert.equal(await noWebGL.locator('#home-simulation canvas').count(), 0);
  await noWebGL.goto(`${origin}#lesson/projectile-step`); await noWebGL.getByText('無法啟動 3D 模擬').waitFor(); assert.equal(await noWebGL.locator('iframe').count(),0); console.log('PASS: WebGL fallback');
  await noWebGL.close();
  const failedLesson = await browser.newPage();
  await failedLesson.addInitScript(() => {
    if (globalThis.parent === globalThis) return;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (type === 'webgl2') return null; return original.call(this, type, ...args); };
  });
  await failedLesson.goto(`${origin}#lesson/projectile-step`);
  await failedLesson.getByText('無法啟動 3D 模擬').waitFor({ timeout: 30000 });
  assert.equal(await failedLesson.locator('iframe').count(), 0, 'lesson WebGL initialization failure shows fallback');
  await failedLesson.close();
  const lostContext = await browser.newPage();
  await lostContext.goto(`${origin}#lesson/projectile-step`);
  const lostCanvas = lostContext.frameLocator('iframe').locator('#gl');
  await lostCanvas.waitFor({ timeout: 30000 });
  await lostCanvas.evaluate(canvas => canvas.dispatchEvent(new canvas.ownerDocument.defaultView.Event('webglcontextlost')));
  await lostContext.getByText('無法啟動 3D 模擬').waitFor();
  assert.equal(await lostContext.locator('iframe').count(), 0, 'lost WebGL context shows fallback');
  console.log('PASS: lesson WebGL initialization and context loss fallbacks');
  await lostContext.close();
} finally { await browser.close(); }
