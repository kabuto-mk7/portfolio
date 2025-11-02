// src/lib/content.ts
// Single source of truth for events + posts persisted in localStorage.
// Matches Admin's data model.

export type EventRow = {
  id: string;
  game: string;
  date: string;       // YYYY-MM-DD
  location: string;
  event: string;
  placement: string;  // e.g. "12/128" or "1st"
  published: boolean;
};

export type MediaItem = {
  id: string;
  src: string;        // data URL or hosted URL
  type: "image" | "video";
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  date: string;       // YYYY-MM-DD
  summary: string;
  content: string;    // markdown-lite / plain text
  published: boolean;
  updatedAt: number;
  attachments?: MediaItem[];
};

const EVENTS_KEY = "kabuto.events.v1";
const POSTS_KEY  = "kabuto.posts.v1";

// ---------- utils ----------
export function uid(): string {
  return (crypto as any)?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Events ----------
export function loadEvents(): EventRow[] {
  return readJSON<EventRow[]>(EVENTS_KEY, []);
}
export function saveEvents(rows: EventRow[]) {
  writeJSON(EVENTS_KEY, rows);
}

// ---------- Posts ----------
export function loadPosts(): Post[] {
  // Always coerce attachments to a sane default so older saves don't break.
  const rows = readJSON<Post[]>(POSTS_KEY, []);
  return rows.map(p => ({ attachments: [], ...p }));
}
export function savePosts(rows: Post[]) {
  writeJSON(POSTS_KEY, rows);
}

// Convenience helpers used by Blog pages
export function loadPublishedPosts(): Post[] {
  return loadPosts()
    .filter(p => p.published)
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
}

export function getPostBySlug(slug: string): Post | null {
  const rows = loadPosts();
  return rows.find(p => p.slug === slug) ?? null;
}
