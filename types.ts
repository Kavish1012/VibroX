export type RepeatMode = "off" | "all" | "one";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  /** Remote audio URL (cloud tracks; local uploads are turned into blob URLs at runtime) */
  audio?: string;
  /** Remote cover URL */
  cover?: string;
  /** Locally uploaded blobs (persisted in IndexedDB) */
  audioBlob?: Blob;
  coverBlob?: Blob;
  liked: boolean;
  playCount: number;
  createdAt: number;
  /** set when the track was uploaded by the user */
  mine?: boolean;
  /** lives in the shared Supabase library */
  remote?: boolean;
  /** owner tag stored alongside the row (best effort) */
  owner?: string | null;
}

export type Section = "home" | "liked" | "account" | "plus" | "playlists" | "queue";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  /** Supabase auth uid of the owner (playlists.user_id) */
  userId: string;
  createdAt: number;
  /** ids of songs in this playlist, in position order */
  songIds: string[];
}

export interface ToastItem {
  id: number;
  message: string;
  tone: "default" | "success" | "error";
}
