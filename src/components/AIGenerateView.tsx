import React, { useState } from 'react';
import { SubjectBranch, QuestionType, DifficultyLevel, Question } from '../types';
import { Sparkles, BrainCircuit, RefreshCw, AlertCircle, CheckCircle, PlusCircle, Book, CalendarRange } from 'lucide-react';

interface AIGenerateViewProps {
  onAddGeneratedQuestions: (newQuestions: Question[]) => void;
  defaultSemester?: string;
}

export default function AIGenerateView({ onAddGeneratedQuestions, defaultSemester }: AIGenerateViewProps) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectBranch>('توحيد');
  const [selectedSemester, setSelectedSemester] = useState<string>(defaultSemester || 'الفصل الدراسي الثاني');
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['mcq', 'true_false']);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('متوسط');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [customTopic, setCustomTopic] = useState<string>('');

  // Generation progress state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [stageMessage, setStageMessage] = useState('');

  // Holder for newly generated questions pending confirmation
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  const toggleTypeSelection = (type: QuestionType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      setErrorMsg('الرجاء اختيار نوع واحد على الأقل للتحضير والتوليد.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setGeneratedQuestions([]);
    
    // Staged updates for smooth AI feel
    setStageMessage('يجري الآن تأسيس العقد مع الذكاء الاصطناعي...');
    setTimeout(() => {
      if (loading) setStageMessage('تحليل منهج الصف الثاني المتوسط المعتمد...');
    }, 1200);
    setTimeout(() => {
      if (loading) setStageMessage('صياغة أسئلة دقيقة وتوليد الخيارات الصحيحة ومفاتيح الإجابة...');
    }, 2800);

    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: selectedSubject,
          semester: selectedSemester,
          count: questionCount,
          difficulty: selectedDifficulty,
          types: selectedTypes,
          topic: customTopic
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل التوليد. الرجاء التأكد من تسجيل مفاتيح API الخاصة بك.');
      }

      const tagged = (data.questions || []).map((q: Question) => ({
        ...q,
        semester: q.semester || selectedSemester
      }));
      setGeneratedQuestions(tagged);
      setSuccessMsg(`تم بنجاح توليد ${data.questions?.length || 0} أسئلة متوافقة مع وزارة التعليم بالسعودية!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ اتصال بالخادم المضيف لمزود الذكاء الاسطناعي.');
    } finally {
      setLoading(false);
      setStageMessage('');
    }
  };

  const handlePushToBank = () => {
    if (generatedQuestions.length === 0) return;
    onAddGeneratedQuestions(generatedQuestions);
    setSuccessMsg('تم دمج وحفظ الأسئلة المولدة بنجاح في بنك الأسئلة الشامل بنظام المدرسة!');
    setGeneratedQuestions([]);
  };

  // Helper type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'اختيار من متعدد';
      case 'true_false': return 'صح أو خطأ';
      case 'fill_blank': return 'أكمل الفراغ';
      case 'matching': return 'مزاوجة وتوصيل';
      case 'ordering': return 'ترتيب العناصر';
      case 'essay': return 'مقالي شرعي';
      case 'verse_hadith': return 'سؤال آية/حديث';
      default: return type;
    }
  };

  return (
    <div id="ai-generator-module" className="space-y-4">
      <div className="bg-gradient-to-r from-[#0F4C81] to-[#2E7D32]/90 rounded-xl p-4 text-white shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 animate-fade-in">
            <Sparkles className="text-yellow-300 animate-pulse fill-yellow-300" size={18} />
            <h2 className="text-sm font-bold">توليد وصياغة الأسئلة بالذكاء الاصطناعي (أوف لاين / أون لاين)</h2>
          </div>
          <p className="text-blue-100 mt-1 text-[11px] max-w-2xl leading-relaxed">
            تم دمج نموذج <strong className="font-bold underline text-yellow-300">Gemini</strong> للاتصال مباشرة بالخادم المعتمد وتوليد أسئلة دراسات إسلامية دقيقة حسب المعايير الرسمية لوزارة التعليم السعودية لمنهج الصف الثاني المتوسط.
          </p>
        </div>
        <BrainCircuit size={32} className="opacity-20 shrink-0 hidden md:block" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Settings Form */}
        <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs space-y-3 h-fit">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center gap-1.5">
            <Book size={14} className="text-[#0F4C81]" />
            محددات التوليد الذكي
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">الفرع الإسلامي</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectBranch)}
                className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white outline-none transition-all"
              >
                <option value="توحيد">التوحيد</option>
                <option value="تفسير">التفسير</option>
                <option value="حديث">الحديث الشريف</option>
                <option value="فقه">الفقه الإسلامي</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">الفصل الدراسي</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white outline-none transition-all"
              >
                <option value="الفصل الدراسي الأول">الفصل الأول</option>
                <option value="الفصل الدراسي الثاني">الفصل الثاني</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5"> نوع وصيغة الأسئلة المطلوبة (اختر صيغة أو أكثر) </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-slate-50 dark:bg-slate-755/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {[
                { value: 'mcq', label: 'اختيار من متعدد' },
                { value: 'true_false', label: 'صح أو خطأ' },
                { value: 'fill_blank', label: 'أكمل الفراغ' },
                { value: 'matching', label: 'المزاوجة وتوصيل' },
                { value: 'ordering', label: 'ترتيب المفاهيم' },
                { value: 'essay', label: 'السؤال المقالي' },
                { value: 'verse_hadith', label: 'آية / حديث شريف' }
              ].map((item) => {
                const isSelected = selectedTypes.includes(item.value as QuestionType);
                return (
                  <label
                    key={item.value}
                    className={`flex items-center gap-2 p-1.5 rounded-md text-[10px] font-bold cursor-pointer transition select-none border ${
                      isSelected
                        ? 'bg-[#0F4C81]/10 border-[#0F4C81] text-[#0F4C81] dark:bg-[#0F4C81]/20 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTypeSelection(item.value as QuestionType)}
                      className="rounded text-[#0F4C81] focus:ring-[#0F4C81] shrink-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1"> مستوى الصعوبة </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel)}
                className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white outline-none transition-all"
              >
                <option value="سهل">سهل</option>
                <option value="متوسط">متوسط</option>
                <option value="صعب">صعب</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1"> عدد الأسئلة </label>
              <input
                type="number"
                min={1}
                max={10}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-705 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1"> الموضوع المعين أو السورة الكريمة </label>
            <textarea
              placeholder="مثال: تفسير الآيات الأولى من سورة الحجرات، أو صلاة الاستسقاء..."
              rows={2}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
            />
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">اترك هذا الحقل فارغاً لتوليد أسئلة نموذجية عامة للمستوى الدراسي بأكمله.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1.5 font-bold py-2 px-3 rounded-lg bg-gradient-to-r from-[#0F4C81] to-[#2E7D32] hover:opacity-95 text-white text-xs shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin text-white" size={14} />
                جاري التوليد الآن...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                ابدأ التوليد بالذكاء الاصطناعي
              </>
            )}
          </button>
        </form>

        {/* Results Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-755 shadow-xs flex flex-col justify-between min-h-[400px]">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-2 mb-3 flex items-center justify-between font-sans">
              <span> الأسئلة المقترحة المولدة </span>
              {generatedQuestions.length > 0 && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
                  {generatedQuestions.length} أسئلة جاهزة
                </span>
              )}
            </h3>

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 text-[#D32F2F] dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-900/50 flex items-start gap-2.5 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-1 font-sans">
                  <span className="font-bold block text-xs">فشل طلب جني الـ AI:</span>
                  <span className="leading-relaxed text-[11px] font-mono">{errorMsg}</span>
                  <span className="block text-[10px] text-slate-500 mt-1 font-semibold">
                    * ملاحظة: يمكنك التحقق من إعداد مفتاح <code className="bg-slate-100 dark:bg-slate-850 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> من خلال زر الإعدادات وأيقونة Secrets.
                  </span>
                </div>
              </div>
            )}

            {/* Success notifications */}
            {successMsg && !errorMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-[#2E7D32] dark:text-emerald-400 p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/55 flex items-start gap-2 text-xs mb-3 font-sans">
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Loading state progress */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-[#0F4C81] rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto text-yellow-500 animate-ping" size={18} />
                </div>
                <h4 className="text-slate-705 dark:text-white font-bold text-xs">جاري إنشاء الأسئلة وتزويدها بالمخارج...</h4>
                <p className="text-slate-400 text-[10px] animate-pulse font-mono max-w-sm">{stageMessage}</p>
              </div>
            )}

            {/* Default state */}
            {!loading && generatedQuestions.length === 0 && !errorMsg && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
                <BrainCircuit size={36} className="text-slate-200 dark:text-slate-700 stroke-[1.5]" />
                <div>
                  <h4 className="text-slate-600 dark:text-slate-350 font-bold text-xs">بانتظار طلب التوليد الذكي</h4>
                  <p className="text-slate-400 text-[10px] mt-1 max-w-md leading-relaxed">
                    حدد المادة الفرعية، شكل السؤال وصعوبته ثم انقر على توليد للحصول على أسئلة فورية مطابقة لآخر تنظيمات وزارة التعليم السعودية مجاناً.
                  </p>
                </div>
              </div>
            )}

            {/* Questions list to review */}
            {!loading && generatedQuestions.length > 0 && (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-slate-50 dark:bg-slate-750/40 p-3 rounded-lg border border-slate-150 dark:border-slate-700 space-y-1.5 relative">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] font-bold bg-[#0F4C81] text-white px-1.5 py-0.5 rounded">
                        {q.subject}
                      </span>
                      <span className="text-[9px] font-medium bg-slate-205 dark:bg-slate-700 text-slate-700 dark:text-slate-350 px-1.5 py-0.5 rounded">
                        {getTypeLabel(q.type)}
                      </span>
                      <span className="text-[9px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                        صعوبة: {q.difficulty}
                      </span>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono mr-auto">
                        درجة: {q.points}
                      </span>
                    </div>

                    <h4 className="text-slate-800 dark:text-white font-bold text-xs leading-relaxed">{q.text}</h4>

                    {q.type === 'mcq' && q.options && (
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                        {q.options.map((opt, o_idx) => (
                          <div 
                            key={o_idx} 
                            className={`p-1.5 rounded-md text-[10px] flex items-center gap-2 ${
                              opt === q.correctAnswer 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400 font-semibold' 
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span className="font-semibold text-[9px] opacity-70">
                              {['أ', 'ب', 'ج', 'د'][o_idx] || String.fromCharCode(65 + o_idx)}.
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type !== 'mcq' && (
                      <div className="bg-white/80 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-[10px] flex gap-1 mt-1.5">
                        <span className="text-slate-400 font-semibold shrink-0">الإجابة:</span>
                        <span className="text-slate-808 dark:text-slate-200 font-medium">{q.correctAnswer}</span>
                      </div>
                    )}

                    <div className="text-[9px] text-slate-400 flex justify-between pt-1.5 border-t border-slate-100/60 dark:border-slate-800 font-mono">
                      <span>الدرس: {q.lesson}</span>
                      <span>الوحدة: {q.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm integration to main system bank */}
          {!loading && generatedQuestions.length > 0 && (
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={handlePushToBank}
                className="flex items-center gap-1.5 bg-[#2E7D32] hover:bg-[#205722] text-white font-bold py-1.5 px-4 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle size={14} />
                تأكيد واعتماد وإضافة للبنك
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
