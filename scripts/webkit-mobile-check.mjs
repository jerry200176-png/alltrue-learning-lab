import { webkit, devices } from 'playwright';
import { readFileSync } from 'node:fs';

// WebKit on Linux can uncover browser-engine issues but is not iPhone Safari.
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const lessons = JSON.parse(readFileSync('src/lessons.json', 'utf8'));
const device = Object.fromEntries(Object.entries(devices['iPhone 13']).filter(([key]) => key !== 'defaultBrowserType'));
const browser = await webkit.launch({ headless: true });
try {
  const context = await browser.newContext(device);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  await page.locator('#home-simulation canvas').waitFor({ timeout: 30000 });
  for (const [index, lesson] of lessons.entries()) {
    const { slug } = lesson;
    console.log(`Loading ${index + 1}/${lessons.length}: ${slug}`);
    await page.goto(`${origin}#lesson/${slug}`);
    const frame = page.frameLocator('#simulation iframe');
    try { await frame.locator('#gl').waitFor({ timeout: 30000 }); }
    catch (error) {
      console.error(`FAILED ${slug}; simulation: ${(await page.locator('#simulation').innerText()).slice(0, 400)}; errors: ${errors.join('; ')}`);
      throw error;
    }
    await frame.locator('#steps button').first().waitFor({ state: 'visible', timeout: 30000 });
    await frame.locator('#tabL').waitFor({ state: 'visible', timeout: 30000 });
    await frame.locator('#tabR').waitFor({ state: 'visible', timeout: 30000 });
    if (errors.length) throw new Error(errors.join('; '));
    if ((index + 1) % 8 === 0) console.log(`Checked ${index + 1}/${lessons.length}: WebKit mobile emulation`);
  }
  console.log(`PASS: ${lessons.length} lessons loaded in WebKit mobile emulation`);
  await context.close();
} finally { await browser.close(); }
