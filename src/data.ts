import lessonsJson from './lessons.json';
import { xiaobaiLessons } from './xiaobai';
import { openScienceLessons } from './open-science';
export type Subject = 'phys' | 'chem' | 'bio' | 'geo' | 'math';
export interface Lesson { source?: 'xiaobai' | 'open-science'; slug: string; subject: Subject; title: string; type: string; question: string; steps: string[]; file: string; cover: string }
export const lessons = lessonsJson as Lesson[];
export const allLessons = [...lessons, ...xiaobaiLessons, ...openScienceLessons];
export const subjects: Record<Subject, {name: string; english: string; color: string; description: string}> = {
  phys: { name: '物理', english: 'PHYSICS', color: 'blue', description: '從運動、力到電與磁，探索自然的規律。' },
  chem: { name: '化學', english: 'CHEMISTRY', color: 'orange', description: '走進物質的結構、反應與變化。' },
  bio: { name: '生物', english: 'BIOLOGY', color: 'green', description: '觀察細胞與生命系統的運作。' },
  geo: { name: '地球科學', english: 'EARTH SCIENCE', color: 'purple', description: '從大氣到地表，理解地球的動態。' },
  math: { name: '數學', english: 'MATHEMATICS', color: 'gold', description: '從空間與形狀，探索數學的關係。' }
};
export function filterLessons(query: string, subject: string): Lesson[] {
  const q = query.trim().toLocaleLowerCase('zh-TW');
  return allLessons.filter(lesson => (subject === 'all' || lesson.subject === subject) && (!q || [lesson.title, lesson.question, ...lesson.steps].some(s => s.toLocaleLowerCase('zh-TW').includes(q))));
}
export function lessonUrl(slug: string): string { return `#lesson/${encodeURIComponent(slug)}`; }
