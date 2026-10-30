import type { Lesson } from './data';
import type { TeachingContent } from './education';

/** User-authorised Xiaobai Education lesson; separate from the pinned Tongjiang collection. */
export const xiaobaiLessons: Lesson[] = [{
  slug: 'xiaobai-mirror', source: 'xiaobai', subject: 'phys', title: '平面鏡成像', type: '光學實驗',
  question: '平面鏡中的像，與物體的位置和大小有什麼關係？',
  steps: ['移動物體，觀察鏡中像的位置。', '比較物距、像距與物像大小。', '改變入射角，觀察反射光路。'],
  file: 'mirror.html', cover: 'mirror-cover.png'
}];

export const xiaobaiTeaching: Record<string, TeachingContent> = {
  'xiaobai-mirror': {
    objectives: ['觀察平面鏡成像的大小與位置。', '透過光路比較入射角與反射角。'],
    principle: '平面鏡所成的像是正立、等大的虛像，像和物體到鏡面的垂直距離相等。光的反射遵守反射角等於入射角；兩角皆以法線為基準。',
    operations: ['在「鏡面觀察」中移動物體，觀察像的變化。', '切換至「等大、等距與垂直」，改變物距和物高並比較物像。', '切換至「反射定律」，改變入射方向並比較入射角和反射角。'],
    questions: [
      { question: '物體遠離鏡面時，像到鏡面的距離如何變化？', guidance: '調整物距，觀察物體和像到鏡面的垂直距離；兩者會保持相等。' },
      { question: '改變物體高度時，像的高度如何變化？', guidance: '調整物高並比較顯示結果；理想平面鏡中的像與物體等大。' },
      { question: '改變入射角時，反射角會如何變化？', guidance: '在反射定律場景調整光線，並以法線為基準比較兩角。' }
    ],
    misconceptions: ['平面鏡的像是反射光線反向延長形成的虛像，無法直接用光屏接住。', '入射角和反射角是相對法線量測，不是相對鏡面量測。'],
    teacherTips: ['先請學生預測物像距離，再操作並記錄數值。', '可搭配玻璃板與兩個相同物體，協助學生比較模型與真實實驗。']
  }
};
