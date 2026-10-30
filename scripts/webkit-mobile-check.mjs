import { webkit, devices } from 'playwright';

// WebKit on Linux can uncover browser-engine issues but is not iPhone Safari.
const origin = process.env.LAB_URL || 'http://127.0.0.1:4173/';
const device = Object.fromEntries(Object.entries(devices['iPhone 13']).filter(([key]) => key !== 'defaultBrowserType'));
const browser = await webkit.launch({ headless: true });
try {
  const context = await browser.newContext(device);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  await page.locator('#home-simulation canvas').waitFor({ timeout: 30000 });
  for (const slug of ['projectile-step', 'titration-step', 'enzyme-step', 'earth-motion-step']) {
    await page.goto(`${origin}#lesson/${slug}`);
    const frame = page.frameLocator('#simulation iframe');
    await frame.locator('#gl').waitFor({ timeout: 30000 });
    await frame.locator('#steps button').first().waitFor({ state: 'visible', timeout: 30000 });
    await frame.locator('#tabL').waitFor({ state: 'visible', timeout: 30000 });
    await frame.locator('#tabR').waitFor({ state: 'visible', timeout: 30000 });
    if (errors.length) throw new Error(errors.join('; '));
    console.log(`PASS: WebKit mobile emulation ${slug}`);
  }
  await context.close();
} finally { await browser.close(); }
