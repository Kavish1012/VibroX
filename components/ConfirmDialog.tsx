import { useEffect } from "react";
import { CloseIcon } from "./icons";

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
      <div className="animate-fade-up w-full max-w-[420px] rounded-2xl border border-line bg-[#161616] p-6 shadow-[0_30px_90px_rgba(0,0,0,.7)]">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[18px] font-extrabold tracking-tight">{title}</h3>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/60">{body}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="h-10 rounded-full border border-line px-5 text-[13px] font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-10 rounded-full bg-danger px-5 text-[13px] font-bold text-[#2a0505] transition hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
