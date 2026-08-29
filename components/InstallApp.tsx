import { useEffect, useReducer, useState } from "react";
import { cn } from "../utils/cn";
import { usePlayer } from "../store/player";
import { CloseIcon, DownloadIcon, RefreshIcon } from "./icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Shared install-prompt store. The browser fires `beforeinstallprompt` only
 * once and its event is one-shot, so we capture it in one place, consume it
 * exactly once, and keep every install button in sync. The button itself is
 * stateless — it renders on every load/refresh until the app is installed.
 */
const store = {
  captured: null as BeforeInstallPromptEvent | null,
  used: false,
  installed:
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true),
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    if (!store.captured && !store.used && !store.installed) {
      store.captured = e as BeforeInstallPromptEvent;
      emit();
    }
  });
  window.addEventListener("appinstalled", () => {
    store.installed = true;
    store.captured = null;
    store.used = false;
    emit();
  });
}

function useInstallPrompt() {
  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);

  const canNative = !store.installed && Boolean(store.captured) && !store.used;

  /** Shows the native install dialog once. Returns false when unavailable. */
  const requestNative = async (): Promise<boolean> => {
    if (!store.captured || store.used) return false;
    store.used = true; // consume the one-shot event up front
    try {
      await store.captured.prompt();
      await store.captured.userChoice.catch(() => undefined);
    } catch {
      /* fall through to the manual instructions */
    }
    emit();
    return true;
  };

  return { installed: store.installed, canNative, requestNative };
}

function InstallHelpModal({
  open,
  onClose,
  nativeTried,
}: {
  open: boolean;
  onClose: () => void;
  nativeTried: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
      <div className="animate-fade-up w-full max-w-[420px] rounded-2xl border border-line bg-[#161616] p-6 shadow-[0_30px_90px_rgba(0,0,0,.75)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <DownloadIcon width={20} height={20} />
            </span>
            <div>
              <h3 className="text-[17px] font-extrabold tracking-tight">Install VibroX</h3>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/45">
                {nativeTried
                  ? "The native install dialog is one-shot per visit and has been used. Refresh the page to get a fresh dialog, or use the steps below:"
                  : "Your browser didn't offer an install dialog here. Refresh to re-arm it, or use the steps below:"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 text-[12.5px] leading-relaxed">
          <div className="rounded-xl border border-line bg-black/30 p-3.5">
            <p className="font-bold text-white/85">iPhone / iPad (Safari)</p>
            <p className="mt-1 text-white/55">
              Tap the <span className="text-white/80">Share</span> button, scroll down and choose{" "}
              <span className="text-white/80">“Add to Home Screen”</span>, then confirm.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-black/30 p-3.5">
            <p className="font-bold text-white/85">Android (Chrome)</p>
            <p className="mt-1 text-white/55">
              Open the <span className="text-white/80">⋮ menu</span> and choose{" "}
              <span className="text-white/80">“Install app”</span> (or “Add to Home screen”).
            </p>
          </div>
          <div className="rounded-xl border border-line bg-black/30 p-3.5">
            <p className="font-bold text-white/85">Desktop (Chrome / Edge)</p>
            <p className="mt-1 text-white/55">
              Click the <span className="text-white/80">install icon</span> in the address bar, or
              open <span className="text-white/80">⋮ menu → Cast, save, and share → Install page as
              app…</span>
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-white/35">
            Tip: inside an embedded preview frame browsers don't offer installers — open VibroX in
            its own browser tab (or the deployed URL) and the install option will appear.
          </p>
        </div>

        <div className="mt-6 grid gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-[13px] font-bold text-[#1b0d00] transition hover:bg-brand-soft"
          >
            <RefreshIcon width={15} height={15} />
            Refresh &amp; retry install dialog
          </button>
          <button
            onClick={onClose}
            className="h-10 w-full rounded-full border border-line text-[12.5px] font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

interface InstallButtonProps {
  className?: string;
  label?: string;
  /** icon-only on small screens (top-bar usage) */
  compact?: boolean;
}

/**
 * Permanent PWA install button. Renders on every load/refresh until the app
 * is installed. Click behavior never silently fails:
 *  1. Native install dialog when the browser provided its one-shot prompt.
 *  2. Otherwise: manual-steps modal + a toast so the click is always visible.
 */
export default function InstallButton({ className, label = "Install VibroX", compact }: InstallButtonProps) {
  const { installed, canNative, requestNative } = useInstallPrompt();
  const { pushToast } = usePlayer();
  const [helpOpen, setHelpOpen] = useState(false);
  const [nativeTried, setNativeTried] = useState(false);

  if (installed) return null;

  const handleClick = async () => {
    if (canNative) {
      const handled = await requestNative();
      setNativeTried(true);
      if (handled) return;
    }
    setNativeTried(true);
    setHelpOpen(true);
    pushToast("Install steps opened — your browser blocks the install dialog here", "default");
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Install VibroX as an app"
        aria-label="Install VibroX as an app"
        className={cn(
          "flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-white/5 px-4 text-[12px] font-bold text-white/80 transition hover:border-brand/50 hover:bg-brand/10 hover:text-brand active:scale-95",
          className,
        )}
      >
        <DownloadIcon width={15} height={15} />
        {compact ? (
          <span className="hidden sm:inline">{label}</span>
        ) : (
          <span>{label}</span>
        )}
      </button>
      <InstallHelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        nativeTried={nativeTried}
      />
    </>
  );
}
