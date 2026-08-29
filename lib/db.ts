import type { Track } from "../types";

const DB_NAME = "VibroxDB";
const DB_VERSION = 1;
const TRACKS = "tracks";
const SETTINGS = "settings";

let dbPromise: Promise<IDBDatabase> | null = null;

/** Reads a global that may be blocked entirely (sandboxed iframes throw on access). */
function safeGlobal<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const factory = safeGlobal(() => globalThis.indexedDB);
    if (!factory) {
      reject(new Error("IndexedDB is unavailable in this browser."));
      return;
    }
    const req = factory.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TRACKS)) db.createObjectStore(TRACKS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open IndexedDB."));
  });
  return dbPromise;
}

function store(db: IDBDatabase, name: string, mode: IDBTransactionMode) {
  return db.transaction(name, mode).objectStore(name);
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const tracksStore = {
  async all(): Promise<Track[]> {
    const db = await openDB();
    return request<Track[]>(store(db, TRACKS, "readonly").getAll());
  },
  async put(track: Track): Promise<void> {
    const db = await openDB();
    await request(store(db, TRACKS, "readwrite").put(track));
  },
  async remove(id: string): Promise<void> {
    const db = await openDB();
    await request(store(db, TRACKS, "readwrite").delete(id));
  },
};

export const settingsStore = {
  async get<T>(key: string): Promise<T | undefined> {
    const db = await openDB();
    const row = await request<{ key: string; value: T } | undefined>(
      store(db, SETTINGS, "readonly").get(key),
    );
    return row?.value;
  },
  async set<T>(key: string, value: T): Promise<void> {
    const db = await openDB();
    await request(store(db, SETTINGS, "readwrite").put({ key, value }));
  },
};
