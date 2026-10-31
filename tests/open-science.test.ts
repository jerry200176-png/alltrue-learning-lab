import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { allLessons, filterLessons } from '../src/data';
import { openScienceLessons, openScienceTeaching } from '../src/open-science';

const sha = (value: Buffer) => createHash('sha256').update(value).digest('hex');
describe('開源科學教材', () => {
  it('adds the orbital lesson with a complete teaching guide', () => {
    expect(allLessons).toHaveLength(62);
    expect(openScienceLessons).toHaveLength(1);
    expect(filterLessons('電子組態', 'chem').map(lesson => lesson.slug)).toEqual(['atomic-orbitals']);
    const content = openScienceTeaching['atomic-orbitals'];
    expect(content.objectives.length).toBeGreaterThan(0);
    expect(content.principle).toContain('示意');
    expect(content.operations).toHaveLength(3);
    expect(content.questions).toHaveLength(3);
    expect(content.questions.every(item => item.question && item.guidance)).toBe(true);
    expect(content.misconceptions.length).toBeGreaterThan(0);
    expect(content.teacherTips.length).toBeGreaterThan(0);
  });
  it('pins the reviewed original, adaptation and local stylesheet', () => {
    expect(sha(readFileSync('vendor/open-science/atomic-orbital.original.html'))).toBe('41d16fbe38026ec4a2f155e804e5aa810eb3c9ce3ffb4a0a90506bb537390ffe');
    expect(sha(readFileSync('public/open-science/atomic-orbital.html'))).toBe('e8684cac4cdc6b5fb71d70cac6b1b6a254642b7cde576332b0f7449f446c07a2');
    expect(sha(readFileSync('public/open-science/orbital-tailwind.css'))).toBe('59dadaeff2d1e96164fd33d4465299711b1ad7add88229c96634bb03b7296bd3');
    expect(readFileSync('public/open-science/LICENSE', 'utf8')).toContain('Copyright (c) 2025 Hong Kong Physics Teachers');
  });
  it('uses consistent electron counts including the potassium, chromium and copper exceptions', () => {
    const html = readFileSync('public/open-science/atomic-orbital.html', 'utf8');
    const fn = html.match(/function getOrbitalsForZ\(z\) \{[\s\S]*?return orbitals;\s*\}/u)?.[0];
    expect(fn).toBeTruthy();
    const calculate = runInNewContext(`(${fn})`) as (z: number) => Array<{type: string; n: number; electrons: number}>;
    for (let z = 1; z <= 36; z++) expect(calculate(z).reduce((sum, orbital) => sum + orbital.electrons, 0)).toBe(z);
    for (const [z, fourS, threeD] of [[19,1,0], [20,2,0], [24,1,5], [29,1,10]]) {
      const orbitals = calculate(z);
      expect(orbitals.find(item => item.n === 4 && item.type === 's')?.electrons ?? 0).toBe(fourS);
      expect(orbitals.find(item => item.n === 3 && item.type === 'd')?.electrons ?? 0).toBe(threeD);
    }
  });
});
