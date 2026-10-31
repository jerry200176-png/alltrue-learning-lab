import { expect, it } from 'vitest';
import { lensVisibleLabel } from '../src/lens-labels';

it('distinguishes the adjustable screen distance from the theoretical image distance', () => {
  expect(lensVisibleLabel('像距 = 25 cm')).toBe('光屏距離 = 25 cm');
  expect(lensVisibleLabel('調整像距 s')).toBe('調整光屏距離 s');
  expect(lensVisibleLabel('理論像距 v = 15 cm')).toBe('理論像距 v = 15 cm');
});
