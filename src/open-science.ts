import type { Lesson } from './data';
import type { TeachingContent } from './education';

// Content is maintained independently from the adapted 3D simulation.
export const openScienceLessons: Lesson[] = [{
  source: 'open-science', slug: 'atomic-orbitals', subject: 'chem', title: '原子軌域與電子組態', type: '原子模型',
  question: '原子序改變時，電子組態與已佔據的副層如何改變？',
  steps: ['移動原子序滑桿，選擇氫到氪之間的元素。', '比較元素符號、電子組態與已佔據的副層。', '旋轉示意圖，比較 s、p、d 副層的代表形狀。'],
  file: 'atomic-orbital.html', cover: 'atomic-orbital-cover.png'
}];

export const openScienceTeaching: Record<string, TeachingContent> = {
  'atomic-orbitals': {
    objectives: ['辨認原子序與中性原子的電子數之間的關係。', '比較電子組態中 s、p、d 副層的表示方式。'],
    principle: '中性原子的電子數等於原子序。基態電子組態描述電子分布於各副層的數量；圖中的軌域形狀僅為概念示意，並非電子軌道或精確機率分布。',
    operations: ['選擇氫、氦和氖，記錄各元素的電子組態。', '比較鉀、鈣、鉻與銅的 4s 和 3d 電子數。', '旋轉圖形，比較 s、p、d 副層的代表形狀。'],
    questions: [
      { question: '中性氦原子有幾個電子？它們位於哪個副層？', guidance: '選擇氦，觀察原子序 2 與電子組態 1s²。' },
      { question: '鉀和鈣的 4s 副層各有幾個電子？', guidance: '依序選擇鉀與鈣，比較已佔據副層中的 4s¹ 與 4s²。' },
      { question: '鉻和銅的 3d、4s 電子數與相鄰元素的規律有什麼不同？', guidance: '選擇鉻和銅，觀察基態組態分別為 3d⁵ 4s¹ 與 3d¹⁰ 4s¹。' }
    ],
    misconceptions: ['軌域不是電子繞核運行的固定路徑。', '示意圖的顏色、大小與形狀不是實際顏色，也不代表精確的電子機率分布。', '鉻與銅的基態電子組態不能只用簡單的填入順序推得。'],
    teacherTips: ['先區分軌域、副層與電子組態，再比較模型中的代表形狀。', '本模型不呈現量子數、軌域節面、精確機率密度或同位素差異；部分 d 軌域並非四葉形，請搭配教材說明。']
  }
};

// These strings are injected into the sandboxed source at runtime.
export const orbitalTranslations = { 'zh-HK': {
  app_title: '原子軌域與電子組態', app_subtitle: '中性原子的基態電子組態', atomic_number: '原子序', electron_config: '電子組態',
  adjust_element: '選擇元素（原子序 1–36）', legend_title: '副層形狀示意', legend_s: 's 副層（球形示意）', legend_p: 'p 副層（啞鈴形示意）',
  legend_d: 'd 副層（部分四葉形）', legend_nucleus: '原子核（示意）', note_title: '圖形說明',
  note_content: '顏色與尺寸僅供區分，圖形不代表精確機率分布或各軌域的佔據情形。鉻與銅的基態電子組態具有例外。',
  drag_rotate: '拖曳或用方向鍵旋轉', active_orbitals: '已佔據的副層'
} };
