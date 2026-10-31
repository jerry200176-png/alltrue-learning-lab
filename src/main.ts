import './style.css';
import bridgeUrl from './bridge.ts?worker&url';
import { allLessons, filterLessons, lessonUrl, subjects, type Lesson, type Subject } from './data';
import { xiaobaiTeaching } from './xiaobai';
import { teaching } from './education';
import { solarPosition } from './solar';
import { loadCesium } from './cesium-loader';

const app = document.querySelector<HTMLDivElement>('#app')!;
let globeController: ReturnType<typeof import('./globe').mountGlobe> | undefined;
const base = import.meta.env.BASE_URL;
const asset = (path: string) => `${base}${path}`;
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const subjectKeys: Subject[] = ['phys', 'chem', 'bio', 'geo', 'math'];
// These subject images are the unmodified covers from the pinned upstream release.
const subjectCovers: Record<Subject, string> = { phys: 'upstream/covers/current-field-step.webp', chem: 'upstream/covers/ball-stick-step.webp', bio: 'upstream/covers/mitosis-step.webp', geo: 'upstream/covers/river-step.webp', math: 'xiaobai/blocks-cover.png' };
const brand = `<a class="brand" href="#" aria-label="台北全真一對一首頁"><img src="${asset('logo.jpg')}" alt="全真標誌" /><span><b>台北全真一對一</b><small>LEARNING LAB</small></span></a>`;
const header = `<header class="topbar"><div class="wrap topbar-inner">${brand}<nav aria-label="主要導覽"><a href="#catalog">探索教材</a><a href="#credits">關於本站</a></nav><a class="mobile-about" href="#credits" aria-label="關於本站" title="關於本站">ⓘ</a><a class="top-cta" href="#catalog">開始探索 <span>↗</span></a></div></header>`;
const footer = `<footer id="about"><div class="wrap footer-inner"><div>${brand}<p>讓好奇心，成為理解世界的起點。</p></div></div></footer>`;
function credits(): void {
  app.innerHTML = `${header}<main class="credits-page wrap"><a class="back-link" href="#catalog">← 返回教材庫</a><h1>教材來源與授權</h1><p>本站原有的 54 個 3D 教材、目錄與封面改編自 <a href="https://lab.tongjiang.app/" target="_blank" rel="noreferrer">铜匠实验室（Tongjiang Lab）</a>（<a href="https://github.com/smithjohn78390/tongjiang-lab" target="_blank" rel="noreferrer">原始碼</a>），採 <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hant" target="_blank" rel="noreferrer">CC BY-NC 4.0</a> 授權，僅限非商業用途。</p><p>「平面鏡成像」、「等高線與地形圖」、「原子結構與元素辨認」、「凸透鏡與凹透鏡成像」、「核裂變與核電廠」、「立體積木與不同視角」及「空氣與氧氣」由小白教育提供，權利人已授權本網站使用及翻譯。該教材保留原作者與第三方聲明。</p><p>本網站新增繁體中文介面、文字轉換、教案及操作輔助；Tongjiang Lab 教材保留上游原始程式。首頁地球與星空使用 NASA/Goddard Space Flight Center Scientific Visualization Studio 的 <a href="https://svs.gsfc.nasa.gov/3615/" target="_blank" rel="noreferrer">地球合成影像</a>與 <a href="https://svs.gsfc.nasa.gov/4851/" target="_blank" rel="noreferrer">Deep Star Maps 2020</a>。地球影像含 Reto Stöckli／NASA Earth Observatory 的 Blue Marble 資料；星圖含 ESA/Gaia/DPAC 資料。內含 three.js 等第三方元件，詳見下列聲明。</p><p><a href="${asset('upstream/LICENSE')}">上游授權條款</a> · <a href="${asset('upstream/THIRD_PARTY_NOTICES.md')}">第三方授權聲明</a></p><p>首頁地球引擎依 <a href="https://github.com/bilawalsidhu/gods-eye-view" target="_blank" rel="noreferrer">God’s Eye View</a>（MIT）調整，使用 <a href="${asset('third-party/CESIUM-LICENSE.txt')}">CesiumJS（Apache 2.0）</a>；衛星地圖由 Esri、Vantor、Earthstar Geographics 和 GIS 社群提供，地形由 Re:Earth Terrain／Mapterhorn（CC BY 4.0）提供。<a href="${asset('third-party/GODS-EYE-VIEW-LICENSE.txt')}">專案授權</a></p><p>教學內容與模擬仍待逐項專業審查，課堂使用前請由教師確認。</p></main>${footer}`;
}
function count(subject: Subject) { return allLessons.filter(l => l.subject === subject).length; }
function card(l: Lesson): string {
  const s = subjects[l.subject];
  return `<a class="lesson-card" href="${lessonUrl(l.slug)}"><div class="card-image"><img src="${asset(l.source === 'xiaobai' ? `xiaobai/${l.cover}` : `upstream/${l.cover}`)}" alt="" loading="lazy"><span class="card-badge ${s.color}">${s.name}</span><span class="card-arrow">↗</span></div><div class="card-body"><div class="card-meta">${escape(l.type)} <span>·</span> ${l.steps.length} 個探索步驟</div><h3>${escape(l.title)}</h3><p>${escape(l.question)}</p><span class="card-link">進入單元 <span>→</span></span></div></a>`;
}
function home(): void {
  app.innerHTML = `${header}<main><section class="hero"><div class="wrap hero-inner"><div class="hero-copy"><p class="hero-eyebrow"><span></span> ALLTRUE LEARNING LAB · 3D SCIENCE</p><h1>台北全真<br><em>一對一</em></h1><p>動手探索，讓科學看得見。</p><div class="hero-actions"><a class="button dark" href="#catalog">探索所有教材 <span>↗</span></a></div><div class="hero-stats"><div><b>${allLessons.length}</b><span>互動單元</span></div><div><b>${String(subjectKeys.length).padStart(2, '0')}</b><span>探索領域</span></div><div><b>3D</b><span>動手學習</span></div></div></div><div class="hero-demo"><div class="earth-scene"><div class="scene-kicker"><span></span> 互動地球</div><div id="home-simulation" class="hero-simulation"><div class="sim-message">正在載入地球…</div></div><div class="globe-bar"><span>拖曳旋轉・滾輪縮放</span><div><button type="button" data-earth-turn="-1" aria-label="向左旋轉地球" disabled>←</button><button type="button" data-earth-toggle aria-label="自動旋轉" aria-pressed="false" title="自動旋轉" disabled>▶</button><button type="button" data-earth-turn="1" aria-label="向右旋轉地球" disabled>→</button></div></div><div class="view-actions" aria-label="地球視角"><span>視角</span><button type="button" data-earth-view="taipei" disabled>臺北</button><button type="button" data-earth-view="north" disabled>北極</button><button type="button" data-earth-overlay aria-pressed="false" disabled>顯示日照線</button></div></div><aside class="earth-controls" aria-label="地球日照探索"><div><p class="lab-kicker">ALLTRUE · 3D LAB</p><h2>追著陽光看地球</h2><p class="lab-lead">調整日照，看看晝夜如何變化。</p></div><div class="sun-presets" role="group" aria-label="日照時段"><button type="button" data-sun-hour="6">清晨</button><button type="button" data-sun-hour="12">正午</button><button type="button" data-sun-hour="18">傍晚</button><button type="button" data-sun-hour="0">深夜</button></div><div class="earth-slider"><label for="earth-hour">臺北時間 <output id="earth-hour-value" for="earth-hour">12:00</output></label><input id="earth-hour" type="range" min="0" max="23.5" step="0.5" value="12"><div class="range-ends"><span>00:00</span><span>12:00</span><span>23:30</span></div></div><div class="earth-slider"><label for="earth-day">日期 <output id="earth-day-value" for="earth-day">6 月 21 日</output></label><input id="earth-day" type="range" min="1" max="365" step="1" value="172"><div class="range-ends"><span>1 月</span><span>6 月</span><span>12 月</span></div></div><div class="sun-results" aria-live="polite" aria-atomic="true"><div><span>臺北太陽高度</span><strong id="sun-altitude">—</strong></div><div><span>日照狀態</span><strong id="sun-state">—</strong></div></div><p class="lab-note"><span class="legend-taipei"></span> 臺北 &nbsp; <span class="legend-sun"></span> 太陽直射點・光線方向示意<br>衛星影像非即時；日照高度為幾何估算。</p><a class="lab-link" href="#lesson/earth-motion-step">深入探索地球運動 <span>↗</span></a></aside></div></div></section><section class="subjects-section wrap"><div class="section-intro"><div><h2>選擇探索領域</h2></div></div><div class="subject-grid">${subjectKeys.map(key => { const s=subjects[key]; return `<button class="subject-tile" data-subject="${key}"><img src="${asset(subjectCovers[key])}" alt="" loading="lazy"><span class="subject-copy"><span class="subject-number">${s.english}</span><strong>${s.name}</strong><small>${count(key)} 個互動單元 <span aria-hidden="true">↗</span></small></span></button>`; }).join('')}</div></section><section class="catalog-section" id="catalog"><div class="wrap"><div class="section-intro"><div><p class="overline">THE LEARNING LIBRARY <span>✳</span></p><h2>一起動手，探索科學。</h2><p>從教材中找到你的下一個問題。</p></div><span class="section-index">02 / 教材庫</span></div><div class="catalog-tools"><div class="filters" aria-label="教材分類"><button class="active" data-filter="all">全部 <span>${allLessons.length}</span></button>${subjectKeys.map(k=>`<button data-filter="${k}">${subjects[k].name} <span>${count(k)}</span></button>`).join('')}</div><label class="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="搜尋教材或主題" aria-label="搜尋教材或主題"></label></div><div class="results-label" id="result-count"></div><div class="lesson-grid" id="lesson-grid"></div></div></section><section class="closing"><div class="wrap closing-inner"><span class="closing-symbol">✳</span><div><p class="overline">KEEP ASKING QUESTIONS</p><h2>每一次提問，<br>都是探索的開始。</h2></div><a href="#catalog" class="button light">找到你的教材 <span>↗</span></a></div></section></main>${footer}`;
  let filter = 'all';
  const input = app.querySelector<HTMLInputElement>('.search input')!;
  const grid = app.querySelector<HTMLElement>('#lesson-grid')!;
  const update = () => { const found = filterLessons(input.value, filter); grid.innerHTML = found.map(card).join('') || '<p class="empty">找不到符合的單元，試試其他關鍵字。</p>'; app.querySelector('#result-count')!.textContent = `顯示 ${found.length} 個單元`; app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b => { b.classList.toggle('active', b.dataset.filter === filter); b.setAttribute('aria-pressed', String(b.dataset.filter === filter)); }); };
  app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b => b.addEventListener('click', () => {filter = b.dataset.filter!; update();}));
  app.querySelectorAll<HTMLButtonElement>('[data-subject]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.subject!; update(); document.querySelector('#catalog')?.scrollIntoView({behavior:'instant'});}));
  input.addEventListener('input', update); update();
  const demo = app.querySelector<HTMLElement>('#home-simulation')!;
  app.querySelector<HTMLElement>('.hero')!.style.setProperty('--star-map', `url("${new URL(asset('derived/nasa-stars-4096.jpg'), window.location.href).href}")`);
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
    app.querySelectorAll<HTMLButtonElement>('[data-sun-hour]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.sunHour) === localHour)));
  };
  hour.addEventListener('input', updateSun); day.addEventListener('input', updateSun);
  app.querySelectorAll<HTMLButtonElement>('[data-sun-hour]').forEach(button => button.addEventListener('click', () => { hour.value = button.dataset.sunHour!; updateSun(); }));
  app.querySelectorAll<HTMLButtonElement>('[data-earth-view]').forEach(button => button.addEventListener('click', () => globeController?.setView(button.dataset.earthView === 'north' ? 'north' : 'taipei')));
  updateSun();
  void loadCesium().then(() => import('./globe')).then(({ mountGlobe }) => {
    if (!demo.isConnected) return;
    try {
      const toggle = app.querySelector<HTMLButtonElement>('[data-earth-toggle]')!;
      globeController = mountGlobe(demo, asset('derived/nasa-earth-2048.jpg'), playing => {
        toggle.setAttribute('aria-pressed', String(playing));
        toggle.textContent = playing ? '❚❚' : '▶';
        toggle.title = playing ? '暫停自動旋轉' : '開始自動旋轉';
      }, asset('derived/nasa-earth-4096.jpg'));
      app.querySelectorAll<HTMLButtonElement>('[data-earth-turn], [data-earth-toggle], [data-earth-view], [data-earth-overlay]').forEach(button => { button.disabled = false; });
      updateSun();
    }
    catch { demo.innerHTML = '<div class="sim-message"><b>無法啟動 3D 地球</b><p>請更新瀏覽器或啟用硬體加速。</p></div>'; }
  }).catch(() => { if (demo.isConnected) demo.innerHTML = '<div class="sim-message"><b>地球載入失敗</b><p>請重新整理頁面。</p></div>'; });
  app.querySelectorAll<HTMLButtonElement>('[data-earth-turn]').forEach(button => button.addEventListener('click', () => {
    globeController?.rotate(Number(button.dataset.earthTurn));
  }));
  app.querySelector<HTMLButtonElement>('[data-earth-toggle]')!.addEventListener('click', () => globeController?.toggleRotation());
  app.querySelector<HTMLButtonElement>('[data-earth-overlay]')!.addEventListener('click', event => {
    const button = event.currentTarget as HTMLButtonElement; const visible = button.getAttribute('aria-pressed') !== 'true';
    globeController?.setOverlay(visible); button.setAttribute('aria-pressed', String(visible));
    button.textContent = visible ? '隱藏日照線' : '顯示日照線';
  });
}
function bullets(items: string[]) { return `<ul>${items.map(i=>`<li>${escape(i)}</li>`).join('')}</ul>`; }
let webGLProbed = false;
function supportsWebGL(): boolean {
  if (webGLProbed) return true;
  try {
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) return false;
    // This is only a probe; do not retain a second context alongside the lesson.
    context.getExtension('WEBGL_lose_context')?.loseContext();
    webGLProbed = true;
    return true;
  } catch { return false; }
}
const failedSimulation = '<div class="sim-message"><b>無法啟動 3D 模擬</b><p>裝置無法建立或維持 WebGL 2。請關閉其他分頁、重新整理，或改用支援 WebGL 2 的瀏覽器。</p></div>';
window.addEventListener('message', event => {
  const frame = app.querySelector<HTMLIFrameElement>('.simulation-frame');
  if (!frame || event.source !== frame.contentWindow || (event.origin !== location.origin && event.origin !== 'null') || event.data?.type !== 'alltrue-webgl-failed') return;
  const holder = frame.parentElement;
  if (holder?.id === 'simulation') holder.innerHTML = failedSimulation;
});
async function loadSimulation(lesson: Lesson, holder: HTMLElement): Promise<void> {
  holder.classList.toggle('spatial-simulation', lesson.slug === 'xiaobai-spatial-views');
  if (!supportsWebGL()) { holder.innerHTML = failedSimulation; return; }
  try {
    const response = await fetch(asset(lesson.source === 'xiaobai' ? `xiaobai/${lesson.file}` : `upstream/${lesson.file}`));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (!holder.isConnected) return;
    const frame = document.createElement('iframe'); frame.title = `${lesson.title} 3D 互動教材`; frame.allow = 'fullscreen'; frame.className='simulation-frame';
    const scriptUrl = new URL(bridgeUrl, window.location.href).href;
    let localization = `<script type="module" src="${scriptUrl}"></script>`;
    if (lesson.source === 'xiaobai') {
      frame.setAttribute('sandbox', 'allow-scripts allow-pointer-lock');
      const bridgeResponse = await fetch(scriptUrl);
      if (!bridgeResponse.ok) throw new Error('Localisation unavailable');
      const bridge = await bridgeResponse.text();
      if (!holder.isConnected) return;
      localization = `<script>${bridge.replace(/<\/script/gi, '<\\/script')}</script>`;
    }
    // A successful probe does not guarantee the lesson can create or retain a context.
    // Report explicit WebGL errors from the iframe; ordinary lesson errors are not masked.
    const monitor = `<script>(()=>{const contexts=new Set(),frames=new Set(),original=HTMLCanvasElement.prototype.getContext,request=window.requestAnimationFrame,cancel=window.cancelAnimationFrame;let releasing=false;window.requestAnimationFrame=callback=>{const id=request.call(window,time=>{frames.delete(id);if(!releasing)callback(time)});frames.add(id);return id};window.cancelAnimationFrame=id=>{frames.delete(id);cancel.call(window,id)};HTMLCanvasElement.prototype.getContext=function(type,...args){const result=original.call(this,type,...args);if((type==='webgl'||type==='webgl2')&&result)contexts.add(result);return result};window.__alltrueReleaseGraphics=()=>{releasing=true;for(const id of frames)cancel.call(window,id);frames.clear();for(const context of contexts){try{context.getExtension('WEBGL_lose_context')?.loseContext()}catch{}}contexts.clear()};addEventListener('pagehide',()=>window.__alltrueReleaseGraphics(),{once:true});const report=()=>{if(!releasing)parent.postMessage({type:'alltrue-webgl-failed'},'*')};const isContextError=text=>/webgl/i.test(text)&&/(context|not supported)/i.test(text);addEventListener('error',e=>{if(isContextError(e.message))report()},true);addEventListener('unhandledrejection',e=>{if(isContextError(String(e.reason)))report()},true);addEventListener('webglcontextlost',report,true)})();</script>`;
    const policy = lesson.source === 'xiaobai' ? `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; worker-src blob:">` : '';
    const documentBase = lesson.source === 'xiaobai' ? 'about:srcdoc' : new URL(asset('upstream/courses/'), window.location.href).href;
    // Hide the mirror lesson's on-screen signature at the owner's request; preserve source credits.
    const presentation = lesson.slug === 'xiaobai-mirror' ? '<style>#xb-mirror-header .xb-mirror-signature{display:none!important}</style>' : lesson.slug === 'xiaobai-lens' ? '<style>#creatorBrand > span,.about-credit{display:none!important}</style>' : '';
    // This authorised course embeds its experiments in srcdoc; propagate the same
    // offline translation and WebGL monitoring to the nested opaque-origin frame.
    let nestedBridge = '';
    if (lesson.slug === 'xiaobai-oxygen') {
      // Keep the two tube labels readable on narrow screens; their content and positions remain tied to the model.
      const mobileLabels = '<style>@media(max-width:600px){#label-a,#label-b{min-width:0!important;width:58px!important;white-space:normal!important;line-height:1.2!important}#label-a b,#label-b b{font-size:9px!important;letter-spacing:0!important}#label-a small,#label-b small{display:none!important}}</style>';
      const childPrefix = `${monitor}${localization}${mobileLabels}`;
      const encoded = JSON.stringify(childPrefix).replace(/<\/script/gi, '<\\/script');
      nestedBridge = `<script>(()=>{const d=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'srcdoc');const prefix=${encoded};Object.defineProperty(HTMLIFrameElement.prototype,'srcdoc',{...d,set(value){d.set.call(this,String(value).replace('<head>','<head>'+prefix))}});addEventListener('message',event=>{if(event.data?.type==='alltrue-webgl-failed'&&event.source===document.querySelector('#stage-host iframe')?.contentWindow)parent.postMessage(event.data,'*')})})();</script>`;
    }
    const oxygenPresentation = lesson.slug === 'xiaobai-oxygen' ? `<style>#course-header > .signature > span,#about-dialog .creator{display:none!important}</style><script>if(matchMedia('(pointer:coarse)').matches)addEventListener('DOMContentLoaded',()=>window.__XBOnlineQuality?.change(true,false),{once:true})</script>` : '';
    const injected = `${policy}<base href="${documentBase}">${monitor}${localization}${presentation}${oxygenPresentation}${nestedBridge}`;
    frame.srcdoc = html.replace('<head>', `<head>${injected}`); holder.replaceChildren(frame);
  } catch { if (holder.isConnected) holder.innerHTML = '<div class="sim-message"><b>教材載入失敗</b><p>請檢查網路連線後重新整理頁面。</p></div>'; }
}
function detail(lesson: Lesson): void {
  const subject = subjects[lesson.subject]; const content = teaching[lesson.slug] || xiaobaiTeaching[lesson.slug];
  app.innerHTML = `${header}<main class="detail-main"><div class="wrap"><a class="back-link" href="#catalog">← 返回教材庫</a><div class="detail-heading"><div><p class="overline">${subject.english} / ${subject.name}</p><h1>${escape(lesson.title)}</h1><p>${escape(lesson.question)}</p></div><span class="detail-number">${String(allLessons.indexOf(lesson)+1).padStart(2,'0')} <small>/ ${allLessons.length}</small></span></div><div class="detail-layout"><section><div class="sim-header"><div><span class="status-dot"></span> 互動探索 <small>INTERACTIVE LAB</small></div><button class="fullscreen-button" type="button">全螢幕 ↗</button></div><div id="simulation" class="simulation"><div class="sim-message">正在載入教材…</div></div><p class="sim-caption">${lesson.source === 'xiaobai' ? '手機可使用教材內的操作面板；拖曳畫面可變更視角。' : '操作方式依各教材而異。手機可點選畫面左右兩側的分頁展開操作面板，頂部工具列可左右滑動。'}部分顯示文字由系統轉換，專業術語仍待逐項校對。</p><div class="lesson-content"><p class="review-notice">教學內容與模擬尚待專業審查，課堂使用前請由教師確認。</p>${content ? `<section><p class="overline">LEARNING OBJECTIVES</p><h2>學習目標</h2>${bullets(content.objectives)}</section><section><p class="overline">THE PRINCIPLE</p><h2>認識原理</h2><p>${escape(content.principle)}</p></section><section><p class="overline">LET’S EXPLORE</p><h2>動手操作</h2><ol>${content.operations.map(i=>`<li>${escape(i)}</li>`).join('')}</ol></section><section><p class="overline">THINK ABOUT IT</p><h2>引導問題</h2>${content.questions.map((q,i)=>`<details><summary><span>0${i+1}</span>${escape(q.question)}</summary><p>${escape(q.guidance)}</p></details>`).join('')}</section><section><p class="overline">COMMON MISCONCEPTIONS</p><h2>常見迷思</h2>${bullets(content.misconceptions)}</section><section><p class="overline">FOR TEACHERS</p><h2>教師提示</h2>${bullets(content.teacherTips)}</section>` : `<section class="pending"><p class="overline">TEACHING NOTES</p><h2>教學內容整理中</h2><p>此單元目前提供上游互動教材與探索步驟。學習目標、原理、引導問題、常見迷思及教師提示尚待編寫與核對，請教師先行審閱，再用於課堂。</p></section>`}</div></section><aside><div class="sidebar-card"><p class="overline">YOUR LEARNING PATH</p><h2>探索步驟</h2><p>跟著教材中的步驟，一步步觀察與思考。</p><ol>${lesson.steps.map(step=>`<li>${escape(step)}</li>`).join('')}</ol></div><div class="sidebar-note"><span>✳</span><p>先想一想，<br>再動手試試看。</p></div></aside></div></div></main>${footer}`;
  app.querySelector<HTMLButtonElement>('.fullscreen-button')!.addEventListener('click', () => {
    const frame = app.querySelector<HTMLIFrameElement>('.simulation-frame');
    if (frame?.requestFullscreen) void frame.requestFullscreen().catch(() => {});
  });
  void loadSimulation(lesson, app.querySelector<HTMLElement>('#simulation')!);
}
function render(): void { globeController?.dispose(); globeController = undefined; const frame = app.querySelector<HTMLIFrameElement>('.simulation-frame'); try { (frame?.contentWindow as (Window & { __alltrueReleaseGraphics?: () => void }) | null)?.__alltrueReleaseGraphics?.(); } catch { /* The frame may already be gone. */ } if (location.hash === '#credits') { credits(); window.scrollTo(0,0); return; } const match = location.hash.match(/^#lesson\/([^/]+)$/); if (match) { let slug = ''; try { slug=decodeURIComponent(match[1]); } catch { /* invalid route */ } const lesson=allLessons.find(l=>l.slug===slug); if (lesson) { detail(lesson); window.scrollTo(0,0); return; } } home(); if(location.hash === '#catalog' || location.hash === '#about') requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView()); }
window.addEventListener('hashchange', render); render();
