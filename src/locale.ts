import { Converter } from 'opencc-js';
import glossary from './glossary.json';
const convert = Converter({ from: 'cn', to: 'twp' });
export function translate(value: string): string {
  if (!/[\u3400-\u9fff]/u.test(value)) return value;
  let result = convert(value);
  for (const [from, to] of glossary) result = from === '平拋' ? result.replace(/(?<!水)平拋(?!射)/gu, to) : result.replaceAll(from, to);
  return result;
}
