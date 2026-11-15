import React from 'react';
import { Question, Exam } from '../types';
import { BarChart3, PieChart, TrendingUp, BookOpen } from 'lucide-react';

interface ReportsViewProps {
  questions: Question[];
  exams: Exam[];
}

export default function ReportsView({ questions, exams }: ReportsViewProps) {
  
  // 1. Difficulty distribution calculation
  const easyCount = questions.filter(q => q.difficulty === 'سهل').length;
  const mediumCount = questions.filter(q => q.difficulty === 'متوسط').length;
  const hardCount = questions.filter(q => q.difficulty === 'صعب').length;
  const totalDifficulties = easyCount + mediumCount + hardCount || 1;

  const easyPercent = Math.round((easyCount / totalDifficulties) * 100);
  const mediumPercent = Math.round((mediumCount / totalDifficulties) * 100);
  const hardPercent = Math.round((hardCount / totalDifficulties) * 100);

  // 2. Subject Branch counts
  const subjects = ['توحيد', 'تفسير', 'حديث', 'فقه'] as const;
  const subjectCounts = {
    'توحيد': questions.filter(q => q.subject === 'توحيد').length,
    'تفسير': questions.filter(q => q.subject === 'تفسير').length,
    'حديث': questions.filter(q => q.subject === 'حديث').length,
    'فقه': questions.filter(q => q.subject === 'فقه').length,
  };
  const maxSubjectCount = Math.max(...Object.values(subjectCounts)) || 1;



  return (
    <div id="reports-view-module" className="space-y-4 font-sans">
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-white font-sans">التقارير والإحصائيات الشاملة</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs">تحليل أداء الطلاب وتوزيع مستويات صعوبة وفروع أسئلة الدراسات الإسلامية بالضوابط القياسية.</p>
      </div>

      {/* Primary summary badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-750 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0F4C81]/10 rounded-lg flex items-center justify-center text-[#0F4C81] shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 dark:text-slate-350 font-bold block">إجمالي بنك الأسئلة</span>
            <strong className="text-sm font-bold text-slate-800 dark:text-white">{questions.length} أسئلة</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-750 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2E7D32]/10 rounded-lg flex items-center justify-center text-[#2E7D32] shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 dark:text-slate-350 font-bold block">النماذج المصدرة</span>
            <strong className="text-sm font-bold text-slate-800 dark:text-white">{exams.length} نماذج</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Difficulty metrics - custom SVG display */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center gap-1.5">
            <PieChart size={14} className="text-[#0F4C81] dark:text-[#6cb1ec]" />
            توزيع مستويات الصعوبة للمواد الشرعية
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-around">
            {/* Minimalist donut-pie chart SVG */}
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Easy - Emerald color */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#2E7D32"
                  strokeWidth="3.2"
                  strokeDasharray={`${easyPercent} ${100 - easyPercent}`}
                  strokeDashoffset="0"
                  className="transition-all"
                />
                {/* Medium - Royal Blue */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#0F4C81"
                  strokeWidth="3.2"
                  strokeDasharray={`${mediumPercent} ${100 - mediumPercent}`}
                  strokeDashoffset={`-${easyPercent}`}
                  className="transition-all"
                />
                {/* Hard - Crimson red */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke="#D32F2F"
                  strokeWidth="3.2"
                  strokeDasharray={`${hardPercent} ${100 - hardPercent}`}
                  strokeDashoffset={`-${easyPercent + mediumPercent}`}
                  className="transition-all"
                />
                {/* Center blank hole - styled dynamically for light and dark support */}
                <circle cx="18" cy="18" r="12" className="fill-white dark:fill-slate-800" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold text-slate-800 dark:text-white leading-none">{questions.length}</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-450 font-bold mt-1">سؤال بالبنك</span>
              </div>
            </div>

            {/* Explaining indicators */}
            <div className="space-y-2 w-full max-w-xs text-[11px]">
              <div className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/15 p-2 rounded-lg border border-emerald-100 dark:border-emerald-950/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">سهل السلوك</span>
                </div>
                <span className="text-slate-650 dark:text-slate-400">({easyCount}) أسئلة - <strong className="text-emerald-800 dark:text-emerald-450">{easyPercent}%</strong></span>
              </div>

              <div className="flex justify-between items-center bg-[#0F4C81]/5 dark:bg-[#0F4C81]/15 p-2 rounded-lg border border-[#0F4C81]/10 dark:border-[#0F4C81]/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0F4C81]"></span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">متوسط العمق</span>
                </div>
                <span className="text-slate-650 dark:text-slate-400">({mediumCount}) أسئلة - <strong className="text-[#0F4C81] dark:text-[#6cb1ec]">{mediumPercent}%</strong></span>
              </div>

              <div className="flex justify-between items-center bg-red-50/50 dark:bg-red-955/15 p-2 rounded-lg border border-red-100 dark:border-red-955/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D32F2F]"></span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">دقيق / صعب</span>
                </div>
                <span className="text-slate-650 dark:text-slate-400">({hardCount}) أسئلة - <strong className="text-[#D32F2F] dark:text-red-400">{hardPercent}%</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Course subjects proportions */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center gap-1.5">
            <BarChart3 size={14} className="text-[#0F4C81] dark:text-[#6cb1ec]" />
            معدل تنوع موضوعات الدراسات الإسلامية بالبنك
          </h3>

          <div className="space-y-2.5">
            {subjects.map(subj => {
              const count = subjectCounts[subj];
              const percentage = Math.round((count / maxSubjectCount) * 100) || 5;

              let color = 'bg-[#0F4C81]';
              if (subj === 'حديث') color = 'bg-[#2E7D32]';
              else if (subj === 'تفسير') color = 'bg-indigo-600';
              else if (subj === 'فقه') color = 'bg-amber-500';

              return (
                <div key={subj} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-700 dark:text-slate-300">
                    <span>
                      {subj === 'توحيد' ? 'التوحيد' :
                       subj === 'تفسير' ? 'التفسير' :
                       subj === 'حديث' ? 'الحديث' : 'الفقه'}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">{count} سؤال</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>



      </div>
    </div>
  );
}
