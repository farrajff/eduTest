export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'matching' | 'ordering' | 'essay' | 'verse_hadith';

export type SubjectBranch = 'توحيد' | 'تفسير' | 'حديث' | 'فقه';

export type DifficultyLevel = 'سهل' | 'متوسط' | 'صعب';

export interface MatchingPair {
  id: string;
  left: string;   // Column A item
  right: string;  // Correct matching Column B item
}

export interface Question {
  id: string;
  subject: SubjectBranch;
  semester?: string; // 'الفصل الدراسي الأول' | 'الفصل الدراسي الثاني'
  unit: string;
  lesson: string;
  learningOutcome: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  points: number;
  text: string;
  // Options for MCQ (exactly 4 items)
  options?: string[];
  // Correct answer explanation or key value
  // For MCQ: correct option index (0 to 3) or option text
  // For True/False: "صح" or "خطأ"
  // For Fill Blank: correct string answer
  // For Essay: suggested answer guidelines
  // For Verse/Hadith: missing words or explain core meaning
  correctAnswer: string;
  // For Matching (المزاوجة)
  matchingPairs?: MatchingPair[];
  // For Ordering (الترتيب)
  orderedItems?: string[];
}

export interface Exam {
  id: string;
  title: string;
  grade: string; // 'الصف الثاني المتوسط' standard
  semester: string; // 'الفصل الدراسي الأول' etc.
  schoolName: string;
  academicYear: string;
  timeLimit: number; // in minutes
  totalPoints: number;
  questions: Question[];
  createdAt: string;
}

export interface ExamForm {
  formId: 'أ' | 'ب' | 'ج' | 'د';
  questions: Question[];
}

export interface StudentGrade {
  id: string;
  studentName: string;
  className: string;
  formId: 'أ' | 'ب' | 'ج' | 'د';
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  gradedAt: string;
  // Individual question score mapping
  scores: Record<string, number>;
}
