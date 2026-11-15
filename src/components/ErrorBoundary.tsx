import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  declare props: Readonly<ErrorBoundaryProps>;
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'حدث خطأ غير متوقع في تشغيل المنصة.'
    };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-right"
        >
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-red-700">
              حدث خلل مؤقت أثناء تحميل المنصة
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              يرجى إعادة تحميل الصفحة، أو مسح البيانات المؤقتة إذا استمر الخطأ.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] font-mono text-slate-700 break-words">
              {this.state.errorMessage}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                إعادة تحميل الصفحة
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                إعادة ضبط المحلي
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
