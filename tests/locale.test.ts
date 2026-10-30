import { expect, it } from 'vitest';
import { translate } from '../src/locale';
it('converts visible text and terminology without repeatedly changing already translated text', () => {
  const value = translate('平抛运动、竖直方向和酶');
  expect(value).toBe('水平拋射運動、鉛直方向和酵素');
  expect(translate(value)).toBe(value);
  expect(translate('只靠一只斜槽')).toBe('只靠一個斜槽');
});
