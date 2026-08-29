export function fmt(sec?: number | null): string {
  const v = Number(sec);
  if (!Number.isFinite(v) || v <= 0) return "0:00";
  const m = Math.floor(v / 60);
  const s = Math.floor(v % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function hashId(id: string): number {
  let h = 2166136261;
  for (const ch of String(id)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random pick — powers "Daily Picks" so it changes once per day. */
export function dailyPicks<T>(items: T[], n: number, key: string): T[] {
  if (!items.length) return [];
  let seed = 0;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return items
    .map((t, i) => ({
      item: t,
      score: ((seed ^ (hashId(String(i)) + key.length)) * 1664525 + 1013904223) >>> 0,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
    .map((x) => x.item);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const GRADIENTS = [
  ["#ff7a00", "#2a1408"],
  ["#ff2e63", "#1b0a1f"],
  ["#00c2ff", "#04182b"],
  ["#8b5cf6", "#160b2b"],
  ["#22c55e", "#052012"],
  ["#f59e0b", "#231204"],
  ["#ec4899", "#26081b"],
  ["#14b8a6", "#04201f"],
];

export function gradientFor(id: string): string {
  const [a, b] = GRADIENTS[hashId(id) % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function initials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
