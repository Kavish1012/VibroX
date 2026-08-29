import { cn } from "../utils/cn";

const BARS = [0, 1, 2, 3, 4, 5, 6];

export default function Visualizer({ active, className }: { active?: boolean; className?: string }) {
  return (
    <div
      className={cn("flex h-5 items-end gap-[3px]", !active && "opacity-45", className)}
      aria-hidden
    >
      {BARS.map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-brand",
            active ? "animate-bar" : "h-[20%]",
          )}
          style={
            active
              ? {
                  animationDelay: `${(i % 4) * 0.11}s`,
                  animationDuration: `${0.55 + (i % 3) * 0.12}s`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
