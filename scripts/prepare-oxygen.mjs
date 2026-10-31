// Reproduce the nested-frame cleanup from the already sanitised owner-provided
// preview. Keep the original preview containing temporary identifiers out of Git.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/prepare-oxygen.mjs <sanitised-preview.html> <output.html>');
const digest = data => createHash('sha256').update(data).digest('hex');
const source = readFileSync(input, 'utf8');
assert.equal(digest(source), 'b59c9c4c557b0323b459cc46e5630e7879e835787db2f40bccc7ee88412ff8f5');
const start = source.indexOf('const MODULES={'); const end = source.indexOf('};', start) + 1;
assert.ok(start >= 0 && end > start);
let modules = source.slice(start, end); let count = 0;
for (const match of [...modules.matchAll(/(\w+):"([A-Za-z0-9+/=]+)"/gu)]) {
  const [, name, encoded] = match; const original = Buffer.from(encoded, 'base64').toString('utf8');
  const cleaned = original.replace(/<script\s+data-xb-content-guard="[^"]+">[\s\S]*?<\/script>/u, '');
  assert.notEqual(cleaned, original, `expected a content guard in ${name}`);
  assert.equal(cleaned.includes('data-xb-content-guard'), false);
  modules = modules.replace(encoded, Buffer.from(cleaned, 'utf8').toString('base64')); count++;
}
assert.equal(count, 3);
const originalResult = source.slice(0, start) + modules + source.slice(end);
const result = originalResult.replace(/<meta\s+name=["']xb-delivery["'][^>]*>/u, '');
assert.notEqual(result, originalResult, 'expected one temporary delivery marker');
assert.equal(digest(result), 'c8c6efb753bfb850497b46c7a6f6c0f19534ee726e3a3666236faa9b189edc72');
writeFileSync(output, result); console.log(`Prepared ${count} nested modules; sha256 ${digest(result)}`);
