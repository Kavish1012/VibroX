import { useEffect } from "react";
import { usePlayer } from "../store/player";
import { cn } from "../utils/cn";
import { fmt } from "../lib/format";
import { safeImageUrl } from "../lib/safe";
import CoverArt from "./CoverArt";
import {
  CloseIcon,
  HeartIcon,
  MuteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  VolumeIcon,
} from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenQueue?: () => void;
}

const FULLSCREEN_BARS = Array.from({ length: 28 }, (_, i) => ({
  delay: `${(i % 7) * 0.08}s`,
  duration: `${0.5 + (i % 5) * 0.12}s`,
}));

export default function FullScreenPlayer({ open, onClose, onOpenQueue }: Props) {
  const {
    current,
    coverFor,
    isPlaying,
    isLoading,
    time,
    duration,
    seek,
    toggle,
    next,
    prev,
    isShuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    volume,
    setVolume,
    muted,
    toggleMute,
    toggleLike,
    queue,
  } = usePlayer();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const artUrl = current ? safeImageUrl(coverFor(current)) : undefined;
  const maxDur = duration || current?.duration || 0;
  const pct = maxDur > 0 ? Math.min(100, (time / maxDur) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col justify-between overflow-hidden bg-[#070707] text-white transition-opacity duration-300"
      role="dialog"
      aria-label="Full screen player"
    >
      {/* Blurred background cover art glow */}
      {artUrl ? (
        <div
          className="pointer-events-none absolute inset-0 scale-125 opacity-25 blur-[95px] transition-all duration-700"
          style={{
            backgroundImage: `url(${artUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 opacity-30 blur-[110px] bg-gradient-to-br from-brand/40 via-[#181818] to-black" />
      )}

      {/* Dark overlay gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#050505]" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-7 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 items-center justify-center">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full bg-brand",
                isPlaying && "animate-ping",
              )}
            />
          </span>
          <span className="text-[11px] font-extrabold tracking-[0.24em] text-white/55 uppercase">
            {isPlaying ? "Now Playing Fullscreen" : "Paused"}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Collapse fullscreen player"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12.5px] font-bold text-white/80 transition hover:border-white/30 hover:bg-white/15 hover:text-white"
        >
          <span>Close</span>
          <CloseIcon width={14} height={14} />
        </button>
      </header>

      {/* Main Center Content (80% Zoomed Out) */}
      <main className="relative z-10 mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center justify-center px-6 py-2 scale-[0.80] sm:scale-[0.82] origin-center transition-transform">
        {/* Cover Art Container */}
        <div className="relative mb-5 aspect-square w-full max-w-[280px] sm:max-w-[310px]">
          <CoverArt
            track={
              current ?? {
                id: "none",
                title: "VibroX",
                artist: "",
                album: "",
                duration: 0,
                liked: false,
                playCount: 0,
                createdAt: 0,
              }
            }
            url={artUrl}
            className="h-full w-full shadow-[0_28px_80px_rgba(0,0,0,0.85)]"
            rounded="rounded-[28px]"
          />
          {isLoading && (
            <div className="absolute inset-0 grid place-items-center rounded-[28px] bg-black/65">
              <span className="h-10 w-10 animate-spin-slow rounded-full border-3 border-white/25 border-t-brand" />
            </div>
          )}
        </div>

        {/* Dynamic Sound Waves beneath Cover */}
        <div className="mb-6 flex h-8 items-end justify-center gap-1.5 px-4" aria-hidden>
          {FULLSCREEN_BARS.map((bar, idx) => (
            <span
              key={idx}
              className={cn(
                "w-1 rounded-full transition-colors duration-300",
                isPlaying
                  ? "bg-gradient-to-t from-brand/70 via-brand to-[#ffc894]"
                  : "h-1.5 bg-white/20",
              )}
              style={
                isPlaying
                  ? {
                      animation: `fullscreenWave ${bar.duration} ease-in-out infinite alternate`,
                      animationDelay: bar.delay,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {/* Title, Artist, Like */}
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-black tracking-tight text-white sm:text-[26px]">
              {current ? current.title : "No song selected"}
            </h1>
            <p className="mt-1 truncate text-[14.5px] font-medium text-white/60">
              {current ? current.artist : "Choose a track from your library"}
              {current?.album ? ` — ${current.album}` : ""}
            </p>
          </div>

          <button
            onClick={() => current && toggleLike(current)}
            disabled={!current}
            aria-label="Toggle Like"
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:scale-105 hover:border-white/25 hover:text-white",
              current?.liked && "border-brand/40 bg-brand/15 text-brand hover:text-brand",
            )}
          >
            <HeartIcon width={21} height={21} filled={current?.liked} />
          </button>
        </div>

        {/* Seek Bar */}
        <div className="mt-7 w-full">
          <input
            type="range"
            min={0}
            max={maxDur || 1}
            step={0.1}
            value={time}
            aria-label="Seek"
            onChange={(e) => seek(Number(e.target.value))}
            className="vibro h-1.5 w-full"
            style={{ ["--fill" as string]: `${pct}%` }}
          />
          <div className="mt-2 flex items-center justify-between text-[12px] font-semibold tabular-nums text-white/45">
            <span>{fmt(time)}</span>
            <span>{fmt(maxDur)}</span>
          </div>
        </div>

        {/* Quick Skip -10s / Restart / +10s bar */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => seek(Math.max(0, time - 10))}
            aria-label="Rewind 10 seconds"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-bold text-white/70 transition hover:border-white/25 hover:text-white"
          >
            <span>-10s</span>
          </button>
          <button
            onClick={() => seek(0)}
            aria-label="Restart song from beginning"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11.5px] font-bold text-white/70 transition hover:border-brand/40 hover:text-brand"
          >
            <span>↺ Restart</span>
          </button>
          <button
            onClick={() => seek(Math.min(maxDur, time + 10))}
            aria-label="Forward 10 seconds"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11.5px] font-bold text-white/70 transition hover:border-white/25 hover:text-white"
          >
            <span>+10s</span>
          </button>
        </div>

        {/* Main Controls */}
        <div className="mt-5 flex w-full items-center justify-between px-2 sm:px-6">
          <button
            onClick={toggleShuffle}
            aria-label="Toggle Shuffle"
            title="Shuffle"
            className={cn(
              "grid h-11 w-11 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white",
              isShuffle && "bg-brand/15 text-brand hover:text-brand",
            )}
          >
            <ShuffleIcon width={20} height={20} />
          </button>

          <button
            onClick={prev}
            aria-label="Previous Track"
            className="grid h-12 w-12 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
          >
            <PrevIcon width={23} height={23} />
          </button>

          <button
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="grid h-16 w-16 place-items-center rounded-full bg-white text-black shadow-[0_0_35px_rgba(255,255,255,0.25)] transition hover:scale-105 hover:bg-white/95 active:scale-95"
          >
            {isPlaying ? (
              <PauseIcon width={24} height={24} />
            ) : (
              <PlayIcon width={24} height={24} />
            )}
          </button>

          <button
            onClick={next}
            aria-label="Next Track"
            className="grid h-12 w-12 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
          >
            <NextIcon width={23} height={23} />
          </button>

          <button
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
            title={`Repeat: ${repeat}`}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white",
              repeat !== "off" && "bg-brand/15 text-brand hover:text-brand",
            )}
          >
            {repeat === "one" ? (
              <RepeatOneIcon width={20} height={20} />
            ) : (
              <RepeatIcon width={20} height={20} />
            )}
          </button>
        </div>
      </main>

      {/* Bottom Volume, Queue & Hint Footer */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-black/40 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className={cn(
              "text-white/60 transition hover:text-white",
              muted && "text-brand",
            )}
          >
            {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
          </button>
          <div className="w-28 sm:w-36">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(e) => setVolume(Number(e.target.value))}
              className="vibro w-full"
              style={{
                ["--fill" as string]: `${(muted ? 0 : volume) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenQueue && (
            <button
              onClick={() => {
                onClose();
                onOpenQueue();
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11.5px] font-bold text-white/80 transition hover:border-brand/50 hover:text-white"
            >
              <span>Queue ({queue.length})</span>
            </button>
          )}

          <p className="hidden text-[11px] font-medium text-white/35 sm:block">
            Press <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-white/70">Esc</kbd> to return
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fullscreenWave {
          0% {
            height: 6px;
          }
          100% {
            height: 30px;
          }
        }
      `}</style>
    </div>
  );
}
