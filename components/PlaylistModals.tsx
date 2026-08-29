import { useEffect, useState } from "react";
import { usePlayer } from "../store/player";
import { cn } from "../utils/cn";
import { CloseIcon, CheckIcon, PlaylistIcon, PlusIcon } from "./icons";

/* -------------------------------------------------------------------------- */
/* Create playlist                                                            */
/* -------------------------------------------------------------------------- */

interface CreateProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function CreatePlaylistModal({ open, onClose, onCreated }: CreateProps) {
  const { createPlaylist, user } = usePlayer();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setError("");
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give your playlist a name.");
      return;
    }
    if (!user) {
      setError("Please sign in to create and manage playlists.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const pl = await createPlaylist(trimmed, description.trim() || undefined);
      onCreated?.(pl.id);
      onClose();
    } catch {
      setError("Could not create playlist. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="animate-fade-up w-full max-w-[400px] rounded-2xl border border-line bg-[#161616] p-6 shadow-[0_30px_90px_rgba(0,0,0,.75)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <PlaylistIcon width={20} height={20} />
            </span>
            <div>
              <h3 className="text-[18px] font-extrabold tracking-tight">Create playlist</h3>
              <p className="mt-0.5 text-[11.5px] text-white/45">
                Private to {user ? user.email : "your account"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <label className="mt-5 grid gap-1.5">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
            Playlist name
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Late Night Drives"
            maxLength={80}
            className="h-11 rounded-xl border border-line bg-black/40 px-3 text-[13.5px] focus:border-brand/60 focus:outline-none"
          />
        </label>
        <label className="mt-3 grid gap-1.5">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
            Description (optional)
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Synthwave for the freeway…"
            maxLength={140}
            className="h-10 rounded-xl border border-line bg-black/40 px-3 text-[13px] focus:border-brand/60 focus:outline-none"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-[#ffb4b4]">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-line px-5 text-[13px] font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-[13px] font-bold text-[#1b0d00] transition hover:bg-brand-soft disabled:opacity-60"
          >
            <PlusIcon width={15} height={15} />
            {busy ? "Creating…" : "Create playlist"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Add song to playlist (opened by the “+” button beside a track)             */
/* -------------------------------------------------------------------------- */

export function AddToPlaylistModal() {
  const {
    playlistSongTarget,
    closeAddToPlaylist,
    playlists,
    addSongToPlaylist,
    createPlaylist,
    user,
    setSection,
  } = usePlayer();
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setNewName("");
    setBusyId(null);
  }, [playlistSongTarget]);

  useEffect(() => {
    if (!playlistSongTarget) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAddToPlaylist();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [playlistSongTarget, closeAddToPlaylist]);

  if (!playlistSongTarget) return null;
  const track = playlistSongTarget;

  const pickPlaylist = async (playlistId: string) => {
    setBusyId(playlistId);
    await addSongToPlaylist(playlistId, track.id);
    setBusyId(null);
  };

  const createWithSong = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || !user) return;
    setBusyId("new");
    try {
      const pl = await createPlaylist(trimmed);
      await addSongToPlaylist(pl.id, track.id);
      closeAddToPlaylist();
    } catch {
      /* error toast already shown by the store */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
      <div className="animate-fade-up w-full max-w-[400px] rounded-2xl border border-line bg-[#161616] p-6 shadow-[0_30px_90px_rgba(0,0,0,.75)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-extrabold tracking-tight">Add to playlist</h3>
            <p className="mt-1 truncate text-[12px] text-white/50">
              <span className="font-bold text-white/80">{track.title}</span> · {track.artist}
            </p>
          </div>
          <button
            onClick={closeAddToPlaylist}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        {!user ? (
          <div className="mt-5">
            <p className="rounded-xl border border-line bg-black/30 px-4 py-4 text-center text-[12.5px] leading-relaxed text-white/55">
              Please sign in to create and manage playlists.
            </p>
            <button
              onClick={() => {
                closeAddToPlaylist();
                setSection("account");
              }}
              className="mt-4 h-11 w-full rounded-full bg-brand text-[13px] font-bold text-[#1b0d00] transition hover:bg-brand-soft"
            >
              Sign in
            </button>
          </div>
        ) : (
          <>
            <div className="scrollbar-thin mt-5 grid max-h-[260px] gap-1.5 overflow-y-auto pr-1">
              {playlists.length === 0 && (
                <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-[12px] text-white/40">
                  No playlists yet — create your first one below.
                </p>
              )}
              {playlists.map((pl) => {
                const alreadyIn = pl.songIds.includes(track.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => !alreadyIn && pickPlaylist(pl.id)}
                    disabled={busyId === pl.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition",
                      alreadyIn
                        ? "cursor-default border-line/60 bg-white/[0.03] opacity-70"
                        : "hover:border-brand/40 hover:bg-brand/[0.08]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                        alreadyIn ? "bg-white/8 text-white/40" : "bg-brand/15 text-brand",
                      )}
                    >
                      {alreadyIn ? (
                        <CheckIcon width={16} height={16} />
                      ) : (
                        <PlaylistIcon width={16} height={16} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">{pl.name}</span>
                      <span className="mt-0.5 block text-[11px] text-white/40">
                        {alreadyIn
                          ? "Already in this playlist"
                          : `${pl.songIds.length} song${pl.songIds.length === 1 ? "" : "s"}`}
                      </span>
                    </span>
                    {!alreadyIn && (
                      <PlusIcon width={15} height={15} className="shrink-0 text-brand" />
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={createWithSong} className="mt-4 flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New playlist name…"
                maxLength={80}
                className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-black/40 px-3 text-[12.5px] focus:border-brand/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newName.trim() || busyId === "new"}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-[12px] font-bold text-[#1b0d00] transition hover:bg-brand-soft disabled:opacity-50"
              >
                <PlusIcon width={14} height={14} />
                {busyId === "new" ? "Adding…" : "Create"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* Default export kept for the existing TopBar / Playlists usages */
export default CreatePlaylistModal;
