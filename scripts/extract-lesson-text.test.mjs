import { test, expect } from 'vitest';
import { extractStrings } from './extract-lesson-text.mjs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('classifies display candidates separately from program keys and conditions', () => {
  const source = `const data={"控制鍵": 1, label:"顯示標籤"}; obj["內部索引"] = 1; if (mode === "內部狀態") obj.textContent = "顯示內容"; canvas.fillText("圖形標籤", 0, 0); obj.innerHTML = \`<b>動態內容</b>\`; obj.setAttribute("title", "提示文字");`;
  const records = extractStrings(source, 12);
  const contexts = Object.fromEntries(records.map(record => [record.text, record.context]));
  expect(contexts).toEqual({
    '控制鍵': 'program-key', '顯示標籤': 'display-candidate', '內部索引': 'program-key', '內部狀態': 'program-condition',
    '顯示內容': 'display-candidate', '圖形標籤': 'display-candidate', '<b>動態內容</b>': 'display-candidate', '提示文字': 'display-candidate'
  });
  for (const record of records) expect(source.slice(record.start - 12, record.end - 12)).toHaveLength(record.end - record.start);
});


test('extracts the pinned lesson with traceable positions without writing into upstream', () => {
  const directory = mkdtempSync(join(tmpdir(), 'alltrue-text-'));
  try {
    const output = join(directory, 'report.json');
    execFileSync(process.execPath, ['scripts/extract-lesson-text.mjs', 'projectile-step', output]);
    const report = JSON.parse(readFileSync(output, 'utf8'));
    const hashes = JSON.parse(readFileSync('docs/upstream-sha256.json', 'utf8'));
    expect(report.sha256).toBe(hashes['courses/projectile-step.html']);
    expect(report.records.length).toBeGreaterThan(100);
    expect(report.records[0].context).toBe('display-candidate');
    expect(report.records[0].text).toContain('平抛运动');
    expect(() => execFileSync(process.execPath, ['scripts/extract-lesson-text.mjs', 'projectile-step', 'public/upstream/courses/report.json'], { stdio: 'pipe' })).toThrow();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
