import { useMemo } from "react";
import { usePlayer } from "../store/player";
import { plural } from "../lib/format";
import TrackList from "../components/TrackList";
import EmptyState from "../components/EmptyState";
import { HeartIcon, ShuffleIcon } from "../components/icons";

export default function LikedView() {
  const { tracks, search, playAll } = usePlayer();
  const liked = useMemo(() => tracks.filter((t) => t.liked), [tracks]);

  const q = search.trim().toLowerCase();
  const shown = q
    ? liked.filter((t) =>
        [t.title, t.artist, t.album].some((v) => String(v ?? "").toLowerCase().includes(q)),
      )
    : liked;

  return (
    <div className="px-4 pb-10 sm:px-6">
      <section className="relative overflow-hidden rounded-[26px] border border-white/5 bg-gradient-to-br from-[#2a0f22] via-[#171717] to-[#0c0c0c] px-6 py-9 sm:px-9">
        <div className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full bg-[#ff2e63]/25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#ff9ec4] uppercase">
              collection
            </p>
            <h1 className="mt-3 flex items-center gap-3 text-[clamp(28px,5vw,48px)] leading-none font-black tracking-tight">
              Liked songs
              <HeartIcon width={30} height={30} filled className="text-brand" />
            </h1>
            <p className="mt-3 text-[13px] text-white/55">
              {plural(liked.length, "track")} you've saved for later.
            </p>
          </div>
          {liked.length > 0 && (
            <button
              onClick={() => playAll(true, liked)}
              className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[13px] font-bold text-black transition hover:scale-[1.03] active:scale-95"
            >
              <ShuffleIcon width={15} height={15} /> Shuffle liked
            </button>
          )}
        </div>
      </section>

      <section className="mt-7">
        <TrackList
          tracks={shown}
          emptyState={
            <EmptyState
              title="Songs you like will appear here."
              hint="Hit the heart on any track — likes are remembered between visits."
            />
          }
        />
      </section>
    </div>
  );
}
