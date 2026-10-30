import './style.css';
import bridgeUrl from './bridge.ts?worker&url';
import { filterLessons, lessons, lessonUrl, subjects, type Lesson, type Subject } from './data';
import { teaching } from './education';

const app = document.querySelector<HTMLDivElement>('#app')!;
const base = import.meta.env.BASE_URL;
const asset = (path: string) => `${base}${path}`;
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const subjectKeys: Subject[] = ['phys', 'chem', 'bio', 'geo'];
const brand = `<a class="brand" href="#" aria-label="全真 Learning Lab 首頁"><img src="${asset('logo.jpg')}" alt="全真" /><span><b>全真</b><small>LEARNING LAB</small></span></a>`;
const header = `<header class="topbar"><div class="wrap topbar-inner">${brand}<nav aria-label="主要導覽"><a href="#catalog">探索教材</a><a href="#about">關於本站</a></nav><a class="top-cta" href="#catalog">開始探索 <span>↗</span></a></div></header>`;
const footer = `<footer id="about"><div class="wrap footer-inner"><div>${brand}<p>讓好奇心，成為理解世界的起點。</p></div><div><b>關於教材</b><p>教材改編自 <a href="https://lab.tongjiang.app" target="_blank" rel="noreferrer">Tongjiang Lab</a>，採 CC BY-NC 4.0 授權。<br><a href="${asset('upstream/LICENSE')}">授權條款</a> · <a href="${asset('upstream/THIRD_PARTY_NOTICES.md')}">第三方聲明</a></p></div></div></footer>`;
function count(subject: Subject) { return lessons.filter(l => l.subject === subject).length; }
function card(l: Lesson): string {
  const s = subjects[l.subject];
  return `<a class="lesson-card" href="${lessonUrl(l.slug)}"><div class="card-image"><img src="${asset(`upstream/${l.cover}`)}" alt="" loading="lazy"><span class="card-badge ${s.color}">${s.name}</span><span class="card-arrow">↗</span></div><div class="card-body"><div class="card-meta">${escape(l.type)} <span>·</span> ${l.steps.length} 個探索步驟</div><h3>${escape(l.title)}</h3><p>${escape(l.question)}</p><span class="card-link">進入單元 <span>→</span></span></div></a>`;
}
function home(): void {
  app.innerHTML = `${header}<main><section class="hero"><div class="wrap hero-inner"><div class="hero-copy"><div class="eyebrow"><i></i> 讓學習，看見更多可能</div><h1>把好奇，<br><em>變成理解。</em></h1><p>從一個問題出發，動手探索科學。<br>讓抽象的知識，在眼前真實展開。</p><div class="hero-actions"><a class="button dark" href="#catalog">探索所有教材 <span>↗</span></a><a class="text-link" href="#about">認識 Learning Lab <span>↓</span></a></div><div class="hero-stats"><div><b>54</b><span>互動單元</span></div><div><b>04</b><span>探索領域</span></div><div><b>3D</b><span>動手學習</span></div></div></div><div class="hero-visual"><div class="visual-orbit orbit-one"></div><div class="visual-orbit orbit-two"></div><div class="visual-disc"><span>ALLTRUE<br>LEARNING<br>LAB<span class="star">✳</span></span></div><div class="floating-note"><span>✳</span><div><b>從觀察開始</b><small>Explore, experiment, understand.</small></div></div><div class="visual-caption">LEARNING IS AN ADVENTURE <span>✦</span></div></div></div></section><section class="subjects-section wrap"><div class="section-intro"><div><p class="overline">FIND YOUR CURIOSITY <span>✳</span></p><h2>今天，想探索什麼？</h2><p>選一個領域，打開你的學習旅程。</p></div><span class="section-index">01 / 領域</span></div><div class="subject-grid">${subjectKeys.map((key, i) => { const s=subjects[key]; return `<button class="subject-tile ${s.color}" data-subject="${key}"><span class="subject-number">0${i+1} / ${s.english}</span><span class="subject-icon">${['↗','✳','✿','◉'][i]}</span><strong>${s.name}</strong><small>${count(key)} 個互動單元</small><span class="tile-arrow">↗</span></button>`; }).join('')}</div></section><section class="catalog-section" id="catalog"><div class="wrap"><div class="section-intro"><div><p class="overline">THE LEARNING LIBRARY <span>✳</span></p><h2>一起動手，探索科學。</h2><p>從教材中找到你的下一個問題。</p></div><span class="section-index">02 / 教材庫</span></div><div class="catalog-tools"><div class="filters" aria-label="教材分類"><button class="active" data-filter="all">全部 <span>54</span></button>${subjectKeys.map(k=>`<button data-filter="${k}">${subjects[k].name} <span>${count(k)}</span></button>`).join('')}</div><label class="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="搜尋教材或主題" aria-label="搜尋教材或主題"></label></div><div class="results-label" id="result-count"></div><div class="lesson-grid" id="lesson-grid"></div></div></section><section class="closing"><div class="wrap closing-inner"><span class="closing-symbol">✳</span><div><p class="overline">KEEP ASKING QUESTIONS</p><h2>每一次提問，<br>都是探索的開始。</h2></div><a href="#catalog" class="button light">找到你的教材 <span>↗</span></a></div></section></main>${footer}`;
  let filter = 'all';
  const input = app.querySelector<HTMLInputElement>('.search input')!;
  const grid = app.querySelector<HTMLElement>('#lesson-grid')!;
  const update = () => { const found = filterLessons(input.value, filter); grid.innerHTML = found.map(card).join('') || '<p class="empty">找不到符合的單元，試試其他關鍵字。</p>'; app.querySelector('#result-count')!.textContent = `顯示 ${found.length} 個單元`; app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b => { b.classList.toggle('active', b.dataset.filter === filter); b.setAttribute('aria-pressed', String(b.dataset.filter === filter)); }); };
  app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b => b.addEventListener('click', () => {filter = b.dataset.filter!; update();}));
  app.querySelectorAll<HTMLButtonElement>('[data-subject]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.subject!; update(); document.querySelector('#catalog')?.scrollIntoView({behavior:'smooth'});}));
  input.addEventListener('input', update); update();
}
function bullets(items: string[]) { return `<ul>${items.map(i=>`<li>${escape(i)}</li>`).join('')}</ul>`; }
function supportsWebGL(): boolean { try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; } }
async function loadSimulation(lesson: Lesson): Promise<void> {
  const holder = app.querySelector<HTMLElement>('#simulation')!;
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
  app.innerHTML = `${header}<main class="detail-main"><div class="wrap"><a class="back-link" href="#catalog">← 返回教材庫</a><div class="detail-heading"><div><p class="overline">${subject.english} / ${subject.name}</p><h1>${escape(lesson.title)}</h1><p>${escape(lesson.question)}</p></div><span class="detail-number">${String(lessons.indexOf(lesson)+1).padStart(2,'0')} <small>/ 54</small></span></div><div class="detail-layout"><section><div class="sim-header"><div><span class="status-dot"></span> 互動探索 <small>INTERACTIVE LAB</small></div><button class="fullscreen-button" type="button">全螢幕 ↗</button></div><div id="simulation" class="simulation"><div class="sim-message">正在載入教材…</div></div><p class="sim-caption">操作方式依各教材而異。部分顯示文字由系統轉換，專業術語仍待逐項校對。</p><div class="lesson-content"><p class="review-notice">教學內容與模擬尚待專業審查，課堂使用前請由教師確認。</p>${content ? `<section><p class="overline">LEARNING OBJECTIVES</p><h2>學習目標</h2>${bullets(content.objectives)}</section><section><p class="overline">THE PRINCIPLE</p><h2>認識原理</h2><p>${escape(content.principle)}</p></section><section><p class="overline">LET’S EXPLORE</p><h2>動手操作</h2><ol>${content.operations.map(i=>`<li>${escape(i)}</li>`).join('')}</ol></section><section><p class="overline">THINK ABOUT IT</p><h2>引導問題</h2>${content.questions.map((q,i)=>`<details><summary><span>0${i+1}</span>${escape(q.question)}</summary><p>${escape(q.guidance)}</p></details>`).join('')}</section><section><p class="overline">COMMON MISCONCEPTIONS</p><h2>常見迷思</h2>${bullets(content.misconceptions)}</section><section><p class="overline">FOR TEACHERS</p><h2>教師提示</h2>${bullets(content.teacherTips)}</section>` : `<section class="pending"><p class="overline">TEACHING NOTES</p><h2>教學內容整理中</h2><p>此單元目前提供上游互動教材與探索步驟。學習目標、原理、引導問題、常見迷思及教師提示尚待編寫與核對，請教師先行審閱，再用於課堂。</p></section>`}</div></section><aside><div class="sidebar-card"><p class="overline">YOUR LEARNING PATH</p><h2>探索步驟</h2><p>跟著教材中的步驟，一步步觀察與思考。</p><ol>${lesson.steps.map(step=>`<li>${escape(step)}</li>`).join('')}</ol></div><div class="sidebar-note"><span>✳</span><p>先想一想，<br>再動手試試看。</p></div></aside></div></div></main>${footer}`;
  app.querySelector<HTMLButtonElement>('.fullscreen-button')!.addEventListener('click', () => {
    const frame = app.querySelector<HTMLIFrameElement>('.simulation-frame');
    if (frame?.requestFullscreen) void frame.requestFullscreen().catch(() => {});
  });
  void loadSimulation(lesson);
}
function render(): void { const match = location.hash.match(/^#lesson\/([^/]+)$/); if (match) { let slug = ''; try { slug=decodeURIComponent(match[1]); } catch { /* invalid route */ } const lesson=lessons.find(l=>l.slug===slug); if (lesson) { detail(lesson); window.scrollTo(0,0); return; } } home(); if(location.hash === '#catalog' || location.hash === '#about') requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView()); }
window.addEventListener('hashchange', render); render();
