import React, { useState, useEffect } from 'react';
import { Question, Exam, StudentGrade } from './types';
import { initialQuestions } from './initialQuestions';
import QuestionBankView from './components/QuestionBankView';
import AIGenerateView from './components/AIGenerateView';
import ExamCreatorView from './components/ExamCreatorView';
import PrintView from './components/PrintView';
import ReportsView from './components/ReportsView';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  doc, 
  setDoc, 
  getDoc,
  OperationType,
  handleFirestoreError
} from './firebase';

import { 
  BookOpen, 
  Sparkles, 
  Award, 
  Printer, 
  GraduationCap, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun, 
  Save, 
  Download, 
  Upload, 
  User, 
  Building2, 
  Calendar, 
  HelpCircle, 
  Database, 
  CloudOff, 
  Check, 
  Layers, 
  FileCheck,
  ChevronLeft,
  X,
  AlertCircle,
  UploadCloud,
  LogIn,
  LogOut,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export interface GoogleUser {
  email: string;
  name: string;
  avatar: string;
  lastSyncedAt?: string;
}

export default function App() {
  // 1. Core Databases states loaded from Local Storage (Offline first support)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);

  // 2. Personalization configurations
  const [schoolName, setSchoolName] = useState('مدرسة البراء بن عازب المتوسطة');
  const [academicYear, setAcademicYear] = useState('1447هـ - 2026م');
  const [semester, setSemester] = useState(() => {
    return localStorage.getItem('islamic_semester') || 'الفصل الدراسي الثاني';
  });

  // Google Account and Cloud Save states (Derived strictly from Firebase Auth)
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('islamic_guest_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [teacherName, setTeacherName] = useState<string>(() => {
    try {
      return sessionStorage.getItem('islamic_guest_mode') === 'true' ? 'ضيف' : '';
    } catch {
      return '';
    }
  });
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // 3. UI states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bank' | 'generator' | 'creator' | 'print' | 'reports'>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSaveActive, setAutoSaveActive] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Initialize Databases on Mount
  useEffect(() => {
    // Questions bank with automatic curriculum version migration (includes Semester 1 & 2)
    const CURRICULUM_VERSION = 'v5_semesters_complete_curriculum';
    const currentVersion = localStorage.getItem('islamic_curriculum_version');
    const storedQuestions = localStorage.getItem('islamic_questions_bank');

    if (currentVersion === CURRICULUM_VERSION && storedQuestions !== null) {
      try {
        const stored: Question[] = JSON.parse(storedQuestions);
        setQuestions(stored);
      } catch (err) {
        setQuestions(initialQuestions);
      }
    } else {
      // Adopt approved curriculum questions with Semester 1 and 2
      setQuestions(initialQuestions);
      localStorage.setItem('islamic_questions_bank', JSON.stringify(initialQuestions));
      localStorage.setItem('islamic_curriculum_version', CURRICULUM_VERSION);
      localStorage.setItem('islamic_bank_initialized', 'true');
    }

    // Exams
    const storedExams = localStorage.getItem('islamic_exams_list');
    if (storedExams) {
      try {
        setExams(JSON.parse(storedExams));
      } catch {
        setExams([]);
      }
    }

    // Grades
    const storedGrades = localStorage.getItem('islamic_grades_list');
    if (storedGrades) {
      try {
        setStudentGrades(JSON.parse(storedGrades));
      } catch {
        setStudentGrades([]);
      }
    }

    // Metadata personalization
    const storedSchool = localStorage.getItem('islamic_school_name');
    if (storedSchool && storedSchool !== 'مدرسة عمير بن سعد المتوسطة' && storedSchool !== 'مدارس الملك فهد الأهلية') {
      setSchoolName(storedSchool);
    } else {
      setSchoolName('مدرسة البراء بن عازب المتوسطة');
      localStorage.setItem('islamic_school_name', 'مدرسة البراء بن عازب المتوسطة');
    }
    const storedYear = localStorage.getItem('islamic_academic_year');
    if (storedYear) setAcademicYear(storedYear);
    const storedSem = localStorage.getItem('islamic_semester');
    if (storedSem) setSemester(storedSem);
  }, []);

  // Sync / Auto-save triggers
  const triggerAutoSaveIndicator = () => {
    setAutoSaveActive(true);
    setTimeout(() => setAutoSaveActive(false), 2000);
  };

  // Listen to Firebase Auth state (single source of truth for signed-in user)
  useEffect(() => {
    // Clear any legacy hardcoded fallback user until Firebase confirms an active session
    if (!auth) {
      setGoogleUser(null);
      setTeacherName('');
      setAuthChecking(false);
      return;
    }

    const fallbackTimer = setTimeout(() => {
      setAuthChecking(false);
    }, 4500);

    try {
      const unsub = onAuthStateChanged(auth, async (fbUser) => {
        clearTimeout(fallbackTimer);
        if (fbUser) {
          const accountEmail = fbUser.email || fbUser.displayName || 'مستخدم Google';
          const accountDisplayName = fbUser.displayName || fbUser.email || 'مستخدم Google';
          const u: GoogleUser = {
            email: accountEmail,
            name: accountDisplayName,
            avatar: fbUser.photoURL || '',
            lastSyncedAt: new Date().toLocaleTimeString('ar-SA')
          };
          setGoogleUser(u);
          setIsGuest(false);
          try {
            sessionStorage.removeItem('islamic_guest_mode');
          } catch {}
          setTeacherName(accountEmail);
          setAuthError(null);
          localStorage.setItem('islamic_google_user', JSON.stringify(u));
          localStorage.setItem('islamic_teacher_name', accountEmail);
          setAuthChecking(false);

          // Fetch or create user cloud data from Firestore
          if (db) {
            const userPath = `users/${fbUser.uid}`;
            try {
              const userRef = doc(db, 'users', fbUser.uid);
              const snap = await getDoc(userRef);
              if (snap.exists()) {
                const data = snap.data();
                if (data.schoolName) setSchoolName(data.schoolName);
                if (data.semester) setSemester(data.semester);
                if (data.academicYear) setAcademicYear(data.academicYear);
                if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                  setQuestions(data.questions);
                  localStorage.setItem('islamic_questions_bank', JSON.stringify(data.questions));
                }
                if (data.exams && Array.isArray(data.exams) && data.exams.length > 0) {
                  setExams(data.exams);
                  localStorage.setItem('islamic_exams_list', JSON.stringify(data.exams));
                }
              } else {
                let currentQs = initialQuestions;
                try {
                  const cachedQs = localStorage.getItem('islamic_questions_bank');
                  if (cachedQs) {
                    const parsed = JSON.parse(cachedQs);
                    if (Array.isArray(parsed) && parsed.length > 0) currentQs = parsed;
                  }
                } catch {}
                await setDoc(userRef, {
                  id: fbUser.uid,
                  email: accountEmail,
                  name: accountDisplayName,
                  schoolName: schoolName,
                  academicYear: academicYear,
                  semester: semester,
                  teacherName: accountEmail,
                  questions: currentQs,
                  exams: exams,
                  updatedAt: new Date().toISOString()
                });
              }
            } catch (e) {
              handleFirestoreError(e, OperationType.GET, userPath);
            }
          }
        } else {
          setGoogleUser(null);
          let activeGuest = false;
          try {
            activeGuest = sessionStorage.getItem('islamic_guest_mode') === 'true';
          } catch {}
          setTeacherName(activeGuest ? 'ضيف' : '');
          localStorage.removeItem('islamic_google_user');
          localStorage.removeItem('islamic_teacher_name');
          setAuthChecking(false);
        }
      });
      return () => {
        clearTimeout(fallbackTimer);
        unsub();
      };
    } catch (e) {
      clearTimeout(fallbackTimer);
      console.warn('Firebase auth listener notice: ', e);
      setAuthChecking(false);
    }
  }, []);

  // Google Account and Data persistence handler with Cloud Firestore sync
  const handleSaveUserData = async () => {
    const nowTime = new Date().toLocaleTimeString('ar-SA');
    localStorage.setItem('islamic_questions_bank', JSON.stringify(questions));
    localStorage.setItem('islamic_exams_list', JSON.stringify(exams));
    localStorage.setItem('islamic_grades_list', JSON.stringify(studentGrades));
    localStorage.setItem('islamic_school_name', schoolName);
    localStorage.setItem('islamic_academic_year', academicYear);
    localStorage.setItem('islamic_semester', semester);
    localStorage.setItem('islamic_teacher_name', teacherName);

    if (googleUser) {
      const updatedUser = {
        ...googleUser,
        lastSyncedAt: nowTime
      };
      setGoogleUser(updatedUser);
      localStorage.setItem('islamic_google_user', JSON.stringify(updatedUser));
    }

    // Sync to Cloud Firestore
    if (auth?.currentUser && db) {
      const userPath = `users/${auth.currentUser.uid}`;
      const accountEmail = auth.currentUser.email || googleUser?.email || '';
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          id: auth.currentUser.uid,
          email: accountEmail,
          name: googleUser?.name || accountEmail,
          schoolName,
          academicYear,
          semester,
          teacherName: accountEmail,
          questions,
          exams,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        showToast('تعذر المزامنة مع سحابة Firestore، يرجى التحقق من الصلاحيات.', 'error');
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }
    }

    triggerAutoSaveIndicator();
    if (googleUser) {
      showToast(`تم حفظ وتحديث جميع الأسئلة وتعديلاتك بنجاح على حساب Google (${googleUser.email}) وسحابة Firestore!`, 'success');
    } else {
      showToast('تم حفظ جميع الأسئلة والتعديلات محلياً في وضع الضيف! للمزامنة السحابية يمكنك تسجيل الدخول بحساب Google.', 'success');
    }
  };

  const handleGuestLogin = () => {
    setAuthError(null);
    setIsGuest(true);
    setTeacherName('ضيف');
    try {
      sessionStorage.setItem('islamic_guest_mode', 'true');
    } catch {}
    showToast('تم الدخول بوضع الضيف (يتم حفظ بياناتك محلياً على هذا المتصفح).', 'info');
  };

  const handleGuestLogout = () => {
    setIsGuest(false);
    setTeacherName('');
    setAuthError(null);
    try {
      sessionStorage.removeItem('islamic_guest_mode');
    } catch {}
    showToast('تم إنهاء جلسة الضيف.', 'info');
  };

  const handlePopupGoogleSignIn = async () => {
    if (!auth) {
      const msg = 'تعذر تهيئة خدمة المصادقة من Firebase.';
      setAuthError(msg);
      showToast(msg, 'error');
      return false;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const email = result.user.email || result.user.displayName || 'مستخدم Google';
        setIsGuest(false);
        try {
          sessionStorage.removeItem('islamic_guest_mode');
        } catch {}
        setTeacherName(email);
        localStorage.setItem('islamic_teacher_name', email);
        showToast(`تم تسجيل الدخول بنجاح بحساب Google (${email})!`, 'success');
        setShowGoogleModal(false);
        return true;
      }
    } catch (err: any) {
      const code = err?.code || '';
      let msg = 'تعذر تسجيل الدخول بحساب Google. يرجى المحاولة مرة أخرى.';
      if (code === 'auth/popup-blocked') {
        msg = 'قام المتصفح بحظر نافذة تسجيل الدخول المنبثقة. يرجى السماح بالنوافذ المنبثقة (Pop-ups) لهذا الموقع والمحاولة مجدداً.';
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        msg = 'تم إغلاق نافذة تسجيل الدخول قبل إكمال العملية.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = 'هذا النطاق غير مصرح به في إعدادات Firebase Authentication (Authorized Domains). يرجى إضافة النطاق من لوحة تحكم Firebase.';
      } else if (code === 'auth/network-request-failed') {
        msg = 'تعذر الاتصال بالإنترنت. يرجى التحقق من الشبكة والمحاولة مجدداً.';
      }
      setAuthError(msg);
      showToast(msg, 'error');
    } finally {
      setAuthLoading(false);
    }
    return false;
  };

  const handleGoogleLogout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch {}
    setGoogleUser(null);
    setIsGuest(false);
    setTeacherName('');
    setAuthError(null);
    try {
      sessionStorage.removeItem('islamic_guest_mode');
    } catch {}
    localStorage.removeItem('islamic_google_user');
    localStorage.removeItem('islamic_teacher_name');
    setShowGoogleModal(false);
    showToast('تم تسجيل الخروج من حساب Google بنجاح.', 'info');
  };

  const handleClearAllQuestions = () => {
    setQuestions([]);
    localStorage.setItem('islamic_questions_bank', JSON.stringify([]));
    localStorage.setItem('islamic_bank_initialized', 'true');
    showToast('تم حذف وتفريغ جميع الأسئلة والتقسيمات السابقة بنجاح.', 'info');
    triggerAutoSaveIndicator();
  };

  const handleReplaceAllQuestions = (newQs: Question[]) => {
    setQuestions(newQs);
    localStorage.setItem('islamic_questions_bank', JSON.stringify(newQs));
    localStorage.setItem('islamic_bank_initialized', 'true');
    showToast(`تم اعتماد وتحديث بنك الأسئلة بالكامل (${newQs.length} سؤال) بنجاح!`, 'success');
    triggerAutoSaveIndicator();
  };

  const handleBulkAddQuestions = (newQs: Question[]) => {
    const updated = [...newQs, ...questions];
    setQuestions(updated);
    localStorage.setItem('islamic_questions_bank', JSON.stringify(updated));
    localStorage.setItem('islamic_bank_initialized', 'true');
    showToast(`تمت إضافة ${newQs.length} سؤال جديد إلى بنك الأسئلة!`, 'success');
    triggerAutoSaveIndicator();
  };

  const handleAddQuestion = (q: Question) => {
    const updated = [q, ...questions];
    setQuestions(updated);
    localStorage.setItem('islamic_questions_bank', JSON.stringify(updated));
    triggerAutoSaveIndicator();
  };

  const handleUpdateQuestion = (updatedQ: Question) => {
    const updated = questions.map(q => q.id === updatedQ.id ? updatedQ : q);
    setQuestions(updated);
    localStorage.setItem('islamic_questions_bank', JSON.stringify(updated));
    triggerAutoSaveIndicator();
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    localStorage.setItem('islamic_questions_bank', JSON.stringify(updated));
    triggerAutoSaveIndicator();
  };

  const handleAddAIQuestions = (newQs: Question[]) => {
    const updated = [...newQs, ...questions];
    setQuestions(updated);
    localStorage.setItem('islamic_questions_bank', JSON.stringify(updated));
    triggerAutoSaveIndicator();
  };

  const handleAddExam = (exam: Exam) => {
    const updated = [...exams, exam];
    setExams(updated);
    localStorage.setItem('islamic_exams_list', JSON.stringify(updated));
    triggerAutoSaveIndicator();
    setActiveTab('print'); // Redirect directly to printing preview
  };

  const handleDeleteExam = (id: string) => {
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    localStorage.setItem('islamic_exams_list', JSON.stringify(updated));
    triggerAutoSaveIndicator();
  };

  const handleAddGrade = (grade: StudentGrade) => {
    const updated = [grade, ...studentGrades];
    setStudentGrades(updated);
    localStorage.setItem('islamic_grades_list', JSON.stringify(updated));
    triggerAutoSaveIndicator();
  };

  const handleDeleteGrade = (id: string) => {
    const updated = studentGrades.filter(g => g.id !== id);
    setStudentGrades(updated);
    localStorage.setItem('islamic_grades_list', JSON.stringify(updated));
    triggerAutoSaveIndicator();
  };

  // Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('islamic_school_name', schoolName);
    localStorage.setItem('islamic_academic_year', academicYear);
    localStorage.setItem('islamic_semester', semester);
    localStorage.setItem('islamic_teacher_name', teacherName);
    setShowSettings(false);
    triggerAutoSaveIndicator();
  };

  // Back up Export / Import
  const handleBackupExport = () => {
    const backupData = {
      questions,
      exams,
      studentGrades,
      config: { schoolName, academicYear, semester, teacherName }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_منصة_الاختبارات_${Date.now()}.json`;
    link.click();
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.questions) setQuestions(parsed.questions);
        if (parsed.exams) setExams(parsed.exams);
        if (parsed.studentGrades) setStudentGrades(parsed.studentGrades);
        
        if (parsed.config) {
          if (parsed.config.schoolName) setSchoolName(parsed.config.schoolName);
          if (parsed.config.academicYear) setAcademicYear(parsed.config.academicYear);
          if (parsed.config.semester) setSemester(parsed.config.semester);
          if (parsed.config.teacherName) setTeacherName(parsed.config.teacherName);
        }

        showToast('تمت استعادة وتحديث جميع سجلات المدرسة بنجاح!', 'success');
        triggerAutoSaveIndicator();
      } catch (err) {
        showToast('حدث خطأ في تحميل ملف النسخ الاحتياطي، يرجى التأكد من الصيغة الصحيحة.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetQuestions = () => {
    setQuestions(initialQuestions);
    localStorage.setItem('islamic_questions_bank', JSON.stringify(initialQuestions));
    showToast(`تمت إعادة ضبط بنك الأسئلة بنجاح شاملاً ${initialQuestions.length} سؤالاً للفصلين الدراسيين الأول والثاني!`, 'success');
    triggerAutoSaveIndicator();
  };

  if (authChecking) {
    return (
      <div dir="rtl" className={`min-h-screen flex flex-col items-center justify-center p-6 font-sans ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-slate-800'}`}>
        <div className="w-12 h-12 rounded-2xl bg-[#0F4C81] text-white flex items-center justify-center font-extrabold text-xl shadow-md mb-4 animate-pulse">
          بـ
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">جاري التحقق من حالة تسجيل الدخول...</p>
        <p className="text-xs text-slate-400 mt-1">منصة بنك واختبارات الدراسات الإسلامية</p>
      </div>
    );
  }

  if (!googleUser && !isGuest) {
    return (
      <div dir="rtl" className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 via-blue-50/40 to-emerald-50/40 text-slate-800'}`}>
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0F4C81] to-[#2E7D32] p-6 text-white text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-white/15 backdrop-blur-xs rounded-2xl flex items-center justify-center font-extrabold text-xl border border-white/25 shadow-xs">
              بـ
            </div>
            <h1 className="text-lg font-extrabold leading-snug">منصة بنك واختبارات الدراسات الإسلامية</h1>
            <p className="text-xs text-blue-100 font-medium">الصف الثاني المتوسط • {schoolName}</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0F4C81] dark:text-blue-300 text-[11px] font-bold">
                <ShieldCheck size={14} />
                <span>اختر طريقة الدخول للمتابعة</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white pt-1">مرحباً بك في المنصة</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                سجل دخولك بحساب Google للمزامنة السحابية بين أجهزتك، أو ادخل كضيف للعمل مباشرة مع الحفظ المحلي على هذا المتصفح.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                <BookOpen size={15} className="mx-auto text-[#0F4C81] mb-1" />
                <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">بنك الأسئلة</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                <Sparkles size={15} className="mx-auto text-amber-500 mb-1" />
                <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">توليد ذكي</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                <Printer size={15} className="mx-auto text-[#2E7D32] mb-1" />
                <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">نماذج الطباعة</span>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-right">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold text-red-700 dark:text-red-300 leading-relaxed">{authError}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={authLoading}
                onClick={handlePopupGoogleSignIn}
                className="w-full py-3 px-4 bg-[#4285F4] hover:bg-[#3367D6] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{authLoading ? 'جاري فتح نافذة تسجيل الدخول...' : 'تسجيل الدخول بحساب Google'}</span>
              </button>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span>أو</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              <button
                type="button"
                disabled={authLoading}
                onClick={handleGuestLogin}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2 cursor-pointer"
              >
                <User size={15} className="text-slate-500 dark:text-slate-300" />
                <span>الدخول كضيف (حفظ محلي على المتصفح)</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 leading-relaxed">
              لن يتم تسجيل الدخول تلقائياً لأي حساب؛ يمكنك اختيار الدخول بحساب Google أو الدخول كضيف.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="school-exams-app-root" className={`min-h-screen flex flex-col font-sans transition-colors ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-slate-800'}`}>

      {/* 1. Header Toolbar (no-print) */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-750 shadow-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 no-print [print-color-adjust:exact]">
        
        {/* Brand Logo and Title */}
        <div id="app-logo-box" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0F4C81] rounded-lg flex items-center justify-center text-white shadow-xs">
            <span className="font-extrabold text-sm">بـ</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800 dark:text-white leading-none">منصة بنك واختبارات الدراسات الإسلامية</h1>
            <div className="flex items-center gap-1.5 text-[9px] text-[#2E7D32] dark:text-emerald-400 font-bold mt-0.5">
              <span>الصف الثاني المتوسط</span>
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              <span>وزارة التعليم السعودية</span>
            </div>
          </div>
        </div>

        {/* Central Personalization breadcrumb & Semester Switcher */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
            <Building2 size={13} className="text-[#0F4C81]" />
            <span>المدرسة: <strong className="text-slate-800 dark:text-white">{schoolName}</strong></span>
          </div>

          {/* Quick Semester Switcher (الفصل الدراسي الأول / الفصل الدراسي الثاني) */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
            <span className="text-[10px] text-slate-400 font-bold">الفصل:</span>
            <div className="flex bg-slate-200/80 dark:bg-slate-750 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setSemester('الفصل الدراسي الأول');
                  localStorage.setItem('islamic_semester', 'الفصل الدراسي الأول');
                  showToast('تم التبديل إلى: الفصل الدراسي الأول', 'info');
                }}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  semester === 'الفصل الدراسي الأول'
                    ? 'bg-[#0F4C81] text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                الفصل الأول
              </button>
              <button
                type="button"
                onClick={() => {
                  setSemester('الفصل الدراسي الثاني');
                  localStorage.setItem('islamic_semester', 'الفصل الدراسي الثاني');
                  showToast('تم التبديل إلى: الفصل الدراسي الثاني', 'info');
                }}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  semester === 'الفصل الدراسي الثاني'
                    ? 'bg-[#2E7D32] text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                الفصل الثاني
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <User size={13} className="text-indigo-500" />
            <span>المستخدم: <strong className="text-slate-800 dark:text-white font-mono">{googleUser?.email || teacherName || 'ضيف'}</strong></span>
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2">
          {/* Cloud Save & Sync Action */}
          <button
            type="button"
            onClick={handleSaveUserData}
            className="flex items-center gap-1.5 bg-[#2E7D32] hover:bg-[#205722] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="حفظ ومزامنة وتثبيت كافة التعديلات والبيانات"
          >
            <UploadCloud size={14} className={autoSaveActive ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">حفظ التعديلات</span>
          </button>

          {/* Google User Avatar / Sign-In Button */}
          {googleUser ? (
            <div 
              onClick={() => setShowGoogleModal(true)}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition select-none"
              title="إدارة حساب Google وتزامن السجلات"
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] overflow-hidden shrink-0 border border-blue-200">
                {googleUser.avatar ? (
                  <img src={googleUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (googleUser.email || googleUser.name || 'G').charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:flex flex-col text-right leading-none">
                <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate max-w-[100px]">{googleUser.name}</span>
                <span className="text-[8.5px] text-slate-400 font-mono truncate max-w-[100px]">{googleUser.email}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="متصل ومحفوظ"></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-750 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-650 text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>دخول Google</span>
              </button>
              <button
                type="button"
                onClick={handleGuestLogout}
                title="إنهاء جلسة الضيف والعودة لشاشة الدخول"
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-2 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">خروج الضيف</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            title="تغيير المظهر"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-slate-400 hover:text-[#0F4C81] dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            title="الإعدادات الشاملة"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Google Account Management Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">حساب Google ومزامنة التعديلات</h3>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">×</button>
            </div>

            <div className="p-5 space-y-4">
              {googleUser ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    {googleUser.avatar ? (
                      <img src={googleUser.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base border-2 border-white shadow-xs shrink-0">
                        {(googleUser.email || googleUser.name || 'G').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{googleUser.name}</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-mono truncate">{googleUser.email}</p>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 size={11} />
                        <span>تم الربط وحفظ التعديلات تلقائياً</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-750/50 rounded-xl space-y-1.5 text-xs text-slate-650 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400">المدرسة المعتمدة:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{schoolName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الأسئلة المحفوظة:</span>
                      <span className="font-bold text-[#0F4C81] dark:text-blue-400 font-mono">{questions.length} سؤال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">نماذج الاختبارات:</span>
                      <span className="font-bold text-[#2E7D32] dark:text-emerald-400 font-mono">{exams.length} اختبار</span>
                    </div>
                    {googleUser.lastSyncedAt && (
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>آخر حفظ ومزامنة:</span>
                        <span className="font-mono">{googleUser.lastSyncedAt}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveUserData();
                        setShowGoogleModal(false);
                      }}
                      className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#205722] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UploadCloud size={14} />
                      حفظ وتحديث كافة التعديلات والبيانات الآن
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut size={13} />
                      تسجيل الخروج من الحساب
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    سجل دخولك بحساب Google لحفظ وتأمين بنك الأسئلة والاختبارات وتعديلاتك تلقائياً والوصول إليها من أي جهاز.
                  </p>

                  {authError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-[11px] font-semibold text-red-700 dark:text-red-300">
                      {authError}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={handlePopupGoogleSignIn}
                    className="w-full py-2.5 bg-[#4285F4] hover:bg-[#3367D6] disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#ffffff" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#ffffff" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                      <path fill="#ffffff" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#ffffff" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>{authLoading ? 'جاري تسجيل الدخول...' : 'دخول بحساب Google'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">تخصيص بيانات وإعدادات المنصة</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">اسم المدرسة المعتمد بالترويسة</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">اسم المستخدم / المعلم</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">الفصل الدراسي</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-850 dark:text-white"
                  >
                    <option value="الفصل الدراسي الأول">الفصل الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الثاني</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">العام الدراسي</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-755 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1.5">
                <span className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400">النسخ الاحتياطي ومزامنة الملفات (JSON):</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleBackupExport}
                    className="flex items-center justify-center gap-1 bg-[#0F4C81] text-white text-[10px] py-1.5 rounded-md font-bold"
                  >
                    <Download size={11} />
                    تصدير ملف مدرستك
                  </button>
                  <label
                    className="flex items-center justify-center gap-1 bg-[#2E7D32] text-white text-[10px] py-1.5 rounded-md font-bold cursor-pointer text-center"
                  >
                    <Upload size={11} />
                    استيراد ملف backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleBackupImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-2 text-center">
                {showResetConfirm ? (
                  <div className="bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200 dark:border-red-900/40 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[10px] font-bold text-red-800 dark:text-red-300 leading-normal">
                      هل أنت متأكد من رغبتك في إعادة تعيين بنك الأسئلة بالكامل إلى البنك الأصلي الافتراضي؟ ستفقد أي أسئلة قمت بإضافتها يدوياً.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          handleResetQuestions();
                          setShowResetConfirm(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 text-[10px] font-semibold rounded cursor-pointer"
                      >
                        نعم، أعد الضبط
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 px-2.5 py-1 text-[10px] font-semibold rounded cursor-pointer"
                      >
                        تراجع
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleClearAllQuestions();
                        setShowSettings(false);
                      }}
                      className="w-full text-center bg-red-100/80 hover:bg-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-300 py-1.5 rounded-md font-bold text-[11px] border border-red-300 dark:border-red-900/50 transition cursor-pointer"
                    >
                      تفريغ وحذف جميع الأسئلة والتقسيمات الحالية ({questions.length} سؤال)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="w-full text-center bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 py-1.5 rounded-md font-bold text-[11px] border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      إعادة تعيين بنك الأسئلة الأصلي ({initialQuestions.length} سؤالاً)
                    </button>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                      يعيد البنك لوضع المصنع ومزامنة كامل الـ {initialQuestions.length} سؤالاً للفصلين الأول والثاني 1447هـ
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#0F4C81] text-white text-xs font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Main content container split layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-3 md:p-4 gap-4">
        
        {/* Sidebar navigation links (no-print) */}
        <nav id="app-sidebar-tabs" className="md:w-56 shrink-0 flex flex-col gap-1 no-print">
          
          <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2.5 mb-1 tracking-wider">
            القائمة الرئيسية
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-150/50 dark:hover:bg-slate-800/40'}`}
          >
            <Layers size={14} />
            <span>لوحة التحكم الرئيسية</span>
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${activeTab === 'bank' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-150/50 dark:hover:bg-slate-800/40'}`}
          >
            <BookOpen size={14} />
            <span>إدارة بنك الأسئلة</span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${activeTab === 'generator' ? 'bg-gradient-to-r from-[#0F4C81] to-[#2E7D32]/90 text-white shadow-xs' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-150/50 dark:hover:bg-slate-800/40'}`}
          >
            <Sparkles size={14} className={activeTab === 'generator' ? 'animate-bounce text-yellow-300' : 'text-yellow-550'} />
            <span>توليد بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={() => setActiveTab('creator')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${activeTab === 'creator' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-150/50 dark:hover:bg-slate-800/40'}`}
          >
            <FileCheck size={14} />
            <span>إنشاء اختبار جديد</span>
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${activeTab === 'print' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-150/50 dark:hover:bg-slate-800/40'}`}
          >
            <Printer size={14} />
            <span>المعاينة والطباعة</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${activeTab === 'reports' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-150/50 dark:hover:bg-slate-800/40'}`}
          >
            <BarChart3 size={14} />
            <span>التقارير والإحصائيات</span>
          </button>

          {/* Side Info */}
          <div className="mt-auto p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-750 rounded-xl flex items-start gap-2 text-[10px] leading-relaxed text-slate-400">
            <HelpCircle size={13} className="shrink-0 mt-0.5 text-slate-300" />
            <div>
              <p>مدرسة هجينة تعمل بالكامل دون اتصال لتخزين سجلاتك وحمايتها محلياً على المتصفح.</p>
              <span className="text-[8px] hover:underline cursor-pointer block mt-1 font-bold" onClick={() => setShowSettings(true)}>ترغب بالنقل؟ خذ نسخة احتياطية</span>
            </div>
          </div>
        </nav>

        {/* Dynamic Display workspace panels */}
        <main id="app-dynamic-content" className="flex-1 min-w-0">
          
          {/* Active Tab: Dashboard Layout */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 no-print">
              
              {/* Salutations Hero Card */}
              <div className="bg-gradient-to-r from-[#0F4C81] to-[#2E7D32]/90 rounded-2xl p-4 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">أهلاً بك، <span className="font-mono">{googleUser?.email || teacherName || 'ضيف'}</span>!</h2>
                  <p className="text-blue-100 text-xs">
                    مرحباً بك في المنصة الذكية لإدارة بنك الأسئلة وتوليد وطباعة اختبارات الدراسات الإسلامية للصف الثاني المتوسط.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white/15 p-1 rounded-xl border border-white/20 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setSemester('الفصل الدراسي الأول');
                        localStorage.setItem('islamic_semester', 'الفصل الدراسي الأول');
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${semester === 'الفصل الدراسي الأول' ? 'bg-white text-[#0F4C81] shadow-xs' : 'text-blue-100 hover:text-white'}`}
                    >
                      الفصل الأول
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSemester('الفصل الدراسي الثاني');
                        localStorage.setItem('islamic_semester', 'الفصل الدراسي الثاني');
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${semester === 'الفصل الدراسي الثاني' ? 'bg-white text-[#2E7D32] shadow-xs' : 'text-blue-100 hover:text-white'}`}
                    >
                      الفصل الثاني
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 flex justify-between items-center group cursor-pointer hover:shadow-xs transition" onClick={() => setActiveTab('bank')}>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">إجمالي أسئلة بنكك</span>
                    <strong className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{questions.length}</strong>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#0F4C81]/15 text-[#0F4C81] flex items-center justify-center font-bold">
                    <BookOpen size={16} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 flex justify-between items-center group cursor-pointer hover:shadow-xs transition" onClick={() => setActiveTab('print')}>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">الاختبارات المصدرة</span>
                    <strong className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{exams.length}</strong>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    <Printer size={16} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-750 flex justify-between items-center group cursor-pointer hover:shadow-xs transition" onClick={() => setActiveTab('print')}>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">نماذج متعددة اليوم</span>
                    <strong className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{exams.length * 4} نماذج</strong>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Layers size={16} />
                  </div>
                </div>
              </div>

              {/* Launcher widgets / Bento columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Info and quick tutorials */}
                <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">الوصول السريع لمهام المدرس</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    <div 
                      onClick={() => setActiveTab('generator')}
                      className="p-3 bg-slate-50 hover:bg-sky-50/40 rounded-lg border border-slate-100 transition cursor-pointer text-right flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                          <Sparkles size={13} className="text-yellow-500 animate-pulse" />
                          مولد الأسئلة بالذكاء الاصطناعي
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">توليد وصياغة أسئلة فقه وتوحيد وتفسير ذكية بمطابقة التعليم وحفظها بالبنك محلياً.</p>
                      </div>
                      <ChevronLeft size={13} className="self-end text-slate-300 mt-1.5" />
                    </div>

                    <div 
                      onClick={() => setActiveTab('creator')}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/30 rounded-lg border border-slate-100 transition cursor-pointer text-right flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                          <FileCheck size={13} className="text-[#2E7D32]" />
                          توليد وطباعة اختبار فوري
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">إعداد مواصفات الامتحان واختيار الأسئلة لتوليد نماذج متعددة (أ، ب، ج، د) مبعثرة مع مفاتيح حلول جاهزة.</p>
                      </div>
                      <ChevronLeft size={13} className="self-end text-slate-300 mt-1.5" />
                    </div>

                    <div 
                      onClick={() => setActiveTab('reports')}
                      className="p-3 bg-slate-50 hover:bg-amber-50/35 rounded-lg border border-slate-100 transition cursor-pointer text-right flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                          <BarChart3 size={13} className="text-amber-500" />
                          الإحصائيات والتحليلات
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">تحليل وتوزيع نسب التفوق والتقارير الرسومية وموازنة الصعوبة في الأسئلة للامتحانات الورقية.</p>
                      </div>
                      <ChevronLeft size={13} className="self-end text-slate-300 mt-1.5" />
                    </div>

                  </div>
                </div>

                {/* Right col: Bank Overview */}
                <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800">بيانات البنك التفصيلية</h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                      <span className="text-slate-400">التوحيد:</span>
                      <strong className="text-slate-700 font-bold font-mono">{questions.filter(q => q.subject === 'توحيد').length} أسئلة</strong>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                      <span className="text-slate-400">التفسير:</span>
                      <strong className="text-slate-700 font-bold font-mono">{questions.filter(q => q.subject === 'تفسير').length} أسئلة</strong>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-50">
                      <span className="text-slate-400">الحديث:</span>
                      <strong className="text-slate-700 font-bold font-mono">{questions.filter(q => q.subject === 'حديث').length} أسئلة</strong>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">الفقه:</span>
                      <strong className="text-slate-700 font-bold font-mono">{questions.filter(q => q.subject === 'فقه').length} أسئلة</strong>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2 text-[10px] leading-relaxed border border-slate-100">
                      📝 يمكنك الضغط على "إضافة سؤال جديد" بتبوب بنك الأسئلة أو إدارة المولد لتوسيع وتغذية قاعدة بيانات الأسئلة.
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Active Tab: Question Bank View */}
          {activeTab === 'bank' && (
            <QuestionBankView
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onClearAllQuestions={handleClearAllQuestions}
              onReplaceAllQuestions={handleReplaceAllQuestions}
              onBulkAddQuestions={handleBulkAddQuestions}
              activeSemester={semester}
            />
          )}

          {/* Active Tab: AI Generator View */}
          {activeTab === 'generator' && (
            <AIGenerateView
              onAddGeneratedQuestions={handleAddAIQuestions}
              defaultSemester={semester}
            />
          )}

          {/* Active Tab: Exam Creator View */}
          {activeTab === 'creator' && (
            <ExamCreatorView
              questions={questions}
              onSaveExam={handleAddExam}
              schoolName={schoolName}
              academicYear={academicYear}
              semester={semester}
              onSemesterChange={(sem) => {
                setSemester(sem);
                localStorage.setItem('islamic_semester', sem);
              }}
              onNotify={showToast}
            />
          )}

           {/* Active Tab: Preview and PDF Print Layout */}
          {activeTab === 'print' && (
            <PrintView
              exams={exams}
              onDeleteExam={handleDeleteExam}
            />
          )}

          {/* Active Tab: Statistics and Reports list */}
          {activeTab === 'reports' && (
            <ReportsView
              questions={questions}
              exams={exams}
            />
          )}

        </main>
      </div>

      {/* 3. Auto save floating Indicator at bottom left with fade transition */}
      {autoSaveActive && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#2E7D32] border border-emerald-500 shadow-md text-white rounded-xl py-2.5 px-4 text-xs font-bold font-sans animate-bounce flex items-center gap-2 no-print">
          <Check size={16} />
          <span>✓ تم الحفظ والمزامنة تلقائياً</span>
        </div>
      )}

      {/* App Footer space */}
      <footer className="py-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400 font-medium no-print">
        <span>© 2026 - نظام اختبارات الدراسات الإسلامية الإلكتروني للصف الثاني المتوسط | كافة البيانات مخزنة بحماية قصوى محلياً.</span>
      </footer>

      {/* Custom Toast Notification Component (Replaces native alerts) */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200' 
            : toast.type === 'error'
            ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200'
            : 'bg-[#0F4C81]/10 dark:bg-[#0F4C81]/20 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-200'
        }`}>
          {toast.type === 'success' && <Check size={16} className="text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <X size={16} className="text-red-500 shrink-0" />}
          {toast.type === 'info' && <AlertCircle size={16} className="text-blue-500 shrink-0" />}
          <span className="text-xs font-bold leading-normal">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
