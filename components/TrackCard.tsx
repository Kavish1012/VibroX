import type { Track } from "../types";
import CoverArt from "./CoverArt";
import { PauseIcon, PlayIcon } from "./icons";
import { cn } from "../utils/cn";

interface Props {
  track: Track;
  coverUrl?: string;
  active?: boolean;
  playing?: boolean;
  onPlay: () => void;
}

export default function TrackCard({ track, coverUrl, active, playing, onPlay }: Props) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        "group w-[152px] shrink-0 rounded-2xl border border-transparent bg-card p-3 text-left transition-all duration-300",
        "hover:-translate-y-1 hover:border-white/10 hover:bg-elev",
        active && "border-brand/40 bg-brand/[0.07]",
      )}
    >
      <div className="relative mb-3">
        <CoverArt track={track} url={coverUrl} className="aspect-square w-full" rounded="rounded-xl" />
        <span
          className={cn(
            "absolute right-2 bottom-2 grid h-11 w-11 place-items-center rounded-full bg-brand text-[#160900]",
            "shadow-[0_10px_24px_rgba(0,0,0,.55)] transition-all duration-300",
            active
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
          {playing ? <PauseIcon width={17} height={17} /> : <PlayIcon width={17} height={17} />}
        </span>
      </div>
      <p className={cn("truncate text-[13.5px] font-bold", active && "text-brand")}>{track.title}</p>
      <p className="mt-1 truncate text-[11.5px] text-white/50">{track.artist}</p>
    </button>
  );
}
