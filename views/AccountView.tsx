import { useMemo, useState } from "react";
import { usePlayer } from "../store/player";
import { cn } from "../utils/cn";
import { fmt, plural } from "../lib/format";
import type { Track } from "../types";
import CoverArt from "../components/CoverArt";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  CloudIcon,
  CloudOffIcon,
  GoogleIcon,
  LockIcon,
  LogoutIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
  TrashIcon,
  UploadIcon,
} from "../components/icons";

function StatusPill({ status, busy }: { status: string; busy: boolean }) {
  const map: Record<string, string> = {
    ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    connecting: "border-white/15 bg-white/5 text-white/60",
    offline: "border-danger/40 bg-danger/10 text-[#ffb4b4]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        map[status] ?? map.connecting,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", busy && "animate-pulse")} />
      {status === "ready"
        ? "cloud connected"
        : status === "offline"
          ? "cloud unreachable"
          : "connecting…"}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">{children}</span>
  );
}

export default function AccountView() {
  const {
    user,
    isAdmin,
    cloudStatus,
    cloudBusy,
    cloudError,
    tracks,
    coverFor,
    addUpload,
    removeTrack,
    updateTrack,
    pushToast,
    profile,
    openProfilePrompt,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOutCloud,
    refreshCloud,
  } = usePlayer();

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* Admin Studio state */
  const [songAudio, setSongAudio] = useState<File | null>(null);
  const [songCover, setSongCover] = useState<File | null>(null);
  const [songCoverPreview, setSongCoverPreview] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songAlbum, setSongAlbum] = useState("");

  /* Admin track manager state */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", artist: "", album: "" });
  const [pendingTrackDelete, setPendingTrackDelete] = useState<Track | null>(null);
  const [trackFilter, setTrackFilter] = useState("");

  const cloudCount = tracks.filter((t) => t.remote).length;
  const localCount = tracks.filter((t) => !t.remote).length;
  const likedCount = tracks.filter((t) => t.liked).length;

  const filteredTracks = useMemo(() => {
    const q = trackFilter.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) =>
      [t.title, t.artist, t.album].some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [tracks, trackFilter]);

  const startEdit = (track: Track) => {
    setEditingId(track.id);
    setEditDraft({ title: track.title, artist: track.artist, album: track.album });
  };

  const saveEdit = async (id: string) => {
    if (!editDraft.title.trim() || !editDraft.artist.trim()) {
      pushToast("Title and artist are required.", "error");
      return;
    }
    await updateTrack(id, {
      title: editDraft.title.trim(),
      artist: editDraft.artist.trim(),
      album: editDraft.album.trim() || "Single",
    });
    setEditingId(null);
  };

  const handleAdminPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songAudio) {
      pushToast("Please choose an MP3/audio file.", "error");
      return;
    }
    if (!songTitle.trim() || !songArtist.trim()) {
      pushToast("Song Title and Artist are required.", "error");
      return;
    }
    await addUpload({
      title: songTitle.trim(),
      artist: songArtist.trim(),
      album: songAlbum.trim() || "Single",
      audio: songAudio,
      cover: songCover,
    });
    setSongAudio(null);
    setSongCover(null);
    if (songCoverPreview.startsWith("blob:")) URL.revokeObjectURL(songCoverPreview);
    setSongCoverPreview("");
    setSongTitle("");
    setSongArtist("");
    setSongAlbum("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "in") await signInWithPassword(email.trim(), password);
      else await signUpWithPassword(email.trim(), password);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="px-4 pb-10 sm:px-6">
      {/* Hero */}
      <section className="relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-[26px] border border-white/5 bg-gradient-to-br from-[#10202b] via-[#161616] to-[#0c0c0c] px-6 py-9 sm:px-10">
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="relative">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-300/80">
            {isAdmin ? "administrator" : "shared library"}
          </p>
          <h1 className="mt-3 text-[clamp(28px,5vw,48px)] leading-none font-black tracking-tight">
            Account
          </h1>
        </div>
        <StatusPill status={cloudStatus} busy={cloudBusy} />
      </section>

      <div className="mx-auto mt-6 grid max-w-[560px] gap-5">
        {/* Cloud error */}
        {cloudError && (
          <div className="rounded-2xl border border-danger/30 bg-danger/[0.07] p-4">
            <p className="flex items-center gap-2 text-[13px] font-bold text-[#ffb4b4]">
              <CloudOffIcon width={16} height={16} /> Supabase returned an error
            </p>
            <p className="mt-1.5 break-words font-mono text-[11.5px] leading-relaxed text-white/50">
              {cloudError}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-white/45">
              The library is read-only until the tables and bucket allow it. Your saved tracks stay
              on this device — try re-syncing below.
            </p>
          </div>
        )}

        {/* Library stats */}
        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-extrabold tracking-tight">Your library</h2>
              <p className="mt-1 text-[12px] text-white/45">
                {plural(cloudCount, "shared track")} · {plural(localCount, "on-device track")} ·{" "}
                {plural(likedCount, "liked")}
              </p>
            </div>
            <button
              onClick={() => refreshCloud()}
              disabled={cloudBusy}
              className="flex h-10 items-center gap-2 rounded-xl border border-line bg-black/30 px-4 text-[12.5px] font-bold text-white/80 transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              <RefreshIcon width={15} height={15} className={cloudBusy ? "animate-spin-slow" : ""} />
              Re-sync
            </button>
          </div>
        </div>

        {/* ===== SIGNED IN ===== */}
        {user ? (
          <div className="grid gap-5">
            {/* Account card */}
            <div className="overflow-hidden rounded-2xl border border-line bg-card">
              <div className="h-1.5 w-full bg-gradient-to-r from-brand via-[#ff922e] to-transparent" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-[#b83b00] text-[20px] font-black text-[#1b0d00] shadow-[0_8px_24px_rgba(255,122,0,.25)]">
                      {(profile.name?.[0] || user.email?.[0] || "?").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold">
                        {profile.name || user.email}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {isAdmin ? (
                          <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 font-bold uppercase text-brand">
                            <ShieldIcon width={10} height={10} /> Admin
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 font-bold text-white/60">
                            Member
                          </span>
                        )}
                        {profile.name && (
                          <span className="truncate text-white/35">{user.email}</span>
                        )}
                      </p>
                      {profile.dob && (
                        <p className="mt-1 text-[11px] text-white/45">
                          DOB ·{" "}
                          {new Date(`${profile.dob}T00:00:00`).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      {(!profile.name || !profile.dob) && (
                        <button
                          onClick={openProfilePrompt}
                          className="mt-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-[11px] font-bold text-brand transition hover:bg-brand/20"
                        >
                          Complete your profile
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={signOutCloud}
                    title="Log out"
                    className="flex shrink-0 items-center gap-2 rounded-full border border-danger/40 bg-danger/10 px-4 py-2 text-[12px] font-bold text-[#ffb4b4] transition hover:bg-danger hover:text-white"
                  >
                    <LogoutIcon width={14} height={14} />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>

                <ul className="mt-4 grid gap-2 border-t border-line/60 pt-4 text-[12.5px] text-white/60">
                  {isAdmin ? (
                    <>
                      <li className="flex items-center gap-2">
                        <SparkIcon width={15} height={15} className="text-brand" />
                        Publish, edit and remove any shared track
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldIcon width={15} height={15} className="text-emerald-300" />
                        Moderator access verified server-side
                      </li>
                    </>
                  ) : (
                    <li className="flex items-start gap-2 rounded-xl border border-line/70 bg-black/25 px-3 py-2.5">
                      <LockIcon width={15} height={15} className="mt-0.5 shrink-0 text-white/40" />
                      <span className="leading-relaxed">
                        Publishing is locked to admin accounts only.
                      </span>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <CloudIcon width={15} height={15} className="text-sky-300" /> Likes sync across
                    devices
                  </li>
                </ul>
              </div>
            </div>

            {/* ===== ADMIN STUDIO ===== */}
            {isAdmin && (
              <div className="grid gap-5">
                {/* Publish */}
                <form
                  onSubmit={handleAdminPublish}
                  className="overflow-hidden rounded-2xl border border-brand/35 bg-gradient-to-b from-[#1d1309] to-card shadow-[0_16px_50px_rgba(255,122,0,.08)]"
                >
                  <div className="flex items-center justify-between border-b border-brand/20 bg-brand/[0.07] px-5 py-4">
                    <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand">
                      <ShieldIcon width={14} height={14} /> Admin Studio
                    </span>
                    <span className="text-[11px] font-semibold text-white/35">
                      {user.email}
                    </span>
                  </div>

                  <div className="grid gap-4 p-5">
                    {/* Audio dropzone */}
                    <label
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed px-4 py-6 text-center transition",
                        songAudio
                          ? "border-brand/60 bg-brand/[0.06]"
                          : "border-line bg-black/25 hover:border-brand/50",
                      )}
                    >
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSongAudio(file);
                            if (!songTitle) {
                              setSongTitle(
                                file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(),
                              );
                            }
                          }
                        }}
                      />
                      <UploadIcon width={22} height={22} className="text-brand" />
                      <span className="text-[12.5px] font-semibold text-white/85">
                        {songAudio ? songAudio.name : "Choose an MP3 / audio file"}
                      </span>
                      <span className="text-[11px] text-white/40">
                        {songAudio
                          ? `${(songAudio.size / (1024 * 1024)).toFixed(2)} MB — tap to replace`
                          : "MP3, WAV, FLAC, M4A · up to 50 MB"}
                      </span>
                    </label>

                    {/* Cover + metadata */}
                    <div className="flex items-center gap-3.5">
                      <label
                        className={cn(
                          "relative grid h-16 w-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-black/25 text-white/35 transition hover:border-brand/60",
                          songCoverPreview && "border-solid border-brand/50",
                        )}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSongCover(file);
                              setSongCoverPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        {songCoverPreview ? (
                          <img
                            src={songCoverPreview}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PlusIcon width={18} height={18} />
                        )}
                      </label>
                      <div className="min-w-0 flex-1">
                        <FieldLabel>Cover art (optional)</FieldLabel>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-white/45">
                          {songCover
                            ? songCover.name
                            : "A generated gradient is used when omitted."}
                        </p>
                        {songCover && (
                          <button
                            type="button"
                            onClick={() => {
                              setSongCover(null);
                              if (songCoverPreview.startsWith("blob:"))
                                URL.revokeObjectURL(songCoverPreview);
                              setSongCoverPreview("");
                            }}
                            className="mt-1 text-[11px] font-bold text-white/40 transition hover:text-danger"
                          >
                            Remove cover
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          ["title", songTitle, setSongTitle, "Song Title *", 100],
                          ["artist", songArtist, setSongArtist, "Artist *", 100],
                          ["album", songAlbum, setSongAlbum, "Album", 80],
                        ] as const
                      ).map(([key, value, setValue, label, max]) => (
                        <label key={key} className="grid gap-1.5">
                          <FieldLabel>{label}</FieldLabel>
                          <input
                            value={value}
                            maxLength={max}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={label.replace(" *", "")}
                            className="h-10 rounded-xl border border-line bg-black/40 px-3 text-[13px] transition focus:border-brand/60 focus:outline-none"
                          />
                        </label>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={cloudBusy}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-[#ff922e] text-[13.5px] font-extrabold text-[#1b0d00] shadow-[0_10px_30px_rgba(255,122,0,.25)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                    >
                      <UploadIcon width={16} height={16} />
                      {cloudBusy ? "Publishing to Cloud…" : "Publish to Shared Library"}
                    </button>
                  </div>
                </form>

                {/* Track manager */}
                <div className="overflow-hidden rounded-2xl border border-line bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
                    <h3 className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
                      <ShieldIcon width={16} height={16} className="text-emerald-300" />
                      Manage shared tracks
                      <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] font-bold text-white/50">
                        {tracks.length}
                      </span>
                    </h3>
                    <label className="relative w-full sm:w-52">
                      <SearchIcon
                        width={14}
                        height={14}
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/30"
                      />
                      <input
                        value={trackFilter}
                        onChange={(e) => setTrackFilter(e.target.value)}
                        placeholder="Filter tracks…"
                        className="h-9 w-full rounded-full border border-line bg-black/30 pr-3 pl-9 text-[12px] transition focus:border-brand/50 focus:outline-none"
                      />
                    </label>
                  </div>

                  {tracks.length === 0 ? (
                    <p className="px-5 py-8 text-center text-[12px] text-white/40">
                      The library is empty. Publish a song above to get started.
                    </p>
                  ) : filteredTracks.length === 0 ? (
                    <p className="px-5 py-8 text-center text-[12px] text-white/40">
                      No tracks match “{trackFilter}”.
                    </p>
                  ) : (
                    <div className="scrollbar-thin grid max-h-[400px] gap-1 overflow-y-auto p-3">
                      {filteredTracks.map((t) => (
                        <div
                          key={t.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-2.5 py-2 transition",
                            editingId === t.id
                              ? "bg-brand/[0.07] ring-1 ring-brand/30"
                              : "hover:bg-white/[0.04]",
                          )}
                        >
                          <CoverArt
                            track={t}
                            url={coverFor(t)}
                            className="h-10 w-10 shrink-0"
                            rounded="rounded-lg"
                          />
                          <div className="min-w-0 flex-1">
                            {editingId === t.id ? (
                              <div className="grid gap-1.5 sm:grid-cols-[1fr_1fr_1fr]">
                                {(
                                  [
                                    ["title", editDraft.title, "Title"],
                                    ["artist", editDraft.artist, "Artist"],
                                    ["album", editDraft.album, "Album"],
                                  ] as const
                                ).map(([key, value, ph]) => (
                                  <input
                                    key={key}
                                    value={value}
                                    maxLength={100}
                                    onChange={(e) =>
                                      setEditDraft((d) => ({ ...d, [key]: e.target.value }))
                                    }
                                    placeholder={ph}
                                    className="h-8 rounded-lg border border-line bg-black/40 px-2.5 text-[12px] transition focus:border-brand/60 focus:outline-none"
                                  />
                                ))}
                              </div>
                            ) : (
                              <>
                                <p className="flex items-center gap-2 text-[13px] font-bold">
                                  <span className="truncate">{t.title}</span>
                                  {t.remote ? (
                                    <span className="shrink-0 rounded bg-sky-400/15 px-1.5 py-px text-[9px] font-bold tracking-wide uppercase text-sky-300">
                                      cloud
                                    </span>
                                  ) : (
                                    <span className="shrink-0 rounded bg-brand/15 px-1.5 py-px text-[9px] font-bold tracking-wide uppercase text-brand">
                                      local
                                    </span>
                                  )}
                                </p>
                                <p className="mt-0.5 truncate text-[11.5px] text-white/45">
                                  {t.artist} · {t.album}
                                  {t.duration ? ` · ${fmt(t.duration)}` : ""}
                                </p>
                              </>
                            )}
                          </div>
                          {editingId === t.id ? (
                            <div className="flex shrink-0 gap-1.5">
                              <button
                                onClick={() => saveEdit(t.id)}
                                className="h-9 rounded-lg bg-brand px-3.5 text-[12px] font-bold text-[#1b0d00] transition hover:bg-brand-soft"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="h-9 rounded-lg border border-line px-2.5 text-[12px] font-semibold text-white/60 transition hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex shrink-0 gap-1">
                              <button
                                onClick={() => startEdit(t)}
                                aria-label="Edit track"
                                title="Edit"
                                className="grid h-9 w-9 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                              >
                                <PencilIcon width={15} height={15} />
                              </button>
                              <button
                                onClick={() => setPendingTrackDelete(t)}
                                aria-label="Delete track"
                                title="Delete"
                                className="grid h-9 w-9 place-items-center rounded-full text-white/45 transition hover:bg-danger/15 hover:text-danger"
                              >
                                <TrashIcon width={15} height={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <ConfirmDialog
              open={Boolean(pendingTrackDelete)}
              title="Delete this track?"
              body={
                pendingTrackDelete
                  ? `“${pendingTrackDelete.title}” will be removed from the shared library for everyone.`
                  : ""
              }
              onCancel={() => setPendingTrackDelete(null)}
              onConfirm={() => {
                if (pendingTrackDelete) removeTrack(pendingTrackDelete.id);
                setPendingTrackDelete(null);
              }}
            />
          </div>
        ) : (
          /* ===== GUEST ===== */
          <form onSubmit={submit} className="rounded-2xl border border-line bg-card p-5">
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-black/40 p-1">
              {(["in", "up"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError("");
                  }}
                  className={cn(
                    "h-9 rounded-lg text-[12.5px] font-bold transition",
                    mode === m ? "bg-brand text-[#1b0d00]" : "text-white/50 hover:text-white",
                  )}
                >
                  {m === "in" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  maxLength={120}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border border-line bg-black/40 px-3 text-[13.5px] transition focus:border-brand/60 focus:outline-none"
                />
              </label>
              <label className="grid gap-1.5">
                <FieldLabel>Password</FieldLabel>
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={100}
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl border border-line bg-black/40 px-3 text-[13.5px] transition focus:border-brand/60 focus:outline-none"
                />
              </label>
            </div>

            {error && (
              <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] leading-relaxed text-[#ffb4b4]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cloudBusy}
              className="mt-4 h-11 w-full rounded-xl bg-brand text-[13px] font-bold text-[#1b0d00] transition hover:bg-brand-soft disabled:opacity-60"
            >
              {cloudBusy ? "Working…" : mode === "in" ? "Sign in & continue" : "Create account"}
            </button>

            <div className="my-4 flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/25">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={() => signInWithGoogle()}
              disabled={cloudBusy}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-white/95 text-[13px] font-bold text-[#1f1f1f] transition hover:bg-white disabled:opacity-60"
            >
              <GoogleIcon /> Continue with Google
            </button>

            <p className="mt-4 text-[11px] leading-relaxed text-white/35">
              Auth runs on Supabase — your password is never stored in this app. Google sign-in must
              be enabled in Authentication → Providers, with{" "}
              <code className="text-white/60">
                {typeof window !== "undefined" ? window.location.origin : ""}
              </code>{" "}
              added to the redirect allow-list.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}


