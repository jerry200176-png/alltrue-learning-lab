import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

// This is a Chromium viewport/touch emulation, not an iOS or physical-device test.
const lessons = JSON.parse(readFileSync('src/lessons.json', 'utf8'));
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const options = { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
const failures = [];
let browser;
try {
  for (const [index, lesson] of lessons.entries()) {
    if (index % 8 === 0) { await browser?.close(); browser = await chromium.launch(options); }
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(`${origin}#lesson/${lesson.slug}`);
      const frame = page.frameLocator('#simulation iframe');
      await frame.locator('#gl').waitFor({ timeout: 30000 });
      await frame.locator('#steps button').first().waitFor({ state: 'visible', timeout: 30000 });
      await frame.locator('#tabL').waitFor({ state: 'visible', timeout: 30000 });
      await frame.locator('#tabR').waitFor({ state: 'visible', timeout: 30000 });
      if (errors.length) throw new Error(errors.join('; '));
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('頁面水平溢出');
    } catch (error) { failures.push(`${lesson.slug}: ${String(error).slice(0, 250)}`); }
    await page.close();
    if ((index + 1) % 8 === 0) console.log(`Checked ${index + 1}/${lessons.length}; failures: ${failures.length}`);
  }
  console.log(`Checked ${lessons.length}/${lessons.length}; failures: ${failures.length}`);
  for (const failure of failures) console.error(failure);
  if (failures.length) process.exitCode = 1;
} finally { await browser?.close(); }
