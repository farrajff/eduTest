import { Question, SubjectBranch } from '../types';

export interface LessonItem {
  name: string;
  pageRange: string;
  semester?: 'الفصل الدراسي الأول' | 'الفصل الدراسي الثاني';
}

// Canonical curriculum lessons for Semester 1 (الفصل الدراسي الأول)
export const CANONICAL_LESSONS_SEM1: Record<SubjectBranch, LessonItem[]> = {
  'توحيد': [
    { name: 'الدرس الأول: مكانة الأنبياء عليهم السلام والتحذير من الغلو فيهم (ص 14 - 18)', pageRange: 'ص 14 - 18', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثاني: مكانة نبينا محمد ﷺ والتحذير من الغلو فيه (ص 19 - 22)', pageRange: 'ص 19 - 22', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثالث: عقيدة المسلمين في عيسى ابن مريم عليه السلام والتحذير من الغلو فيه (ص 23 - 24)', pageRange: 'ص 23 - 24', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الرابع: عقيدة المسلمين في الملائكة عليهم السلام والتحذير من الغلو فيهم (ص 25 - 27)', pageRange: 'ص 25 - 27', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الخامس: مكانة الأولياء والصالحين والتحذير من الغلو فيهم (ص 28 - 30)', pageRange: 'ص 28 - 30', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس السادس: شروط قبول العبادة (ص 32 - 33)', pageRange: 'ص 32 - 33', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس السابع: الرياء (ص 34 - 36)', pageRange: 'ص 34 - 36', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثامن: إرادة الدنيا بعمل الآخرة (ص 37 - 39)', pageRange: 'ص 37 - 39', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس التاسع: الاستعانة والاستعاذة (ص 40 - 44)', pageRange: 'ص 40 - 44', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس العاشر: الذبح (ص 45 - 48)', pageRange: 'ص 45 - 48', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الحادي عشر: الذبح لله في مكان يُذبح فيه لغير الله (ص 49 - 51)', pageRange: 'ص 49 - 51', semester: 'الفصل الدراسي الأول' }
  ],
  'تفسير': [
    { name: 'الدرس الأول: تفسير سورة الجمعة (الآيات 1 - 4) (ص 54 - 57)', pageRange: 'ص 54 - 57', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثاني: تفسير سورة الجمعة (الآيات 9 - 11) (ص 62 - 65)', pageRange: 'ص 62 - 65', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثالث: تفسير سورة المنافقون (الآيات 1 - 4) (ص 68 - 71)', pageRange: 'ص 68 - 71', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الرابع: تفسير سورة الحج (الآيات 1 - 4) (ص 76 - 78)', pageRange: 'ص 76 - 78', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الخامس: تفسير سورة الحج (الآيات 25 - 29) (ص 79 - 82)', pageRange: 'ص 79 - 82', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس السادس: تفسير سورة الحج (الآيات 73 - 78) (ص 83 - 87)', pageRange: 'ص 83 - 87', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس السابع: تفسير سورة المؤمنون (الآيات 1 - 11) (ص 90 - 93)', pageRange: 'ص 90 - 93', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثامن: تفسير سورة المؤمنون (الآيات 51 - 61) (ص 94 - 97)', pageRange: 'ص 94 - 97', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس التاسع: تفسير سورة المؤمنون (الآيات 101 - 111) (ص 98 - 101)', pageRange: 'ص 98 - 101', semester: 'الفصل الدراسي الأول' }
  ],
  'حديث': [
    { name: 'الدرس الأول: شعب الإيمان (ص 106 - 108)', pageRange: 'ص 106 - 108', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثاني: فضل العلم (ص 109 - 110)', pageRange: 'ص 109 - 110', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثالث: الخوف والرجاء (ص 112 - 114)', pageRange: 'ص 112 - 114', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الرابع: قرب الجنة والنار (ص 115 - 117)', pageRange: 'ص 115 - 117', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الخامس: حسن الظن بالله (ص 118 - 119)', pageRange: 'ص 118 - 119', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس السادس: التوكل على الله (ص 120 - 122)', pageRange: 'ص 120 - 122', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس السابع: نتائج التوكل على الله (ص 123 - 124)', pageRange: 'ص 123 - 124', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثامن: فضل الوضوء والصلاة في تكفير الذنوب (ص 126 - 128)', pageRange: 'ص 126 - 128', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس التاسع: فضل صلاة العشاء والفجر (ص 129 - 131)', pageRange: 'ص 129 - 131', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس العاشر: فضل التبكير إلى الصلاة (ص 132 - 134)', pageRange: 'ص 132 - 134', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الحادي عشر: تعاهد القرآن وفضل سورتي البقرة وآل عمران (ص 136 - 140)', pageRange: 'ص 136 - 140', semester: 'الفصل الدراسي الأول' }
  ],
  'فقه': [
    { name: 'الدرس الأول: منزلة الزكاة وشروط وجوبها (ص 148 - 152)', pageRange: 'ص 148 - 152', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثاني: الأموال الزكوية - زكاة النقدين وعروض التجارة (ص 153 - 157)', pageRange: 'ص 153 - 157', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثالث: زكاة بهيمة الأنعام والخارج من الأرض (ص 158 - 162)', pageRange: 'ص 158 - 162', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الرابع: إخراج الزكاة ومصارفها (ص 163 - 168)', pageRange: 'ص 163 - 168', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الخامس: زكاة الفطر وصدقة التطوع (ص 169 - 173)', pageRange: 'ص 169 - 173', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس السادس: الصوم ومكانته (ص 176 - 179)', pageRange: 'ص 176 - 179', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس السابع: أحكام الصيام ومفطراته (ص 180 - 184)', pageRange: 'ص 180 - 184', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس الثامن: الأعذار المبيحة للفطر وقضاء الصوم (ص 185 - 188)', pageRange: 'ص 185 - 188', semester: 'الفصل الدراسي الأول' },
    { name: 'الدرس التاسع: صوم التطوع والاعتكاف (ص 189 - 194)', pageRange: 'ص 189 - 194', semester: 'الفصل الدراسي الأول' }
  ]
};

// Canonical curriculum lessons for Semester 2 (الفصل الدراسي الثاني)
export const CANONICAL_LESSONS_SEM2: Record<SubjectBranch, LessonItem[]> = {
  'توحيد': [
    { name: 'الدرس الأول: الشرك الأصغر وأقسامه (ص 14 - 18)', pageRange: 'ص 14 - 18', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثاني: الحلف بغير الله وقول: ما شاء الله وشئت (ص 19 - 22)', pageRange: 'ص 19 - 22', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثالث: الطيرة والفأل (ص 23 - 26)', pageRange: 'ص 23 - 26', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الرابع: التنجيم وحكمه (ص 27 - 30)', pageRange: 'ص 27 - 30', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الخامس: الكهانة والعرافة (ص 31 - 34)', pageRange: 'ص 31 - 34', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس السادس: السحر وحكمه وخطره (ص 35 - 39)', pageRange: 'ص 35 - 39', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس السابع: الرقى والتمائم وأحكامها (ص 40 - 44)', pageRange: 'ص 40 - 44', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثامن: سب الدهر والرياح (ص 45 - 48)', pageRange: 'ص 45 - 48', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس التاسع: الغلو في قبور الصالحين وبناء المساجد عليها (ص 49 - 53)', pageRange: 'ص 49 - 53', semester: 'الفصل الدراسي الثاني' }
  ],
  'تفسير': [
    { name: 'الدرس الأول: تفسير سورة النور (الآيات 27 - 29) (الاستئذان وآداب دخول البيوت) (ص 56 - 60)', pageRange: 'ص 56 - 60', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثاني: تفسير سورة النور (الآيات 30 - 31) (غض البصر وحفظ الفروج والحجاب) (ص 61 - 66)', pageRange: 'ص 61 - 66', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثالث: تفسير سورة النور (الآيات 35 - 38) (مثل نور الله وعمارة المساجد) (ص 67 - 72)', pageRange: 'ص 67 - 72', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الرابع: تفسير سورة الفرقان (الآيات 63 - 67) (صفات عباد الرحمن) (ص 74 - 78)', pageRange: 'ص 74 - 78', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الخامس: تفسير سورة الفرقان (الآيات 68 - 71) (الكبائر وتوبة عباد الرحمن) (ص 79 - 83)', pageRange: 'ص 79 - 83', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس السادس: تفسير سورة الفرقان (الآيات 72 - 77) (دعاء عباد الرحمن وجزاؤهم) (ص 84 - 88)', pageRange: 'ص 84 - 88', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس السابع: تفسير سورة الشعراء (الآيات 69 - 89) (دعوة إبراهيم عليه السلام لقومه) (ص 90 - 95)', pageRange: 'ص 90 - 95', semester: 'الفصل الدراسي الثاني' }
  ],
  'حديث': [
    { name: 'الدرس الأول: بر الوالدين وأثره (حديث: أحب الأعمال إلى الله الصلاة على وقتها ثم بر الوالدين) (ص 100 - 103)', pageRange: 'ص 100 - 103', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثاني: صلة الرحم وفضلها (حديث: من أحب أن يبسط له في رزقه فليصل رحمه) (ص 104 - 107)', pageRange: 'ص 104 - 107', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثالث: حق الجار وإكرامه (حديث: ما زال جبريل يوصيني بالجار) (ص 108 - 111)', pageRange: 'ص 108 - 111', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الرابع: كف الأذى وسلامة اللسان واليد (حديث: المسلم من سلم المسلمون من لسانه ويده) (ص 112 - 115)', pageRange: 'ص 112 - 115', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الخامس: الإحسان والرفق بالحيوان (حديث: في كل كبد رطبة أجر) (ص 116 - 119)', pageRange: 'ص 116 - 119', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس السادس: الأخوة الإيمانية والنهي عن التقاطع (حديث: لا تباغضوا ولا تحاسدوا) (ص 120 - 123)', pageRange: 'ص 120 - 123', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس السابع: التحذير من النفاق وعلاماته (حديث: آية المنافق ثلاث) (ص 124 - 128)', pageRange: 'ص 124 - 128', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثامن: فضل الكلمة الطيبة وإفشاء السلام (حديث: والكلمة الطيبة صدقة) (ص 129 - 132)', pageRange: 'ص 129 - 132', semester: 'الفصل الدراسي الثاني' }
  ],
  'فقه': [
    { name: 'الدرس الأول: منزلة الحج وشروط وجوبه (ص 136 - 140)', pageRange: 'ص 136 - 140', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثاني: المواقيت الزمانية والمكانية للحج والعمرة (ص 141 - 145)', pageRange: 'ص 141 - 145', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثالث: الإحرام: صفته، وسننه، ومحظوراته (ص 146 - 151)', pageRange: 'ص 146 - 151', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الرابع: أركان الحج وواجباته (ص 152 - 156)', pageRange: 'ص 152 - 156', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الخامس: صفة الحج والعمرة خطوة بخطوة (ص 157 - 163)', pageRange: 'ص 157 - 163', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس السادس: الفدية وأنواعها وجزاء الصيد (ص 164 - 168)', pageRange: 'ص 164 - 168', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس السابع: الأضحية: فضلها، وشروطها، ووقتها (ص 169 - 173)', pageRange: 'ص 169 - 173', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس الثامن: العقيقة وأحكام الذكاة والصيد (ص 174 - 178)', pageRange: 'ص 174 - 178', semester: 'الفصل الدراسي الثاني' },
    { name: 'الدرس التاسع: آداب زيارة المسجد النبوي الشريف والسلام على النبي ﷺ (ص 179 - 184)', pageRange: 'ص 179 - 184', semester: 'الفصل الدراسي الثاني' }
  ]
};

// Combined Canonical lessons
export const CANONICAL_LESSONS: Record<SubjectBranch, LessonItem[]> = {
  'توحيد': [...CANONICAL_LESSONS_SEM1['توحيد'], ...CANONICAL_LESSONS_SEM2['توحيد']],
  'تفسير': [...CANONICAL_LESSONS_SEM1['تفسير'], ...CANONICAL_LESSONS_SEM2['تفسير']],
  'حديث': [...CANONICAL_LESSONS_SEM1['حديث'], ...CANONICAL_LESSONS_SEM2['حديث']],
  'فقه': [...CANONICAL_LESSONS_SEM1['فقه'], ...CANONICAL_LESSONS_SEM2['فقه']]
};

export function getCanonicalLessons(subject: SubjectBranch, semester?: string): LessonItem[] {
  if (semester === 'الفصل الدراسي الثاني') {
    return CANONICAL_LESSONS_SEM2[subject] || [];
  }
  if (semester === 'الفصل الدراسي الأول') {
    return CANONICAL_LESSONS_SEM1[subject] || [];
  }
  return CANONICAL_LESSONS[subject] || [];
}

// Clean text for flexible comparison
export function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/^[\(\[\{]?([أ-دabcdABCD1-4])[\)\]\}][\.\-\s]*/, '')
    .replace(/[\*✓]/g, '')
    .trim()
    .toLowerCase();
}

const LETTER_INDEX_MAP: Record<string, number> = {
  'أ': 0, 'ا': 0, 'ب': 1, 'ج': 2, 'د': 3,
  'a': 0, 'b': 1, 'c': 2, 'd': 3,
  'A': 0, 'B': 1, 'C': 2, 'D': 3,
  '1': 0, '2': 1, '3': 2, '4': 3
};

/**
 * Determine if a specific MCQ option is the correct answer
 */
export function isOptionCorrect(q: Question, optionText: string, optionIndex: number): boolean {
  if (q.type !== 'mcq') return false;
  if (!q.correctAnswer) return optionIndex === 0;

  const rawAns = q.correctAnswer.trim();
  const rawOpt = optionText.trim();

  // 1. Direct equality
  if (rawOpt === rawAns) return true;

  // 2. Cleaned equality
  const cAns = cleanText(rawAns);
  const cOpt = cleanText(rawOpt);
  if (cAns && cOpt && (cAns === cOpt || cOpt.includes(cAns) || cAns.includes(cOpt))) {
    return true;
  }

  // 3. Answer is a letter identifier: 'أ', 'ب', 'ج', 'د' or '(أ)' or 'خيار أ'
  const letterMatch = rawAns.match(/^[\(\[\{]?([أابجدABCDabcd1-4])[\)\]\}]?$/) ||
                      rawAns.match(/^(?:الخيار|فقرة|إجابة|الفقرة|حرف)?\s*[\(\[]?([أابجدABCDabcd1-4])[\)\]]?$/);
  if (letterMatch) {
    const char = letterMatch[1];
    if (LETTER_INDEX_MAP[char] !== undefined && LETTER_INDEX_MAP[char] === optionIndex) {
      return true;
    }
  }

  // 4. Answer is index as string "0", "1", "2", "3"
  if (rawAns === String(optionIndex)) {
    return true;
  }

  return false;
}

/**
 * Get the 0-based index of the correct option for MCQ question
 */
export function getCorrectIndex(q: Question): number {
  if (!q.options || q.options.length === 0) return 0;
  for (let i = 0; i < q.options.length; i++) {
    if (isOptionCorrect(q, q.options[i], i)) {
      return i;
    }
  }
  return 0;
}

/**
 * Normalize and resolve correct answer string to the matching option text
 */
export function resolveCorrectAnswer(options: string[] | undefined, rawAnswer: string): string {
  if (!options || options.length === 0) return rawAnswer.trim();
  const trimmedAns = rawAnswer.trim();
  if (!trimmedAns) return options[0];

  // Check direct match
  const directIdx = options.findIndex(opt => opt.trim() === trimmedAns);
  if (directIdx >= 0) return options[directIdx];

  // Check letter or numeric answer
  const letterMatch = trimmedAns.match(/^[\(\[\{]?([أابجدABCDabcd1-4])[\)\]\}]?$/) ||
                      trimmedAns.match(/^(?:الخيار|فقرة|إجابة|الفقرة|حرف)?\s*[\(\[]?([أابجدABCDabcd1-4])[\)\]]?$/);
  if (letterMatch) {
    const char = letterMatch[1];
    const targetIdx = LETTER_INDEX_MAP[char];
    if (targetIdx !== undefined && targetIdx < options.length) {
      return options[targetIdx];
    }
  }

  // Check 0-based numeric index
  if (['0', '1', '2', '3'].includes(trimmedAns)) {
    const numIdx = parseInt(trimmedAns, 10);
    if (numIdx < options.length) return options[numIdx];
  }

  // Check cleaned text match
  const cAns = cleanText(trimmedAns);
  const foundIdx = options.findIndex(opt => {
    const cOpt = cleanText(opt);
    return cOpt === cAns || cOpt.includes(cAns) || cAns.includes(cOpt);
  });
  if (foundIdx >= 0) {
    return options[foundIdx];
  }

  return options[0];
}
