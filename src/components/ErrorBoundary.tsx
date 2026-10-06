import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    localStorage.clear(); // Clear potentially corrupt state/tokens
    window.location.hash = "";
    window.location.pathname = "/";
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-xl w-full space-y-6 shadow-2xl relative overflow-hidden">
            {/* Background ambient light */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5 relative z-10">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Tizimda nosozlik yuz berdi</h2>
                <p className="text-xs text-slate-400">Kutilmagan runtime xatolik aniqlandi</p>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 overflow-auto max-h-48 scrollbar-thin">
                <p className="text-rose-400 font-mono text-xs font-bold leading-relaxed break-words">
                  {this.state.error?.toString() || "Noma'lum xatolik"}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-slate-500 font-mono text-[10px] mt-2 leading-tight overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tizimning ichki holati yoki noto'g'ri kesh ma'lumotlari tufayli xatolik yuz bergan bo'lishi mumkin. Quyidagi tugma orqali keshni tozalab, tizimni qayta yuklashingiz mumkin.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 relative z-10">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-rose-500 hover:bg-rose-400 text-slate-950 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Keshni tozalash va Qayta yuklash
              </button>
              <button
                onClick={() => {
                  window.location.hash = "";
                  window.location.reload();
                }}
                className="px-5 bg-slate-800 hover:bg-slate-750 text-slate-200 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Bosh sahifa
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
