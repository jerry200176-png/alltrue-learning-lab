import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const lessons = JSON.parse(readFileSync('src/lessons.json', 'utf8'));
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const failures = [];
try {
  for (const [index, lesson] of lessons.entries()) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(`${origin}#lesson/${lesson.slug}`);
      const frame = page.frameLocator('iframe');
      await frame.locator('canvas').first().waitFor({ timeout: 15000 });
      await frame.getByText('目錄', { exact: true }).first().waitFor({ timeout: 15000 });
      if (errors.length) throw new Error(errors.join('; '));
    } catch (error) { failures.push(`${lesson.slug}: ${String(error).slice(0, 300)}`); }
    await page.close();
    if ((index + 1) % 10 === 0) console.log(`Checked ${index + 1}; failures: ${failures.length}`);
  }
  console.log(`Checked ${lessons.length}; failures: ${failures.length}`);
  for (const failure of failures) console.error(failure);
  if (failures.length) process.exitCode = 1;
} finally { await browser.close(); }
