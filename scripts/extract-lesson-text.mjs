import { parse } from 'acorn';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, relative, isAbsolute, sep } from 'node:path';

const cjk = /[\u3400-\u9fff]/u;
const displayFields = new Set(['text', 'title', 'label', 'hint', 'question', 'caption', 'description', 'placeholder', 'textContent', 'innerText', 'innerHTML']);
const outputCalls = new Set(['fillText', 'strokeText', 'createTextNode']);
function nameOf(node) {
  if (!node) return '';
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal') return String(node.value);
  return '';
}
function classify(node, parent) {
  if (!parent) return 'unclassified';
  if (parent.type === 'Property' && parent.key === node) return 'program-key';
  if (parent.type === 'MemberExpression' && parent.property === node) return 'program-key';
  if (parent.type === 'SwitchCase' && parent.test === node) return 'program-condition';
  if (parent.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(parent.operator)) return 'program-condition';
  if (parent.type === 'Property' && parent.value === node && displayFields.has(nameOf(parent.key))) return 'display-candidate';
  if (parent.type === 'AssignmentExpression' && parent.right === node && parent.left.type === 'MemberExpression' && displayFields.has(nameOf(parent.left.property))) return 'display-candidate';
  if (parent.type === 'CallExpression' && parent.callee.type === 'MemberExpression') {
    if (outputCalls.has(nameOf(parent.callee.property))) return 'display-candidate';
    if (nameOf(parent.callee.property) === 'setAttribute' && parent.arguments[1] === node && ['title', 'aria-label', 'placeholder'].includes(nameOf(parent.arguments[0]))) return 'display-candidate';
  }
  return 'unclassified';
}
/** Reports source locations and syntax contexts; it never modifies a lesson or translates keys. */
export function extractStrings(source, htmlOffset = 0) {
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  const found = [];
  const stack = [[ast, null, null]];
  while (stack.length) {
    const [node, parent, grandparent] = stack.pop();
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') continue;
    const value = node.type === 'Literal' && typeof node.value === 'string' ? node.value : node.type === 'TemplateElement' ? node.value.cooked : null;
    if (typeof value === 'string' && cjk.test(value)) {
      const template = node.type === 'TemplateElement' && parent?.type === 'TemplateLiteral';
      const context = template ? classify(parent, grandparent) : classify(node, parent);
      found.push({ start: htmlOffset + node.start, end: htmlOffset + node.end, context, text: value });
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === 'start' || key === 'end') continue;
      if (Array.isArray(child)) {
        for (const item of child) if (item && typeof item === 'object' && typeof item.type === 'string') stack.push([item, node, parent]);
      } else if (child && typeof child === 'object' && typeof child.type === 'string') stack.push([child, node, parent]);
    }
  }
  return found.sort((a, b) => a.start - b.start);
}
function run() {
  const [slug, output] = process.argv.slice(2);
  if (!slug || !/^[a-z0-9-]+-step$/.test(slug) || !output) throw new Error('Usage: node scripts/extract-lesson-text.mjs <lesson-slug> <output.json>');
  const upstreamRoot = resolve('public/upstream');
  const relativeOutput = relative(upstreamRoot, resolve(output));
  if (relativeOutput !== '..' && !relativeOutput.startsWith(`..${sep}`) && !isAbsolute(relativeOutput)) throw new Error('Output must be outside public/upstream');
  const filename = `public/upstream/courses/${slug}.html`;
  const bytes = readFileSync(filename); const html = bytes.toString('utf8');
  const startTag = '<script type="module">'; const start = html.indexOf(startTag);
  if (start < 0) throw new Error(`Module script not found: ${filename}`);
  const contentStart = start + startTag.length; const end = html.indexOf('</script>', contentStart);
  if (end < 0) throw new Error(`Script end not found: ${filename}`);
  const records = extractStrings(html.slice(contentStart, end), contentStart);
  const title = /<title>([^<]*)<\/title>/iu.exec(html);
  if (title && cjk.test(title[1])) {
    const titleStart = title.index + '<title>'.length;
    records.unshift({ start: titleStart, end: titleStart + title[1].length, context: 'display-candidate', text: title[1] });
  }
  const result = { source: filename, upstreamCommit: '4d63ce0a72d987c850ec6d919e570bdb752c87a6', sha256: createHash('sha256').update(bytes).digest('hex'), records };
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(`${slug}: ${records.length} strings → ${output}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
