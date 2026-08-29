import type { Track } from "../types";
import { cn } from "../utils/cn";
import { fmt } from "../lib/format";
import CoverArt from "./CoverArt";
import {
  CloseIcon,
  HeartIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  QueueIcon,
  TrashIcon,
} from "./icons";
import Visualizer from "./Visualizer";

interface Props {
  track: Track;
  active?: boolean;
  playing?: boolean;
  coverUrl?: string;
  onPlay: () => void;
  onLike: () => void;
  onQueue: () => void;
  /** opens the “Add to playlist” picker (the “+” button) */
  onAddToPlaylist?: () => void;
  onDelete?: () => void;
  /** removes the song from the current playlist (playlist view only) */
  onRemove?: () => void;
  compact?: boolean;
}

export default function TrackRow({
  track,
  active,
  playing,
  coverUrl,
  onPlay,
  onLike,
  onQueue,
  onAddToPlaylist,
  onDelete,
  onRemove,
  compact,
}: Props) {
  return (
    <div
      onDoubleClick={onPlay}
      className={cn(
        "group grid select-none items-center gap-3 rounded-xl px-2.5 py-2 transition-colors",
        "grid-cols-[36px_minmax(0,1fr)_auto] sm:grid-cols-[36px_minmax(0,1fr)_92px_auto]",
        active ? "bg-brand/10" : "hover:bg-white/[0.055]",
      )}
    >
      <button
        onClick={onPlay}
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
        className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg"
      >
        <CoverArt track={track} url={coverUrl} className="absolute inset-0" rounded="rounded-lg" />
        <span
          className={cn(
            "absolute inset-0 grid place-items-center bg-black/60 text-white transition-opacity",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {playing ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
        </span>
      </button>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {active && (
            <span className="shrink-0">
              <Visualizer active={playing} className="h-3.5" />
            </span>
          )}
          <p
            className={cn(
              "truncate text-[13.5px] font-semibold",
              active ? "text-brand" : "text-white",
            )}
          >
            {track.title}
          </p>
        </div>
        <p className="mt-0.5 truncate text-[11.5px] text-muted">
          {track.artist}
          {!compact && !track.remote && (
            <span className="ml-2 rounded bg-brand/15 px-1.5 py-px text-[9.5px] font-bold tracking-wide text-brand uppercase">
              on device
            </span>
          )}
        </p>
      </div>

      {!compact && (
        <span className="hidden truncate text-[12px] text-white/45 sm:block">{track.album}</span>
      )}

      <div className="flex items-center justify-end gap-0.5">
        <span
          className={cn(
            "w-10 text-right text-[12px] tabular-nums text-white/45 group-hover:hidden",
            active && "text-brand",
          )}
        >
          {fmt(track.duration)}
        </span>
        <button
          onClick={onLike}
          aria-label={track.liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
          className={cn(
            "hidden h-8 w-8 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white group-hover:grid sm:grid",
            track.liked && "text-brand hover:text-brand",
          )}
        >
          <HeartIcon width={15} height={15} filled={track.liked} />
        </button>
        {onAddToPlaylist && (
          <button
            onClick={onAddToPlaylist}
            aria-label="Add to playlist"
            title="Add to playlist"
            className="hidden h-8 w-8 place-items-center rounded-full text-brand transition hover:bg-brand/15 hover:text-brand-soft group-hover:grid sm:grid"
          >
            <PlusIcon width={15} height={15} />
          </button>
        )}
        <button
          onClick={onQueue}
          aria-label="Add to queue"
          title="Add to queue"
          className="hidden h-8 w-8 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white group-hover:grid sm:grid"
        >
          <QueueIcon width={15} height={15} />
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label="Delete track"
            className="hidden h-8 w-8 place-items-center rounded-full text-white/45 transition hover:bg-danger/15 hover:text-danger group-hover:grid sm:grid"
          >
            <TrashIcon width={15} height={15} />
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            aria-label="Remove from playlist"
            title="Remove from playlist"
            className="grid h-8 w-8 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            <CloseIcon width={14} height={14} />
          </button>
        )}
      </div>
    </div>
  );
}
