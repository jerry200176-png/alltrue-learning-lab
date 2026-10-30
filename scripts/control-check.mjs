import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const lessons = JSON.parse(readFileSync('src/lessons.json', 'utf8'));
const selected = process.env.LAB_SLUG ? lessons.filter(lesson => lesson.slug === process.env.LAB_SLUG) : lessons;
if (!selected.length) throw new Error('Unknown LAB_SLUG');
const limit = Number(process.env.LAB_LIMIT || selected.length);
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const failures = []; let sliders = 0; let choices = 0; let empty = 0;
try {
  for (const [index, lesson] of selected.slice(0, limit).entries()) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(`${origin}#lesson/${lesson.slug}`); await page.locator('iframe').waitFor();
      const frame = page.frames()[1]; await frame.locator('#steps button').first().waitFor({ timeout: 20000 });
      const inputs = frame.locator('#right input[type=range]:not(:disabled)'); const count = await inputs.count();
      let checked = 0;
      for (let j = 0; j < count; j++) {
        const input = inputs.nth(j);
        const key = await input.getAttribute('data-key');
        if (!key) throw new Error('range has no stable key');
        const label = input.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " sl ")][1]').locator('.slh b');
        await label.waitFor({ state: 'attached' });
        await frame.waitForFunction(inputKey => !!document.querySelector(`#right input[data-key="${inputKey}"]`)?.closest('.sl')?.querySelector('.slh b')?.textContent?.trim(), key, { timeout: 30000 });
        const info = await input.evaluate(el => ({ key: el.dataset.key, min: Number(el.min), max: Number(el.max), value: Number(el.value), step: Number(el.step) }));
        if (!(info.max > info.min)) throw new Error(`invalid range ${JSON.stringify(info)}`);
        const before = (await label.innerText()).trim();
        const step = info.step > 0 ? info.step : (info.max - info.min) / 2;
        let target = info.min + Math.floor((info.max - info.min) / (2 * step)) * step;
        if (Math.abs(target - info.value) < step / 2) target = info.value === info.min ? info.max : info.min;
        target = Number(target.toFixed(8));
        await input.fill(String(target));
        try { await frame.waitForFunction(({ key, previous, expected }) => {
          const el = document.querySelector(`#right input[data-key="${key}"]`);
          const text = el?.closest('.sl')?.querySelector('.slh b')?.textContent?.trim();
          return Number(el?.value) === expected && !!text && text !== previous;
        }, { key: info.key, previous: before, expected: target }, { timeout: 30000 }); } catch { throw new Error(`range ${info.key} from ${info.value} (${before}) to ${target}: ${await label.innerText()}`); }
        sliders++; checked++;
      }
      const groups = frame.locator('#right .sw.multi'); const groupCount = await groups.count();
      for (let j = 0; j < groupCount; j++) {
        const group = groups.nth(j); const buttons = group.locator('button[data-v]:not(:disabled)');
        if (await buttons.count() < 2) continue;
        const target = group.locator('button[data-v]:not(:disabled):not(.on)').first(); if (!await target.count()) continue;
        const groupKey = await group.getAttribute('data-key');
        const value = await target.getAttribute('data-v');
        if (!groupKey || value === null) throw new Error('choice has no stable key or value');
        await target.evaluate(el => el.click());
        await frame.waitForFunction(({ key, selectedValue }) => {
          const group = [...document.querySelectorAll('#right .sw.multi')].find(el => el.getAttribute('data-key') === key);
          return [...(group?.querySelectorAll('button[data-v]') || [])].some(el => el.getAttribute('data-v') === selectedValue && el.classList.contains('on'));
        }, { key: groupKey, selectedValue: value }, { timeout: 30000 });
        choices++; checked++;
      }
      if (!checked) { empty++; console.log(`NO CONTROLS: ${lesson.slug}`); }
      if (errors.length) throw new Error(errors.join('; '));
    } catch (error) { const failure = `${lesson.slug}: ${String(error).slice(0, 350)}`; failures.push(failure); console.error(failure); }
    await page.close();
    if ((index + 1) % 10 === 0) console.log(`Checked ${index + 1}, sliders ${sliders}, choices ${choices}, empty ${empty}, failures ${failures.length}`);
  }
  console.log(`Checked ${Math.min(limit, selected.length)}, sliders ${sliders}, choices ${choices}, empty ${empty}, failures ${failures.length}`);
  for (const failure of failures) console.error(failure);
  if (failures.length) process.exitCode = 1;
} finally { await browser.close(); }
