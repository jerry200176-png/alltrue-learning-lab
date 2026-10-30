import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { allLessons, filterLessons, lessons } from '../src/data';
import { xiaobaiLessons, xiaobaiTeaching } from '../src/xiaobai';

describe('小白教育教材', () => {
  it('adds the authorised mirror lesson without replacing the 54 upstream lessons', () => {
    expect(lessons).toHaveLength(54);
    expect(xiaobaiLessons).toHaveLength(2);
    expect(allLessons).toHaveLength(56);
    expect(new Set(allLessons.map(lesson => lesson.slug)).size).toBe(56);
    expect(filterLessons('平面鏡', 'phys').map(lesson => lesson.slug)).toEqual(['xiaobai-mirror']);
    expect(filterLessons('等高線', 'geo').map(lesson => lesson.slug)).toEqual(['xiaobai-terrain']);
    const terrain = xiaobaiTeaching['xiaobai-terrain'];
    expect(terrain.operations).toHaveLength(3);
    expect(terrain.questions).toHaveLength(3);
    expect(terrain.questions.every(item => item.question && item.guidance)).toBe(true);
    const plan = xiaobaiTeaching['xiaobai-mirror'];
    expect(plan.objectives.length).toBeGreaterThan(0);
    expect(plan.principle).toBeTruthy();
    expect(plan.operations).toHaveLength(3);
    expect(plan.questions).toHaveLength(3);
    expect(plan.questions.every(item => item.question && item.guidance)).toBe(true);
    expect(plan.misconceptions.length).toBeGreaterThan(0);
    expect(plan.teacherTips.length).toBeGreaterThan(0);
  });
  it('pins the authorised terrain lesson without a temporary delivery identifier', () => {
    const html = readFileSync('public/xiaobai/terrain.html');
    expect(createHash('sha256').update(html).digest('hex')).toBe('fd7fd44a588317fb23b6e209f9d9bf8217fa4376ffb4b691ea0b50981de06964');
    expect(html.toString()).not.toContain('deliveryId');
    expect(html.toString()).toContain('three.js authors');
  });
  it('keeps the reviewed lesson and derived preview pinned and omits temporary access identifiers', () => {
    const html = readFileSync('public/xiaobai/mirror.html');
    const cover = readFileSync('public/xiaobai/mirror-cover.png');
    const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex');
    expect(sha(html)).toBe('85d27445c9507428b2020cc398ddfbe30e948613b126903b3ed86e9efdf54a2a');
    expect(sha(cover)).toBe('810539489d296ac90fd9109dd8dbeb6cbd0edaac81d05c2eefe70351af3520b6');
    expect(html.toString()).not.toContain('deliveryId');
    expect(html.toString()).toContain('three.js authors');
    expect(html.toString()).toContain('小小小白');
  });
});
