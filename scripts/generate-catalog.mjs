import fs from 'node:fs';
import { Converter } from 'opencc-js';
// Machine conversion is a starting point; manual review remains required.
const terminology = JSON.parse(fs.readFileSync('src/glossary.json', 'utf8'));
const convert = Converter({ from: 'cn', to: 'twp' });
const localize = input => terminology.reduce((value, [from, to]) => from === '平拋' ? value.replace(/(?<!水)平拋(?!射)/gu, to) : value.replaceAll(from, to), convert(input));
const rows = JSON.parse(fs.readFileSync('public/upstream/catalog.json', 'utf8'));
const overrides = JSON.parse(fs.readFileSync('src/catalog-overrides.json', 'utf8'));
const result = rows.map(({ slug, subject, title, type, question, steps, file, cover }) => ({ slug, subject, title: localize(title), type: localize(type), question: localize(question), steps: steps.map(localize), file, cover, ...overrides[slug] }));
fs.writeFileSync('src/lessons.json', JSON.stringify(result, null, 2) + '\n');
