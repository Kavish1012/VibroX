import { createClient, type SupabaseClient, type Session, type User } from "@supabase/supabase-js";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://zrsxemqfrgrdcvgbmujk.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_1Iw6O0D5V5OgyNI4bagNtA_MdAQsfK3";

export const MUSIC_BUCKET = "music";
export const SONGS_TABLE = "songs";
export const FAVORITES_TABLE = "favorites";

/*
 * Playlist schema (already configured in Supabase — the website only
 * reads/writes these tables and never creates or modifies them):
 *
 *   public.playlists       → id, user_id, name, description, cover_url, created_at
 *   public.playlist_tracks → id (bigint), playlist_id, song_id, created_at, position
 *
 * Ownership (user_id) is enforced server-side; the site always operates with
 * the authenticated user's own playlist IDs only.
 */
export const PLAYLISTS_TABLE = "playlists";
export const PLAYLIST_TRACKS_TABLE = "playlist_tracks";

export interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at?: string | null;
}

export interface PlaylistTrackRow {
  id: number;
  playlist_id: string;
  song_id: string;
  position: number;
  created_at?: string | null;
}

/** Accounts with full moderation rights (can edit/delete any cloud track). */
export const ADMIN_EMAILS = ["kavish09101012@gmail.com", "shahudi124@gmail.com"];

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export const cloudEnabled = true;

export function isAdminUser(user: User | null | undefined): boolean {
  const email = (user?.email ?? "").trim().toLowerCase();
  return Boolean(email) && ADMIN_EMAILS.includes(email);
}

export interface CloudSongRow {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  audio_url: string;
  cover_url: string | null;
  duration: number | null;
  play_count?: number | null;
  owner?: string | null;
  created_at?: string | null;
}

export function rowToTrack(row: CloudSongRow, liked = false): import("../types").Track {
  return {
    id: String(row.id),
    title: row.title || "Untitled",
    artist: row.artist || "Unknown artist",
    album: row.album || "Single",
    duration: Number(row.duration) || 0,
    audio: row.audio_url,
    cover: row.cover_url || undefined,
    liked,
    playCount: Number(row.play_count) || 0,
    createdAt: row.created_at ? new Date(row.created_at).getTime() || Date.now() : Date.now(),
    remote: true,
    owner: row.owner ?? null,
  };
}

export type { Session, User };
