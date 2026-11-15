import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Exam, Question } from '../types';
import { Printer, FileText, HelpCircle, Check } from 'lucide-react';
import { isOptionCorrect, resolveCorrectAnswer } from '../utils/questionUtils';
import moeLogo from '../assets/moe-logo.png';

function MinistryLogo() {
  return (
    <img
      src={moeLogo}
      alt="شعار وزارة التعليم"
      className="max-w-full max-h-full object-contain select-none"
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
  const [twoPageFitEnabled, setTwoPageFitEnabled] = useState<boolean>(true);
  const [printZoom, setPrintZoom] = useState<number>(1);
  const [splitMidpointForTwoPages, setSplitMidpointForTwoPages] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Helper function to convert English numerals (123) to Eastern Arabic / Hindi numerals (١٢٣)
  const toArabicNumerals = (num: any): string => {
    if (num === null || num === undefined) return '';
    const str = String(num);
    if (!useArabicNumerals) return str;
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, (w) => arabicDigits[+w]);
  };

  const formatPointsLabel = (pts: number): string => {
    const numStr = toArabicNumerals(pts);
    if (pts === 1) return `${numStr} درجة`;
    if (pts === 2) return `${numStr} درجتان`;
    if (pts >= 3 && pts <= 10) return `${numStr} درجات`;
    return `${numStr} درجة`;
  };

  // Sync initial / latest exam when exams change
  useEffect(() => {
    if (exams.length === 0) {
      setSelectedExam(null);
      return;
    }
    if (!selectedExam || !exams.some(ex => ex.id === selectedExam.id)) {
      setSelectedExam(exams[exams.length - 1]); // default to latest exam
    }
  }, [exams, selectedExam]);

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

  // Only switch to ultra-compact / 2-column dense layout when exam has 23+ items
  const isCompactExam = twoPageFitEnabled && formQuestions.length >= 23;

  // Measure rendered sheet height so:
  // - Exams with < 23 items spread comfortably across 2 pages (never crammed into 1 page, never spilling to 3)
  // - Exams with >= 23 items compress cleanly to fit within 2 pages max
  const measureAndScaleForTwoPages = useCallback(() => {
    const el = sheetRef.current;
    if (!el || !selectedExam || !twoPageFitEnabled) {
      setPrintZoom(1);
      setSplitMidpointForTwoPages(false);
      if (el) el.style.setProperty('--print-zoom', '1');
      return;
    }

    // Temporarily reset zoom variable while measuring raw content height
    el.style.setProperty('--print-zoom', '1');

    const rawHeight = el.scrollHeight;
    const width = el.clientWidth || 726;
    const effectiveHeight = width < 680 ? rawHeight * Math.max(0.65, width / 726) : rawHeight;

    if (!isCompactExam) {
      // Under 23 questions: keep comfortable readability (zoom = 1 up to 1740px)
      // and split onto Page 2 if the sheet would otherwise fit on a single page (< 1090px).
      const MAX_TWO_PAGES_PX = 1740;
      const SINGLE_PAGE_MAX_PX = 1090;
      const canSplit = formQuestions.length >= 4;

      setSplitMidpointForTwoPages(canSplit && effectiveHeight <= SINGLE_PAGE_MAX_PX);

      const nextZoom = effectiveHeight > MAX_TWO_PAGES_PX
        ? Math.max(0.62, Number((MAX_TWO_PAGES_PX / effectiveHeight).toFixed(3)))
        : 1;

      setPrintZoom(nextZoom);
      el.style.setProperty('--print-zoom', String(nextZoom));
    } else {
      // 23+ questions: compact mode without forced midpoint break, scaled safely into 2 pages
      setSplitMidpointForTwoPages(false);
      const MAX_TWO_PAGES_DENSE_PX = 1560;
      const nextZoom = effectiveHeight > MAX_TWO_PAGES_DENSE_PX
        ? Math.max(0.50, Number((MAX_TWO_PAGES_DENSE_PX / effectiveHeight).toFixed(3)))
        : 1;

      setPrintZoom(nextZoom);
      el.style.setProperty('--print-zoom', String(nextZoom));
    }
  }, [selectedExam, twoPageFitEnabled, isCompactExam, formQuestions.length]);

  useLayoutEffect(() => {
    measureAndScaleForTwoPages();

    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measureAndScaleForTwoPages();
      });
    }

    window.addEventListener('beforeprint', measureAndScaleForTwoPages);
    window.addEventListener('resize', measureAndScaleForTwoPages);
    return () => {
      cancelled = true;
      window.removeEventListener('beforeprint', measureAndScaleForTwoPages);
      window.removeEventListener('resize', measureAndScaleForTwoPages);
    };
  }, [measureAndScaleForTwoPages, formQuestions, sheetType, selectedFormId, useArabicNumerals]);

  const handlePrint = () => {
    measureAndScaleForTwoPages();
    // Allow DOM style variable flush before opening browser print dialog
    requestAnimationFrame(() => {
      window.print();
    });
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
  const baseTypeOrder = ['mcq', 'true_false', 'fill_blank', 'matching', 'ordering', 'verse_hadith', 'essay'];
  const extraTypes = Object.keys(grouped).filter(t => !baseTypeOrder.includes(t));
  const typesOrdered = [...baseTypeOrder, ...extraTypes].filter(t => !!grouped[t]);

  // Compute balanced section index for splitting shorter (<23 items) exams across 2 pages
  let splitSectionIndex = -1;
  if (splitMidpointForTwoPages && typesOrdered.length >= 2) {
    const halfCount = formQuestions.length / 2;
    let running = 0;
    for (let i = 0; i < typesOrdered.length - 1; i++) {
      running += grouped[typesOrdered[i]].length;
      if (running >= halfCount) {
        splitSectionIndex = i + 1;
        break;
      }
    }
    if (splitSectionIndex === -1) {
      splitSectionIndex = Math.ceil(typesOrdered.length / 2);
    }
  }

  // Map types to premium Arabic question ordinal labels
  const arabOrdinals = ['السؤال الأول', 'السؤال الثاني', 'السؤال الثالث', 'السؤال الرابع', 'السؤال الخامس', 'السؤال السادس', 'السؤال السابع', 'السؤال الثامن'];

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
    <div id="print-section-module" className="space-y-4 print:space-y-0">
      
      {/* Selector and Options toolbar in standard view - hidden during print */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 font-sans">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">اختر ورقة الاختبار لغرض المعاينة والطباعة:</label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedExam?.id || ''}
              onChange={(e) => setSelectedExam(exams.find(ex => ex.id === e.target.value) || null)}
              className="bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-805 dark:text-white font-bold outline-none cursor-pointer"
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.title} ({ex.semester})</option>
              ))}
            </select>
            {selectedExam && (
              <span className="text-[10.5px] font-bold text-[#0F4C81] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-2 py-1 rounded-lg">
                {toArabicNumerals(formQuestions.length)} فقرة • {formatPointsLabel(selectedExam.totalPoints)}
              </span>
            )}
          </div>
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
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-750 rounded-lg border border-slate-200 dark:border-slate-700">
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

          {/* Two-page fit Switch */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-750 rounded-lg border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="two-page-fit-checkbox"
              checked={twoPageFitEnabled}
              onChange={(e) => setTwoPageFitEnabled(e.target.checked)}
              className="rounded text-[#0F4C81] focus:ring-[#0F4C81] cursor-pointer"
            />
            <label htmlFor="two-page-fit-checkbox" className="text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              طباعة في ورقتين (A4)
            </label>
            {twoPageFitEnabled && splitMidpointForTwoPages && (
              <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">
                توزيع على صفحتين
              </span>
            )}
            {twoPageFitEnabled && printZoom < 0.99 && (
              <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                ملاءمة {toArabicNumerals(Math.round(printZoom * 100))}٪
              </span>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="bg-[#0F4C81] hover:bg-[#0c3d67] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Printer size={13} />
            طباعة الاختبار (ورقتين)
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
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/40 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-400 no-print font-sans">
        <HelpCircle size={15} className="shrink-0 mt-0.5" />
        <p>
          💡 <strong>نصيحة الطباعة في ورقتين:</strong> تم ضبط تنسيق الورقة والمقياس التلقائي لتطبع الأسئلة داخل <strong>صفحتين (A4) فقط</strong> دون قص أو ترحيل صفحات زائدة. عند الضغط على <strong>طباعة الاختبار</strong> تأكد من اختيار مقاس الورق A4 والهوامش الافتراضية (أو الحد الأدنى) وتفعيل طباعة رسومات الخلفية.
        </p>
      </div>

      {/* PRINTABLE WORK AREA CONTAINER */}
      {selectedExam && (
        <div
          ref={sheetRef}
          style={{ '--print-zoom': printZoom } as React.CSSProperties}
          className={`bg-white text-slate-900 rounded-xl border border-slate-200 ${isCompactExam ? 'p-3' : 'p-5'} print:p-0 max-w-[19.4cm] mx-auto min-h-0 print-card [print-color-adjust:exact]`}
        >
          
          {/* Saudi MoE standard header */}
          <div className={`grid grid-cols-3 items-center border-b-2 border-double border-slate-800 ${isCompactExam ? 'pb-1.5 mb-1.5' : 'pb-2.5 mb-2.5'}`}>
            <div className={`text-right ${isCompactExam ? 'text-[9.5px]' : 'text-[10.5px]'} space-y-0.5 text-slate-800 leading-snug`}>
              <div className="font-bold">المملكة العربية السعودية</div>
              <div className="font-bold">وزارة التعليم</div>
              <div>الإدارة العامة للتعليم بمنطقة الرياض</div>
              <div className="font-semibold">{selectedExam.schoolName}</div>
            </div>

            <div className="flex flex-col items-center text-center">
              {/* Official Saudi Ministry of Education Logo */}
              <div className={`${isCompactExam ? 'w-[74px] h-[50px]' : 'w-[84px] h-[58px]'} flex items-center justify-center relative`}>
                <MinistryLogo />
              </div>
              <div className="text-[9.5px] text-slate-500 font-bold leading-none mt-0.5">الدراسات الإسلامية</div>
            </div>

            <div className={`text-left ${isCompactExam ? 'text-[9.5px]' : 'text-[10.5px]'} space-y-0.5 text-slate-800 leading-snug`}>
              <div>المادة: <b className="font-bold text-slate-900">الدراسات الإسلامية</b></div>
              <div>الصف: <b className="font-bold text-slate-900">الثاني المتوسط</b></div>
              <div>{selectedExam.semester}</div>
              <div>العام الدراسي: <b className="font-serif text-slate-900 font-bold">{toArabicNumerals(selectedExam.academicYear)}</b></div>
              <div>زمن الاختبار: <b className="font-bold text-slate-900">{toArabicNumerals(selectedExam.timeLimit)} دقيقة</b></div>
            </div>
          </div>

          {/* Exam core title, dynamic parallel Form name tag */}
          <div className={`relative text-center ${isCompactExam ? 'my-1' : 'my-2.5'}`}>
            <h1 className={`${isCompactExam ? 'text-sm' : 'text-lg'} font-extrabold text-slate-900 tracking-tight leading-snug`}>
              {selectedExam.title}
            </h1>
            <div className="absolute top-0 left-0 bg-slate-900 text-white rounded px-2 py-0.5 text-[10.5px] font-bold font-mono">
              نموذج ({selectedFormId})
            </div>
            {sheetType === 'answer-key' && (
              <div className="inline-block mt-1 bg-emerald-600 text-white font-bold rounded px-2.5 py-0.5 text-[10.5px]">
                مفتاح الإجابة والحلول النموذجية للمصحح
              </div>
            )}
          </div>

          {/* Student details line table */}
          {sheetType === 'exam' && (
            <div className={`border border-slate-800 px-2.5 ${isCompactExam ? 'py-1 mb-1.5 text-[10px]' : 'py-2 mb-3.5 text-[11px]'} rounded-md grid grid-cols-12 gap-x-2 items-center leading-tight`}>
              <div className="col-span-6 flex items-center gap-1.5 border-l border-slate-300 pl-2">
                <span className="font-bold shrink-0 text-slate-700">اسم الطالب رباعياً:</span>
                <span className="w-full border-b border-dotted border-slate-400 h-3"></span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 border-l border-slate-300 px-1.5">
                <span className="font-bold shrink-0 text-slate-700">الفصل:</span>
                <span className="w-full border-b border-dotted border-slate-400 h-3"></span>
              </div>
              <div className="col-span-4 flex items-center justify-center px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-center">
                <span className="font-bold text-slate-800 w-full text-center">الدرجة المستحقة: ( {toArabicNumerals(selectedExam.totalPoints)} ) درجة</span>
              </div>
            </div>
          )}

          {/* MODEL WRITTEN QUESTIONS GRID */}
          <div className={isCompactExam ? 'space-y-1.5' : 'space-y-4'}>
            {typesOrdered.map((typeKey, qIndex) => {
              const qsInGroup = grouped[typeKey];
              const ordinalLabel = arabOrdinals[qIndex] || `السؤال ${qIndex + 1}`;
              const typeLabel = getTypeLabel(typeKey);
              const groupSumPoints = qsInGroup.reduce((sum, q) => sum + q.points, 0);

              // Only collapse short T/F or Fill-Blank into 2 columns when exam is large (23+ items)
              const useTwoColumnItems =
                isCompactExam &&
                ((typeKey === 'true_false' && qsInGroup.length >= 4 && qsInGroup.every(item => item.text.length <= 72)) ||
                  (typeKey === 'fill_blank' && sheetType === 'exam' && qsInGroup.length >= 4 && qsInGroup.every(item => item.text.length <= 65)));

              const breakBeforeThisSection = splitMidpointForTwoPages && splitSectionIndex === qIndex;

              return (
                <div key={typeKey} className={`${isCompactExam ? 'space-y-1' : 'space-y-2.5'} ${breakBeforeThisSection ? 'print-break-before' : ''}`}>
                  
                  {/* Question section header */}
                  <div className={`print-section-header border-b border-slate-800 ${isCompactExam ? 'pb-0.5 text-[11.5px]' : 'pb-1 text-[13px]'} flex justify-between items-center gap-2 font-bold`}>
                    <span className="text-slate-900 border-r-4 border-slate-900 pr-2 leading-snug">
                      {ordinalLabel}: {typeLabel}.
                    </span>
                    <span className={`shrink-0 ${isCompactExam ? 'text-[10px]' : 'text-[11px]'} font-extrabold text-slate-800 bg-slate-100 border border-slate-300 rounded px-2 py-0.5`}>
                      {formatPointsLabel(groupSumPoints)}
                    </span>
                  </div>

                  {/* Question items lists */}
                  <div className={useTwoColumnItems ? 'grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-4 gap-y-1 pl-0.5' : `${isCompactExam ? 'space-y-1' : 'space-y-2.5'} pl-0.5`}>
                    {qsInGroup.map((q, subIdx) => {
                      const hasShortOptions = q.type === 'mcq' && q.options && q.options.every(o => o.trim().length <= (isCompactExam ? 28 : 22));
                      const breakBeforeThisItem =
                        splitMidpointForTwoPages &&
                        typesOrdered.length === 1 &&
                        qsInGroup.length >= 4 &&
                        subIdx === Math.ceil(qsInGroup.length / 2);

                      return (
                        <div key={q.id} className={`print-item ${isCompactExam ? 'text-[10.5px] space-y-0.5 leading-snug' : 'text-[12px] space-y-1.5 leading-relaxed'} text-slate-800 ${breakBeforeThisItem ? 'print-break-before' : ''}`}>
                          <div className="flex justify-between items-start gap-2.5">
                            <span className="font-bold flex gap-1.5 items-baseline">
                              <span className="shrink-0">{toArabicNumerals(subIdx + 1)}.</span>
                              <span className={`font-serif text-slate-900 ${isCompactExam ? 'text-[11px] leading-snug' : 'text-[13.5px] leading-relaxed'}`}>{q.text}</span>
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {q.type === 'true_false' && (
                                sheetType === 'answer-key' ? (
                                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-extrabold text-[10px]">
                                    [{q.correctAnswer}]
                                  </span>
                                ) : (
                                  <span className={`font-bold text-slate-500 ${isCompactExam ? 'text-[10.5px]' : 'text-xs'} whitespace-nowrap`}>( &nbsp; &nbsp; &nbsp; )</span>
                                )
                              )}
                              <span className={`shrink-0 ${isCompactExam ? 'text-[9px] px-1 py-0.2' : 'text-[10px] px-1.5 py-0.5'} font-bold text-slate-600 border border-slate-300 rounded bg-slate-50/70`}>
                                {formatPointsLabel(q.points)}
                              </span>
                            </div>
                          </div>

                          {/* Rendering dynamic MCQ list */}
                          {q.type === 'mcq' && q.options && (
                            <div className={`grid ${hasShortOptions ? 'grid-cols-2 sm:grid-cols-4 print:grid-cols-4' : 'grid-cols-2'} gap-x-2.5 ${isCompactExam ? 'gap-y-0.5 pt-0.5 text-[10px]' : 'gap-y-1.5 pt-1 text-[11.5px]'} pr-3.5`}>
                              {q.options.map((opt, oIdx) => {
                                const isCorrect = isOptionCorrect(q, opt, oIdx);
                                const charLabel = ['أ', 'ب', 'ج', 'د'][oIdx] || String.fromCharCode(65 + oIdx);
                                return (
                                  <div key={oIdx} className="flex items-center gap-1.5">
                                    {/* MCQ bubbles */}
                                    <span className={`${isCompactExam ? 'w-3.5 h-3.5 text-[9px]' : 'w-[18px] h-[18px] text-[10px]'} rounded-full border border-slate-700 font-bold flex items-center justify-center shrink-0 ${
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
                                      <Check size={11} className="text-emerald-700 stroke-[3] shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Matching rendering (Column A and Column B with random layout) */}
                          {q.type === 'matching' && q.matchingPairs && (
                            <div className="pr-3.5 pt-1 space-y-0.5">
                              <div className={`grid grid-cols-12 gap-1.5 border bg-slate-50 ${isCompactExam ? 'text-[9px] py-0.5' : 'text-[10px] py-1'} font-bold text-slate-700 px-2 rounded text-center`}>
                                <span className="col-span-5 text-right">العمود (أ)</span>
                                <span className="col-span-2">المطابقة</span>
                                <span className="col-span-5 text-right">العمود (ب)</span>
                              </div>
                              <div className="space-y-0.5">
                                {q.matchingPairs.map((pair, pIdx) => (
                                  <div key={pair.id || pIdx} className={`grid grid-cols-12 gap-1.5 border-b border-slate-100 ${isCompactExam ? 'py-0.5 text-[10px] leading-tight' : 'py-1 text-[11.5px] leading-snug'} items-center`}>
                                    <span className="col-span-5 text-slate-900 font-medium font-serif pr-1">{toArabicNumerals(pIdx + 1)}أ. {pair.left}</span>
                                    <span className="col-span-2 text-center text-slate-400 font-serif">
                                      {sheetType === 'answer-key' ? (
                                        <span className="bg-emerald-600 text-white rounded px-1.5 py-0.2 text-[9.5px] font-bold">كود [{toArabicNumerals(pIdx + 1)}]</span>
                                      ) : '......'}
                                    </span>
                                    <span className="col-span-5 text-slate-700">
                                      {sheetType === 'answer-key' ? (
                                        <span className="text-emerald-800 font-bold underline decoration-double">{pair.right}</span>
                                      ) : (
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
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ordering rendering sub items */}
                          {q.type === 'ordering' && q.orderedItems && (
                            <div className="pr-3.5 pt-0.5 space-y-1">
                              <div className={`flex flex-wrap gap-1.5 text-slate-600 ${isCompactExam ? 'text-[9.5px]' : 'text-[11px]'}`}>
                                {q.orderedItems.map((item, oIdx) => (
                                  <div key={oIdx} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                    {item}
                                  </div>
                                ))}
                              </div>
                              {sheetType === 'exam' ? (
                                <div className={`flex gap-2 items-center text-slate-400 ${isCompactExam ? 'text-[9.5px]' : 'text-[10.5px]'}`}>
                                  <span className="shrink-0">الترتيب:</span>
                                  <span className="w-full border-b border-dotted border-slate-400 h-3"></span>
                                </div>
                              ) : (
                                <div className="bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 text-[#2E7D32] text-[11px] font-bold font-serif leading-snug">
                                  ترتيب التصحيح: {q.correctAnswer}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Essay / verse / fill-blank answer space */}
                          {(q.type === 'essay' || q.type === 'verse_hadith' || q.type === 'fill_blank') && (
                            <div className="pr-3.5 pt-0.5 w-full">
                              {sheetType === 'exam' ? (
                                <div className="space-y-1 w-full">
                                  <div className={`border-b border-dotted border-slate-400 ${isCompactExam ? 'h-2.5' : 'h-3.5'} w-full`}></div>
                                  {(q.type === 'essay' || q.type === 'verse_hadith') && !isCompactExam && (
                                    <div className="border-b border-dotted border-slate-400 h-3.5 w-full"></div>
                                  )}
                                </div>
                              ) : (
                                <div className={`bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 text-[#2E7D32] ${isCompactExam ? 'text-[10px]' : 'text-[11px]'} font-bold leading-snug`}>
                                  الإجابة النموذجية: {q.correctAnswer}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Model Answer footer signature section */}
          <div className={`${isCompactExam ? 'pt-1.5 mt-2 text-[10.5px]' : 'pt-3 mt-4 text-xs'} border-t border-slate-800 text-center text-slate-600 font-bold flex justify-center`}>
            <span className="font-serif">انتهت الأسئلة والحمد لله رب العالمين</span>
          </div>

        </div>
      )}

    </div>
  );
}
