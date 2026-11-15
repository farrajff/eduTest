import React, { useState, useEffect } from 'react';
import { Question, Exam, SubjectBranch, DifficultyLevel } from '../types';
import { Settings, CheckSquare, Square, Hammer, Award, RefreshCw, Layers, ArrowUp, ArrowDown, HelpCircle, Save, Check } from 'lucide-react';
import { getCanonicalLessons, isOptionCorrect } from '../utils/questionUtils';

interface ExamCreatorViewProps {
  questions: Question[];
  onSaveExam: (exam: Exam) => void;
  schoolName: string;
  academicYear: string;
  semester?: string;
  onSemesterChange?: (sem: string) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ExamCreatorView({
  questions,
  onSaveExam,
  schoolName: defaultSchoolName,
  academicYear: defaultAcademicYear,
  semester: defaultSemester,
  onSemesterChange,
  onNotify
}: ExamCreatorViewProps) {
  // Exam metadata fields
  const [examTitle, setExamTitle] = useState('الاختبار النهائي لمادة الدراسات الإسلامية');
  const [semester, setSemester] = useState(defaultSemester || 'الفصل الدراسي الثاني');
  const [schoolName, setSchoolName] = useState(defaultSchoolName || 'مدرسة البراء بن عازب المتوسطة');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear || '1447هـ - 2026م');
  const [timeLimit, setTimeLimit] = useState(45); // minutes

  // Exam Total Score & Equal Integer Distribution
  const [targetTotalPoints, setTargetTotalPoints] = useState<number>(20);
  const [autoDistributePoints, setAutoDistributePoints] = useState<boolean>(true);
  
  // Selection mode: 'manual' | 'auto'
  const [selectionMode, setSelectionMode] = useState<'manual' | 'auto'>('auto');
  
  // Selected question IDs for manual mode
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Automated balancing parameters
  const [autoSubject, setAutoSubject] = useState<'all' | SubjectBranch>('all');
  const [autoQuestionsCount, setAutoQuestionsCount] = useState(10);
  const [easyRatio, setEasyRatio] = useState(30); // percentages
  const [mediumRatio, setMediumRatio] = useState(50);
  const [hardRatio, setHardRatio] = useState(20);

  // Custom question counts by specific type state
  const [useCountByType, setUseCountByType] = useState(false);
  const [allowedTypes, setAllowedTypes] = useState<('mcq' | 'true_false' | 'fill_blank' | 'matching' | 'ordering' | 'essay' | 'verse_hadith')[]>(['mcq', 'true_false', 'fill_blank', 'matching', 'ordering', 'essay', 'verse_hadith']);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({
    mcq: 5,
    true_false: 5,
    fill_blank: 0,
    matching: 0,
    ordering: 0,
    essay: 0,
    verse_hadith: 0,
  });

  // Page range states ("من صفحة كذا إلى صفحة كذا")
  const [pageRangeActive, setPageRangeActive] = useState(false);
  const [pageRangeStart, setPageRangeStart] = useState(1);
  const [pageRangeEnd, setPageRangeEnd] = useState(150);

  // Filter for manual picker
  const [manualSubjectFilter, setManualSubjectFilter] = useState<'all' | SubjectBranch>('all');

  // Preview generated / finalized list
  const [finalQuestions, setFinalQuestions] = useState<Question[]>([]);

  const [selectedLessonsBySubject, setSelectedLessonsBySubject] = useState<Record<SubjectBranch, string[]>>({
    'توحيد': [],
    'تفسير': [],
    'حديث': [],
    'فقه': [],
  });

  const [expandedSubject, setExpandedSubject] = useState<SubjectBranch | null>('توحيد');

  // Sync schoolName and semester if parent props change
  useEffect(() => {
    if (defaultSchoolName) {
      setSchoolName(defaultSchoolName);
    }
  }, [defaultSchoolName]);

  useEffect(() => {
    if (defaultSemester) {
      setSemester(defaultSemester);
    }
  }, [defaultSemester]);

  // Questions belonging to the selected semester (if question has no semester tag, include it)
  const semesterQuestions = React.useMemo(() => {
    return questions.filter(q => !q.semester || q.semester === semester);
  }, [questions, semester]);

  // Extract all curriculum lessons for the selected semester from canonical list and questions bank
  const subjectMetadata = React.useMemo(() => {
    const data: Record<SubjectBranch, { lessons: { name: string; pageRange: string; count: number }[] }> = {
      'توحيد': { lessons: [] },
      'تفسير': { lessons: [] },
      'حديث': { lessons: [] },
      'فقه': { lessons: [] },
    };

    const lessonCounts: Record<string, number> = {};
    semesterQuestions.forEach(q => {
      const key = `${q.subject}|||${q.lesson}`;
      lessonCounts[key] = (lessonCounts[key] || 0) + 1;
    });

    // 1. Populate standard canonical curriculum lessons for active semester
    (['توحيد', 'تفسير', 'حديث', 'فقه'] as SubjectBranch[]).forEach(sub => {
      getCanonicalLessons(sub, semester).forEach(item => {
        data[sub].lessons.push({
          name: item.name,
          pageRange: item.pageRange,
          count: lessonCounts[`${sub}|||${item.name}`] || 0
        });
      });
    });

    // 2. Add any custom lessons existing in user's questions bank for this semester
    semesterQuestions.forEach(q => {
      const sub = q.subject;
      if (data[sub]) {
        const lessonName = q.lesson || 'درس عام';
        if (!data[sub].lessons.some(l => l.name === lessonName)) {
          const pageMatch = lessonName.match(/(\(ص\s*[^)]+\))/);
          const pageRange = pageMatch ? pageMatch[1] : '';
          data[sub].lessons.push({
            name: lessonName,
            pageRange: pageRange,
            count: lessonCounts[`${sub}|||${lessonName}`] || 0
          });
        }
      }
    });

    return data;
  }, [semesterQuestions, semester]);

  // Synchronize filtration selections with loaded metadata to select all by default
  useEffect(() => {
    const initialLessons: Record<SubjectBranch, string[]> = {
      'توحيد': [],
      'تفسير': [],
      'حديث': [],
      'فقه': [],
    };

    (Object.keys(subjectMetadata) as SubjectBranch[]).forEach(sub => {
      initialLessons[sub] = subjectMetadata[sub].lessons.map(l => l.name);
    });

    setSelectedLessonsBySubject(initialLessons);
  }, [subjectMetadata]);

  // Derived filtered pool of questions based on selected semester, lessons and page range
  const filteredQuestions = React.useMemo(() => {
    return semesterQuestions.filter(q => {
      const sub = q.subject;
      const allowedLessons = selectedLessonsBySubject[sub] || [];

      // Check if this lesson is selected
      const lessonKey = q.lesson || 'درس عام';
      const isLessonAllowed = allowedLessons.includes(lessonKey);
      if (!isLessonAllowed) return false;

      // Check if page range option is checked
      if (pageRangeActive && q.lesson) {
        const match = q.lesson.match(/ص\s*(\d+)(?:\s*-\s*(\d+))?/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : start;
          if (end < pageRangeStart || start > pageRangeEnd) {
            return false;
          }
        }
      }

      return true;
    });
  }, [semesterQuestions, selectedLessonsBySubject, pageRangeActive, pageRangeStart, pageRangeEnd]);

  // Pool filtered by branch (autoSubject)
  const autoSubjectPool = React.useMemo(() => {
    if (autoSubject === 'all') return filteredQuestions;
    return filteredQuestions.filter(q => q.subject === autoSubject);
  }, [filteredQuestions, autoSubject]);

  // Pool filtered by both branch and allowedTypes (used in standard auto mode)
  const autoEligiblePool = React.useMemo(() => {
    return autoSubjectPool.filter(q => allowedTypes.includes(q.type));
  }, [autoSubjectPool, allowedTypes]);

  // Available counts per question type inside autoSubjectPool
  const availableCountByType = React.useMemo(() => {
    const counts: Record<string, number> = {
      mcq: 0,
      true_false: 0,
      fill_blank: 0,
      matching: 0,
      ordering: 0,
      essay: 0,
      verse_hadith: 0,
    };
    autoSubjectPool.forEach(q => {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    return counts;
  }, [autoSubjectPool]);

  // Canonical print-section order so "السؤال الأخير" matches the printed exam paper order
  const TYPE_PRINT_ORDER = ['mcq', 'true_false', 'fill_blank', 'matching', 'ordering', 'verse_hadith', 'essay'];

  const sortByPrintSectionOrder = (list: Question[]): Question[] => {
    return [...list].sort((a, b) => {
      const idxA = TYPE_PRINT_ORDER.indexOf(a.type);
      const idxB = TYPE_PRINT_ORDER.indexOf(b.type);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  };

  // Distribute integer points evenly across all items; any remainder goes to the last question
  const distributePointsEvenly = (list: Question[], totalScore: number): Question[] => {
    if (list.length === 0) return list;
    const cleanTotal = Math.max(1, Math.floor(Number(totalScore) || 1));
    const count = list.length;
    const basePoints = Math.floor(cleanTotal / count);
    const remainder = cleanTotal % count;
    return list.map((q, idx) => ({
      ...q,
      points: idx === count - 1 ? basePoints + remainder : basePoints
    }));
  };

  // Fisher-Yates unbiased shuffle helper
  const shuffleQuestions = (items: Question[]): Question[] => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Clamp autoQuestionsCount when eligible pool size changes
  useEffect(() => {
    const maxAvailable = autoEligiblePool.length;
    if (autoQuestionsCount > maxAvailable && maxAvailable > 0) {
      setAutoQuestionsCount(maxAvailable);
    } else if (autoQuestionsCount < 1 && maxAvailable > 0) {
      setAutoQuestionsCount(1);
    }
  }, [autoEligiblePool, autoQuestionsCount]);

  // Scopes manipulation helper functions
  const handleToggleLesson = (subject: SubjectBranch, lesson: string) => {
    setSelectedLessonsBySubject(prev => {
      const current = prev[subject] || [];
      const updated = current.includes(lesson)
        ? current.filter(l => l !== lesson)
        : [...current, lesson];
      return { ...prev, [subject]: updated };
    });
  };

  const handleSelectAllLessons = (subject: SubjectBranch, allLessons: string[]) => {
    setSelectedLessonsBySubject(prev => ({
      ...prev,
      [subject]: allLessons
    }));
  };

  const handleDeselectAllLessons = (subject: SubjectBranch) => {
    setSelectedLessonsBySubject(prev => ({
      ...prev,
      [subject]: []
    }));
  };
  
  // Feed auto generation when dependencies or auto parameters change
  const runAutoGeneration = () => {
    // Check if the user opted to customize counts specifically by type
    if (useCountByType) {
      if (autoSubjectPool.length === 0) {
        setFinalQuestions([]);
        return;
      }

      const result: Question[] = [];
      TYPE_PRINT_ORDER.forEach(t => {
        const countNeeded = typeCounts[t] || 0;
        if (countNeeded <= 0) return;
        const poolOfType = shuffleQuestions(autoSubjectPool.filter(q => q.type === t));
        result.push(...poolOfType.slice(0, countNeeded));
      });

      const ordered = sortByPrintSectionOrder(result);
      setFinalQuestions(autoDistributePoints ? distributePointsEvenly(ordered, targetTotalPoints) : ordered);
      return;
    }

    if (autoEligiblePool.length === 0) {
      setFinalQuestions([]);
      return;
    }

    const targetTotal = Math.min(Math.max(1, autoQuestionsCount), autoEligiblePool.length);
    const shuffledPool = shuffleQuestions(autoEligiblePool);

    // Calculate count per difficulty
    const targetEasy = Math.round((easyRatio / 100) * targetTotal);
    const targetHard = Math.round((hardRatio / 100) * targetTotal);
    const targetMedium = Math.max(0, targetTotal - targetEasy - targetHard);

    const easyPool = shuffledPool.filter(q => q.difficulty === 'سهل');
    const mediumPool = shuffledPool.filter(q => q.difficulty === 'متوسط');
    const hardPool = shuffledPool.filter(q => q.difficulty === 'صعب');

    const result: Question[] = [];

    const grab = (subPool: Question[], targetCount: number) => {
      if (targetCount <= 0) return 0;
      const grabbed = subPool.slice(0, targetCount);
      result.push(...grabbed);
      return grabbed.length;
    };

    const grabbedEasy = grab(easyPool, targetEasy);
    const grabbedMedium = grab(mediumPool, targetMedium);
    const grabbedHard = grab(hardPool, targetHard);

    // Top up to exact targetTotal from remaining eligible questions if any difficulty lacked items
    const totalGrabbed = grabbedEasy + grabbedMedium + grabbedHard;
    if (totalGrabbed < targetTotal) {
      const currentIds = new Set(result.map(r => r.id));
      const leftovers = shuffledPool.filter(q => !currentIds.has(q.id));
      result.push(...leftovers.slice(0, targetTotal - totalGrabbed));
    }

    const ordered = sortByPrintSectionOrder(result.slice(0, targetTotal));
    setFinalQuestions(autoDistributePoints ? distributePointsEvenly(ordered, targetTotalPoints) : ordered);
  };

  // Run automatically in auto-mode
  useEffect(() => {
    if (selectionMode === 'auto') {
      runAutoGeneration();
    }
  }, [selectionMode, autoSubject, autoQuestionsCount, easyRatio, mediumRatio, hardRatio, autoEligiblePool, autoSubjectPool, useCountByType, typeCounts]);

  // Redistribute points whenever targetTotalPoints or autoDistributePoints changes
  useEffect(() => {
    if (autoDistributePoints && finalQuestions.length > 0) {
      setFinalQuestions(prev => distributePointsEvenly(prev, targetTotalPoints));
    }
  }, [targetTotalPoints, autoDistributePoints]);

  // Adjust specific question points within final selection (switches off auto-distribution to preserve manual override)
  const handleUpdateQuestionPoints = (id: string, newPoints: number) => {
    setAutoDistributePoints(false);
    setFinalQuestions(prev => prev.map(q => q.id === id ? { ...q, points: Math.max(0, Math.floor(newPoints || 0)) } : q));
  };

  // Sync final questions list in manual mode without losing custom order or points
  useEffect(() => {
    if (selectionMode === 'manual') {
      setFinalQuestions(prev => {
        const selectedSet = new Set(selectedIds);
        const kept = prev.filter(q => selectedSet.has(q.id));
        const keptIds = new Set(kept.map(q => q.id));
        const newlyAdded = questions.filter(q => selectedSet.has(q.id) && !keptIds.has(q.id));
        const combined = sortByPrintSectionOrder([...kept, ...newlyAdded]);
        return autoDistributePoints ? distributePointsEvenly(combined, targetTotalPoints) : combined;
      });
    }
  }, [selectedIds, selectionMode, questions]);

  // Toggle selection in manual mode
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const list = [...finalQuestions];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    setFinalQuestions(autoDistributePoints ? distributePointsEvenly(list, targetTotalPoints) : list);
  };

  const handleMoveDown = (index: number) => {
    if (index === finalQuestions.length - 1) return;
    const list = [...finalQuestions];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    setFinalQuestions(autoDistributePoints ? distributePointsEvenly(list, targetTotalPoints) : list);
  };

  const handleRemoveQuestion = (id: string) => {
    if (selectionMode === 'manual') {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setFinalQuestions(prev => {
        const remaining = prev.filter(q => q.id !== id);
        return autoDistributePoints ? distributePointsEvenly(remaining, targetTotalPoints) : remaining;
      });
    }
  };

  const calculateTotalPoints = () => {
    return finalQuestions.reduce((sum, q) => sum + q.points, 0);
  };

  const handleSave = () => {
    if (!examTitle.trim()) {
      onNotify?.('الرجاء كتابة اسم أو عنوان للاختبار.', 'error');
      return;
    }
    if (finalQuestions.length === 0) {
      onNotify?.('الرجاء اختيار سؤال واحد على الأقل لتوليد ورقة الاختبار.', 'error');
      return;
    }

    const examData: Exam = {
      id: `exam-${Date.now()}`,
      title: examTitle.trim(),
      grade: 'الصف الثاني المتوسط',
      semester,
      schoolName: schoolName.trim(),
      academicYear: academicYear.trim(),
      timeLimit: Number(timeLimit) || 45,
      totalPoints: calculateTotalPoints(),
      questions: finalQuestions,
      createdAt: new Date().toISOString()
    };

    onSaveExam(examData);
    onNotify?.('تم حفظ وتوثيق الاختبار الجديد بنجاح! تم نقله إلى قائمة المعاينة والطباعة.', 'success');
  };

  // Helper types label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'اختيار من متعدد';
      case 'true_false': return 'صح أو خطأ';
      case 'fill_blank': return 'أكمل الفراغ';
      case 'matching': return 'المزاوجة';
      case 'ordering': return 'الترتيب';
      case 'essay': return 'مقالي عريض';
      case 'verse_hadith': return 'آية/حديث';
      default: return type;
    }
  };

  return (
    <div id="exam-creator-module" className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-white">إنشاء اختبار جديد</h2>
        <p className="text-slate-500 mt-0.5 text-xs">توليد أوراق اختبارات الدراسات الإسلامية بالاعتماد على بنك الأسئلة المتكامل يدوياً أو آلياً.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Grid: Config Panel */}
        <div className="space-y-4 lg:col-span-1">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center gap-1.5 font-sans">
              <Settings size={14} className="text-[#0F4C81]" />
              ترويسة ورقة الاختبار
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">اسم الاختبار الرئيسي</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white font-medium outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">المرحلة والمستوى</label>
                <input
                  type="text"
                  disabled
                  value="الصف الثاني المتوسط"
                  className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 font-medium outline-none cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">الفصل الدراسي</label>
                  <select
                    value={semester}
                    onChange={(e) => {
                      setSemester(e.target.value);
                      onSemesterChange?.(e.target.value);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-750 dark:text-slate-300 outline-none"
                  >
                    <option value="الفصل الدراسي الأول">الفصل الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الثاني</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">زمن الاختبار (دقائق)</label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white font-mono font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">المدرسة</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">العام الدراسي</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Exam Total Score & Equal Distribution Card */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10.5px] font-bold text-[#0F4C81] dark:text-blue-300 flex items-center gap-1">
                    <Award size={13} />
                    درجة الاختبار الكلية:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={targetTotalPoints}
                    onChange={(e) => {
                      setTargetTotalPoints(Math.max(1, Math.floor(Number(e.target.value) || 1)));
                      setAutoDistributePoints(true);
                    }}
                    className="w-20 h-7 text-center bg-blue-50/70 dark:bg-slate-750 border border-[#0F4C81]/40 dark:border-blue-800 rounded-lg text-xs font-mono font-extrabold text-[#0F4C81] dark:text-blue-300 outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {[10, 15, 20, 25, 30, 40].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setTargetTotalPoints(preset);
                        setAutoDistributePoints(true);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition cursor-pointer ${
                        targetTotalPoints === preset && autoDistributePoints
                          ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                          : 'bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-750/60 p-2 rounded-lg border border-slate-150 dark:border-slate-700">
                  <label htmlFor="auto-distribute-points" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      id="auto-distribute-points"
                      type="checkbox"
                      checked={autoDistributePoints}
                      onChange={(e) => setAutoDistributePoints(e.target.checked)}
                      className="rounded text-[#2E7D32] focus:ring-[#2E7D32] cursor-pointer"
                    />
                    <span>توزيع الدرجات بالتساوي بدون كسور (والمتبقي في السؤال الأخير)</span>
                  </label>
                </div>

                {finalQuestions.length > 0 && autoDistributePoints && (() => {
                  const n = finalQuestions.length;
                  const base = Math.floor(targetTotalPoints / n);
                  const rem = targetTotalPoints % n;
                  if (targetTotalPoints < n) {
                    return (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-800 dark:text-amber-300 space-y-1">
                        <p className="font-bold">تنبيه: الدرجة الكلية ({targetTotalPoints}) أقل من عدد الفقرات ({n})، لذا ستحصل الفقرات الأولى على 0 درجة والفقرة الأخيرة على {targetTotalPoints}.</p>
                        <button
                          type="button"
                          onClick={() => setTargetTotalPoints(n)}
                          className="text-[9.5px] font-bold underline text-[#0F4C81] dark:text-blue-300 cursor-pointer"
                        >
                          ضبط الدرجة الكلية إلى {n} درجة (درجة لكل فقرة)
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div className="p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/50 text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
                      {rem === 0
                        ? `التوزيع: ${base} درجة لكل فقرة بالتساوي (${n} فقرات × ${base} = ${targetTotalPoints} درجة).`
                        : `التوزيع: ${base} درجة لكل فقرة، وتوضع الدرجات المتبقية (${rem}) في السؤال الأخير ليصبح (${base + rem} درجة).`}
                    </div>
                  );
                })()}

                {!autoDistributePoints && finalQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAutoDistributePoints(true)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-[#0F4C81] dark:text-blue-300 text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    إعادة توزيع الدرجات ({targetTotalPoints} درجة) بالتساوي الآن
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Configuration Selection methodology */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-2 font-sans">
              آلية اختيار الأسئلة
            </h3>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectionMode('auto')}
                className={`py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${selectionMode === 'auto' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                ذكاء تلقائي متوازن
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('manual')}
                className={`py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${selectionMode === 'manual' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                توزيع يدوي مخصص
              </button>
            </div>

            {selectionMode === 'auto' ? (
              <div className="space-y-3 pt-0.5 font-sans">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">التركيز على مادة معينة</label>
                  <select
                    value={autoSubject}
                    onChange={(e) => setAutoSubject(e.target.value as 'all' | SubjectBranch)}
                    className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="all">شامل لكل فروع الدراسات الإسلامية</option>
                    <option value="توحيد">تركيز فروع التوحيد</option>
                    <option value="تفسير">تركيز فروع التفسير</option>
                    <option value="حديث">تركيز فروع الحديث</option>
                    <option value="فقه">تركيز فروع الفقه</option>
                  </select>
                </div>

                {/* Desired Question Types Toggle checkboxes (only when not using exact count-by-type) */}
                {!useCountByType && (
                  <div className="space-y-1.5 p-2.5 bg-slate-50 dark:bg-slate-755/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-[10px] font-bold text-slate-500">صيغ وبنوك الأسئلة المراد إدراجها آلياً</label>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {[
                        { value: 'mcq', label: 'اختيار من متعدد' },
                        { value: 'true_false', label: 'صح أو خطأ' },
                        { value: 'fill_blank', label: 'أكمل الفراغ' },
                        { value: 'matching', label: 'المزاوجة' },
                        { value: 'ordering', label: 'الترتيب' },
                        { value: 'essay', label: 'سؤال مقالي' },
                        { value: 'verse_hadith', label: 'آية / حديث' }
                      ].map((item) => {
                        const isChecked = allowedTypes.includes(item.value as any);
                        const avail = availableCountByType[item.value] || 0;
                        return (
                          <label
                            key={item.value}
                            className={`flex items-center justify-between gap-1 p-1 rounded-md text-[9.5px] font-semibold cursor-pointer transition select-none border ${
                              isChecked
                                ? 'bg-[#0F4C81]/5 border-[#0F4C81] text-[#0F4C81] dark:bg-[#0F4C81]/25 dark:text-blue-300 dark:border-blue-900'
                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-750 text-slate-450 dark:text-slate-400 hover:border-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setAllowedTypes(prev => {
                                    if (prev.includes(item.value as any)) {
                                      if (prev.length === 1) return prev; // keep at least one
                                      return prev.filter(t => t !== item.value);
                                    } else {
                                      return [...prev, item.value as any];
                                    }
                                  });
                                }}
                                className="rounded text-[#0F4C81] focus:ring-[#0F4C81] w-3 h-3 cursor-pointer shrink-0"
                              />
                              <span className="truncate">{item.label}</span>
                            </span>
                            <span className="text-[8.5px] font-mono text-slate-400 shrink-0">({avail})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-755 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="use-count-by-type"
                    checked={useCountByType}
                    onChange={(e) => setUseCountByType(e.target.checked)}
                    className="rounded text-[#0F4C81] focus:ring-[#0F4C81] cursor-pointer"
                  />
                  <label htmlFor="use-count-by-type" className="text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    تخصيص عدد الأسئلة المطلوبة حسب نوعها
                  </label>
                </div>

                {useCountByType ? (
                  <div className="bg-blue-50/40 dark:bg-[#0F4C81]/5 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700 space-y-2">
                    <span className="text-[9.5px] font-bold text-[#0F4C81] dark:text-blue-300 block mb-1">حدد عدد الأسئلة المطلوبة لكل نوع:</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { key: 'mcq', label: 'اختيار من متعدد' },
                        { key: 'true_false', label: 'صح أو خطأ' },
                        { key: 'fill_blank', label: 'أكمل الفراغ' },
                        { key: 'matching', label: 'المزاوجة / التوصيل' },
                        { key: 'ordering', label: 'الترتيب' },
                        { key: 'essay', label: 'أسئلة مقالية' },
                        { key: 'verse_hadith', label: 'سؤال نص شرعي (آية/حديث)' }
                      ].map(item => {
                        const avail = availableCountByType[item.key] || 0;
                        const requested = typeCounts[item.key] || 0;
                        const exceeds = requested > avail;
                        return (
                          <div key={item.key} className="flex justify-between items-center text-[10.5px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-slate-650 dark:text-slate-300 font-medium truncate">{item.label}</span>
                              <span className={`text-[9px] font-mono ${avail === 0 ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                (المتوفر: {avail})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={avail}
                                value={requested}
                                onChange={(e) => {
                                  const val = Math.min(avail, Math.max(0, Number(e.target.value) || 0));
                                  setTypeCounts(prev => ({ ...prev, [item.key]: val }));
                                }}
                                className={`w-11 h-6 text-center font-bold bg-white dark:bg-slate-800 border rounded text-xs outline-none ${
                                  exceeds
                                    ? 'border-amber-400 text-amber-700 dark:text-amber-300'
                                    : 'border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white'
                                }`}
                              />
                              <span className="text-[9px] text-slate-400">سؤال</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(() => {
                      const requestedSum = (Object.values(typeCounts) as number[]).reduce((a, b) => a + b, 0);
                      return (
                        <div className="pt-2 border-t border-blue-105 dark:border-slate-700 text-[10px] font-bold text-[#2e7d32] bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded text-center space-y-0.5">
                          <div>مجموع الأسئلة المختارة والمدرجة بالورقة: {finalQuestions.length} من {requestedSum} سؤالاً</div>
                          {finalQuestions.length < requestedSum && (
                            <div className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold">
                              بعض الأنواع المختارة يتوفر منها عدد أقل في {semester} ضمن الدروس المحددة.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>العدد الإجمالي المطلوب لأسئلة الاختبار</span>
                        <span className="text-[#0F4C81] font-mono font-bold">{Math.min(autoQuestionsCount, autoEligiblePool.length)}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={Math.max(1, autoEligiblePool.length)}
                        value={Math.min(autoQuestionsCount, Math.max(1, autoEligiblePool.length))}
                        onChange={(e) => setAutoQuestionsCount(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0F4C81]"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                        الأسئلة المتوفرة بالفرع والأنواع والتصفية الحالية: <strong className="text-[#0F4C81] dark:text-blue-300 font-mono">{autoEligiblePool.length}</strong> سؤالاً (من أصل {semesterQuestions.length} في {semester})
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-750 p-2.5 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block mb-1 text-center">أوزان موازنة مستويات الصعوبة (٪)</span>
                      <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-semibold">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-1 rounded text-emerald-800 dark:text-emerald-400">
                          <span>سهل</span>
                          <input 
                            type="number" 
                            value={easyRatio} 
                            onChange={(e)=> {
                              const v = Number(e.target.value);
                              setEasyRatio(v);
                              setMediumRatio(100 - v - hardRatio);
                            }} 
                            className="w-full bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900 rounded text-center mt-1 text-xs text-slate-800 dark:text-white" 
                          />
                        </div>
                        <div className="bg-[#0F4C81]/5 p-1 rounded text-[#0F4C81] dark:text-blue-300">
                          <span>متوسط</span>
                          <input 
                            type="text" 
                            disabled 
                            value={mediumRatio} 
                            className="w-full bg-slate-100 dark:bg-slate-900 rounded text-center mt-1 text-xs font-bold text-slate-500 cursor-not-allowed" 
                          />
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-1 rounded text-amber-800 dark:text-amber-400">
                          <span>صعب</span>
                          <input 
                            type="number" 
                            value={hardRatio} 
                            onChange={(e)=> {
                              const v = Number(e.target.value);
                              setHardRatio(v);
                              setMediumRatio(100 - easyRatio - v);
                            }} 
                            className="w-full bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-905 rounded text-center mt-1 text-xs text-slate-800 dark:text-white" 
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={runAutoGeneration}
                  className="w-full py-2 bg-[#2E7D32] hover:bg-[#205722] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  إعادة خلط وتوليد الأسئلة المشروطة
                </button>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
                <p>💡 <strong>التوزيع اليدوي:</strong></p>
                <p>يمكنك تصفح واختيار الأسئلة التي تفضلها بنفسك من العمود الأوسط ليتم إضافتها إلى النموذج النهائي للاختبار.</p>
              </div>
            )}
          </div>

          {/* تحديد نطاق ومحتوى الاختبار (الصفحات والدروس المطلوبة) */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center gap-1.5 font-sans">
              <Layers size={14} className="text-[#0F4C81]" />
              تحديد نطاق الاختبار (الصفحات والدروس)
            </h3>

            {/* Page range configuration block */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-750/40 rounded-xl border border-slate-150 dark:border-slate-700 space-y-2 font-sans">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="page-range-active"
                  checked={pageRangeActive}
                  onChange={(e) => setPageRangeActive(e.target.checked)}
                  className="rounded text-[#0F4C81] focus:ring-[#0F4C81] cursor-pointer"
                />
                <label htmlFor="page-range-active" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  تحديد نطاق الصفحات (من صفحة .. إلى صفحة ..)
                </label>
              </div>

              {pageRangeActive && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-500 mb-1">من صفحة:</label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={pageRangeStart}
                      onChange={(e) => setPageRangeStart(Math.max(1, Number(e.target.value)))}
                      className="w-full h-8 px-2 text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-650 rounded-lg outline-none text-[#0F4C81] dark:text-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-500 mb-1">إلى صفحة:</label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={pageRangeEnd}
                      onChange={(e) => setPageRangeEnd(Math.max(pageRangeStart, Number(e.target.value)))}
                      className="w-full h-8 px-2 text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-650 rounded-lg outline-none text-[#0F4C81] dark:text-blue-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
              {(Object.keys(subjectMetadata) as SubjectBranch[]).map(sub => {
                const metadata = subjectMetadata[sub];
                const selectedLessons = selectedLessonsBySubject[sub] || [];
                const isExpanded = expandedSubject === sub;

                // count of active questions in this branch under current lesson filters
                const totalQuestionsInSub = semesterQuestions.filter(q => q.subject === sub).length;
                const activeQuestionsInSub = filteredQuestions.filter(q => q.subject === sub).length;

                return (
                  <div key={sub} className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden transition-all bg-slate-50/50 dark:bg-slate-850/40">
                    {/* Header Row */}
                    <div 
                      className="p-2 flex items-center justify-between cursor-pointer hover:bg-slate-105 dark:hover:bg-slate-850 transition"
                      onClick={() => setExpandedSubject(isExpanded ? null : sub)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[11px] text-slate-800 dark:text-white font-sans">{sub}</span>
                        <span className="text-[9px] text-slate-450 font-medium font-mono">
                          ({activeQuestionsInSub} من {totalQuestionsInSub} سؤال)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[8.5px] bg-[#0F4C81]/10 text-[#0F4C81] dark:bg-[#0F4C81]/25 dark:text-blue-300 px-1.5 py-0.5 rounded font-extrabold font-sans">
                          {selectedLessons.length === metadata.lessons.length ? (
                            'شامل كل الدروس'
                          ) : selectedLessons.length === 0 ? (
                            'مستبعد'
                          ) : (
                            `محدد ${selectedLessons.length} من ${metadata.lessons.length} درس`
                          )}
                        </span>
                        <span>
                          {isExpanded ? <ArrowUp size={11} className="text-slate-400" /> : <ArrowDown size={11} className="text-slate-400" />}
                        </span>
                      </div>
                    </div>

                    {/* Content Panel if expanded */}
                    {isExpanded && (
                      <div className="p-2.5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2.5 text-right">
                        
                        {/* Lesson / Topic Selection Section (تحديد الدروس المطلوبة) */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              اختر أسماء الدروس المقررة في الاختبار:
                            </span>
                            <div className="flex gap-2 text-[9px] font-bold">
                              <button
                                type="button"
                                onClick={() => handleSelectAllLessons(sub, metadata.lessons.map(l => l.name))}
                                className="text-[#0F4C81] dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                تحديد كل الدروس ({metadata.lessons.length})
                              </button>
                              <span className="text-slate-200">|</span>
                              <button
                                type="button"
                                onClick={() => handleDeselectAllLessons(sub)}
                                className="text-[#D32F2F] hover:underline cursor-pointer"
                              >
                                إلغاء تحديد الكل
                              </button>
                            </div>
                          </div>

                          {metadata.lessons.length === 0 ? (
                            <p className="text-[9px] text-slate-400 py-2">لا توجد دروس مسجلة في هذا الفرع.</p>
                          ) : (
                            <div className="space-y-1.5 pt-0.5 max-h-[280px] overflow-y-auto pr-1">
                              {metadata.lessons.map(lessonObj => {
                                const isLessonSelected = selectedLessons.includes(lessonObj.name);
                                return (
                                  <div 
                                    key={lessonObj.name}
                                    onClick={() => handleToggleLesson(sub, lessonObj.name)}
                                    className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer select-none text-[10.5px] ${
                                      isLessonSelected
                                        ? 'bg-blue-50/70 dark:bg-[#0F4C81]/15 border-[#0F4C81] text-slate-900 dark:text-white font-bold shadow-2xs'
                                        : 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className="shrink-0 text-[#0F4C81]">
                                        {isLessonSelected ? (
                                          <CheckSquare size={15} className="fill-[#0F4C81] text-white" />
                                        ) : (
                                          <Square size={15} className="text-slate-300 dark:text-slate-600" />
                                        )}
                                      </div>
                                      <span className="leading-normal flex-1 text-right text-slate-800 dark:text-slate-200 font-medium">
                                        {lessonObj.name}
                                      </span>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1.5 text-[9.5px]">
                                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                        {lessonObj.count} أسئلة
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Column: Selection List depending on Mode */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-50 dark:border-slate-700 pb-2 mb-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                  {selectionMode === 'manual' ? `تحديد الأسئلة يدوياً (المحدد: ${selectedIds.length})` : `مخرجات التوليد والتوزيع (${finalQuestions.length} فقرة)`}
                </h3>
                {selectionMode === 'manual' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const visibleIds = filteredQuestions
                          .filter(q => manualSubjectFilter === 'all' || q.subject === manualSubjectFilter)
                          .map(q => q.id);
                        setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                      }}
                      className="text-[10px] font-bold text-[#0F4C81] dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      تحديد الظاهر ({filteredQuestions.filter(q => manualSubjectFilter === 'all' || q.subject === manualSubjectFilter).length})
                    </button>
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        إلغاء التحديد
                      </button>
                    )}
                    <select
                      value={manualSubjectFilter}
                      onChange={(e) => setManualSubjectFilter(e.target.value as 'all' | SubjectBranch)}
                      className="bg-slate-55 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 outline-none"
                    >
                      <option value="all">كل الفروع</option>
                      <option value="توحيد">توحيد</option>
                      <option value="تفسير">تفسير</option>
                      <option value="حديث">حديث</option>
                      <option value="فقه">فقه</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Manual selection UI list of all questions with checkboxes */}
              {selectionMode === 'manual' ? (
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {filteredQuestions
                    .filter(q => manualSubjectFilter === 'all' || q.subject === manualSubjectFilter)
                    .map(q => {
                      const isSelected = selectedIds.includes(q.id);
                      const assignedQ = finalQuestions.find(curr => curr.id === q.id);
                      return (
                        <div 
                          key={q.id} 
                          onClick={() => toggleSelection(q.id)}
                          className={`p-2.5 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer select-none ${
                            isSelected 
                              ? 'bg-blue-50/75 dark:bg-[#0F4C81]/10 border-[#0F4C81] dark:border-[#0F4C81] shadow-xs' 
                              : 'bg-white dark:bg-slate-800 border-slate-150 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="mt-0.5 text-[#0F4C81] shrink-0">
                            {isSelected ? (
                              <CheckSquare size={15} className="fill-[#0F4C81] text-white" />
                            ) : (
                              <Square size={15} className="text-slate-300 dark:text-slate-650" />
                            )}
                          </div>
                          <div className="space-y-1 w-full font-sans">
                            <div className="flex items-center gap-1 flex-wrap w-full">
                              <span className="text-[9px] font-bold text-slate-500">[{q.subject}]</span>
                              <span className="text-[9px] font-medium text-slate-400">({getTypeLabel(q.type)})</span>
                              <span className={`text-[8px] px-1 py-0.2 rounded font-semibold ${
                                q.difficulty === 'سهل' ? 'bg-emerald-100 dark:bg-emerald-955 text-emerald-800 dark:text-emerald-400' :
                                q.difficulty === 'متوسط' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400' :
                                'bg-red-50 dark:bg-red-955 text-red-700 dark:text-red-400'
                              }`}>{q.difficulty}</span>
                              
                              {isSelected ? (
                                <div className="mr-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[9px] text-[#0F4C81] dark:text-blue-300 font-bold">الدرجة:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={assignedQ ? assignedQ.points : q.points}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                                      handleUpdateQuestionPoints(q.id, val);
                                    }}
                                    className="w-11 h-6 text-center text-[10px] font-mono font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded outline-none text-[#0F4C81] dark:text-white"
                                  />
                                </div>
                              ) : (
                                <span className="text-[9px] font-mono text-slate-500 mr-auto">الدرجة: {q.points}</span>
                              )}
                            </div>
                            <h4 className="text-slate-800 dark:text-white font-bold text-xs leading-relaxed text-right">{q.text}</h4>
                            {q.type === 'mcq' && q.options && (
                              <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                                {q.options.map((opt, oIdx) => {
                                  const isCorr = isOptionCorrect(q, opt, oIdx);
                                  return (
                                    <div key={oIdx} className={`p-1 rounded flex items-center justify-between gap-1 ${
                                      isCorr ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700' : 'text-slate-600 dark:text-slate-400'
                                    }`}>
                                      <span className="truncate">{['أ', 'ب', 'ج', 'د'][oIdx]}) {opt}</span>
                                      {isCorr && <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-bold shrink-0">✓ الصحيح</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* Auto generated question items (with custom control to reorder / remove) */
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {finalQuestions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      الرجاء اختيار دروس أو أنواع أسئلة متوفرة في بنك الأسئلة ليتم توليدها هنا.
                    </div>
                  ) : (
                    finalQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-slate-50 dark:bg-slate-750/30 p-2.5 rounded-lg border border-slate-150 dark:border-slate-700 flex justify-between gap-4 items-start font-sans">
                        <div className="space-y-1 flex-1 text-right">
                          <div className="flex gap-1.5 items-center flex-wrap w-full">
                            <span className="bg-[#0F4C81]/10 dark:bg-[#0F4C81]/20 text-[#0F4C81] dark:text-[#6cb1ec] text-[9px] px-1.5 py-0.5 rounded font-bold">
                              الفقرة {idx + 1}{idx === finalQuestions.length - 1 ? ' (الأخيرة)' : ''}
                            </span>
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-medium">{q.subject}</span>
                            <span className="text-slate-400 text-[10px]">({getTypeLabel(q.type)})</span>
                            <span className="text-slate-400 text-[10px]">({q.difficulty})</span>

                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded-md text-[10px] mr-auto">
                              <span className="text-slate-500 dark:text-slate-400 font-bold">الدرجة:</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={q.points}
                                onChange={(e) => handleUpdateQuestionPoints(q.id, Number(e.target.value))}
                                className="w-10 h-5 text-center text-[10px] font-mono font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-600 rounded outline-none text-[#0F4C81] dark:text-blue-450"
                              />
                            </div>
                          </div>
                          <h4 className="text-slate-800 dark:text-white font-bold text-xs leading-relaxed">{q.text}</h4>
                          {q.type === 'mcq' && q.options && (
                            <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                              {q.options.map((opt, oIdx) => {
                                const isCorr = isOptionCorrect(q, opt, oIdx);
                                return (
                                  <div key={oIdx} className={`p-1 rounded flex items-center justify-between gap-1 ${
                                    isCorr ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700' : 'text-slate-600 dark:text-slate-400'
                                  }`}>
                                    <span className="truncate">{['أ', 'ب', 'ج', 'د'][oIdx]}) {opt}</span>
                                    {isCorr && <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-bold shrink-0">✓ الصحيح</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Controls: Up, Down, Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 text-slate-450 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="نقل لأعلى"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === finalQuestions.length - 1}
                            className="p-1 text-slate-450 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="نقل لأسفل"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="p-1 text-[#D32F2F] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-[11px] cursor-pointer"
                            title="استبعاد السؤال"
                          >
                            <span>استبعاد</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Bottom saving stats bar */}
            <div className="border-t border-slate-150 dark:border-slate-700 pt-3 mt-4 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-350">
                <div className="flex items-center gap-1.5">
                  <Layers size={13} className="text-slate-400" />
                  <span>الأسئلة المختارة للاختبار: <strong className="text-slate-800 dark:text-white font-bold">{finalQuestions.length}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award size={13} className="text-[#2E7D32]" />
                  <span>مجموع الدرجات الإجمالي: <strong className="text-[#2E7D32] dark:text-emerald-400 font-bold">{calculateTotalPoints()} درجة</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white font-bold py-1.5 px-4 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
              >
                <Save size={13} />
                حفظ وإصدار لوحة الاختبار
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
