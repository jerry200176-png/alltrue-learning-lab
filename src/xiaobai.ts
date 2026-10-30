import type { Lesson } from './data';
import type { TeachingContent } from './education';

/** User-authorised Xiaobai Education lesson; separate from the pinned Tongjiang collection. */
export const xiaobaiLessons: Lesson[] = [{
  slug: 'xiaobai-mirror', source: 'xiaobai', subject: 'phys', title: '平面鏡成像', type: '光學實驗',
  question: '平面鏡中的像，與物體的位置和大小有什麼關係？',
  steps: ['移動物體，觀察鏡中像的位置。', '比較物距、像距與物像大小。', '改變入射角，觀察反射光路。'],
  file: 'mirror.html', cover: 'mirror-cover.png'
}, {
  slug: 'xiaobai-terrain', source: 'xiaobai', subject: 'geo', title: '等高線與地形圖', type: '地形探索',
  question: '等高線如何呈現地形高度與坡度？',
  steps: ['選取兩個觀察點，比較海拔與相對高度。', '觀察水平切面如何形成等高線。', '比較等高線疏密與地形坡度。'],
  file: 'terrain.html', cover: 'terrain-cover.png'
}];

export const xiaobaiTeaching: Record<string, TeachingContent> = {
  'xiaobai-terrain': {
    objectives: ['辨認海拔與相對高度，並讀取地形圖。', '比較等高線疏密與地形坡度的關係。'],
    principle: '等高線連接海拔相同的點。在等高距與比例尺相同的地形圖上，等高線越密，表示相同水平距離內的高度變化越大，坡度越陡；海拔差是兩點海拔的差值。',
    operations: ['在「海拔與相對高度」中選取 A、B 兩點，記錄各點海拔及高度差。', '切換至「等高線生成」，觀察水平切面與地形交線。', '比較相同等高距下，等高線疏密不同的坡面。'],
    questions: [
      { question: '兩點海拔分別為 152.5 公尺與 742.3 公尺時，相對高度是多少？', guidance: '以較高處海拔減去較低處海拔，得到 589.8 公尺；可在模型中核對。' },
      { question: '水平切面上移時，與地形的交線如何變化？', guidance: '移動切面並觀察交線，說明每條線連接相同海拔的點。' },
      { question: '在等高距和比例尺相同時，等高線較密代表坡度如何？', guidance: '比較兩處坡面；相同水平距離內高度變化較大，坡度較陡。' }
    ],
    misconceptions: ['等高線疏密比較坡度時，必須確認地圖比例尺與等高距相同。', '相對高度是兩點海拔之差，不是其中一點的海拔。'],
    teacherTips: ['請學生先用紙筆計算高度差，再以模型檢查。', '提醒學生模型有垂直方向放大，外觀坡度不一定代表實際比例。']
  },
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
