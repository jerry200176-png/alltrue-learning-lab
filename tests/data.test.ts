import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { filterLessons, lessons, subjects, type Subject } from '../src/data';
import { teaching } from '../src/education';
import hashes from '../docs/upstream-sha256.json';

describe('教材目錄', () => {
  it('contains every upstream lesson exactly once with valid subjects and source paths', () => {
    expect(lessons).toHaveLength(54);
    expect(new Set(lessons.map(l => l.slug)).size).toBe(54);
    for (const lesson of lessons) {
      expect(subjects[lesson.subject]).toBeDefined();
      expect(lesson.title).toBeTruthy(); expect(lesson.question).toBeTruthy();
      expect(lesson.steps.length).toBeGreaterThan(0);
      expect(lesson.file).toBe(`courses/${lesson.slug}.html`);
      expect(lesson.cover).toBe(`covers/${lesson.slug}.webp`);
    }
    expect((['phys', 'chem', 'bio', 'geo'] as Subject[]).map(s => lessons.filter(l => l.subject === s).length)).toEqual([10, 25, 5, 14]);
  });
  it('filters by subject and text without returning unrelated entries', () => {
    expect(filterLessons('', 'bio')).toHaveLength(5);
    expect(filterLessons('水平拋射', 'phys').map(l => l.slug)).toEqual(['projectile-step']);
    expect(filterLessons('水平拋射', 'chem')).toHaveLength(0);
    expect(filterLessons('找不到的教材', 'all')).toHaveLength(0);
  });
  it('validates the structure of the teaching drafts', () => {
    expect(Object.keys(teaching).sort()).toEqual(lessons.map(l => l.slug).sort());
    for (const [slug, plan] of Object.entries(teaching)) {
      expect(lessons.some(l => l.slug === slug)).toBe(true);
      expect(plan.objectives.length).toBeGreaterThan(0); expect(plan.principle).toBeTruthy();
      expect(plan.operations.length).toBeGreaterThanOrEqual(3); expect(plan.questions.length).toBeGreaterThanOrEqual(3);
      expect(plan.questions.every(q => q.question.trim() && q.guidance.trim())).toBe(true);
      expect(new Set(plan.questions.map(q => q.question)).size).toBe(plan.questions.length);
      expect(plan.operations.every(step => step.trim())).toBe(true);
      expect(plan.misconceptions.length).toBeGreaterThan(0); expect(plan.teacherTips.length).toBeGreaterThan(0);
    }
  });
  it('keeps the imported lesson, cover, catalog and license files byte-identical to the pinned source', () => {
    for (const [path, expected] of Object.entries(hashes)) {
      const actual = createHash('sha256').update(readFileSync(`public/upstream/${path}`)).digest('hex');
      expect(actual, path).toBe(expected);
    }
  });
});
