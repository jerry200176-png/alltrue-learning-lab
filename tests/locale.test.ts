import { expect, it } from 'vitest';
import { translate } from '../src/locale';
it('converts visible text and terminology without repeatedly changing already translated text', () => {
  const value = translate('平抛运动、竖直方向和酶');
  expect(value).toBe('水平拋射運動、鉛直方向和酵素');
  expect(translate(value)).toBe(value);
  expect(translate('只靠一只斜槽')).toBe('只靠一個斜槽');
  expect(translate('水蒸汽与碳循环')).toBe('水蒸氣與碳循環');
  expect(translate('蒸汽和水蒸汽')).toBe('蒸氣和水蒸氣');
  expect(translate('课件滑块和参考工况')).toBe('教材滑桿和參考操作條件');
});
