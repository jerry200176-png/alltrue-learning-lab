import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const lessons = JSON.parse(readFileSync('src/lessons.json', 'utf8'));
const selected = process.env.LAB_SLUG ? lessons.filter(lesson => lesson.slug === process.env.LAB_SLUG) : lessons;
if (!selected.length) throw new Error('Unknown LAB_SLUG');
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const failures = []; let toggles = 0; let skipped = 0;
try {
  for (const [index, lesson] of selected.entries()) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(`${origin}#lesson/${lesson.slug}`); await page.locator('iframe').waitFor();
      const frame = page.frames()[1]; await frame.locator('#steps button').first().waitFor({ timeout: 20000 });
      const groups = frame.locator('#right .sw:not(.multi)');
      for (let j = 0; j < await groups.count(); j++) {
        const group = groups.nth(j); const button = group.locator('button');
        if (await button.count() !== 1 || await button.isDisabled()) { skipped++; continue; }
        const key = await group.getAttribute('data-key'); if (!key) throw new Error('toggle has no stable key');
        await frame.waitForFunction(inputKey => [...document.querySelectorAll('#right .sw:not(.multi)')].find(el => el.getAttribute('data-key') === inputKey)?.querySelector('.st')?.textContent?.trim(), key, { timeout: 30000 });
        const before = await group.evaluate(el => ({ on: el.querySelector('button')?.classList.contains('on'), text: el.querySelector('.st')?.textContent?.trim() }));
        await button.evaluate(el => el.click());
        await frame.waitForFunction(({ inputKey, state }) => {
          const group = [...document.querySelectorAll('#right .sw:not(.multi)')].find(el => el.getAttribute('data-key') === inputKey);
          const button = group?.querySelector('button'); const text = group?.querySelector('.st')?.textContent?.trim();
          return !!button && (button.classList.contains('on') !== state.on || (!!text && text !== state.text));
        }, { inputKey: key, state: before }, { timeout: 30000 });
        toggles++;
      }
      if (errors.length) throw new Error(errors.join('; '));
    } catch (error) { const failure = `${lesson.slug}: ${String(error).slice(0, 350)}`; failures.push(failure); console.error(failure); }
    await page.close();
    if ((index + 1) % 10 === 0) console.log(`Checked ${index + 1}, toggles ${toggles}, skipped ${skipped}, failures ${failures.length}`);
  }
  console.log(`Checked ${selected.length}, toggles ${toggles}, skipped ${skipped}, failures ${failures.length}`);
  for (const failure of failures) console.error(failure);
  if (failures.length) process.exitCode = 1;
} finally { await browser.close(); }
