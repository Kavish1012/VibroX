import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/runtime errors so the preview never turns into a blank page.
 * Shows the message plus a reload action instead.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced in the UI below; logged for anyone with devtools open.
    console.error("VibroX crashed:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-6">
        <div className="w-full max-w-[520px] rounded-2xl border border-danger/30 bg-[#161616] p-6">
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-danger uppercase">
            something broke
          </p>
          <h1 className="mt-3 text-[22px] font-black tracking-tight">VibroX couldn't start</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-white/55">
            The player hit an unexpected error. Reloading usually fixes it — your saved tracks are
            stored on this device and will still be here.
          </p>
          <pre className="scrollbar-thin mt-4 max-h-40 overflow-auto rounded-xl border border-line bg-black/60 p-3 text-[11.5px] leading-relaxed break-words whitespace-pre-wrap text-white/60">
            {error.message || String(error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 h-11 rounded-full bg-brand px-5 text-[13px] font-bold text-[#1b0d00] transition hover:bg-brand-soft"
          >
            Reload VibroX
          </button>
        </div>
      </div>
    );
  }
}
