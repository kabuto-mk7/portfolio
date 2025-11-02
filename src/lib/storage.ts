import type { EventRow, Post, MediaItem } from "@/types";

const EVENTS_KEY = "kabuto.data.events.v1";
const POSTS_KEY  = "kabuto.data.posts.v1";
export const ADMIN_HASH_KEY = "kabuto.admin.hash";
const ADMIN_SALT = "kabuto.salt.v1";

/** Portfolio media store (admin uploads). */
const PORTFOLIO_KEY = "kabuto.data.portfolio.v1";

export function safeParse<T>(raw: string | null, fallback: T): T {
  try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

/* ---------- Portfolio items ---------- */
export function loadPortfolioItems(): MediaItem[] {
  return safeParse<MediaItem[]>(localStorage.getItem(PORTFOLIO_KEY), []);
}
export function savePortfolioItems(items: MediaItem[]) {
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("kabuto:data", { detail: { type: "portfolio" } }));
  } catch {}
}

/* ---------- Events ---------- */
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

/* ---------- Posts ---------- */
export function loadPosts(): Post[] {
  const raw = safeParse<Post[]>(localStorage.getItem(POSTS_KEY), []);
  return raw.map(p => ({ ...p, attachments: p.attachments ?? [] }));
}
export function savePosts(rows: Post[]) {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent("kabuto:data", { detail: { type: "posts" } }));
  } catch {}
}

/* ---------- Admin auth ---------- */
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

/* ---------- Utils ---------- */
export function uid() { return Math.random().toString(36).slice(2, 10); }
