import { translate } from './locale';

// This layer changes rendered text only. Upstream files and their calculations stay intact.
function localizeNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return;
    const text = node.nodeValue || '';
    const translated = translate(text);
    if (text !== translated) node.nodeValue = translated;
  } else if (node instanceof Element) {
    for (const name of ['title', 'aria-label', 'placeholder']) {
      const value = node.getAttribute(name);
      if (value) { const translated = translate(value); if (translated !== value) node.setAttribute(name, translated); }
    }
    if (node instanceof HTMLInputElement && ['button', 'submit', 'reset'].includes(node.type)) node.value = translate(node.value);
    for (const child of node.childNodes) localizeNode(child);
  }
}
const observer = new MutationObserver(records => {
  for (const record of records) {
    if (record.type === 'characterData') localizeNode(record.target);
    else if (record.type === 'attributes') localizeNode(record.target);
    else for (const node of record.addedNodes) localizeNode(node);
  }
});
observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder'] });
localizeNode(document.documentElement);

// Three.js lessons draw some labels to 2D canvas textures; translate and measure the same text.
const context = CanvasRenderingContext2D.prototype;
const fillText = context.fillText;
const strokeText = context.strokeText;
const measureText = context.measureText;
context.fillText = function (text, x, y, maxWidth) { if (maxWidth === undefined) fillText.call(this, translate(String(text)), x, y); else fillText.call(this, translate(String(text)), x, y, maxWidth); };
context.strokeText = function (text, x, y, maxWidth) { if (maxWidth === undefined) strokeText.call(this, translate(String(text)), x, y); else strokeText.call(this, translate(String(text)), x, y, maxWidth); };
context.measureText = function (text) { return measureText.call(this, translate(String(text))); };
document.documentElement.lang = 'zh-Hant-TW';

// Standalone upstream lessons link to a local index that does not exist in the host app.
document.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>('a.home');
  if (link?.getAttribute('href') === './index.html' && window.parent !== window) {
    event.preventDefault();
    window.parent.location.hash = '#catalog';
  }
});

// Keep the upstream fold controls, but avoid their overlapping panels on narrow screens.
window.addEventListener('DOMContentLoaded', () => {
  if (!window.matchMedia('(max-width: 600px)').matches) return;
  const left = document.querySelector<HTMLElement>('#left');
  const right = document.querySelector<HTMLElement>('#right');
  const leftTab = document.querySelector<HTMLButtonElement>('#tabL');
  const rightTab = document.querySelector<HTMLButtonElement>('#tabR');
  const leftFold = left?.querySelector<HTMLButtonElement>('.fold');
  const rightFold = right?.querySelector<HTMLButtonElement>('.fold');
  if (!left || !right || !leftTab || !rightTab || !leftFold || !rightFold) return;
  const style = document.createElement('style');
  style.textContent = '@media(max-width:600px){#left.collapsed,#right.collapsed{visibility:hidden!important}#top .row1{overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}#top .hud{flex-shrink:0}#tabL,#tabR{min-width:36px;min-height:44px}}';
  document.head.appendChild(style);
  if (!left.classList.contains('collapsed')) leftFold.click();
  if (!right.classList.contains('collapsed')) rightFold.click();
  leftTab.addEventListener('click', () => { if (!right.classList.contains('collapsed')) rightFold.click(); });
  rightTab.addEventListener('click', () => { if (!left.classList.contains('collapsed')) leftFold.click(); });
});
