import type { TeachingContent } from './education';
type Question = readonly [question: string, guidance: string];
/** Each lesson supplies its own observable concepts, steps, answers, and misconception. */
export function plan(goal: string, principle: string, operations: string[], questions: Question[], misconception: string, tip: string): TeachingContent {
  return {
    objectives: [`透過操作${goal}。`, '以觀察和資料解釋現象，並說明模型的限制。'],
    principle,
    operations,
    questions: questions.map(([question, guidance]) => ({ question, guidance })),
    misconceptions: [misconception],
    teacherTips: [tip, '先讓學生預測，再操作並以畫面中的現象或數據說明；模擬為理想化模型，實際情況可能不同。']
  };
}
