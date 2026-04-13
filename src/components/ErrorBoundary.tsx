import React, { Component } from "react";
import GlassCard from "./GlassCard";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component<any, any> {
  props: any;
  state: any = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (error?.message) {
          const parsed = JSON.parse(error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Database Error: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-emerald-50">
          <GlassCard className="max-w-md w-full p-8 text-center space-y-6 border-red-500/30">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-emerald-900">Oops! Something went wrong</h2>
              <p className="text-emerald-800/60 text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>
            {isFirestoreError && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                Permission Denied or Connection Issue
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </button>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
