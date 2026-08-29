import { useMemo, useState } from "react";
import { usePlayer } from "../store/player";
import type { Playlist, Track } from "../types";
import { cn } from "../utils/cn";
import { fmt, plural } from "../lib/format";
import {
  CheckIcon,
  ChevronLeftIcon,
  CloudOffIcon,
  MusicIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  PlaylistIcon,
  RefreshIcon,
  TrashIcon,
} from "../components/icons";
import CoverArt from "../components/CoverArt";
import TrackList from "../components/TrackList";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import CreatePlaylistModal from "../components/PlaylistModals";

function PlaylistCover({ tracks, coverFor, className }: {
  tracks: Track[];
  coverFor: (t: Track) => string | undefined;
  className?: string;
}) {
  const covers = tracks.slice(0, 4);
  if (covers.length === 0) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-gradient-to-br from-[#3a2a12] via-[#1c1c1c] to-[#101010] text-white/35",
          className,
        )}
      >
        <MusicIcon width={26} height={26} />
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden bg-black", className)}>
      {covers.map((t, i) => (
        <CoverArt key={t.id + i} track={t} url={coverFor(t)} className="h-full w-full" rounded="rounded-none" />
      ))}
    </div>
  );
}

export default function PlaylistsView() {
  const {
    playlists,
    tracks,
    user,
    coverFor,
    play,
    playAll,
    deletePlaylist,
    renamePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    playlistsError,
    loadPlaylists,
    setSection,
  } = usePlayer();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Playlist | null>(null);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const selected = playlists.find((p) => p.id === selectedId) ?? null;

  const songsOf = useMemo(() => {
    if (!selected) return [];
    return selected.songIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is Track => Boolean(t));
  }, [selected, tracks]);

  const addable = useMemo(
    () => (selected ? tracks.filter((t) => !selected.songIds.includes(t.id)) : []),
    [selected, tracks],
  );

  const totalSeconds = songsOf.reduce((sum, t) => sum + (t.duration || 0), 0);

  /* ------------------------------------------------------------- guest state */
  if (!user) {
    return (
      <div className="px-4 pb-10 sm:px-6">
        <section className="relative overflow-hidden rounded-[26px] border border-white/5 bg-gradient-to-br from-[#251a08] via-[#161616] to-[#0c0c0c] px-6 py-12 sm:px-10">
          <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
          <p className="relative text-[11px] font-extrabold tracking-[0.2em] text-brand-soft uppercase">your library</p>
          <h1 className="relative mt-3 flex items-center gap-3 text-[clamp(28px,5vw,48px)] leading-none font-black tracking-tight">
            Playlists <PlaylistIcon width={30} height={30} className="text-brand" />
          </h1>
          <p className="relative mt-3 max-w-[480px] text-[13px] leading-relaxed text-white/55">
            Sign in to build private playlists — they're saved to your account and stay separate from
            every other listener.
          </p>
          <button
            onClick={() => setSection("account")}
            className="relative mt-6 h-11 rounded-full bg-brand px-6 text-[13px] font-bold text-[#1b0d00] transition hover:bg-brand-soft"
          >
            Sign in to continue
          </button>
        </section>
      </div>
    );
  }

  /* ---------------------------------------------------------- playlist detail */
  if (selected) {
    return (
      <div className="px-4 pb-10 sm:px-6">
        <button
          onClick={() => {
            setSelectedId(null);
            setShowAddSongs(false);
          }}
          className="mt-2 flex items-center gap-1.5 text-[12.5px] font-bold text-white/55 transition hover:text-white"
        >
          <ChevronLeftIcon width={16} height={16} /> All playlists
        </button>

        <section className="mt-4 flex flex-wrap items-center gap-5 rounded-[24px] border border-white/5 bg-gradient-to-br from-[#251a08] via-[#161616] to-[#0c0c0c] p-5 sm:p-7">
          <PlaylistCover
            tracks={songsOf}
            coverFor={coverFor}
            className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl shadow-xl shadow-black/50 sm:h-36 sm:w-36"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-extrabold tracking-[0.2em] text-brand-soft uppercase">playlist</p>
            {renaming ? (
              <form
                className="mt-2 flex max-w-[380px] items-center gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await renamePlaylist(selected.id, renameValue);
                  setRenaming(false);
                }}
              >
                <input
                  autoFocus
                  value={renameValue}
                  maxLength={80}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-brand/50 bg-black/50 px-3 text-[15px] font-bold focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Save name"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-[#1b0d00] transition hover:bg-brand-soft"
                >
                  <CheckIcon width={17} height={17} />
                </button>
              </form>
            ) : (
              <h1 className="mt-1.5 truncate text-[clamp(22px,4vw,38px)] leading-tight font-black tracking-tight">
                {selected.name}
              </h1>
            )}
            {selected.description && !renaming && (
              <p className="mt-1.5 truncate text-[12.5px] text-white/60">{selected.description}</p>
            )}
            <p className="mt-2 text-[12px] text-white/45">
              {plural(songsOf.length, "song")}
              {totalSeconds > 0 && <> · {fmt(totalSeconds)}</>}
              <span className="ml-2 rounded bg-white/10 px-1.5 py-px text-[10px] font-bold text-white/55">
                private
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {songsOf.length > 0 && (
              <button
                onClick={() => playAll(false, songsOf)}
                className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[13px] font-bold text-black transition hover:scale-[1.03] active:scale-95"
              >
                <PlayIcon width={14} height={14} /> Play all
              </button>
            )}
            <button
              onClick={() => setShowAddSongs((v) => !v)}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full border px-4 text-[12.5px] font-bold transition",
                showAddSongs
                  ? "border-brand bg-brand/20 text-brand"
                  : "border-line bg-white/5 text-white/80 hover:bg-white/10",
              )}
            >
              <PlusIcon width={14} height={14} /> {showAddSongs ? "Hide songs" : "Add songs"}
            </button>
            {!renaming && (
              <button
                onClick={() => {
                  setRenaming(true);
                  setRenameValue(selected.name);
                }}
                aria-label="Rename playlist"
                title="Rename playlist"
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white/5 text-white/60 transition hover:border-brand/40 hover:text-brand"
              >
                <PencilIcon width={16} height={16} />
              </button>
            )}
            <button
              onClick={() => setPendingDelete(selected)}
              aria-label="Delete playlist"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white/5 text-white/60 transition hover:border-danger/40 hover:text-danger"
            >
              <TrashIcon width={16} height={16} />
            </button>
          </div>
        </section>

        {/* Add songs panel */}
        {showAddSongs && (
          <section className="mt-6">
            <h2 className="mb-3 text-[17px] font-extrabold tracking-tight">
              Add to this playlist{" "}
              <span className="text-[12px] font-semibold text-white/40">
                {plural(addable.length, "available song")}
              </span>
            </h2>
            {addable.length === 0 ? (
              <EmptyState
                title="Everything's already in here."
                hint="Every song in the shared library is part of this playlist."
              />
            ) : (
              <div className="grid">
                {addable.map((track) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.05]"
                  >
                    <button
                      onClick={() => play(track)}
                      className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg"
                      aria-label={`Play ${track.title}`}
                    >
                      <CoverArt track={track} url={coverFor(track)} className="absolute inset-0" rounded="rounded-lg" />
                      <span className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                        <PlayIcon width={14} height={14} />
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{track.title}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-white/45">{track.artist}</p>
                    </div>
                    <span className="hidden w-10 text-right text-[12px] text-white/40 sm:block">
                      {fmt(track.duration)}
                    </span>
                    <button
                      onClick={() => addSongToPlaylist(selected.id, track.id)}
                      aria-label={`Add ${track.title} to ${selected.name}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 text-brand transition hover:bg-brand hover:text-[#1b0d00]"
                    >
                      <PlusIcon width={15} height={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Songs in playlist */}
        <section className="mt-6">
          <TrackList
            tracks={songsOf}
            onRemove={(t) => removeSongFromPlaylist(selected.id, t.id)}
            emptyState={
              <EmptyState
                title="This playlist is empty."
                hint="Toggle “Add songs” above to pull tracks in from the shared library."
              />
            }
          />
        </section>

        <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title="Delete this playlist?"
          body={
            pendingDelete
              ? `“${pendingDelete.name}” and its ${plural(pendingDelete.songIds.length, "song")} will be removed. The songs themselves stay in the library.`
              : ""
          }
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            if (pendingDelete) {
              await deletePlaylist(pendingDelete.id);
              setSelectedId(null);
            }
            setPendingDelete(null);
          }}
        />
      </div>
    );
  }

  /* ---------------------------------------------------------- playlists grid */
  return (
    <div className="px-4 pb-10 sm:px-6">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-[26px] border border-white/5 bg-gradient-to-br from-[#251a08] via-[#161616] to-[#0c0c0c] px-6 py-9 sm:px-9">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.2em] text-brand-soft uppercase">your library</p>
          <h1 className="mt-3 flex items-center gap-3 text-[clamp(28px,5vw,48px)] leading-none font-black tracking-tight">
            Playlists <PlaylistIcon width={30} height={30} className="text-brand" />
          </h1>
          <p className="mt-3 max-w-[460px] text-[13px] text-white/55">
            Only you can see these. {user.email} · {plural(playlists.length, "playlist")}.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[13px] font-bold text-[#1b0d00] transition hover:scale-[1.03] hover:bg-brand-soft active:scale-95"
        >
          <PlusIcon width={15} height={15} /> New playlist
        </button>
      </section>

      {playlistsError && (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-5">
          <p className="flex items-center gap-2 text-[13px] font-bold text-amber-200">
            <CloudOffIcon width={16} height={16} /> Playlists aren't loading
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/55">{playlistsError}</p>
          <button
            onClick={() => user && loadPlaylists(user.id)}
            className="mt-3.5 flex h-10 items-center gap-2 rounded-full border border-line bg-white/5 px-4 text-[12.5px] font-bold text-white/80 transition hover:bg-white/10"
          >
            <RefreshIcon width={14} height={14} /> Try again
          </button>
        </div>
      )}

      <section className="mt-7">
        {playlists.length === 0 ? (
          <EmptyState
            title="No playlists yet."
            hint="Create your first playlist and start adding songs from the shared library."
            action={
              <button
                onClick={() => setCreateOpen(true)}
                className="flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-[12.5px] font-bold text-[#1b0d00] transition hover:bg-brand-soft"
              >
                <PlusIcon width={14} height={14} /> New playlist
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {playlists.map((pl) => {
              const songs = pl.songIds
                .map((id) => tracks.find((t) => t.id === id))
                .filter((t): t is Track => Boolean(t));
              return (
                <button
                  key={pl.id}
                  onClick={() => setSelectedId(pl.id)}
                  className="group rounded-2xl bg-card p-3 text-left transition hover:-translate-y-1 hover:bg-elev"
                >
                  <div className="relative mb-3">
                    <PlaylistCover
                      tracks={songs}
                      coverFor={coverFor}
                      className="aspect-square w-full"
                    />
                    <span className="absolute right-2 bottom-2 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-brand text-[#1b0d00] opacity-0 shadow-[0_10px_24px_rgba(0,0,0,.55)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <PlayIcon width={16} height={16} />
                    </span>
                    <span
                      role="button"
                      aria-label="Delete playlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(pl);
                      }}
                      className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white/70 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-danger hover:text-white"
                    >
                      <TrashIcon width={14} height={14} />
                    </span>
                  </div>
                  <p className="truncate text-[13.5px] font-bold">{pl.name}</p>
                  <p className="mt-1 truncate text-[11.5px] text-white/45">
                    {plural(songs.length, "song")} ·{" "}
                    {new Date(pl.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {pl.description && (
                    <p className="mt-0.5 truncate text-[10.5px] text-white/45">{pl.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <CreatePlaylistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => setSelectedId(id)}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this playlist?"
        body={
          pendingDelete
            ? `“${pendingDelete.name}” and its ${plural(pendingDelete.songIds.length, "song")} will be removed. The songs themselves stay in the library.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) {
            await deletePlaylist(pendingDelete.id);
            if (selectedId === pendingDelete.id) setSelectedId(null);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
