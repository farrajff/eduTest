import { Question } from './types';
import { tauhidQuestions } from './questions_tauhid';
import { tafseerQuestions } from './questions_tafseer';
import { hadithQuestions } from './questions_hadith';
import { fiqhQuestions } from './questions_fiqh';
import { semester2Questions } from './questions_semester2';

// Ensure Semester 1 questions are properly marked with semester: 'الفصل الدراسي الأول'
const semester1Tagged: Question[] = [
  ...tauhidQuestions,
  ...tafseerQuestions,
  ...hadithQuestions,
  ...fiqhQuestions
].map(q => ({
  ...q,
  semester: q.semester || 'الفصل الدراسي الأول'
}));

export const initialQuestions: Question[] = [
  ...semester1Tagged,
  ...semester2Questions
];
