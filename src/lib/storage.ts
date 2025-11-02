import type { EventRow, Post, MediaItem } from "@/types";

const EVENTS_KEY = "kabuto.data.events.v1";
const POSTS_KEY  = "kabuto.data.posts.v1";
const ADMIN_HASH_KEY = "kabuto.admin.hash";
const ADMIN_SALT     = "kabuto.salt.v1";
export { ADMIN_HASH_KEY };

// Key used to persist portfolio media items uploaded via the admin interface.
const PORTFOLIO_KEY = "kabuto.data.portfolio.v1";

// Load the array of portfolio media items from localStorage.  If no items have
// been stored yet, an empty array is returned.  Invalid or corrupted data
// gracefully falls back to an empty list.
export function loadPortfolioItems(): MediaItem[] {
  return safeParse<MediaItem[]>(localStorage.getItem(PORTFOLIO_KEY), []);
}

// Persist the provided array of portfolio media items to localStorage.  When
// called, a custom event is dispatched so that other parts of the app can
// react to changes in the portfolio data (e.g. reload the portfolio page).
export function savePortfolioItems(items: MediaItem[]) {
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("kabuto:data", { detail: { type: "portfolio" } }));
  } catch {}
}

export function safeParse<T>(raw: string | null, fallback: T): T {
  try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

export function loadEvents(): EventRow[] {
  const raw = safeParse<EventRow[]>(localStorage.getItem(EVENTS_KEY), []);
  return raw.map(r => ({ ...r, published: r.published ?? true }));
}
export function saveEvents(rows: EventRow[]) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent("kabuto:data", { detail: { type: "events" } }));
  } catch {}
}

export function loadPosts(): Post[] {
  const raw = safeParse<Post[]>(localStorage.getItem(POSTS_KEY), []);
  // Ensure each post has a default attachments array.  Older stored posts
  // may omit the property so fallback to an empty list to avoid
  // undefined checks later on.
  return raw.map((p) => ({ ...p, attachments: p.attachments ?? [] }));
}
export function savePosts(rows: Post[]) {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent("kabuto:data", { detail: { type: "posts" } }));
  } catch {}
}

export function uid() { return Math.random().toString(36).slice(2, 10); }

async function sha256Hex(s: string) {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

export async function setAdminPassword(pw: string) {
  const hash = await sha256Hex(ADMIN_SALT + pw);
  localStorage.setItem(ADMIN_HASH_KEY, hash);
}
export async function verifyAdminPassword(pw: string) {
  const hash = localStorage.getItem(ADMIN_HASH_KEY);
  if (!hash) return false;
  const attempt = await sha256Hex(ADMIN_SALT + pw);
  return attempt === hash;
}
