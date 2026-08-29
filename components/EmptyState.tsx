import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { MusicIcon } from "./icons";

interface Props {
  title: string;
  hint?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function EmptyState({ title, hint, action, children, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-line/80 bg-white/[0.015] px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-white/35">
        <MusicIcon width={22} height={22} />
      </span>
      <p className="text-[15.5px] font-bold text-white/90">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-[380px] text-[12.5px] leading-relaxed text-white/45">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
      {children}
    </div>
  );
}
