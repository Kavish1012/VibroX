import { useMemo, useRef, useState } from "react";
import { usePlayer } from "../store/player";
import { dailyPicks, plural, todayKey } from "../lib/format";
import TrackCard from "../components/TrackCard";
import TrackList from "../components/TrackList";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { PlayIcon, PlusIcon, ShuffleIcon, SparkIcon } from "../components/icons";
import type { Track } from "../types";

export default function HomeView() {
  const { tracks, currentId, isPlaying, coverFor, play, toggle, playAll, search, setSection, isAdmin, removeTrack, user } =
    usePlayer();
  const scroller = useRef<HTMLDivElement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Track | null>(null);

  const picks = useMemo(
    () => dailyPicks(tracks, 6, todayKey()),
    [tracks],
  );

  const q = search.trim().toLowerCase();
  const results = useMemo(
    () =>
      q
        ? tracks.filter((t) =>
            [t.title, t.artist, t.album].some((v) => String(v ?? "").toLowerCase().includes(q)),
          )
        : tracks,
    [q, tracks],
  );

  return (
    <div className="px-4 pb-10 sm:px-6">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-[26px] border border-white/5 bg-gradient-to-br from-[#241505] via-[#151515] to-[#0d0d0d] px-6 py-9 sm:px-9 sm:py-11">
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 animate-blob rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-24 h-64 w-64 animate-blob rounded-full bg-[#ff2e63]/15 blur-3xl [animation-delay:-5s]" />
        <div className="relative max-w-[620px]">
          <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.2em] text-brand-soft uppercase">
            <SparkIcon width={15} height={15} /> your personal music space
          </p>
          <h1 className="mt-3 text-[clamp(32px,6vw,60px)] leading-[0.95] font-black tracking-tight">
            Your Music.
            <br />
            <span className="bg-gradient-to-r from-brand via-brand-soft to-white bg-clip-text text-transparent">
              Your Mood.
            </span>
          </h1>
          <p className="mt-4 max-w-[440px] text-[13.5px] leading-relaxed text-white/60">
            Add your own files or browse the shared library — everything plays right here in the
            browser, backed by Supabase.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {tracks.length > 0 ? (
              <button
                onClick={() => playAll(false)}
                className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[13px] font-bold text-[#1b0d00] transition hover:scale-[1.03] hover:bg-brand-soft active:scale-95"
              >
                <PlayIcon width={15} height={15} /> Play music
              </button>
            ) : (
              <button
                onClick={() => setSection("account")}
                className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[13px] font-bold text-[#1b0d00] transition hover:scale-[1.03] hover:bg-brand-soft active:scale-95"
              >
                <PlusIcon width={15} height={15} />
                {user ? "Add music" : "Sign in to add music"}
              </button>
            )}
            {tracks.length > 1 && (
              <button
                onClick={() => playAll(true)}
                className="flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                <ShuffleIcon width={15} height={15} /> Shuffle all
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Daily picks */}
      {picks.length > 0 && (
      <section className="mt-8">
        <div className="mb-3.5 flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-[20px] font-extrabold tracking-tight">
              <SparkIcon width={18} height={18} className="text-brand" /> Daily picks for you
            </h2>
            <p className="mt-1 text-[12px] text-white/45">A fresh shuffle, rotated every day.</p>
          </div>
          <div className="hidden gap-1.5 sm:flex">
            {[-1, 1].map((dir) => (
              <button
                key={dir}
                onClick={() =>
                  scroller.current?.scrollBy({ left: dir * 340, behavior: "smooth" })
                }
                aria-label={dir < 0 ? "Scroll left" : "Scroll right"}
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel text-white/60 transition hover:border-white/25 hover:text-white"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d={dir < 0 ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div
          ref={scroller}
          className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
        >
          {picks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              coverUrl={coverFor(track)}
              active={currentId === track.id}
              playing={currentId === track.id && isPlaying}
              onPlay={() => (currentId === track.id ? toggle() : play(track))}
            />
          ))}
        </div>
      </section>
      )}

      {/* All songs */}
      <section className="mt-9">
        <div className="mb-3.5 flex items-end justify-between gap-4">
          <h2 className="text-[20px] font-extrabold tracking-tight">
            {q ? <>Results for “{search}”</> : "All songs"}
          </h2>
          <span className="text-[12px] text-white/45">{plural(results.length, "song")}</span>
        </div>
        <TrackList
          tracks={results}
          onDelete={isAdmin ? (t) => setPendingDelete(t) : undefined}
          emptyState={
            <EmptyState
              title={q ? "No music matched your search." : "Your library is empty."}
              hint={
                q
                  ? "Try a different artist, song or album name."
                  : "Sign in with your admin account to publish music to the shared library."
              }
              action={
                <button
                  onClick={() => setSection("account")}
                  className="h-10 rounded-full border border-line bg-white/5 px-5 text-[12.5px] font-bold text-white transition hover:bg-white/10"
                >
                  {user ? "Open Admin Studio" : "Open Account"}
                </button>
              }
            />
          }
        />
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this track?"
        body={
          pendingDelete
            ? `“${pendingDelete.title}” will be removed from the shared library for everyone.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeTrack(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
