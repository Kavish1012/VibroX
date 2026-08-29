import { LogoMark } from "./icons";

interface Props {
  visible: boolean;
  message?: string;
  onDismiss?: () => void;
}

const FREQUENCIES = [
  { delay: "0.05s", duration: "0.62s", max: "82%" },
  { delay: "0.22s", duration: "0.55s", max: "100%" },
  { delay: "0.11s", duration: "0.78s", max: "68%" },
  { delay: "0.35s", duration: "0.60s", max: "94%" },
  { delay: "0.08s", duration: "0.72s", max: "88%" },
  { delay: "0.28s", duration: "0.58s", max: "100%" },
  { delay: "0.15s", duration: "0.66s", max: "75%" },
  { delay: "0.39s", duration: "0.53s", max: "92%" },
  { delay: "0.18s", duration: "0.69s", max: "84%" },
  { delay: "0.04s", duration: "0.61s", max: "96%" },
  { delay: "0.31s", duration: "0.74s", max: "70%" },
  { delay: "0.14s", duration: "0.57s", max: "90%" },
  { delay: "0.26s", duration: "0.64s", max: "78%" },
];

export default function SoundWaveLoader({ visible, message = "Tuning sound engine…", onDismiss }: Props) {
  if (!visible) return null;
  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-md"
      style={{ animation: "splashIn 0.35s ease both, splashSelfDismiss 2.6s ease forwards" }}
      aria-hidden={!visible}
      title="Click to enter VibroX"
    >
      {/* Ambient soundwave glow */}
      <div className="pointer-events-none absolute h-96 w-96 animate-pulse rounded-full bg-brand/15 blur-[120px]" />

      <div className="relative flex flex-col items-center">
        {/* Pulsing acoustic rings */}
        <div className="relative mb-8 grid place-items-center">
          <span className="absolute h-28 w-28 animate-ping rounded-full border border-brand/30 opacity-40 [animation-duration:2.4s]" />
          <span className="absolute h-20 w-20 animate-ping rounded-full border border-brand/40 opacity-30 [animation-duration:1.6s]" />

          <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand via-[#ff881a] to-[#b83b00] text-[#1b0d00] shadow-[0_0_45px_rgba(255,122,0,0.45)]">
            <LogoMark width={32} height={32} />
          </div>
        </div>

        {/* Animated Sound Wave Bars */}
        <div className="flex h-14 items-center justify-center gap-1.5 px-4" aria-label="Loading sound waves">
          {FREQUENCIES.map((bar, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-[#b83b00] via-brand to-[#ffc894] shadow-[0_0_12px_rgba(255,122,0,0.5)]"
              style={{
                height: bar.max,
                animation: `soundWaveBar ${bar.duration} ease-in-out infinite alternate`,
                animationDelay: bar.delay,
              }}
            />
          ))}
        </div>

        {/* Brand & status message */}
        <div className="mt-7 text-center">
          <p className="text-[24px] font-black tracking-tight text-white">
            Vibro<span className="text-brand">X</span>
          </p>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-[11.5px] font-semibold tracking-[0.22em] text-white/45 uppercase">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            {message}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes soundWaveBar {
          0% {
            transform: scaleY(0.18);
            opacity: 0.55;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        /* JS-independent backstop: the splash can never remain on screen
           even if the dismissal timer ever fails to fire. */
        @keyframes splashIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashSelfDismiss {
          0%, 88% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; }
        }
      `}</style>
    </div>
  );
}
