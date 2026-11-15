import React, { useState, useMemo } from 'react';
import { Question, SubjectBranch, QuestionType, DifficultyLevel, MatchingPair } from '../types';
import { Search, Plus, SlidersHorizontal, Trash2, Edit3, BookOpen, AlertCircle, Sparkles, Check, X, ArrowUp, Link2, ClipboardPaste, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import { isOptionCorrect, getCorrectIndex, resolveCorrectAnswer } from '../utils/questionUtils';

interface QuestionBankViewProps {
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onClearAllQuestions?: () => void;
  onReplaceAllQuestions?: (newQuestions: Question[]) => void;
  onBulkAddQuestions?: (newQuestions: Question[]) => void;
  activeSemester?: string;
}

export default function QuestionBankView({ 
  questions, 
  onAddQuestion, 
  onUpdateQuestion, 
  onDeleteQuestion,
  onClearAllQuestions,
  onReplaceAllQuestions,
  onBulkAddQuestions,
  activeSemester
}: QuestionBankViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectBranch | 'all'>('all');
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Bulk Import & Clear All states
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkSubject, setBulkSubject] = useState<SubjectBranch>('توحيد');
  const [bulkSemester, setBulkSemester] = useState<string>(activeSemester || 'الفصل الدراسي الثاني');
  const [bulkUnit, setBulkUnit] = useState('');
  const [bulkMode, setBulkMode] = useState<'replace' | 'append'>('replace');
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Form Fields
  const [formSubject, setFormSubject] = useState<SubjectBranch>('توحيد');
  const [formSemester, setFormSemester] = useState<string>(activeSemester || 'الفصل الدراسي الثاني');
  const [formUnit, setFormUnit] = useState('');
  const [formLesson, setFormLesson] = useState('');
  const [formOutcome, setFormOutcome] = useState('');
  const [formType, setFormType] = useState<QuestionType>('mcq');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('متوسط');
  const [formPoints, setFormPoints] = useState(2);
  const [formText, setFormText] = useState('');
  const [formCorrectAnswer, setFormCorrectAnswer] = useState('');
  
  // MCQ options
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState<number>(0);

  // Matching pair list
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([
    { id: '1', left: '', right: '' },
    { id: '2', left: '', right: '' },
    { id: '3', left: '', right: '' }
  ]);

  // Ordering list
  const [orderingItems, setOrderingItems] = useState<string[]>(['', '', '', '']);

  // Error/validation messages
  const [validationError, setValidationError] = useState('');

  // Extract unique units
  const uniqueUnits = Array.from(new Set(questions.map(q => q.unit))).filter(Boolean);

  // Filtered list
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.unit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    const matchesType = selectedType === 'all' || q.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    const matchesUnit = selectedUnit === 'all' || q.unit === selectedUnit;
    const matchesSemester = selectedSemester === 'all' || (q.semester || 'الفصل الدراسي الأول') === selectedSemester;
    return matchesSearch && matchesSubject && matchesType && matchesDifficulty && matchesUnit && matchesSemester;
  });

  const resetForm = () => {
    setFormSubject('توحيد');
    setFormSemester(activeSemester || 'الفصل الدراسي الثاني');
    setFormUnit('');
    setFormLesson('');
    setFormOutcome('');
    setFormType('mcq');
    setFormDifficulty('متوسط');
    setFormPoints(2);
    setFormText('');
    setFormCorrectAnswer('');
    setMcqOptions(['', '', '', '']);
    setMcqCorrectIndex(0);
    setMatchingPairs([
      { id: '1', left: '', right: '' },
      { id: '2', left: '', right: '' },
      { id: '3', left: '', right: '' }
    ]);
    setOrderingItems(['', '', '', '']);
    setValidationError('');
  };

  const handleOpenEdit = (q: Question) => {
    resetForm();
    setEditingQuestion(q);
    setFormSubject(q.subject);
    setFormSemester(q.semester || 'الفصل الدراسي الأول');
    setFormUnit(q.unit);
    setFormLesson(q.lesson);
    setFormOutcome(q.learningOutcome);
    setFormType(q.type);
    setFormDifficulty(q.difficulty);
    setFormPoints(q.points);
    setFormText(q.text);
    setFormCorrectAnswer(q.correctAnswer);

    if (q.type === 'mcq' && q.options) {
      setMcqOptions([...q.options]);
      const idx = getCorrectIndex(q);
      setMcqCorrectIndex(idx >= 0 ? idx : 0);
    } else if (q.type === 'matching' && q.matchingPairs) {
      setMatchingPairs([...q.matchingPairs]);
    } else if (q.type === 'ordering' && q.orderedItems) {
      setOrderingItems([...q.orderedItems]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validations
    if (!formUnit.trim() || !formLesson.trim() || !formText.trim()) {
      setValidationError('الرجاء تعبئة الحقول الأساسية: الوحدة، الدرس، ونص السؤال.');
      return;
    }

    let finalCorrectAnswer = formCorrectAnswer;
    let finalOptions: string[] | undefined;
    let finalMatching: MatchingPair[] | undefined;
    let finalOrdering: string[] | undefined;

    if (formType === 'mcq') {
      const validOptions = mcqOptions.filter(opt => opt.trim() !== '');
      if (validOptions.length < 4) {
        setValidationError('يجب تعبئة جميع الخيارات الأربعة لسؤال الاختيار من متعدد.');
        return;
      }
      finalOptions = mcqOptions;
      finalCorrectAnswer = mcqOptions[mcqCorrectIndex];
    } else if (formType === 'true_false') {
      if (finalCorrectAnswer !== 'صح' && finalCorrectAnswer !== 'خطأ') {
        finalCorrectAnswer = 'صح'; // default fallback
      }
    } else if (formType === 'matching') {
      const filledMatching = matchingPairs.filter(p => p.left.trim() && p.right.trim());
      if (filledMatching.length < 2) {
        setValidationError('الرجاء إدخال زوجين متطابقين على الأقل للمزاوجة.');
        return;
      }
      finalMatching = filledMatching;
      finalCorrectAnswer = 'مزاوجة الخيارات المتوافقة';
    } else if (formType === 'ordering') {
      const filledOrdering = orderingItems.filter(item => item.trim() !== '');
      if (filledOrdering.length < 3) {
        setValidationError('الرجاء إدخال ثلاثة عبارات على الأقل لرسم الترتيب الصحيح.');
        return;
      }
      finalOrdering = filledOrdering;
      finalCorrectAnswer = filledOrdering.join(' -> ');
    } else {
      if (!finalCorrectAnswer.trim()) {
        setValidationError('الرجاء تحديد إجابة نموذجية أو الكلمة المفقودة.');
        return;
      }
    }

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      subject: formSubject,
      semester: formSemester,
      unit: formUnit.trim(),
      lesson: formLesson.trim(),
      learningOutcome: formOutcome.trim() || 'فهم واستيعاب ناتج التعلم للدرس',
      type: formType,
      difficulty: formDifficulty,
      points: Number(formPoints) || 2,
      text: formText.trim(),
      options: finalOptions,
      correctAnswer: finalCorrectAnswer,
      matchingPairs: finalMatching,
      orderedItems: finalOrdering
    };

    if (editingQuestion) {
      onUpdateQuestion(questionData);
      setEditingQuestion(null);
    } else {
      onAddQuestion(questionData);
      setIsAdding(false);
    }
    resetForm();
  };

  // Helper labels
  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'mcq': return 'اختيار من متعدد';
      case 'true_false': return 'صح أو خطأ';
      case 'fill_blank': return 'أكمل الفراغ';
      case 'matching': return 'المزاوجة / التوصيل';
      case 'ordering': return 'الترتيب';
      case 'essay': return 'سؤال مقالي';
      case 'verse_hadith': return 'سؤال آية أو حديث';
      default: return type;
    }
  };

  // Smart Bulk Questions Parser
  const parsedBulkQuestions = useMemo(() => {
    if (!bulkImportText.trim()) return [];
    
    // 1. Try parsing JSON
    try {
      const trimmed = bulkImportText.trim();
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
        return list.map((item: any, idx: number) => {
          const rawOpts = item.options || item.choices;
          const cleanOpts = Array.isArray(rawOpts) ? rawOpts.map((o: any) => String(o).trim()) : undefined;
          const detectedType = (item.type || (cleanOpts && cleanOpts.length ? 'mcq' : 'essay')) as QuestionType;
          const rawAns = item.correctAnswer || item.answer || '';
          const finalAns = (detectedType === 'mcq' && cleanOpts) 
            ? resolveCorrectAnswer(cleanOpts, String(rawAns))
            : (String(rawAns).trim() || (detectedType === 'true_false' ? 'صح' : 'إجابة نموذجية'));

          return {
            id: item.id || `q-imported-${Date.now()}-${idx + 1}`,
            subject: (['توحيد', 'تفسير', 'حديث', 'فقه'].includes(item.subject) ? item.subject : bulkSubject) as SubjectBranch,
            semester: item.semester || bulkSemester,
            unit: item.unit || bulkUnit || 'الوحدة المعتمدة',
            lesson: item.lesson || 'الدرس الأول',
            learningOutcome: item.learningOutcome || 'ناتج تعلم معتمد',
            type: detectedType,
            difficulty: (item.difficulty || 'متوسط') as DifficultyLevel,
            points: Number(item.points) || (detectedType === 'true_false' ? 1 : 2),
            text: (item.text || item.question || '').trim(),
            options: cleanOpts,
            correctAnswer: finalAns,
            matchingPairs: item.matchingPairs,
            orderedItems: item.orderedItems
          };
        }).filter((q: Question) => q.text && q.text.length > 0);
      }
    } catch {
      // Fall through to plain text parsing
    }

    // 2. Plain Text / Copy-Paste format parser
    const lines = bulkImportText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const result: Question[] = [];
    let currentSubject: SubjectBranch = bulkSubject;
    let currentUnit: string = bulkUnit.trim() || 'الوحدة المعتمدة';
    let currentLesson: string = 'الدرس الأول';
    let currentText = '';
    let currentOptions: string[] = [];
    let currentAnswer = '';
    let markedOptionAnswer = '';
    let currentType: QuestionType = 'mcq';

    const pushCurrent = () => {
      if (currentText.trim()) {
        const options = currentOptions.length > 0 ? currentOptions : undefined;
        let detectedType: QuestionType = currentType;
        if (options && options.length >= 2) {
          detectedType = 'mcq';
        } else if (currentAnswer === 'صح' || currentAnswer === 'خطأ' || currentText.includes('صح أو خطأ') || currentText.includes('ضع علامة')) {
          detectedType = 'true_false';
        } else if (currentText.includes('الفراغ') || currentText.includes('_____')) {
          detectedType = 'fill_blank';
        } else if (!options) {
          detectedType = 'essay';
        }

        let resolvedAns = currentAnswer.trim();
        if (detectedType === 'mcq' && options) {
          const rawToResolve = resolvedAns || markedOptionAnswer || '';
          resolvedAns = resolveCorrectAnswer(options, rawToResolve);
        } else if (detectedType === 'true_false') {
          if (resolvedAns !== 'صح' && resolvedAns !== 'خطأ') {
            resolvedAns = currentText.includes('خطأ') ? 'خطأ' : 'صح';
          }
        } else if (!resolvedAns) {
          resolvedAns = 'إجابة نموذجية';
        }

        result.push({
          id: `q-pasted-${Date.now()}-${result.length + 1}`,
          subject: currentSubject,
          semester: bulkSemester,
          unit: currentUnit,
          lesson: currentLesson,
          learningOutcome: 'فهم واستيعاب المفاهيم والمفردات الشرعية',
          type: detectedType,
          difficulty: 'متوسط',
          points: detectedType === 'true_false' ? 1 : (detectedType === 'matching' ? 3 : 2),
          text: currentText.trim(),
          options: options,
          correctAnswer: resolvedAns
        });
      }
      currentText = '';
      currentOptions = [];
      currentAnswer = '';
      markedOptionAnswer = '';
      currentType = 'mcq';
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Check subject header
      if (/^((الفرع|المادة|مادة|فرع):?\s*)?(توحيد|التوحيد)$/i.test(line)) {
        currentSubject = 'توحيد';
        continue;
      }
      if (/^((الفرع|المادة|مادة|فرع):?\s*)?(تفسير|التفسير)$/i.test(line)) {
        currentSubject = 'تفسير';
        continue;
      }
      if (/^((الفرع|المادة|مادة|فرع):?\s*)?(حديث|الحديث)$/i.test(line)) {
        currentSubject = 'حديث';
        continue;
      }
      if (/^((الفرع|المادة|مادة|فرع):?\s*)?(فقه|الفقه)$/i.test(line)) {
        currentSubject = 'فقه';
        continue;
      }

      // Check unit / lesson header
      if (/^(الوحدة|وحدة|الفصل|فصل|باب|القسم):/i.test(line)) {
        pushCurrent();
        currentUnit = line.replace(/^(الوحدة|وحدة|الفصل|فصل|باب|القسم):\s*/i, '').trim();
        continue;
      }
      if (/^(الدرس|درس):/i.test(line)) {
        currentLesson = line.replace(/^(الدرس|درس):\s*/i, '').trim();
        continue;
      }

      // Check explicit answer: الإجابة: ... or الجواب: ...
      const answerMatch = line.match(/^(?:ال(?:إجابة|جواب|حل)|صحيح|الصح|correct\s*answer)[:\s]+(.+)/i);
      if (answerMatch) {
        currentAnswer = answerMatch[1].trim();
        continue;
      }

      // Check if line contains multiple options horizontally (e.g., أ) ... ب) ... ج) ... د) ...)
      const multiOptionSplit = line.split(/(?=[أ-دabcdABCD1-4][\)\-\.])/g).map(s => s.trim()).filter(s => s.length > 0);
      if (multiOptionSplit.length >= 2 && currentText) {
        for (const subOpt of multiOptionSplit) {
          const m = subOpt.match(/^([أ-دabcdABCD1-4])[\)\-\.]\s*(.+)/);
          if (m) {
            let optText = m[2].trim();
            if (/[\*✓]|(?:\(صحيح\)|\(صح\))/i.test(optText)) {
              optText = optText.replace(/[\*✓]|(?:\(صحيح\)|\(صح\))/gi, '').trim();
              markedOptionAnswer = optText;
            }
            currentOptions.push(optText);
          }
        }
        continue;
      }

      // Check standard single option: أ) أو 1- أو [أ] أو (أ)
      const optionMatch = line.match(/^[\(\[]?([أ-دabcdABCD]|[1-4])[\)\]\.\-]\s*(.+)/);
      const isBulletOption = /^[-•*]\s*(.+)/.test(line);

      // Check new question prefix: س1: أو 1. أو 1-
      const questionStartMatch = line.match(/^(س\s*\d*[:\.\-]?|\d+[\.\-\)]|\(\d+\))\s*(.+)/);

      if (questionStartMatch && (!optionMatch || questionStartMatch[2].length > 15)) {
        pushCurrent();
        currentText = questionStartMatch[2].trim();
        continue;
      }

      if (optionMatch && currentText) {
        let optText = optionMatch[2].trim();
        // Check if marked with asterisk or checkmark: e.g. "خيار *" or "* خيار"
        if (/[\*✓]|(?:\(صحيح\)|\(صح\))/i.test(optText) || line.startsWith('*')) {
          optText = optText.replace(/[\*✓]|(?:\(صحيح\)|\(صح\))/gi, '').trim();
          markedOptionAnswer = optText;
        }
        currentOptions.push(optText);
        continue;
      }

      if (isBulletOption && currentText) {
        let bulletText = line.replace(/^[-•*]\s*/, '').trim();
        if (/[\*✓]|(?:\(صحيح\)|\(صح\))/i.test(bulletText)) {
          bulletText = bulletText.replace(/[\*✓]|(?:\(صحيح\)|\(صح\))/gi, '').trim();
          markedOptionAnswer = bulletText;
        }
        currentOptions.push(bulletText);
        continue;
      }

      // If no question active, start one
      if (!currentText) {
        currentText = line;
      } else {
        // If line is not an answer or option, append to question text
        currentText += ' ' + line;
      }
    }
    pushCurrent();

    return result;
  }, [bulkImportText, bulkSubject, bulkSemester, bulkUnit]);

  const handleApplyBulkImport = () => {
    if (parsedBulkQuestions.length === 0) return;
    if (bulkMode === 'replace') {
      if (onReplaceAllQuestions) {
        onReplaceAllQuestions(parsedBulkQuestions);
      } else {
        parsedBulkQuestions.forEach(q => onAddQuestion(q));
      }
    } else {
      if (onBulkAddQuestions) {
        onBulkAddQuestions(parsedBulkQuestions);
      } else {
        parsedBulkQuestions.forEach(q => onAddQuestion(q));
      }
    }
    setIsBulkImportOpen(false);
    setBulkImportText('');
  };

  return (
    <div id="questions-bank-module" className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة بنك الأسئلة</h2>
          <p className="text-slate-500 mt-1">عرض وتنظيم بنك الأسئلة للدراسات الإسلامية للصف الثاني المتوسط.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onClearAllQuestions && (
            <button
              onClick={() => setShowClearAllConfirm(true)}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
              title="حذف جميع الأسئلة والتقسيمات السابقة"
            >
              <Trash2 size={15} />
              حذف كافة الأسئلة والتقسيمات
            </button>
          )}

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="لصق واعتماد أسئلة وتقسيمات جديدة دفعة واحدة"
          >
            <ClipboardPaste size={15} />
            لصق واعتماد أسئلة جديدة
          </button>

          <button
            id="btn-add-question-trigger"
            onClick={() => { resetForm(); setIsAdding(true); setEditingQuestion(null); }}
            className="flex items-center gap-1.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus size={15} />
            إضافة سؤال يدوي
          </button>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-red-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-800">تأكيد حذف جميع الأسئلة والتقسيمات؟</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                سيتم مسح كافة الأسئلة والتقسيمات والوحدات الحالية ({questions.length} سؤال) بالكامل من البنك، لتتمكن من إدخال أو اعتماد الأسئلة والتقسيمات الجديدة النظيفة.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onClearAllQuestions) onClearAllQuestions();
                  setShowClearAllConfirm(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                نعم، احذف الكل وتفريغ البنك
              </button>
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Paste and Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-100 flex flex-col my-6 max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ClipboardPaste size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">لصق واعتماد أسئلة وتقسيمات جديدة</h3>
                  <p className="text-[11px] text-slate-500">ألصق نص الأسئلة أو التقسيمات أو ملف JSON للاعتماد الفوري</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkImportOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Instructions */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Sparkles size={14} className="text-blue-600" />
                  محلل ذكي يدعم مختلف التنسيقات العربية:
                </p>
                <p className="text-[11px] text-blue-800">
                  يمكنك لصق الأسئلة مباشرة كما هي (مثال: 1. السؤال ... أ) ... ب) ... الإجابة: ...) أو تقسيمات الوحدات (مثل "الوحدة: التوحيد") أو كود JSON.
                </p>
              </div>

              {/* Mode choice */}
              <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="replace"
                    checked={bulkMode === 'replace'}
                    onChange={() => setBulkMode('replace')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>حذف الأسئلة السابقة واعتماد هذه الأسئلة فقط (تحديث شامل)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="append"
                    checked={bulkMode === 'append'}
                    onChange={() => setBulkMode('append')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>إضافة هذه الأسئلة إلى البنك الحالي</span>
                </label>
              </div>

              {/* Default metadata settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">الفرع الافتراضي:</label>
                  <select
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value as SubjectBranch)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium outline-none"
                  >
                    <option value="توحيد">توحيد</option>
                    <option value="تفسير">تفسير</option>
                    <option value="حديث">حديث</option>
                    <option value="فقه">فقه</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">الفصل الدراسي:</label>
                  <select
                    value={bulkSemester}
                    onChange={(e) => setBulkSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium outline-none"
                  >
                    <option value="الفصل الدراسي الأول">الفصل الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الثاني</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">اسم الوحدة الافتراضي:</label>
                  <input
                    type="text"
                    value={bulkUnit}
                    onChange={(e) => setBulkUnit(e.target.value)}
                    placeholder="مثال: الوحدة الأولى / المنهج الجديد"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium outline-none"
                  />
                </div>
              </div>

              {/* Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">نص الأسئلة والتقسيمات:</label>
                  {parsedBulkQuestions.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ تم التعرف على {parsedBulkQuestions.length} سؤال جاهزة للاعتماد
                    </span>
                  )}
                </div>
                <textarea
                  rows={9}
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="ألصق النص هنا...
مثال:
الوحدة: استحقاق الله للعبادة
1. لمن تصرف العبادة؟
أ) لله وحده
ب) للأنبياء
ج) للملائكة
د) للصالحين
الإجابة: لله وحده"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-sans leading-relaxed focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              {/* Live Preview of parsed questions */}
              {parsedBulkQuestions.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold text-slate-700">معاينة أولية للأسئلة المستخرجة ({parsedBulkQuestions.length}):</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    {parsedBulkQuestions.slice(0, 5).map((q, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold mb-0.5">
                          <span className="bg-blue-50 text-[#0F4C81] px-1.5 py-0.5 rounded font-bold">{q.subject}</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{q.unit}</span>
                          <span className="text-slate-400">({q.type})</span>
                        </div>
                        <p className="font-bold text-slate-800">{q.text}</p>
                        {q.options && (
                          <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                            {q.options.map((opt, oIdx) => {
                              const isCorr = isOptionCorrect(q, opt, oIdx);
                              return (
                                <div key={oIdx} className={`truncate p-1 rounded flex items-center gap-1 ${isCorr ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' : 'text-slate-600'}`}>
                                  <span>{isCorr ? '✓' : '•'}</span>
                                  <span className="truncate">{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="text-[10px] text-emerald-700 mt-1 font-bold flex items-center gap-1">
                          <span>الإجابة الصحيحة المحددة:</span>
                          <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-extrabold">{q.correctAnswer}</span>
                        </div>
                      </div>
                    ))}
                    {parsedBulkQuestions.length > 5 && (
                      <div className="text-center text-[10px] text-slate-500 font-bold py-1">
                        + {parsedBulkQuestions.length - 5} سؤال إضافي سيتم اعتماده...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={parsedBulkQuestions.length === 0}
                onClick={handleApplyBulkImport}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition cursor-pointer ${
                  parsedBulkQuestions.length === 0 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Check size={16} />
                اعتماد وحفظ الأسئلة في البنك ({parsedBulkQuestions.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adding/Editing Overlay Dialog */}
      {(isAdding || editingQuestion) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col my-8 max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد في الدراسات الإسلامية'}
              </h3>
              <button 
                onClick={() => { setIsAdding(false); setEditingQuestion(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
              {validationError && (
                <div className="bg-red-50 text-[#D32F2F] p-4 rounded-xl flex items-start gap-2.5 text-sm border border-red-100">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">الفرع الدراسي</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as SubjectBranch)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
                  >
                    <option value="توحيد">التوحيد</option>
                    <option value="تفسير">التفسير</option>
                    <option value="حديث">الحديث الشريف</option>
                    <option value="فقه">الفقه الإسلامي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">الفصل الدراسي</label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
                  >
                    <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">الوحدة الدراسية</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الإيمان بالكتب السماوية"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">الدرس</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: دلالات وجوب الإيمان بالرسل"
                    value={formLesson}
                    onChange={(e) => setFormLesson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">ناتج التعلم المستهدف (اختياري)</label>
                  <input
                    type="text"
                    placeholder="بيان أهم أركان كذا وكذا..."
                    value={formOutcome}
                    onChange={(e) => setFormOutcome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">نوع السؤال</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      setFormType(newType);
                      // Default Points
                      if (newType === 'true_false') setFormPoints(1);
                      else if (newType === 'matching' || newType === 'ordering') setFormPoints(3);
                      else setFormPoints(2);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
                  >
                    <option value="mcq">اختيار من متعدد (4 خيارات)</option>
                    <option value="true_false">صح أو خطأ</option>
                    <option value="fill_blank">أكمل الفراغ</option>
                    <option value="matching">المزاوجة / التوصيل</option>
                    <option value="ordering">الترتيب</option>
                    <option value="essay">سؤال مقالي</option>
                    <option value="verse_hadith">سؤال آية أو حديث شريف</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">درجة السؤال</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formPoints}
                      onChange={(e) => setFormPoints(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">مستوى الصعوبة</label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all"
                    >
                      <option value="سهل">سهل</option>
                      <option value="متوسط">متوسط</option>
                      <option value="صعب">صعب</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Text Area for Question wording */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">نص السؤال</label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب صيغة السؤال هنا بوضوح..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all font-sans"
                />
              </div>

              {/* Conditional rendering depending on Type */}
              {formType === 'mcq' && (
                <div className="space-y-3 bg-[#0F4C81]/5 p-4 rounded-xl border border-[#0F4C81]/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-[#0F4C81]">خيارات سؤال الاختيار من متعدد الإلزامية (4 خيارات):</span>
                    <span className="text-[11px] text-slate-500">اختر الزر الدائري لتحديد الإجابة الصحيحة</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mcqOptions.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-200">
                        <input
                          type="radio"
                          name="mcq-correct-answer"
                          checked={mcqCorrectIndex === idx}
                          onChange={() => setMcqCorrectIndex(idx)}
                          className="w-4 h-4 text-[#0F4C81] focus:ring-[#0F4C81]"
                        />
                        <input
                          type="text"
                          required
                          placeholder={`خيار ${idx + 1}`}
                          value={option}
                          onChange={(e) => {
                            const updated = [...mcqOptions];
                            updated[idx] = e.target.value;
                            setMcqOptions(updated);
                          }}
                          className="w-full border-b border-transparent focus:border-[#0F4C81] text-xs py-1 outline-none text-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formType === 'true_false' && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col gap-2">
                  <span className="text-xs font-bold text-emerald-800">حدد الإجابة الصحيحة:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200">
                      <input
                        type="radio"
                        name="tf-answer"
                        value="صح"
                        checked={formCorrectAnswer === 'صح'}
                        onChange={() => setFormCorrectAnswer('صح')}
                        className="text-[#2E7D32]"
                      />
                      <span className="text-sm font-bold text-emerald-800">صح</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200">
                      <input
                        type="radio"
                        name="tf-answer"
                        value="خطأ"
                        checked={formCorrectAnswer === 'خطأ'}
                        onChange={() => setFormCorrectAnswer('خطأ')}
                        className="text-red-700"
                      />
                      <span className="text-sm font-bold text-red-800">خطأ</span>
                    </label>
                  </div>
                </div>
              )}

              {formType === 'matching' && (
                <div className="space-y-3 bg-[#2E7D32]/5 p-4 rounded-xl border border-[#2E7D32]/10">
                  <span className="block text-xs font-bold text-[#2E7D32]">أزواج التوصيل والمطابقة وعلاقتها ببعضها:</span>
                  <div className="space-y-2">
                    {matchingPairs.map((pair, idx) => (
                      <div key={pair.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400 shrink-0">{idx + 1}أ.</span>
                          <input
                            type="text"
                            placeholder="العمود (أ) - العبارة"
                            value={pair.left}
                            onChange={(e) => {
                              const updated = [...matchingPairs];
                              updated[idx].left = e.target.value;
                              setMatchingPairs(updated);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400 shrink-0">بينما (ب):</span>
                          <input
                            type="text"
                            placeholder="العمود (ب) - مناظرها الصحيح"
                            value={pair.right}
                            onChange={(e) => {
                              const updated = [...matchingPairs];
                              updated[idx].right = e.target.value;
                              setMatchingPairs(updated);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formType === 'ordering' && (
                <div className="space-y-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <span className="block text-xs font-bold text-amber-800">أدخل العناصر التي يطلب ترتيبها (بالتتابع الصحيح من الأعلى للأسفل):</span>
                  <div className="space-y-2">
                    {orderingItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-6 text-center">{idx + 1}</span>
                        <input
                          type="text"
                          placeholder={`خطوة / عنصر رقم ${idx + 1} في الترتيب الملتزم`}
                          value={item}
                          onChange={(e) => {
                            const updated = [...orderingItems];
                            updated[idx] = e.target.value;
                            setOrderingItems(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Text Answers for simple essay or fill-in-blank or verse-hadith */}
              {(formType === 'fill_blank' || formType === 'essay' || formType === 'verse_hadith') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    {formType === 'fill_blank' 
                      ? 'الكلمة أو الكلمات المتممة للفراغ (الإجابة المكتوبة)' 
                      : 'مفتاح الإجابة النموذجية أو توجيهات التصحيح'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={formType === 'fill_blank' ? 'الكلمة الصحيحة بالضبط' : 'مثال: يجزأ الدعاء أو السيرة مع السند'}
                    value={formCorrectAnswer}
                    onChange={(e) => setFormCorrectAnswer(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-755 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none transition-all font-sans"
                  />
                </div>
              )}

              {/* Bottom buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingQuestion(null); }}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-xs transition-all"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F4C81] hover:bg-[#0c3d67] text-white font-medium text-xs shadow-xs transition-all"
                >
                  حفظ في البنك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Searching & Filters rail */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          <div className="md:col-span-2 relative">
            <Search className="absolute right-2.5 top-2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="ابحث بالنص، الدرس أو اسم السورة الكريمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as SubjectBranch | 'all')}
              className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none transition-all"
            >
              <option value="all">كل الفروع الدراسية</option>
              <option value="توحيد">التوحيد</option>
              <option value="تفسير">التفسير</option>
              <option value="حديث">الحديث الشريف</option>
              <option value="فقه">الفقه الإسلامي</option>
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as QuestionType | 'all')}
              className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none transition-all"
            >
              <option value="all">كل أنواع الأسئلة</option>
              <option value="mcq">اختيار من متعدد</option>
              <option value="true_false">صح أو خطأ</option>
              <option value="fill_blank">أكمل الفراغ</option>
              <option value="matching">المزاوجة / التوصيل</option>
              <option value="ordering">الترتيب</option>
              <option value="essay">سؤال مقالي</option>
              <option value="verse_hadith">سؤال آية أو حديث</option>
            </select>
          </div>
        </div>

        {/* Sub-Filters line */}
        <div className="flex flex-wrap items-center mt-1 gap-3 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <SlidersHorizontal size={12} className="text-slate-400" />
            <span>تصفية إضافية:</span>
          </div>

          {/* Semester filter buttons */}
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => setSelectedSemester('all')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${selectedSemester === 'all' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              كل الفصول
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('الفصل الدراسي الأول')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${selectedSemester === 'الفصل الدراسي الأول' ? 'bg-[#0F4C81] text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              الفصل الأول
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('الفصل الدراسي الثاني')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${selectedSemester === 'الفصل الدراسي الثاني' ? 'bg-[#2E7D32] text-white font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              الفصل الثاني
            </button>
          </div>

          {/* Difficulty filter buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${selectedDifficulty === 'all' ? 'bg-slate-200 text-slate-800 font-medium' : 'bg-slate-100 text-slate-500 hover:bg-slate-150'}`}
            >
              كل الصعوبات
            </button>
            <button
              onClick={() => setSelectedDifficulty('سهل')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${selectedDifficulty === 'سهل' ? 'bg-emerald-100 text-emerald-800 font-medium' : 'bg-slate-100 text-slate-500 hover:bg-slate-150'}`}
            >
              سهل
            </button>
            <button
              onClick={() => setSelectedDifficulty('متوسط')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${selectedDifficulty === 'متوسط' ? 'bg-[#0F4C81]/15 text-[#0F4C81] font-medium' : 'bg-slate-100 text-slate-500 hover:bg-slate-150'}`}
            >
              متوسط
            </button>
            <button
              onClick={() => setSelectedDifficulty('صعب')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${selectedDifficulty === 'صعب' ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-slate-100 text-slate-500 hover:bg-slate-150'}`}
            >
              صعب
            </button>
          </div>

          {/* Unit filter */}
          {uniqueUnits.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <span>الوحدة:</span>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">كل الوحدات</option>
                {uniqueUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Question List display counts */}
      <div className="flex justify-between items-center text-xs mb-1 text-slate-500 px-1">
        <span>أظهرت التصفية <strong className="text-slate-800 dark:text-white font-semibold">{filteredQuestions.length}</strong> سؤال من أصل <strong className="text-slate-800 dark:text-white font-semibold">{questions.length}</strong> في البنك الشامل.</span>
      </div>

      {/* Grid of existing questions */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-755 p-8 text-center flex flex-col items-center justify-center">
            <BookOpen size={36} className="text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-white">لم يتم العثور على أي أسئلة</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-md">الرجاء إدخال سؤال جديد يدوياً، أو تجربة الاستيراد من خلال مولد الذكاء الاصطناعي الذكي.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div 
              key={q.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs hover:shadow-md transition-all p-3.5 flex flex-col justify-between relative group"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3.5">
                {/* Branch labels */}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  q.subject === 'توحيد' ? 'bg-[#0F4C81]/10 text-[#0F4C81]' :
                  q.subject === 'تفسير' ? 'bg-indigo-50 text-indigo-700' :
                  q.subject === 'حديث' ? 'bg-[#2E7D32]/10 text-[#2E7D32]' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {q.subject.toUpperCase()}
                </span>

                {/* Difficulty label */}
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  q.difficulty === 'سهل' ? 'bg-emerald-50 text-emerald-700' :
                  q.difficulty === 'متوسط' ? 'bg-blue-50 text-blue-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {q.difficulty}
                </span>

                {/* Question format type */}
                <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-md font-medium">
                  {getTypeLabel(q.type)}
                </span>

                {/* Semester label */}
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  (q.semester || 'الفصل الدراسي الأول') === 'الفصل الدراسي الثاني'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                }`}>
                  {(q.semester || 'الفصل الدراسي الأول') === 'الفصل الدراسي الثاني' ? 'الفصل الثاني' : 'الفصل الأول'}
                </span>

                {/* Points grade label */}
                <span className="bg-slate-50 text-slate-500 text-[11px] px-2 py-0.5 rounded-md font-mono mr-auto">
                  الدرجة: {q.points}
                </span>

                {/* Actions bar */}
                <div className="flex items-center gap-1.5 transition-all">
                  {deleteConfirmId === q.id ? (
                    <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-lg border border-red-150 dark:border-red-900/50 animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-300">متأكد؟</span>
                      <button
                        onClick={() => {
                          onDeleteQuestion(q.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        نعم
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(q.id)}
                        className="p-1.5 text-slate-500 hover:text-[#D32F2F] hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Text Content */}
              <div className="space-y-3">
                <h4 className="text-slate-800 font-bold leading-relaxed text-base">{q.text}</h4>

                {/* MCQ Choices UI */}
                {q.type === 'mcq' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2 bg-slate-50 dark:bg-slate-750/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    {q.options.map((opt, o_idx) => {
                      const isCorrect = isOptionCorrect(q, opt, o_idx);
                      return (
                        <div 
                          key={o_idx}
                          className={`flex items-center justify-between gap-2 p-2 rounded-lg text-xs transition-all ${
                            isCorrect 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs' 
                              : 'bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                              isCorrect ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 dark:ring-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                            }`}>
                              {['أ', 'ب', 'ج', 'د'][o_idx] || String.fromCharCode(65 + o_idx)}
                            </span>
                            <span className="truncate">{opt}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold shrink-0 flex items-center gap-1 shadow-2xs">
                              <Check size={11} className="stroke-[3]" />
                              الإجابة الصحيحة
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Matching Pairs Details view */}
                {q.type === 'matching' && q.matchingPairs && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <span className="font-semibold block mb-1 text-slate-700 text-[11px]">مفاتيح المزاوجة المعرفة:</span>
                    {q.matchingPairs.map((pair, idx) => (
                      <div key={pair.id || idx} className="flex gap-4 items-center pl-1">
                        <span className="text-[#2E7D32] bg-[#2E7D32]/10 px-1.5 py-0.5 rounded-xs font-mono text-[10px]">{idx+1}أ. ({pair.left})</span>
                        <span className="text-slate-400">⟶</span>
                        <span className="text-slate-700 font-medium">ب. ({pair.right})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ordering Details views */}
                {q.type === 'ordering' && q.orderedItems && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-[#0F4C81]/10 text-xs text-slate-600 flex flex-wrap gap-2 items-center">
                    <span className="font-semibold text-[11px] text-[#0F4C81]">الترتيب المنهجي الصحيح:</span>
                    {q.orderedItems.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 font-medium">{item}</span>
                        {idx < q.orderedItems!.length - 1 && <span className="text-slate-400">←</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Answer Keys details */}
                {q.type !== 'mcq' && q.type !== 'matching' && q.type !== 'ordering' && (
                  <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 text-xs flex gap-2 items-start mt-2">
                    <span className="text-slate-400 shrink-0 font-medium">الإجابة:</span>
                    <span className="text-slate-800 font-medium leading-relaxed font-serif text-sm">{q.correctAnswer}</span>
                  </div>
                )}
              </div>

              {/* Course breadcrumbs foot */}
              <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-slate-50 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  الملف: <strong className="text-slate-500 font-semibold">{q.unit}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  الدرس: <strong className="text-slate-500 font-semibold">{q.lesson}</strong>
                </span>
                <span className="flex items-center gap-1 mr-auto truncate max-w-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F4C81]/40"></span>
                  الناتج: <strong className="text-slate-500 font-semibold italic">{q.learningOutcome}</strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
