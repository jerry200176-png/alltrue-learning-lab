import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { allLessons, filterLessons, lessons } from '../src/data';
import { xiaobaiLessons, xiaobaiTeaching } from '../src/xiaobai';

describe('小白教育教材', () => {
  it('adds the authorised mirror lesson without replacing the 54 upstream lessons', () => {
    expect(lessons).toHaveLength(54);
    expect(xiaobaiLessons).toHaveLength(5);
    expect(allLessons).toHaveLength(59);
    expect(new Set(allLessons.map(lesson => lesson.slug)).size).toBe(59);
    expect(filterLessons('平面鏡', 'phys').map(lesson => lesson.slug)).toEqual(['xiaobai-mirror']);
    expect(filterLessons('等高線', 'geo').map(lesson => lesson.slug)).toEqual(['xiaobai-terrain']);
    expect(filterLessons('元素辨認', 'chem').map(lesson => lesson.slug)).toEqual(['xiaobai-atom']);
    expect(filterLessons('透鏡', 'phys').map(lesson => lesson.slug)).toEqual(['xiaobai-lens']);
    expect(filterLessons('核裂變', 'phys').map(lesson => lesson.slug)).toEqual(['xiaobai-nuclear']);
    const nuclear = xiaobaiTeaching['xiaobai-nuclear'];
    expect(nuclear.operations).toHaveLength(3);
    expect(nuclear.questions).toHaveLength(3);
    expect(nuclear.questions.every(item => item.question && item.guidance)).toBe(true);
    const lens = xiaobaiTeaching['xiaobai-lens'];
    expect(lens.operations).toHaveLength(3);
    expect(lens.questions).toHaveLength(3);
    expect(lens.questions.every(item => item.question && item.guidance)).toBe(true);
    const atom = xiaobaiTeaching['xiaobai-atom'];
    expect(atom.operations).toHaveLength(3);
    expect(atom.questions).toHaveLength(3);
    expect(atom.questions.every(item => item.question && item.guidance)).toBe(true);
    const terrain = xiaobaiTeaching['xiaobai-terrain'];
    expect(terrain.operations).toHaveLength(3);
    expect(terrain.questions).toHaveLength(3);
    expect(terrain.questions.every(item => item.question && item.guidance)).toBe(true);
    for (const lesson of xiaobaiLessons) {
      const content = xiaobaiTeaching[lesson.slug];
      expect(content.objectives.length).toBeGreaterThan(0);
      expect(content.principle).toBeTruthy();
      expect(content.operations.length).toBeGreaterThanOrEqual(3);
      expect(content.questions.length).toBeGreaterThanOrEqual(3);
      expect(content.misconceptions.length).toBeGreaterThan(0);
      expect(content.teacherTips.length).toBeGreaterThan(0);
    }
    const plan = xiaobaiTeaching['xiaobai-mirror'];
    expect(plan.objectives.length).toBeGreaterThan(0);
    expect(plan.principle).toBeTruthy();
    expect(plan.operations).toHaveLength(3);
    expect(plan.questions).toHaveLength(3);
    expect(plan.questions.every(item => item.question && item.guidance)).toBe(true);
    expect(plan.misconceptions.length).toBeGreaterThan(0);
    expect(plan.teacherTips.length).toBeGreaterThan(0);
  });
  it('pins the authorised nuclear lesson without a temporary delivery identifier', () => {
    const html = readFileSync('public/xiaobai/nuclear-energy.html');
    expect(createHash('sha256').update(html).digest('hex')).toBe('77e1f43ed318bdd7eec342ecc398fa553c76fc468a619b3d068283b8aca33a1f');
    expect(html.toString()).not.toContain('deliveryId');
    expect(html.toString()).not.toMatch(/<meta\s+name=["']xb-delivery["']/u);
    expect(html.toString()).toContain('three.js authors');
  });
  it('pins the authorised lens lesson without a temporary delivery identifier', () => {
    const html = readFileSync('public/xiaobai/lens.html');
    expect(createHash('sha256').update(html).digest('hex')).toBe('c1c88572e16cc70249aef774349a744362fe95185df33d8f59976a449ea2d7ae');
    expect(html.toString()).not.toContain('deliveryId');
    expect(html.toString()).not.toMatch(/<meta\s+name=["']xb-delivery["']/u);
    expect(html.toString()).toContain('three.js authors');
  });
  it('pins the authorised atom lesson without a temporary delivery identifier', () => {
    const html = readFileSync('public/xiaobai/atom.html');
    expect(createHash('sha256').update(html).digest('hex')).toBe('226c6c15e69c7a32a19513d26ccc7e3531d7f375bfe5642cc1398774d5ed2af6');
    expect(html.toString()).not.toContain('deliveryId');
    expect(html.toString()).not.toMatch(/<meta\s+name=["']xb-delivery["']/u);
    expect(html.toString()).toContain('three.js authors');
  });
  it('pins the authorised terrain lesson without a temporary delivery identifier', () => {
    const html = readFileSync('public/xiaobai/terrain.html');
    expect(createHash('sha256').update(html).digest('hex')).toBe('f4a54dd5c332300061987fbbd6f113e2082df3aadd826c0be7d9d6363dce2425');
    expect(html.toString()).not.toContain('deliveryId');
    expect(html.toString()).not.toMatch(/<meta\s+name=["']xb-delivery["']/u);
    expect(html.toString()).toContain('three.js authors');
  });
  it('keeps the reviewed lesson and derived preview pinned and omits temporary access identifiers', () => {
    const html = readFileSync('public/xiaobai/mirror.html');
    const cover = readFileSync('public/xiaobai/mirror-cover.png');
    const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex');
    expect(sha(html)).toBe('85d27445c9507428b2020cc398ddfbe30e948613b126903b3ed86e9efdf54a2a');
    expect(sha(cover)).toBe('810539489d296ac90fd9109dd8dbeb6cbd0edaac81d05c2eefe70351af3520b6');
    expect(html.toString()).not.toContain('deliveryId');
    expect(html.toString()).not.toMatch(/<meta\s+name=["']xb-delivery["']/u);
    expect(html.toString()).toContain('three.js authors');
    expect(html.toString()).toContain('小小小白');
  });
});
