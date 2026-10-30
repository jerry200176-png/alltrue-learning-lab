import './style.css';
import bridgeUrl from './bridge.ts?worker&url';
import { filterLessons, lessons, lessonUrl, subjects, type Lesson, type Subject } from './data';
import { teaching } from './education';
import { solarPosition } from './solar';

const app = document.querySelector<HTMLDivElement>('#app')!;
let globeController: ReturnType<typeof import('./globe').mountGlobe> | undefined;
const base = import.meta.env.BASE_URL;
const asset = (path: string) => `${base}${path}`;
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const subjectKeys: Subject[] = ['phys', 'chem', 'bio', 'geo'];
// These subject images are the unmodified covers from the pinned upstream release.
const subjectCovers: Record<Subject, string> = { phys: 'current-field-step', chem: 'ball-stick-step', bio: 'mitosis-step', geo: 'river-step' };
const brand = `<a class="brand" href="#" aria-label="台北全真一對一首頁"><img src="${asset('logo.jpg')}" alt="全真標誌" /><span><b>台北全真一對一</b><small>LEARNING LAB</small></span></a>`;
const header = `<header class="topbar"><div class="wrap topbar-inner">${brand}<nav aria-label="主要導覽"><a href="#catalog">探索教材</a><a href="#about">關於本站</a></nav><a class="top-cta" href="#catalog">開始探索 <span>↗</span></a></div></header>`;
const footer = `<footer id="about"><div class="wrap footer-inner"><div>${brand}<p>讓好奇心，成為理解世界的起點。</p></div><a class="credits-link" href="#credits">教材來源與授權 ↗</a></div></footer>`;
function credits(): void {
  app.innerHTML = `${header}<main class="credits-page wrap"><a class="back-link" href="#catalog">← 返回教材庫</a><h1>教材來源與授權</h1><p>本網站的 3D 教材、目錄與封面改編自 <a href="https://lab.tongjiang.app/" target="_blank" rel="noreferrer">铜匠实验室（Tongjiang Lab）</a>（<a href="https://github.com/smithjohn78390/tongjiang-lab" target="_blank" rel="noreferrer">原始碼</a>），採 <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hant" target="_blank" rel="noreferrer">CC BY-NC 4.0</a> 授權，僅限非商業用途。</p><p>本網站新增繁體中文介面、文字轉換、教案及操作輔助；保留上游教材的原始程式。首頁地球貼圖沿用該教材內標示的 NASA Blue Marble。內含 three.js 等第三方元件，詳見下列聲明。</p><p><a href="${asset('upstream/LICENSE')}">上游授權條款</a> · <a href="${asset('upstream/THIRD_PARTY_NOTICES.md')}">第三方授權聲明</a></p><p>教學內容與模擬仍待逐項專業審查，課堂使用前請由教師確認。</p></main>${footer}`;
}
function count(subject: Subject) { return lessons.filter(l => l.subject === subject).length; }
function card(l: Lesson): string {
  const s = subjects[l.subject];
  return `<a class="lesson-card" href="${lessonUrl(l.slug)}"><div class="card-image"><img src="${asset(`upstream/${l.cover}`)}" alt="" loading="lazy"><span class="card-badge ${s.color}">${s.name}</span><span class="card-arrow">↗</span></div><div class="card-body"><div class="card-meta">${escape(l.type)} <span>·</span> ${l.steps.length} 個探索步驟</div><h3>${escape(l.title)}</h3><p>${escape(l.question)}</p><span class="card-link">進入單元 <span>→</span></span></div></a>`;
}
function home(): void {
  app.innerHTML = `${header}<main><section class="hero"><div class="wrap hero-inner"><div class="hero-copy"><h1>台北全真<br><em>一對一</em></h1><p>動手探索，讓科學看得見。</p><div class="hero-actions"><a class="button dark" href="#catalog">探索所有教材 <span>↗</span></a></div><div class="hero-stats"><div><b>54</b><span>互動單元</span></div><div><b>04</b><span>探索領域</span></div><div><b>3D</b><span>動手學習</span></div></div></div><div class="hero-demo"><div class="earth-scene"><div class="scene-kicker"><span></span> 互動地球</div><div id="home-simulation" class="hero-simulation"><div class="sim-message">正在載入地球…</div></div><div class="globe-bar"><span>拖曳地球轉動視角</span><div><button type="button" data-earth-turn="-1" aria-label="向左旋轉地球" disabled>←</button><button type="button" data-earth-toggle aria-label="自動旋轉" aria-pressed="false" title="自動旋轉" disabled>▶</button><button type="button" data-earth-turn="1" aria-label="向右旋轉地球" disabled>→</button></div></div></div><aside class="earth-controls" aria-label="地球日照探索"><div><p class="lab-kicker">ALLTRUE · 3D LAB</p><h2>探索晝與夜</h2><p class="lab-lead">改變時間，看看陽光如何移動。</p></div><div class="earth-slider"><label for="earth-hour">臺北時間 <output id="earth-hour-value" for="earth-hour">12:00</output></label><input id="earth-hour" type="range" min="0" max="23.5" step="0.5" value="12"><div class="range-ends"><span>00:00</span><span>12:00</span><span>23:30</span></div></div><div class="earth-slider"><label for="earth-day">日期 <output id="earth-day-value" for="earth-day">6 月 21 日</output></label><input id="earth-day" type="range" min="1" max="365" step="1" value="172"><div class="range-ends"><span>1 月</span><span>6 月</span><span>12 月</span></div></div><div class="sun-results" aria-live="polite" aria-atomic="true"><div><span>臺北太陽高度</span><strong id="sun-altitude">—</strong></div><div><span>日照狀態</span><strong id="sun-state">—</strong></div></div><p class="lab-note">黃色標記：臺北。高度為幾何估算，未計大氣折射。</p><a class="lab-link" href="#lesson/earth-motion-step">深入探索地球運動 <span>↗</span></a></aside></div></div></section><section class="subjects-section wrap"><div class="section-intro"><div><h2>選擇探索領域</h2></div></div><div class="subject-grid">${subjectKeys.map(key => { const s=subjects[key]; return `<button class="subject-tile" data-subject="${key}"><img src="${asset(`upstream/covers/${subjectCovers[key]}.webp`)}" alt="" loading="lazy"><span class="subject-copy"><span class="subject-number">${s.english}</span><strong>${s.name}</strong><small>${count(key)} 個互動單元 <span aria-hidden="true">↗</span></small></span></button>`; }).join('')}</div></section><section class="catalog-section" id="catalog"><div class="wrap"><div class="section-intro"><div><p class="overline">THE LEARNING LIBRARY <span>✳</span></p><h2>一起動手，探索科學。</h2><p>從教材中找到你的下一個問題。</p></div><span class="section-index">02 / 教材庫</span></div><div class="catalog-tools"><div class="filters" aria-label="教材分類"><button class="active" data-filter="all">全部 <span>54</span></button>${subjectKeys.map(k=>`<button data-filter="${k}">${subjects[k].name} <span>${count(k)}</span></button>`).join('')}</div><label class="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="搜尋教材或主題" aria-label="搜尋教材或主題"></label></div><div class="results-label" id="result-count"></div><div class="lesson-grid" id="lesson-grid"></div></div></section><section class="closing"><div class="wrap closing-inner"><span class="closing-symbol">✳</span><div><p class="overline">KEEP ASKING QUESTIONS</p><h2>每一次提問，<br>都是探索的開始。</h2></div><a href="#catalog" class="button light">找到你的教材 <span>↗</span></a></div></section></main>${footer}`;
  let filter = 'all';
  const input = app.querySelector<HTMLInputElement>('.search input')!;
  const grid = app.querySelector<HTMLElement>('#lesson-grid')!;
  const update = () => { const found = filterLessons(input.value, filter); grid.innerHTML = found.map(card).join('') || '<p class="empty">找不到符合的單元，試試其他關鍵字。</p>'; app.querySelector('#result-count')!.textContent = `顯示 ${found.length} 個單元`; app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b => { b.classList.toggle('active', b.dataset.filter === filter); b.setAttribute('aria-pressed', String(b.dataset.filter === filter)); }); };
  app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b => b.addEventListener('click', () => {filter = b.dataset.filter!; update();}));
  app.querySelectorAll<HTMLButtonElement>('[data-subject]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.subject!; update(); document.querySelector('#catalog')?.scrollIntoView({behavior:'instant'});}));
  input.addEventListener('input', update); update();
  const demo = app.querySelector<HTMLElement>('#home-simulation')!;
  const hour = app.querySelector<HTMLInputElement>('#earth-hour')!;
  const day = app.querySelector<HTMLInputElement>('#earth-day')!;
  const updateSun = () => {
    const localHour = Number(hour.value); const dayNumber = Number(day.value);
    const position = solarPosition(dayNumber, localHour);
    const date = new Date(Date.UTC(2025, 0, dayNumber));
    app.querySelector<HTMLOutputElement>('#earth-hour-value')!.textContent = `${String(Math.floor(localHour)).padStart(2, '0')}:${localHour % 1 ? '30' : '00'}`;
    app.querySelector<HTMLOutputElement>('#earth-day-value')!.textContent = `${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
    app.querySelector<HTMLElement>('#sun-altitude')!.textContent = `${position.altitude.toFixed(1)}°`;
    app.querySelector<HTMLElement>('#sun-state')!.textContent = Math.abs(position.altitude) < 1 ? '接近地平線' : position.altitude > 0 ? '白天' : '夜晚';
    globeController?.setSun(position.declination, position.subsolarLongitude);
  };
  hour.addEventListener('input', updateSun); day.addEventListener('input', updateSun); updateSun();
  void import('./globe').then(({ mountGlobe }) => {
    if (!demo.isConnected) return;
    try {
      const toggle = app.querySelector<HTMLButtonElement>('[data-earth-toggle]')!;
      globeController = mountGlobe(demo, asset('derived/earth-blue-marble.jpg'), playing => {
        toggle.setAttribute('aria-pressed', String(playing));
        toggle.textContent = playing ? '❚❚' : '▶';
        toggle.title = playing ? '暫停自動旋轉' : '開始自動旋轉';
      });
      app.querySelectorAll<HTMLButtonElement>('[data-earth-turn], [data-earth-toggle]').forEach(button => { button.disabled = false; });
      updateSun();
    }
    catch { demo.innerHTML = '<div class="sim-message"><b>無法啟動 3D 地球</b><p>請更新瀏覽器或啟用硬體加速。</p></div>'; }
  }).catch(() => { if (demo.isConnected) demo.innerHTML = '<div class="sim-message"><b>地球載入失敗</b><p>請重新整理頁面。</p></div>'; });
  app.querySelectorAll<HTMLButtonElement>('[data-earth-turn]').forEach(button => button.addEventListener('click', () => {
    globeController?.rotate(Number(button.dataset.earthTurn));
  }));
  app.querySelector<HTMLButtonElement>('[data-earth-toggle]')!.addEventListener('click', () => globeController?.toggleRotation());
}
function bullets(items: string[]) { return `<ul>${items.map(i=>`<li>${escape(i)}</li>`).join('')}</ul>`; }
function supportsWebGL(): boolean { try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; } }
async function loadSimulation(lesson: Lesson, holder: HTMLElement): Promise<void> {
  if (!supportsWebGL()) { holder.innerHTML = '<div class="sim-message"><b>無法啟動 3D 模擬</b><p>此瀏覽器或裝置不支援 WebGL 2。請更新瀏覽器、啟用硬體加速，或改用支援 WebGL 2 的裝置。</p></div>'; return; }
  try {
    const response = await fetch(asset(`upstream/${lesson.file}`));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (!holder.isConnected) return;
    const frame = document.createElement('iframe'); frame.title = `${lesson.title} 3D 互動教材`; frame.allow = 'fullscreen'; frame.className='simulation-frame';
    const scriptUrl = new URL(bridgeUrl, window.location.href).href;
    const injected = `<base href="${new URL(asset('upstream/courses/'), window.location.href).href}"><script type="module" src="${scriptUrl}"></script>`;
    frame.srcdoc = html.replace('<head>', `<head>${injected}`); holder.replaceChildren(frame);
  } catch { if (holder.isConnected) holder.innerHTML = '<div class="sim-message"><b>教材載入失敗</b><p>請檢查網路連線後重新整理頁面。</p></div>'; }
}
function detail(lesson: Lesson): void {
  const subject = subjects[lesson.subject]; const content = teaching[lesson.slug];
  app.innerHTML = `${header}<main class="detail-main"><div class="wrap"><a class="back-link" href="#catalog">← 返回教材庫</a><div class="detail-heading"><div><p class="overline">${subject.english} / ${subject.name}</p><h1>${escape(lesson.title)}</h1><p>${escape(lesson.question)}</p></div><span class="detail-number">${String(lessons.indexOf(lesson)+1).padStart(2,'0')} <small>/ 54</small></span></div><div class="detail-layout"><section><div class="sim-header"><div><span class="status-dot"></span> 互動探索 <small>INTERACTIVE LAB</small></div><button class="fullscreen-button" type="button">全螢幕 ↗</button></div><div id="simulation" class="simulation"><div class="sim-message">正在載入教材…</div></div><p class="sim-caption">操作方式依各教材而異。手機可點選畫面左右兩側的分頁展開操作面板，頂部工具列可左右滑動。部分顯示文字由系統轉換，專業術語仍待逐項校對。</p><div class="lesson-content"><p class="review-notice">教學內容與模擬尚待專業審查，課堂使用前請由教師確認。</p>${content ? `<section><p class="overline">LEARNING OBJECTIVES</p><h2>學習目標</h2>${bullets(content.objectives)}</section><section><p class="overline">THE PRINCIPLE</p><h2>認識原理</h2><p>${escape(content.principle)}</p></section><section><p class="overline">LET’S EXPLORE</p><h2>動手操作</h2><ol>${content.operations.map(i=>`<li>${escape(i)}</li>`).join('')}</ol></section><section><p class="overline">THINK ABOUT IT</p><h2>引導問題</h2>${content.questions.map((q,i)=>`<details><summary><span>0${i+1}</span>${escape(q.question)}</summary><p>${escape(q.guidance)}</p></details>`).join('')}</section><section><p class="overline">COMMON MISCONCEPTIONS</p><h2>常見迷思</h2>${bullets(content.misconceptions)}</section><section><p class="overline">FOR TEACHERS</p><h2>教師提示</h2>${bullets(content.teacherTips)}</section>` : `<section class="pending"><p class="overline">TEACHING NOTES</p><h2>教學內容整理中</h2><p>此單元目前提供上游互動教材與探索步驟。學習目標、原理、引導問題、常見迷思及教師提示尚待編寫與核對，請教師先行審閱，再用於課堂。</p></section>`}</div></section><aside><div class="sidebar-card"><p class="overline">YOUR LEARNING PATH</p><h2>探索步驟</h2><p>跟著教材中的步驟，一步步觀察與思考。</p><ol>${lesson.steps.map(step=>`<li>${escape(step)}</li>`).join('')}</ol></div><div class="sidebar-note"><span>✳</span><p>先想一想，<br>再動手試試看。</p></div></aside></div></div></main>${footer}`;
  app.querySelector<HTMLButtonElement>('.fullscreen-button')!.addEventListener('click', () => {
    const frame = app.querySelector<HTMLIFrameElement>('.simulation-frame');
    if (frame?.requestFullscreen) void frame.requestFullscreen().catch(() => {});
  });
  void loadSimulation(lesson, app.querySelector<HTMLElement>('#simulation')!);
}
function render(): void { globeController?.dispose(); globeController = undefined; if (location.hash === '#credits') { credits(); window.scrollTo(0,0); return; } const match = location.hash.match(/^#lesson\/([^/]+)$/); if (match) { let slug = ''; try { slug=decodeURIComponent(match[1]); } catch { /* invalid route */ } const lesson=lessons.find(l=>l.slug===slug); if (lesson) { detail(lesson); window.scrollTo(0,0); return; } } home(); if(location.hash === '#catalog' || location.hash === '#about') requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView()); }
window.addEventListener('hashchange', render); render();
