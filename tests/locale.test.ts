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
  expect(translate('粒子计数组合不保证稳定存在。')).toBe('粒子計數組合不保證穩定存在。');
  expect(translate('6 个质子、6 个中子')).toBe('6 個質子、6 個中子');
  expect(translate('压水堆核电站与链式反应')).toBe('壓水式核電廠與連鎖反應');
  expect(translate('选择当前版块的实验任务')).toBe('選擇目前單元的實驗任務');
});
