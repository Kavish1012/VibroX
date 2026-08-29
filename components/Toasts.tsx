import { usePlayer } from "../store/player";
import { cn } from "../utils/cn";

export default function Toasts() {
  const { toasts } = usePlayer();
  return (
    <div className="pointer-events-none fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+168px)] z-[60] grid gap-2 sm:right-6 sm:bottom-28 lg:bottom-24">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "animate-toast-in max-w-[86vw] rounded-xl border px-3.5 py-2.5 text-[12.5px] font-medium shadow-[0_18px_40px_rgba(0,0,0,.55)] backdrop-blur-md",
            t.tone === "error"
              ? "border-danger/40 bg-[#2b1111]/95 text-[#ffb4b4]"
              : t.tone === "success"
                ? "border-brand/40 bg-[#241708]/95 text-[#ffd7a8]"
                : "border-white/10 bg-[#232323]/95 text-white",
          )}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
