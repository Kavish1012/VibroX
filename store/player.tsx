import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Playlist, RepeatMode, ToastItem, Track } from "../types";
import { tracksStore, settingsStore } from "../lib/db";
import { uid } from "../lib/format";
import { safeMediaUrl } from "../lib/safe";
import {
  FAVORITES_TABLE,
  MUSIC_BUCKET,
  PLAYLISTS_TABLE,
  PLAYLIST_TRACKS_TABLE,
  SONGS_TABLE,
  cloudEnabled,
  isAdminUser,
  rowToTrack,
  supabase,
  type CloudSongRow,
  type PlaylistRow,
  type PlaylistTrackRow,
  type User,
} from "../lib/supabase";

interface Prefs {
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
}

export type CloudStatus = "connecting" | "ready" | "offline";

interface UploadInput {
  title: string;
  artist: string;
  album: string;
  audio: File;
  cover?: File | null;
}

interface PlayerValue {
  tracks: Track[];
  current: Track | null;
  currentId: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  isShuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  time: number;
  duration: number;
  queue: string[];
  ready: boolean;
  search: string;
  section: string;
  setSearch: (v: string) => void;
  setSection: (v: string) => void;
  play: (track: Track) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  playAll: (shuffle?: boolean, list?: Track[]) => void;
  addUpload: (input: UploadInput) => Promise<void>;
  removeTrack: (id: string) => void;
  updateTrack: (
    id: string,
    patch: Partial<Pick<Track, "title" | "artist" | "album">>,
  ) => Promise<void>;
  srcFor: (track: Track) => string;
  coverFor: (track: Track) => string | undefined;
  toasts: ToastItem[];
  pushToast: (message: string, tone?: ToastItem["tone"]) => void;
  /* cloud */
  user: User | null;
  isAdmin: boolean;
  cloudStatus: CloudStatus;
  cloudBusy: boolean;
  cloudError: string;
  /** true only for the moderator allow-list in lib/supabase.ts */
  canPublish: boolean;
  canManageTrack: (track: Track | null | undefined) => boolean;
  /* playlists (per-user, Supabase-backed) */
  playlists: Playlist[];
  playlistsError: string;
  loadPlaylists: (userId: string) => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  playlistSongTarget: Track | null;
  openAddToPlaylist: (track: Track) => void;
  closeAddToPlaylist: () => void;
  /* profile (name + DOB, stored in Supabase Auth user metadata) */
  profile: { name: string; dob: string };
  profilePrompt: boolean;
  saveProfile: (name: string, dob: string) => Promise<void>;
  skipProfilePrompt: () => void;
  openProfilePrompt: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutCloud: () => Promise<void>;
  refreshCloud: () => Promise<void>;
}

const PlayerContext = createContext<PlayerValue | null>(null);

export function usePlayer(): PlayerValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

/** Reads track lengths up-front (metadata only) so the library shows real durations. */
const durationListeners = new Map<string, (seconds: number) => void>();

function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement("audio");
    el.preload = "metadata";
    const url = URL.createObjectURL(file);
    const finish = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(seconds) ? seconds : 0);
    };
    el.addEventListener("loadedmetadata", () => finish(el.duration), { once: true });
    el.addEventListener("error", () => finish(0), { once: true });
    window.setTimeout(() => finish(el.duration || 0), 6000);
    el.src = url;
  });
}

function preloadDurations(tracks: Track[]) {
  tracks
    .filter((t) => !t.duration && t.audio && !t.audioBlob)
    .slice(0, 14)
    .forEach((track) => {
      const el = document.createElement("audio");
      el.preload = "metadata";
      el.src = track.audio as string;
      el.addEventListener(
        "loadedmetadata",
        () => {
          if (Number.isFinite(el.duration)) durationListeners.get(track.id)?.(el.duration);
          el.removeAttribute("src");
          el.load();
        },
        { once: true },
      );
      el.addEventListener("error", () => durationListeners.delete(track.id), { once: true });
    });
}

function safeExt(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : "";
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return (file.type.split("/")[1] || "bin").replace(/[^a-z0-9]/gi, "");
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef(new Map<string, string>());
  const historyRef = useRef<string[]>([]);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [volume, setVolumeState] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("home");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /* cloud state */
  const [user, setUser] = useState<User | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("connecting");
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudError, setCloudError] = useState("");

  /* playlists (private per user) */
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsError, setPlaylistsError] = useState("");

  /* song currently being added to a playlist via the track-row “+” button */
  const [playlistSongTarget, setPlaylistSongTarget] = useState<Track | null>(null);
  const openAddToPlaylist = useCallback((track: Track) => setPlaylistSongTarget(track), []);
  const closeAddToPlaylist = useCallback(() => setPlaylistSongTarget(null), []);

  /* profile (name + DOB) — kept in Supabase Auth user metadata */
  const [profile, setProfile] = useState<{ name: string; dob: string }>({ name: "", dob: "" });
  const [profilePrompt, setProfilePrompt] = useState(false);

  const syncProfile = useCallback((u: User | null) => {
    setProfile({
      name: String(u?.user_metadata?.full_name ?? ""),
      dob: String(u?.user_metadata?.date_of_birth ?? ""),
    });
  }, []);

  /**
   * Moderation is locked to the two accounts in ADMIN_EMAILS. Every other signed-in
   * user can browse and like, but cannot publish, edit or delete shared tracks.
   */
  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  const pushToast = useCallback((message: string, tone: ToastItem["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3400);
  }, []);

  const saveProfile = useCallback(
    async (name: string, dob: string) => {
      const { error } = await supabase().auth.updateUser({
        data: { full_name: name, date_of_birth: dob },
      });
      if (error) throw error;
      setProfile({ name, dob });
      setProfilePrompt(false);
      pushToast("Profile saved", "success");
    },
    [pushToast],
  );

  const skipProfilePrompt = useCallback(() => setProfilePrompt(false), []);
  const openProfilePrompt = useCallback(() => setProfilePrompt(true), []);

  /** Central sign-in gate: guests get "Please Sign in first" + Account page. */
  const requireAuth = useCallback((): boolean => {
    if (user) return true;
    pushToast("Please Sign in first", "error");
    setSection("account");
    return false;
  }, [pushToast, user]);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = "metadata";
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  const srcFor = useCallback((track: Track) => {
    if (track.audioBlob) {
      const key = `a:${track.id}`;
      let url = urlsRef.current.get(key);
      if (!url) {
        url = URL.createObjectURL(track.audioBlob);
        urlsRef.current.set(key, url);
      }
      return url;
    }
    return track.audio ?? "";
  }, []);

  const coverFor = useCallback((track: Track) => {
    if (track.coverBlob) {
      const key = `c:${track.id}`;
      let url = urlsRef.current.get(key);
      if (!url) {
        url = URL.createObjectURL(track.coverBlob);
        urlsRef.current.set(key, url);
      }
      return url;
    }
    return track.cover;
  }, []);

  /* ------------------------------------------------------- cloud data helpers */
  const fetchFavorites = useCallback(async (userId: string) => {
    const { data, error } = await supabase()
      .from(FAVORITES_TABLE)
      .select("song_id")
      .eq("user_id", userId);
    if (error) throw error;
    return new Set((data ?? []).map((r) => String((r as { song_id: string }).song_id)));
  }, []);

  const fetchSongs = useCallback(async () => {
    const { data, error } = await supabase()
      .from(SONGS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []) as unknown as CloudSongRow[];
  }, []);

  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refreshCloud = useCallback(
    async (activeUser?: User | null) => {
      const who = activeUser !== undefined ? activeUser : userRef.current;
      setCloudBusy(true);
      try {
        const rows = await fetchSongs();
        const liked = who ? await fetchFavorites(who.id).catch(() => new Set<string>()) : new Set<string>();
        setCloudStatus("ready");
        setCloudError("");
        const remote = rows.map((r) => rowToTrack(r, liked.has(String(r.id))));
        setTracks((prev) => {
          const byId = new Map<string, Track>();
          prev.forEach((t) => byId.set(t.id, t));
          remote.forEach((t) => {
            const local = byId.get(t.id);
            byId.set(t.id, { ...local, ...t, mine: true, remote: true, liked: local?.liked ?? t.liked });
          });
          const rest = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
          return rest;
        });
      } catch (err) {
        setCloudStatus("offline");
        setCloudError(err instanceof Error ? err.message : String(err));
      } finally {
        setCloudBusy(false);
      }
    },
    [fetchFavorites, fetchSongs],
  );

  /* ------------------------------------------------------------- playlists */
  /*
   * Source of truth is Supabase (already configured):
   *   playlists       → id, user_id, name, description, cover_url, created_at
   *   playlist_tracks → id (bigint), playlist_id, song_id, created_at, position
   * The user id always comes from the Supabase Auth session (auth.uid()).
   */
  const loadPlaylists = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase()
        .from(PLAYLISTS_TABLE)
        .select("id, user_id, name, description, cover_url, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      const rows = (data ?? []) as PlaylistRow[];
      if (!rows.length) {
        setPlaylists([]);
        setPlaylistsError("");
        return;
      }
      const ids = rows.map((r) => r.id);
      const { data: tracks, error: tracksError } = await supabase()
        .from(PLAYLIST_TRACKS_TABLE)
        .select("id, playlist_id, song_id, position, created_at")
        .in("playlist_id", ids)
        .order("position", { ascending: true });
      if (tracksError) throw tracksError;
      const byList = new Map<string, string[]>();
      rows.forEach((r) => byList.set(r.id, []));
      ((tracks ?? []) as PlaylistTrackRow[]).forEach((t) => {
        const arr = byList.get(t.playlist_id);
        if (arr && !arr.includes(t.song_id)) arr.push(t.song_id);
      });
      setPlaylists(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? undefined,
          coverUrl: r.cover_url ?? undefined,
          userId: r.user_id,
          createdAt: r.created_at ? new Date(r.created_at).getTime() || Date.now() : Date.now(),
          songIds: byList.get(r.id) ?? [],
        })),
      );
      setPlaylistsError("");
    } catch (err) {
      console.error("Failed to load playlists:", err);
      setPlaylistsError("Could not load your playlists. Please try again.");
    }
  }, []);

  const createPlaylist = useCallback(
    async (name: string, description?: string): Promise<Playlist> => {
      if (!user) throw new Error("Please sign in to create and manage playlists.");
      const { data, error } = await supabase()
        .from(PLAYLISTS_TABLE)
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          cover_url: null,
        })
        .select("id, user_id, name, description, cover_url, created_at")
        .single();
      if (error || !data) {
        console.error("Could not create playlist:", error ?? "no row returned");
        pushToast("Could not create playlist.", "error");
        throw error ?? new Error("Playlist insert returned no row");
      }
      const row = data as PlaylistRow;
      const playlist: Playlist = {
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        coverUrl: row.cover_url ?? undefined,
        userId: row.user_id,
        createdAt: row.created_at ? new Date(row.created_at).getTime() || Date.now() : Date.now(),
        songIds: [],
      };
      setPlaylists((prev) => [playlist, ...prev]);
      pushToast(`Playlist “${name}” saved successfully`, "success");
      return playlist;
    },
    [pushToast, user],
  );

  const renamePlaylist = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        pushToast("Playlist name can't be empty.", "error");
        return;
      }
      const { error } = await supabase()
        .from(PLAYLISTS_TABLE)
        .update({ name: trimmed })
        .eq("id", id);
      if (error) {
        console.error("Could not rename playlist:", error);
        pushToast("Could not rename playlist.", "error");
        return;
      }
      setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)));
      pushToast("Playlist renamed", "success");
    },
    [pushToast],
  );

  const deletePlaylist = useCallback(
    async (id: string) => {
      const pl = playlists.find((p) => p.id === id);
      if (!pl || pl.userId !== user?.id) {
        pushToast("You can only delete your own playlists.", "error");
        return;
      }
      // Remove the relationship rows first (best effort; the schema may also
      // cascade). Songs themselves are never touched.
      const { error: linksError } = await supabase()
        .from(PLAYLIST_TRACKS_TABLE)
        .delete()
        .eq("playlist_id", id);
      if (linksError) console.error("Could not delete playlist tracks:", linksError);
      const { error } = await supabase().from(PLAYLISTS_TABLE).delete().eq("id", id);
      if (error) {
        console.error("Could not delete playlist:", error);
        pushToast("Could not delete playlist.", "error");
        return;
      }
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      pushToast(`Deleted “${pl.name}”`);
    },
    [playlists, pushToast, user],
  );

  const addSongToPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      if (!user) {
        pushToast("Please sign in to create and manage playlists.", "error");
        return;
      }
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return;
      if (pl.songIds.includes(songId)) {
        pushToast("Song already added to this playlist.");
        return;
      }
      const { error } = await supabase()
        .from(PLAYLIST_TRACKS_TABLE)
        .insert({
          playlist_id: playlistId,
          song_id: songId,
          position: pl.songIds.length,
        });
      if (error) {
        console.error("Could not add song:", error);
        pushToast("Could not add song to playlist.", "error");
        return;
      }
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, songIds: [...p.songIds, songId] } : p)),
      );
      pushToast(`Song added to “${pl.name}”`, "success");
    },
    [playlists, pushToast, user],
  );

  const removeSongFromPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      const pl = playlists.find((p) => p.id === playlistId);
      // Only the relationship row is removed — never the song itself.
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, songIds: p.songIds.filter((s) => s !== songId) } : p,
        ),
      );
      const { error } = await supabase()
        .from(PLAYLIST_TRACKS_TABLE)
        .delete()
        .eq("playlist_id", playlistId)
        .eq("song_id", songId);
      if (error) {
        console.error("Could not remove song from playlist:", error);
        pushToast("Could not remove song from playlist.", "error");
        return;
      }
      if (pl) pushToast(`Removed from “${pl.name}”`);
    },
    [playlists, pushToast],
  );

  /* ---------------------------------------------------------------- loading */
  useEffect(() => {
    let cancelled = false;
    setReady(true); // Never block the initial render waiting for async iframe storage or network

    (async () => {
      let stored: Track[] = [];
      try {
        stored = await tracksStore.all();
      } catch {
        /* ignore offline storage error in sandboxed iframe */
      }
      let prefs: Partial<Prefs> = {};
      try {
        prefs = (await settingsStore.get<Partial<Prefs>>("prefs")) ?? {};
      } catch {
        /* ignore */
      }
      if (cancelled) return;

      const byId = new Map<string, Track>();
      stored.forEach((t) => byId.set(t.id, t));
      if (byId.size > 0) {
        setTracks([...byId.values()].sort((a, b) => b.createdAt - a.createdAt));
      }

      if (typeof prefs.shuffle === "boolean") setIsShuffle(prefs.shuffle);
      if (prefs.repeat) setRepeat(prefs.repeat);
      if (Number.isFinite(prefs.volume)) {
        setVolumeState(prefs.volume as number);
        getAudio().volume = prefs.volume as number;
      }
      preloadDurations([...byId.values()]);

      if (cloudEnabled) {
        try {
          // The Supabase client has already restored the persisted session on
          // refresh; verify the current user against the server, falling back
          // to the locally-restored session when offline.
          let restoredUser: User | null = null;
          try {
            const { data } = await supabase().auth.getUser();
            restoredUser = data.user;
          } catch {
            const res = await supabase().auth.getSession();
            restoredUser = res.data.session?.user ?? null;
          }
          if (!cancelled && restoredUser) {
            setUser(restoredUser);
            syncProfile(restoredUser);
          }
          // Playlists load only AFTER authentication is available.
          await refreshCloud(restoredUser);
          if (restoredUser) void loadPlaylists(restoredUser.id);
        } catch {
          setCloudStatus("offline");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* auth subscription (subscribes exactly once to prevent infinite loop/spam) */
  useEffect(() => {
    if (!cloudEnabled) return;
    const { data } = supabase().auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      syncProfile(nextUser);
      if (event === "SIGNED_IN") {
        // Load the shared library AND this user's private playlists
        // (fires for email sign-in, Google OAuth redirect, and token restores).
        window.setTimeout(() => {
          void refreshCloud(nextUser);
          if (nextUser) void loadPlaylists(nextUser.id);
        }, 0);
        // Ask for name + DOB on every fresh login until the profile is complete.
        if (nextUser) {
          const meta = nextUser.user_metadata ?? {};
          if (!meta.full_name || !meta.date_of_birth) setProfilePrompt(true);
        }
      } else if (event === "SIGNED_OUT") {
        getAudio().pause();
        setTracks((prev) => prev.filter((t) => !t.remote));
        setPlaylists([]);
        setProfile({ name: "", dob: "" });
        setProfilePrompt(false);
        setCloudStatus("ready");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [getAudio, loadPlaylists, refreshCloud, syncProfile]);

  /* ------------------------------------------- duration probe registrations */
  useEffect(() => {
    tracks.forEach((t) => {
      durationListeners.set(t.id, (seconds) => {
        durationListeners.delete(t.id);
        setTracks((prev) =>
          prev.map((x) =>
            x.id === t.id && Math.abs((x.duration || 0) - seconds) > 1
              ? { ...x, duration: seconds }
              : x,
          ),
        );
      });
    });
  }, [tracks]);

  /* ------------------------------------------------------------ audio wires */
  const findTrack = useCallback(
    (id: string | null) => tracks.find((t) => t.id === id) ?? null,
    [tracks],
  );

  const current = findTrack(currentId);

  const persistPrefs = useCallback(
    (patch: Partial<Prefs>) => {
      settingsStore
        .set("prefs", { shuffle: isShuffle, repeat, volume, ...(patch as Partial<Prefs>) })
        .catch(() => undefined);
    },
    [isShuffle, repeat, volume],
  );

  const play = useCallback(
    (track: Track) => {
      if (!track) return;
      if (!requireAuth()) return;
      const el = getAudio();
      const rawSrc = srcFor(track);
      const src = safeMediaUrl(rawSrc);
      if (!src) {
        pushToast("That track has no playable audio source.", "error");
        return;
      }
      if (currentId !== track.id || el.src !== src) {
        el.src = src;
        el.currentTime = 0;
        setCurrentId(track.id);
        setTime(0);
        setDuration(track.duration || 0);
        historyRef.current = [...historyRef.current.filter((id) => id !== track.id), track.id].slice(-40);
      }
      el.volume = muted ? 0 : volume;
      el.play().catch(() => pushToast("Tap play again — the browser blocked autoplay.", "error"));
    },
    [currentId, getAudio, muted, pushToast, requireAuth, srcFor, volume],
  );

  const playableList = useMemo(() => tracks, [tracks]);

  const playAll = useCallback(
    (shuffle = false, list: Track[] = playableList) => {
      if (!list.length) {
        pushToast("Nothing to play yet — add some music first.", "error");
        return;
      }
      if (shuffle) setIsShuffle(true);
      const pick = shuffle ? list[Math.floor(Math.random() * list.length)] : list[0];
      play(pick);
    },
    [play, playableList, pushToast],
  );

  const next = useCallback(() => {
    if (!requireAuth()) return;
    const list = playableList;
    if (!list.length) return;
    if (repeat === "one" && currentId) {
      const el = getAudio();
      el.currentTime = 0;
      el.play().catch(() => undefined);
      return;
    }
    if (queue.length) {
      const [id, ...rest] = queue;
      setQueue(rest);
      const t = list.find((x) => x.id === id);
      if (t) {
        play(t);
        return;
      }
    }
    const idx = list.findIndex((t) => t.id === currentId);
    if (isShuffle) {
      const pool = list.filter((t) => t.id !== currentId);
      const t = (pool.length ? pool : list)[Math.floor(Math.random() * (pool.length || list.length))];
      play(t);
      return;
    }
    if (repeat === "off" && idx === list.length - 1) {
      const el = getAudio();
      el.currentTime = 0;
      el.pause();
      return;
    }
    play(list[(idx + 1) % list.length]);
  }, [currentId, getAudio, isShuffle, play, playableList, queue, repeat, requireAuth]);

  const prev = useCallback(() => {
    if (!requireAuth()) return;
    const el = getAudio();
    if (el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    const list = playableList;
    if (!list.length) return;
    if (isShuffle && historyRef.current.length > 1) {
      const trail = [...historyRef.current];
      trail.pop();
      const last = trail.pop();
      historyRef.current = trail;
      const t = list.find((x) => x.id === last);
      if (t) {
        play(t);
        return;
      }
    }
    const idx = list.findIndex((t) => t.id === currentId);
    play(list[(idx - 1 + list.length) % list.length]);
  }, [currentId, getAudio, isShuffle, play, playableList, requireAuth]);

  const toggle = useCallback(() => {
    const el = getAudio();
    if (!currentId || el.paused) {
      if (!requireAuth()) return;
      if (!currentId) {
        playAll(false);
        return;
      }
      el.play().catch(() => undefined);
      return;
    }
    el.pause();
  }, [currentId, getAudio, playAll, requireAuth]);

  const seek = useCallback(
    (seconds: number) => {
      const el = getAudio();
      if (Number.isFinite(el.duration)) el.currentTime = Math.min(Math.max(seconds, 0), el.duration);
    },
    [getAudio],
  );

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
      setMuted(v === 0);
      const el = getAudio();
      el.volume = v;
      el.muted = v === 0;
      persistPrefs({ volume: v });
    },
    [getAudio, persistPrefs],
  );

  const toggleMute = useCallback(() => {
    const el = getAudio();
    const nextMuted = !el.muted;
    el.muted = nextMuted;
    setMuted(nextMuted);
  }, [getAudio]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((s) => {
      persistPrefs({ shuffle: !s });
      return !s;
    });
  }, [persistPrefs]);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => {
      const nextMode: RepeatMode = r === "off" ? "all" : r === "all" ? "one" : "off";
      persistPrefs({ repeat: nextMode });
      return nextMode;
    });
  }, [persistPrefs]);

  const toggleLike = useCallback(
    (track: Track) => {
      if (!track) return;
      if (!requireAuth()) return;
      const nowLiked = !track.liked;
      setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, liked: nowLiked } : t)));

      if (!track.remote) {
        tracksStore.put({ ...track, liked: nowLiked }).catch(() => undefined);
      }

      if (track.remote && user) {
        const apply = nowLiked
          ? supabase().from(FAVORITES_TABLE).upsert(
              { user_id: user.id, song_id: track.id },
              { onConflict: "user_id,song_id" },
            )
          : supabase()
              .from(FAVORITES_TABLE)
              .delete()
              .eq("user_id", user.id)
              .eq("song_id", track.id);
        apply.then(
          ({ error }) => {
            if (error) {
              pushToast(error.message, "error");
              setTracks((prev) =>
                prev.map((t) => (t.id === track.id ? { ...t, liked: !nowLiked } : t)),
              );
            }
          },
        );
      }
      pushToast(nowLiked ? "Added to Liked Songs" : "Removed from Liked Songs");
    },
    [pushToast, requireAuth, user],
  );

  const addToQueue = useCallback(
    (track: Track) => {
      if (!track) return;
      if (!requireAuth()) return;
      setQueue((q) => {
        if (q.includes(track.id)) {
          pushToast("Already in the queue.", "error");
          return q;
        }
        pushToast(`“${track.title}” plays next`);
        return [...q, track.id];
      });
    },
    [pushToast, requireAuth],
  );

  const removeFromQueue = useCallback((id: string) => {
    setQueue((q) => q.filter((x) => x !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    pushToast("Queue cleared");
  }, [pushToast]);

  /* -------------------------------------------------------------- publishing */
  const uploadFile = useCallback(
    async (ownerId: string, id: string, file: File, kind: "audio" | "cover") => {
      // Path is namespaced by the uploader's auth uid so storage policies can
      // scope objects to the account that wrote them:  <owner>/<track>/file.ext
      const path = `${ownerId}/${id}/${kind}-${Date.now()}.${safeExt(file)}`;
      const { error } = await supabase()
        .storage.from(MUSIC_BUCKET)
        .upload(path, file, {
          // Never send a default content type that could be served as HTML/JS.
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
          // upsert:false → an existing object path is never overwritten.
          upsert: false,
        });
      if (error) throw error;
      const { data } = supabase().storage.from(MUSIC_BUCKET).getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Upload succeeded but no public URL came back.");
      return data.publicUrl;
    },
    [],
  );

  /* Client-side validation is defense-in-depth only — the real limits must
     also be enforced in Supabase (storage policies / Edge Function). */
  const AUDIO_MAX_BYTES = 50 * 1024 * 1024;
  const COVER_MAX_BYTES = 5 * 1024 * 1024;
  const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "opus", "webm"];
  const IMAGE_MIME = /^image\/(png|jpe?g|webp|gif)$/i;

  function validateAudioFile(file: File): string | null {
    const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "" : "";
    const typeOk = file.type.startsWith("audio/") || AUDIO_EXTENSIONS.includes(ext);
    if (!typeOk) return `“${file.name}” is not a supported audio file.`;
    if (file.size > AUDIO_MAX_BYTES) return "Audio file is larger than the 50 MB limit.";
    return null;
  }

  function validateCoverFile(file: File): string | null {
    if (!IMAGE_MIME.test(file.type)) return "Cover must be a PNG, JPG, WebP or GIF image.";
    if (file.size > COVER_MAX_BYTES) return "Cover image is larger than the 5 MB limit.";
    return null;
  }

  const addUpload = useCallback(
    async ({ title, artist, album, audio: audioFile, cover }: UploadInput) => {
      const audioProblem = validateAudioFile(audioFile);
      if (audioProblem) {
        pushToast(audioProblem, "error");
        return;
      }
      if (cover) {
        const coverProblem = validateCoverFile(cover);
        if (coverProblem) {
          pushToast(coverProblem, "error");
          return;
        }
      }

      if (!requireAuth()) return;

      const id = uid();
      const localTrack: Track = {
        id,
        title,
        artist,
        album: album || "Single",
        duration: 0,
        audioBlob: audioFile,
        coverBlob: cover ?? undefined,
        liked: false,
        playCount: 0,
        createdAt: Date.now(),
        mine: true,
      };
      setTracks((prev) => [...prev, localTrack]);

      try {
        await tracksStore.put(localTrack);
      } catch {
        pushToast("Kept for this session only — browser storage is full or blocked.", "error");
      }

      if (!user) {
        pushToast(`“${title}” saved on this device — sign in as a moderator to publish`, "success");
        return;
      }

      if (!isAdmin) {
        setCloudStatus("ready");
        pushToast("Publishing is restricted to moderator accounts.", "error");
        return;
      }

      setCloudBusy(true);
      try {
        const [audioUrl, durationSec] = await Promise.all([
          uploadFile(user.id, id, audioFile, "audio"),
          probeDuration(audioFile),
        ]);
        let coverUrl: string | null = null;
        if (cover) coverUrl = await uploadFile(user.id, id, cover, "cover");

        const row = {
          id,
          title,
          artist,
          album: album || "Single",
          audio_url: audioUrl,
          cover_url: coverUrl,
          duration: durationSec,
          owner: user.id,
          created_at: new Date().toISOString(),
        };
        let { error } = await supabase().from(SONGS_TABLE).upsert(row, { onConflict: "id" });
        // Older Supabase schemas lack the `owner` column — retry without it so
        // publishing still works (owner is then unknown, which only weakens
        // per-uploader file cleanup).
        if (error && /owner/i.test(error.message)) {
          const { owner: _omit, ...rowWithoutOwner } = row;
          ({ error } = await supabase().from(SONGS_TABLE).upsert(rowWithoutOwner, { onConflict: "id" }));
        }
        if (error) throw error;

        setTracks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  duration: durationSec,
                  audio: audioUrl,
                  cover: coverUrl ?? undefined,
                  remote: true,
                  owner: user.id,
                }
              : t,
          ),
        );
        pushToast(`“${title}” published to the shared library`, "success");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setCloudStatus("offline");
        setCloudError(message);
        pushToast(`Saved locally, but the cloud upload failed: ${message}`, "error");
      } finally {
        setCloudBusy(false);
      }
    },
    [isAdmin, pushToast, requireAuth, uploadFile, user],
  );

  /** Moderators may manage anything; a signed-in member may only manage their own uploads. */
  const canManageTrack = useCallback(
    (track: Track | null | undefined) => {
      if (!track) return false;
      if (isAdmin) return true;
      return Boolean(user) && track.owner === user?.id && !track.remote;
    },
    [isAdmin, user],
  );

  const removeTrack = useCallback(
    (id: string) => {
      const t = tracks.find((x) => x.id === id);
      if (!t) return;
      if (!canManageTrack(t)) {
        pushToast("You can only remove tracks you uploaded.", "error");
        return;
      }
      const cloud = Boolean(t.remote);

      setQueue((q) => q.filter((x) => x !== id));
      setTracks((prev) => prev.filter((x) => x.id !== id));
      if (currentId === id) {
        getAudio().pause();
        setCurrentId(null);
        setIsPlaying(false);
      }
      tracksStore.remove(id).catch(() => undefined);
      ["a:" + id, "c:" + id].forEach((key) => {
        const url = urlsRef.current.get(key);
        if (url) {
          URL.revokeObjectURL(url);
          urlsRef.current.delete(key);
        }
      });

      if (cloud && user) {
        (async () => {
          const { error } = await supabase().from(SONGS_TABLE).delete().eq("id", id);
          if (error) {
            pushToast(`Removed locally, but cloud delete failed: ${error.message}`, "error");
            return;
          }
          // Objects live under <uploader-uid>/<track-id>/ (or <track-id>/ for
          // legacy uploads from before that layout). Clean up whichever exists.
          const ownerDir = t.owner ?? user.id;
          const bucket = supabase().storage.from(MUSIC_BUCKET);
          const { data: files } = await bucket.list(`${ownerDir}/${id}`);
          let paths: string[] | null = files?.length
            ? files.map((f) => `${ownerDir}/${id}/${f.name}`)
            : null;
          if (!paths) {
            const { data: legacy } = await bucket.list(id);
            if (legacy?.length) paths = legacy.map((f) => `${id}/${f.name}`);
          }
          if (paths) {
            const { error: rmError } = await bucket.remove(paths);
            if (rmError) console.warn("Orphaned storage files remain:", rmError.message);
          }
          pushToast("Removed from the shared library");
        })();
      } else {
        pushToast(`“${t.title}” deleted`);
      }
    },
    [canManageTrack, currentId, getAudio, pushToast, tracks, user],
  );

  const updateTrack = useCallback(
    async (id: string, patch: Partial<Pick<Track, "title" | "artist" | "album">>) => {
      const target = tracks.find((x) => x.id === id);
      if (!canManageTrack(target)) {
        pushToast("Editing is limited to moderators and your own uploads.", "error");
        return;
      }
      let updated: Track | undefined;
      setTracks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          updated = { ...t, ...patch };
          return updated;
        }),
      );
      if (!updated) return;
      if (updated.remote && isAdmin) {
        const { error } = await supabase()
          .from(SONGS_TABLE)
          .update({
            title: updated.title,
            artist: updated.artist,
            album: updated.album || "Single",
          })
          .eq("id", id);
        if (error) {
          pushToast(`Cloud update failed: ${error.message}`, "error");
          return;
        }
      }
      if (!updated.remote) {
        try {
          await tracksStore.put(updated);
        } catch {
          pushToast("Could not save the edit locally.", "error");
        }
      }
    },
    [canManageTrack, isAdmin, pushToast, tracks, user],
  );

  /* ------------------------------------------------------------------- auth */
  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setCloudBusy(true);
      try {
        const { error } = await supabase().auth.signInWithPassword({ email, password });
        if (error) throw error;
        pushToast("Signed in", "success");
      } catch (err) {
        throw err instanceof Error ? err : new Error(String(err));
      } finally {
        setCloudBusy(false);
      }
    },
    [pushToast],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string) => {
      setCloudBusy(true);
      try {
        const { data, error } = await supabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        pushToast(
          data.session ? "Account created — welcome!" : "Check your inbox to confirm the account.",
          "success",
        );
      } catch (err) {
        throw err instanceof Error ? err : new Error(String(err));
      } finally {
        setCloudBusy(false);
      }
    },
    [pushToast],
  );

  const signInWithGoogle = useCallback(async () => {
    setCloudBusy(true);
    try {
      const { error } = await supabase().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setCloudBusy(false);
      pushToast(err instanceof Error ? err.message : String(err), "error");
    }
  }, [pushToast]);

  const signOutCloud = useCallback(async () => {
    await supabase().auth.signOut();
    setUser(null);
    setTracks((prev) => prev.filter((t) => !t.remote));
    setSection("home");
    pushToast("Signed out");
  }, [pushToast]);

  /* --------------------------------------------------------- audio listeners */
  useEffect(() => {
    const el = getAudio();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    let lastTime = 0;
    const onTime = () => {
      const now = el.currentTime;
      if (Math.abs(now - lastTime) >= 0.22 || el.paused || el.ended) {
        lastTime = now;
        setTime(now);
      }
    };
    const onMeta = () => {
      setDuration(el.duration || 0);
      setIsLoading(false);
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setTracks((prev) =>
          prev.map((t) =>
            t.id === currentId && Math.abs((t.duration || 0) - el.duration) > 1
              ? { ...t, duration: el.duration }
              : t,
          ),
        );
      }
    };
    const onError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      pushToast("That track couldn't be loaded. Check your connection or file.", "error");
    };
    const onEnded = () => next();
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("error", onError);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("error", onError);
      el.removeEventListener("ended", onEnded);
    };
  }, [currentId, getAudio, next, pushToast]);

  useEffect(() => {
    // MediaMetadata is missing in some browsers and sandboxed iframes — never let it crash the app.
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined" || !current) return;
    try {
      const art = coverFor(current);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: current.album,
        artwork: art ? [{ src: art, sizes: "512x512", type: "image/jpeg" }] : [],
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
    } catch {
      /* OS media integration is unavailable — playback is unaffected. */
    }
  }, [coverFor, current, next, prev]);

  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current.clear();
    },
    [],
  );

  const value: PlayerValue = useMemo(
    () => ({
      tracks,
      current,
      currentId,
      isPlaying,
      isLoading,
      isShuffle,
      repeat,
      volume,
      muted,
      time,
      duration,
      queue,
      ready,
      search,
      section,
      setSearch,
      setSection,
      play,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      toggleLike,
      addToQueue,
      removeFromQueue,
      clearQueue,
      playAll,
      addUpload,
      removeTrack,
      updateTrack,
      srcFor,
      coverFor,
      toasts,
      pushToast,
      user,
      isAdmin,
      cloudStatus,
      cloudBusy,
      cloudError,
      canPublish: isAdmin,
      canManageTrack,
      playlists,
      loadPlaylists,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      playlistsError,
      playlistSongTarget,
      openAddToPlaylist,
      closeAddToPlaylist,
      profile,
      profilePrompt,
      saveProfile,
      skipProfilePrompt,
      openProfilePrompt,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOutCloud,
      refreshCloud: () => refreshCloud(user),
    }),
    [
      tracks,
      current,
      currentId,
      isPlaying,
      isLoading,
      isShuffle,
      repeat,
      volume,
      muted,
      time,
      duration,
      queue,
      ready,
      search,
      section,
      play,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      toggleLike,
      addToQueue,
      removeFromQueue,
      clearQueue,
      playAll,
      addUpload,
      removeTrack,
      updateTrack,
      srcFor,
      coverFor,
      toasts,
      pushToast,
      user,
      isAdmin,
      cloudStatus,
      cloudBusy,
      cloudError,
      canManageTrack,
      playlists,
      loadPlaylists,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      playlistsError,
      playlistSongTarget,
      openAddToPlaylist,
      closeAddToPlaylist,
      profile,
      profilePrompt,
      saveProfile,
      skipProfilePrompt,
      openProfilePrompt,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOutCloud,
      refreshCloud,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
