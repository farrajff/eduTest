import React, { useState, useEffect } from 'react';
import { Exam, Question, SubjectBranch } from '../types';
import { Printer, Shuffle, FileText, CheckCircle2, ChevronRight, CornerDownLeft, Eye, HelpCircle, Check } from 'lucide-react';
import { isOptionCorrect, resolveCorrectAnswer } from '../utils/questionUtils';

// Robust MinistryLogo with multiple actual Ministry website links and wikimedia fallbacks
function MinistryLogo() {
  const [attempt, setAttempt] = useState<number>(0);

  const logoUrls = [
    "https://upload.wikimedia.org/wikipedia/commons/1/11/Ministry_of_Education_%28Saudi_Arabia%29_Logo.svg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4f/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png",
    "https://www.moe.gov.sa/assets/images/logo.png",
    "https://moe.gov.sa/assets/images/logo.png"
  ];

  const handleLogoError = () => {
    setAttempt(prev => prev + 1);
  };

  // If all image attempts fail, display an incredibly elegant text-based badge that acts as a final graceful fallback
  if (attempt >= logoUrls.length) {
    return (
      <div className="w-20 h-14 bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center p-1 text-center select-none leading-none">
        <span className="text-[9px] font-bold text-[#0F4C81]">وزارة التعليم</span>
        <span className="text-[6px] text-slate-400 font-mono mt-0.5">Ministry of Education</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrls[attempt]}
      alt="شعار وزارة التعليم"
      referrerPolicy="no-referrer"
      className="max-w-full max-h-full object-contain"
      onError={handleLogoError}
    />
  );
}

interface PrintViewProps {
  exams: Exam[];
  onDeleteExam: (id: string) => void;
}

export default function PrintView({ exams, onDeleteExam }: PrintViewProps) {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Selected student form: 'أ' | 'ب' | 'ج' | 'د'
  const [selectedFormId, setSelectedFormId] = useState<'أ' | 'ب' | 'ج' | 'د'>('أ');
  
  // Generated form variations holder
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);

  // Print sheet selection: 'exam' (Student paper) | 'answer-key' (Model Answer Key)
  const [sheetType, setSheetType] = useState<'exam' | 'answer-key'>('exam');

  // Arabic / Eastern/Hindi Numerals (١٢٣) toggle
  const [useArabicNumerals, setUseArabicNumerals] = useState<boolean>(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Helper function to convert English numerals (123) to Eastern Arabic / Hindi numerals (١٢٣)
  const toArabicNumerals = (num: any): string => {
    if (num === null || num === undefined) return '';
    const str = String(num);
    if (!useArabicNumerals) return str;
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, (w) => arabicDigits[+w]);
  };

  // Sync initial exam
  useEffect(() => {
    if (exams.length > 0 && !selectedExam) {
      setSelectedExam(exams[exams.length - 1]); // default to latest exam
    }
  }, [exams]);

  // Handle generating the Form questions with shuffled options without losing answers
  useEffect(() => {
    if (!selectedExam) {
      setFormQuestions([]);
      return;
    }

    const baseQuestions = [...selectedExam.questions];

    if (selectedFormId === 'أ') {
      // Form A is the default base form order without scrambling
      setFormQuestions(baseQuestions);
      return;
    }

    // Seed-based/pseudo random shuffle algorithm based on form identifier
    const seedMap = { 'ب': 0.25, 'ج': 0.65, 'د': 0.85 };
    const multiplier = seedMap[selectedFormId] || 0.5;

    // Shuffle top-level questions
    const shuffledQuestions = baseQuestions.map(q => ({ ...q })).sort((a, b) => {
      // Deterministic pseudo-random string comparison using id & form multiplier
      const scoreA = (a.id.length * multiplier) % 1;
      const scoreB = (b.id.length * multiplier) % 1;
      return scoreA - scoreB;
    });

    // Shuffle MCQ options while keeping track of the correct answer string!
    const finalShuffled = shuffledQuestions.map(q => {
      if (q.type === 'mcq' && q.options) {
        // Resolve correct answer text before shuffling
        const correctText = resolveCorrectAnswer(q.options, q.correctAnswer);
        const opts = [...q.options];
        const shuffledOpts = opts.sort((a, b) => {
          const scoreA = (a.length * multiplier) % 1;
          const scoreB = (b.length * multiplier) % 1;
          return scoreA - scoreB;
        });

        return {
          ...q,
          options: shuffledOpts,
          correctAnswer: correctText // Correct text stays mapped to the actual choice
        };
      }
      return q;
    });

    setFormQuestions(finalShuffled);
  }, [selectedExam, selectedFormId]);

  const handlePrint = () => {
    // Elegant launch of browser native printing
    window.print();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'اختر الإجابة الصحيحة لكل مما يلي';
      case 'true_false': return 'ضع علامة (✓) أمام العبارة الصحيحة وعلامة (✗) أمام العبارة الخاطئة';
      case 'fill_blank': return 'أكمل الفراغات التالية بالكلمات المتممة المناسبة شرعاً';
      case 'matching': return 'صل أو زاوج المجموعة (أ) بما يناسبها من المجموعة (ب) في الجدول التالي';
      case 'ordering': return 'قم بترتيب العناصر التالية بالتسلسل الشرعي الصحيح';
      case 'essay': return 'أجب باختصار وعناية عن الأسئلة المقالية التالية';
      case 'verse_hadith': return 'استخلص المعاني والأحكام الشرعية من النصوص الكريمة التالية';
      default: return 'صنف الأسئلة التالية';
    }
  };

  // Group questions by type to look like a real structured exam paper (السؤال الأول، السؤال الثاني، إلخ)
  const groupQuestionsByType = (questionsList: Question[]) => {
    const groups: Record<string, Question[]> = {};
    questionsList.forEach(q => {
      if (!groups[q.type]) {
        groups[q.type] = [];
      }
      groups[q.type].push(q);
    });
    return groups;
  };

  const grouped = groupQuestionsByType(formQuestions);
  const typesOrdered = ['mcq', 'true_false', 'fill_blank', 'matching', 'ordering', 'verse_hadith', 'essay'].filter(t => !!grouped[t]);

  // Map types to premium Arabic question ordinal labels
  const arabOrdinals = ['السؤال الأول', 'السؤال الثاني', 'السؤال الثالث', 'السؤال الرابع', 'السؤال الخامس', 'السؤال السادس', 'السؤال السابع'];

  if (exams.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-750 p-12 text-center flex flex-col items-center justify-center font-sans">
        <FileText size={40} className="text-slate-300 dark:text-slate-600 mb-2" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-white">لم يتم إصدار أي اختبار بعد</h4>
        <p className="text-slate-400 text-xs mt-1 max-w-xs">الرجاء التوجه لتبويبة "إنشاء اختبار جديد" لتصميم وتوثيق أول اختبار إسلامي.</p>
      </div>
    );
  }

  return (
    <div id="print-section-module" className="space-y-4">
      
      {/* Selector and Options toolbar in standard view - hidden during print */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 font-sans">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">اختر ورقة الاختبار لغرض المعاينة والطباعة:</label>
          <select
            value={selectedExam?.id || ''}
            onChange={(e) => setSelectedExam(exams.find(ex => ex.id === e.target.value) || null)}
            className="bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-805 dark:text-white font-bold outline-none cursor-pointer"
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.title} ({ex.semester})</option>
            ))}
          </select>
        </div>

        {/* Choice of form variation and key sheet */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Sheet Selector: test paper or model answer sheet */}
          <div className="flex bg-slate-150 dark:bg-slate-900 p-0.5 rounded-lg">
            <button
              onClick={() => setSheetType('exam')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${sheetType === 'exam' ? 'bg-[#0F4C81] text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'}`}
            >
              ورقة الأسئلة للطلاب
            </button>
            <button
              onClick={() => setSheetType('answer-key')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${sheetType === 'answer-key' ? 'bg-[#2E7D32] text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'}`}
            >
              نموذج الإجابة للمصحح
            </button>
          </div>

          {/* Form Variation Selector A, B, C, D */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">النموذج مكرر:</span>
            <div className="flex gap-0.5">
              {(['أ', 'ب', 'ج', 'د'] as const).map(fId => (
                <button
                  key={fId}
                  onClick={() => setSelectedFormId(fId)}
                  className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-md transition-all cursor-pointer ${selectedFormId === fId ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-205'}`}
                >
                  {fId}
                </button>
              ))}
            </div>
          </div>

          {/* Use Arabic/Eastern Numerals Switch */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-755 rounded-lg border border-slate-205 dark:border-slate-705">
            <input
              type="checkbox"
              id="numeral-type-checkbox"
              checked={useArabicNumerals}
              onChange={(e) => setUseArabicNumerals(e.target.checked)}
              className="rounded text-[#0F4C81] focus:ring-[#0F4C81] cursor-pointer"
            />
            <label htmlFor="numeral-type-checkbox" className="text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              أرقام عربية (١٢٣)
            </label>
          </div>

          <button
            onClick={handlePrint}
            className="bg-[#0F4C81] hover:bg-[#0c3d67] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Printer size={13} />
            طباعة الاختبار (A4)
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-955/20 px-2 py-1 rounded-lg border border-red-250 dark:border-red-900 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] font-bold text-red-700 dark:text-red-350">متأكد؟</span>
              <button
                onClick={() => {
                  if (selectedExam) {
                    onDeleteExam(selectedExam.id);
                    setSelectedExam(null);
                  }
                  setShowDeleteConfirm(false);
                }}
                className="bg-red-650 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
              >
                حذف
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-slate-205 text-slate-705 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              حذف الاختبار
            </button>
          )}
        </div>
      </div>

      {/* Info indicator no-print */}
      <div className="bg-amber-50 dark:bg-amber-955/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/40 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-400 no-print font-sans">
        <HelpCircle size={15} className="shrink-0 mt-0.5" />
        <p>
          💡 <strong>نصيحة الطباعة الاحترافية:</strong> سيقوم النظام تلقائياً بإخفاء حواف وعناصر التحكم الخاصة بالموقع وجعل ورقة الاختبار بخلفية بيضاء نقية وبدون فواصل عند الضغط على زر <strong>طباعة الاختبار (A4)</strong>. احرص على تفعيل خيار "الرسومات والظلال" في خيارات طباعة متصفحك للحفاظ على محاور التوصيل والجدولة.
        </p>
      </div>

      {/* PRINTABLE WORK AREA CONTAINER */}
      {selectedExam && (
        <div className="bg-white text-slate-900 rounded-xl border border-slate-150 p-6 max-w-[21cm] mx-auto min-h-[29.7cm] print-card [print-color-adjust:exact]">
          
          {/* Saudi MoE standard header */}
          <div className="grid grid-cols-3 items-center border-b-2 border-double border-slate-800 pb-4 mb-4">
            <div className="text-right text-[11px] space-y-0.5 text-slate-800 leading-normal">
              <div className="font-bold">المملكة العربية السعودية</div>
              <div className="font-bold">وزارة التعليم</div>
              <div>الإدارة العامة للتعليم بمنطقة الرياض</div>
              <div className="font-semibold">{selectedExam.schoolName}</div>
            </div>

            <div className="flex flex-col items-center text-center">
              {/* National Saudi Ministry Symbol Logo on standard header */}
              <div className="w-20 h-14 flex items-center justify-center relative">
                <MinistryLogo />
              </div>
              <div className="text-[10px] text-slate-450 mt-0.5 font-bold">الدراسات الإسلامية</div>
            </div>

            <div className="text-left text-[11px] space-y-0.5 text-slate-800 leading-normal">
              <div>المادة: <b className="font-bold text-slate-900">الدراسات الإسلامية</b></div>
              <div>الصف: <b className="font-bold text-slate-900">الثاني المتوسط</b></div>
              <div>{selectedExam.semester}</div>
              <div>العام الدراسي: <b className="font-serif text-slate-900 font-bold">{toArabicNumerals(selectedExam.academicYear)}</b></div>
              <div>زمن الاختبار: <b className="font-bold text-slate-900">{toArabicNumerals(selectedExam.timeLimit)} دقيقة</b></div>
            </div>
          </div>

          {/* Exam core title, dynamic parallel Form name tag */}
          <div className="relative text-center my-4">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-relaxed">
              {selectedExam.title} 
            </h1>
            <div className="absolute top-0 left-0 bg-slate-900 text-white rounded px-2.5 py-0.5 text-xs font-bold font-mono">
              نموذج ({selectedFormId})
            </div>
            {sheetType === 'answer-key' && (
              <div className="inline-block mt-1 bg-emerald-600 text-white font-bold rounded-md px-3 py-0.5 text-xs">
                مفتاح الإجابة والحلول النموذجية للمصحح
              </div>
            )}
          </div>

          {/* Student details line table - only shown for student exam sheets */}
          {sheetType === 'exam' && (
            <div className="border border-slate-800 p-2.5 rounded-lg grid grid-cols-12 gap-x-2 text-[11px] items-center mb-6 leading-relaxed">
              <div className="col-span-6 flex items-center gap-1.5 border-l border-slate-300 pl-2">
                <span className="font-bold shrink-0 text-slate-700">اسم الطالب رباعياً:</span>
                <span className="w-full border-b border-dotted border-slate-400 h-4"></span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 border-l border-slate-300 px-2">
                <span className="font-bold shrink-0 text-slate-700">الفصل:</span>
                <span className="w-full border-b border-dotted border-slate-400 h-4"></span>
              </div>
              <div className="col-span-4 flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-250 rounded text-center">
                <span className="font-bold text-slate-800 w-full text-center">الدرجة النهائية المستحقة: ( {toArabicNumerals(selectedExam.totalPoints)} ) درجة</span>
              </div>
            </div>
          )}

          {/* MODEL WRITTEN QUESTIONS GRID */}
          <div className="space-y-6">
            {typesOrdered.map((typeKey, qIndex) => {
              const qsInGroup = grouped[typeKey];
              const ordinalLabel = arabOrdinals[qIndex] || `السؤال ${qIndex + 1}`;
              const typeLabel = getTypeLabel(typeKey);
              
              const groupSumPoints = qsInGroup.reduce((sum, q) => sum + q.points, 0);

              return (
                <div key={typeKey} className="space-y-4 print-page-break-inside">
                  
                  {/* Question header container */}
                  <div className="border-b border-slate-800 pb-1 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-900 border-r-4 border-slate-900 pr-2 leading-relaxed">
                      {ordinalLabel}: {typeLabel}.
                    </span>
                  </div>

                  {/* Question items lists */}
                  <div className="space-y-4 pl-1">
                    {qsInGroup.map((q, subIdx) => (
                      <div key={q.id} className="text-xs space-y-2 leading-relaxed text-slate-800">
                        <div className="flex justify-between items-start gap-4">
                          <span className="font-bold flex gap-1">
                            <span>{toArabicNumerals(subIdx + 1)}.</span>
                            <span className="font-serif text-slate-900 text-sm">{q.text}</span>
                          </span>
                        </div>

                        {/* Rendering dynamic MCQ list */}
                        {q.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 pr-4">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = isOptionCorrect(q, opt, oIdx);
                              const charLabel = ['أ', 'ب', 'ج', 'د'][oIdx] || String.fromCharCode(65 + oIdx);
                              return (
                                <div key={oIdx} className="flex items-center gap-2">
                                  {/* MCQ bubbles */}
                                  <span className={`w-5 h-5 rounded-full border border-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                    sheetType === 'answer-key' && isCorrect ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold ring-1 ring-emerald-500' : ''
                                  }`}>
                                    {charLabel}
                                  </span>
                                  <span className={`${
                                    sheetType === 'answer-key' && isCorrect ? 'text-emerald-800 font-extrabold underline decoration-2 decoration-emerald-600' : 'text-slate-800'
                                  }`}>
                                    {opt}
                                  </span>
                                  {sheetType === 'answer-key' && isCorrect && (
                                    <Check size={12} className="text-emerald-700 stroke-[3]" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Rendering dynamic True-False blank options */}
                        {q.type === 'true_false' && (
                          <div className="flex justify-start gap-12 pr-4 pt-1">
                            <span className="font-bold text-slate-400"> ( &nbsp; &nbsp; &nbsp; &nbsp; ) </span>
                            {sheetType === 'answer-key' && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-extrabold text-xs">
                                الإجابة الصحيحة: [{q.correctAnswer}]
                              </span>
                            )}
                          </div>
                        )}

                        {/* Matching rendering (Column A and Column B with random layout) */}
                        {q.type === 'matching' && q.matchingPairs && (
                          <div className="pr-4 pt-1.5 space-y-1">
                            <div className="grid grid-cols-12 gap-2 border bg-slate-50 text-[10px] font-bold text-slate-700 p-1.5 rounded text-center">
                              <span className="col-span-5 text-right">العمود (أ)</span>
                              <span className="col-span-2">المطابقة</span>
                              <span className="col-span-5 text-right">العمود (ب)</span>
                            </div>
                            <div className="space-y-1">
                              {q.matchingPairs.map((pair, pIdx) => {
                                // Shuffler indices matchers for print keys
                                return (
                                  <div key={pair.id || pIdx} className="grid grid-cols-12 gap-2 border-b border-slate-100 py-1.5 text-xs items-center leading-normal">
                                    <span className="col-span-5 text-slate-900 font-medium font-serif pr-1">{toArabicNumerals(pIdx + 1)}أ. {pair.left}</span>
                                    <span className="col-span-2 text-center text-slate-400 font-serif">
                                      {sheetType === 'answer-key' ? (
                                        <span className="bg-emerald-600 text-white rounded px-1.5 py-0.2 text-[10px] font-bold">كود [{toArabicNumerals(pIdx + 1)}]</span>
                                      ) : '......'}
                                    </span>
                                    <span className="col-span-5 text-slate-700">
                                      {sheetType === 'answer-key' ? (
                                        <span className="text-emerald-800 font-bold underline decoration-double">{pair.right}</span>
                                      ) : (
                                        /* Shuffle Column B on student exam sheet dynamically based on seed */
                                        <span>
                                          {
                                            q.matchingPairs[
                                              (pIdx + (selectedFormId === 'أ' ? 0 : 1)) % q.matchingPairs.length
                                            ].right
                                          }
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Ordering rendering sub items */}
                        {q.type === 'ordering' && q.orderedItems && (
                          <div className="pr-4 pt-1 space-y-2">
                            <div className="flex flex-wrap gap-2 text-slate-600">
                              {q.orderedItems.map((item, oIdx) => (
                                <div key={oIdx} className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                                  {item}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 items-center text-slate-400 pt-1">
                              <span>خط الترتيب:</span>
                              <span className="w-full border-b border-dotted border-slate-400 h-4"></span>
                            </div>
                            {sheetType === 'answer-key' && (
                              <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-[#2E7D32] text-xs font-bold font-serif leading-relaxed">
                                ترتيب التصحيح: {q.correctAnswer}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Essay blank space for students */}
                        {(q.type === 'essay' || q.type === 'verse_hadith' || q.type === 'fill_blank') && (
                          <div className="pr-4 pt-1 space-y-1.5 w-full">
                            {sheetType === 'exam' ? (
                              <div className="space-y-1 w-full pt-1">
                                <div className="border-b border-dotted border-slate-400 h-4 w-full"></div>
                                <div className="border-b border-dotted border-slate-400 h-4 w-full"></div>
                                {q.type === 'essay' && <div className="border-b border-dotted border-slate-400 h-4 w-full"></div>}
                              </div>
                            ) : (
                              <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-[#2E7D32] text-xs font-bold leading-relaxed">
                                الإجابة النموذجية: {q.correctAnswer}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Model Answer footer signature section */}
          <div className="pt-8 mt-12 border-t border-slate-800 text-center text-xs text-slate-500 font-bold flex justify-center">
            <span className="font-serif">انتهت الأسئلة والحمد لله رب العالمين</span>
          </div>

        </div>
      )}

    </div>
  );
}
