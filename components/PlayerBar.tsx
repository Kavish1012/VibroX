import { usePlayer } from "../store/player";
import { cn } from "../utils/cn";
import { fmt } from "../lib/format";
import CoverArt from "./CoverArt";
import Visualizer from "./Visualizer";
import {
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

function Range({
  value,
  max,
  onChange,
  className,
  ariaLabel,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  className?: string;
  ariaLabel: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <input
      type="range"
      min={0}
      max={max || 1}
      step={max > 3 ? 0.1 : 0.01}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("vibro w-full", className)}
      style={{ ["--fill" as string]: `${pct}%` }}
    />
  );
}

export default function PlayerBar({ onOpenFullScreen }: { onOpenFullScreen?: () => void }) {
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
  } = usePlayer();

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest("button, input, a")) return;
    onOpenFullScreen?.();
  };

  return (
    <div
      onClick={handleBarClick}
      title="Click empty space to expand full-screen player"
      className="relative z-30 shrink-0 cursor-pointer border-t border-line bg-[#0e0e0ef7] transition-colors hover:bg-[#131313f7] backdrop-blur-2xl"
    >
      <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-2.5 lg:grid-cols-[minmax(200px,1fr)_minmax(280px,2fr)_minmax(200px,1fr)] lg:gap-6">
        {/* Now playing */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="relative">
            <CoverArt
              track={current ?? { id: "none", title: "VibroX", artist: "", album: "", duration: 0, liked: false, playCount: 0, createdAt: 0 }}
              url={current ? coverFor(current) : undefined}
              className="h-10 w-10 sm:h-14 sm:w-14"
              rounded="rounded-xl"
              playing={isPlaying}
            />
            {isLoading && (
              <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/55">
                <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/25 border-t-brand" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold sm:text-[13.5px]">
              {current ? current.title : "Nothing playing"}
            </p>
            <p className="mt-0.5 truncate text-[10.5px] text-white/50 sm:text-[11.5px]">
              {current ? current.artist : "Pick a track to get started"}
            </p>
          </div>
          <button
            onClick={() => current && toggleLike(current)}
            disabled={!current}
            aria-label="Like"
            className={cn(
              "ml-1 hidden h-9 w-9 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white sm:grid",
              current?.liked && "text-brand hover:text-brand",
            )}
          >
            <HeartIcon width={17} height={17} filled={current?.liked} />
          </button>
        </div>

        {/* Controls + progress */}
        <div className="order-3 col-span-2 grid gap-1 sm:order-none sm:col-span-1 sm:gap-1.5">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5">
            <button
              onClick={toggleShuffle}
              aria-label="Shuffle"
              title="Shuffle"
              className={cn(
                "hidden h-9 w-9 place-items-center rounded-full text-white/55 transition hover:text-white sm:grid",
                isShuffle && "text-brand hover:text-brand",
              )}
            >
              <ShuffleIcon width={17} height={17} />
            </button>
            <button
              onClick={prev}
              aria-label="Previous track"
              className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:text-white sm:h-9 sm:w-9"
            >
              <PrevIcon width={18} height={18} />
            </button>
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-black transition hover:scale-105 hover:bg-white/90 active:scale-95 sm:h-11 sm:w-11"
            >
              {isPlaying ? <PauseIcon width={17} height={17} /> : <PlayIcon width={17} height={17} />}
            </button>
            <button
              onClick={next}
              aria-label="Next track"
              className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:text-white sm:h-9 sm:w-9"
            >
              <NextIcon width={18} height={18} />
            </button>
            <button
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeat}`}
              title={`Repeat: ${repeat}`}
              className={cn(
                "hidden h-9 w-9 place-items-center rounded-full text-white/55 transition hover:text-white sm:grid",
                repeat !== "off" && "text-brand hover:text-brand",
              )}
            >
              {repeat === "one" ? <RepeatOneIcon width={17} height={17} /> : <RepeatIcon width={17} height={17} />}
            </button>
          </div>

          <div className="grid grid-cols-[28px_1fr_28px] items-center gap-1.5 text-[9.5px] tabular-nums text-white/45 sm:grid-cols-[34px_1fr_34px] sm:gap-2 sm:text-[10.5px]">
            <span className="text-right">{fmt(time)}</span>
            <Range value={time} max={duration || current?.duration || 0} onChange={seek} ariaLabel="Seek" />
            <span>{fmt(duration || current?.duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden items-center justify-end gap-3 lg:flex">
          <Visualizer active={isPlaying} />
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className={cn("text-white/55 transition hover:text-white", muted && "text-brand")}
          >
            {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
          </button>
          <div className="w-[104px]">
            <Range
              value={muted ? 0 : volume}
              max={1}
              onChange={setVolume}
              ariaLabel="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
