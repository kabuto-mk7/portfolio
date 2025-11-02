// src/lib/storage.ts
export type MediaKind = "image" | "video";
export type MediaItem = { id: string; type: MediaKind; src: string; createdAt: number; name?: string };

const BACKEND = (import.meta.env.VITE_STORAGE_BACKEND || "LOCAL").toUpperCase() as "LOCAL" | "SUPABASE";
const SB_BUCKET_PORTFOLIO = import.meta.env.VITE_SUPABASE_BUCKET_PORTFOLIO || "portfolio";
const SB_BUCKET_BLOG      = import.meta.env.VITE_SUPABASE_BUCKET_BLOG || "blog";

function uuid() {
  // not crypto-random, but good enough to name objects + ids
  return (crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function mediaKindFromMime(m: string): MediaKind { return m?.startsWith?.("video") ? "video" : "image"; }
function extIsVideo(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["mp4", "mov", "webm", "m4v"].includes(ext);
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOCAL (IndexedDB) fallback for portfolio/blog media
   ───────────────────────────────────────────────────────────────────────────*/
const DB_NAME = "kabuto-db"; const DB_VERSION = 2;
type Table = "portfolio" | "blog";
type LocalRec = { id: string; name: string; type: MediaKind; blob: Blob; createdAt: number };

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      (["portfolio","blog"] as Table[]).forEach(t => {
        if (!db.objectStoreNames.contains(t)) db.createObjectStore(t, { keyPath: "id" });
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function idbAddMany(table: Table, recs: LocalRec[]): Promise<void> {
  return openDB().then(db => new Promise<void>((res, rej) => {
    const tx = db.transaction(table, "readwrite"); const s = tx.objectStore(table);
    recs.forEach(r => s.add(r)); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  }));
}
function idbList(table: Table): Promise<LocalRec[]> {
  return openDB().then(db => new Promise<LocalRec[]>((res, rej) => {
    const out: LocalRec[] = []; const tx = db.transaction(table, "readonly"); const s = tx.objectStore(table);
    const r = s.openCursor(null, "prev");
    r.onsuccess = () => { const c = r.result; if (!c) return res(out); out.push(c.value as LocalRec); c.continue(); };
    r.onerror = () => rej(r.error);
  }));
}
function idbDelete(table: Table, id: string): Promise<void> {
  return openDB().then(db => new Promise<void>((res, rej) => {
    const tx = db.transaction(table, "readwrite"); tx.objectStore(table).delete(id);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  }));
}
let localUrls = new Map<string, string>();
function toItemsFromLocal(rows: LocalRec[]): MediaItem[] {
  return rows.map(r => {
    let url = localUrls.get(r.id);
    if (!url) { url = URL.createObjectURL(r.blob); localUrls.set(r.id, url); }
    return { id: r.id, type: r.type, src: url, createdAt: r.createdAt, name: r.name };
  });
}
export function revokeAllObjectUrls(){ localUrls.forEach(u=>URL.revokeObjectURL(u)); localUrls.clear(); }

/* ─────────────────────────────────────────────────────────────────────────────
   SUPABASE client (+ helpers)
   ───────────────────────────────────────────────────────────────────────────*/
let _sb: any = null;
async function sb() {
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);
  return _sb;
}
async function sbUploadMany(bucket: string, files: File[]): Promise<string[]> {
  const supabase = await sb(); const ids: string[] = [];
  for (const f of files) {
    const id = uuid(); const ext = (f.name.split(".").pop() || "").toLowerCase();
    const key = `${id}.${ext || (mediaKindFromMime(f.type) === "video" ? "mp4" : "png")}`;
    const { error } = await supabase.storage.from(bucket).upload(key, f, { upsert: false });
    if (error) throw error; ids.push(key);
  } return ids;
}
async function sbList(bucket: string): Promise<MediaItem[]> {
  const supabase = await sb();
  const { data, error } = await supabase.storage.from(bucket).list("", {
    sortBy: { column: "created_at", order: "desc" },
    limit: 10000
  });
  if (error) throw error;
  return (data || []).filter((o:any)=>!o.name.endsWith("/")).map((o:any) => {
    const url = supabase.storage.from(bucket).getPublicUrl(o.name).data.publicUrl as string;
    const ts = new Date(o.created_at || Date.now()).getTime();
    return { id: o.name, type: extIsVideo(o.name) ? "video" : "image", src: url, createdAt: ts, name: o.name };
  });
}
async function sbDelete(bucket: string, key: string): Promise<void> {
  const supabase = await sb(); const { error } = await supabase.storage.from(bucket).remove([key]); if (error) throw error;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PUBLIC MEDIA API  (Portfolio + Blog attachments)
   ───────────────────────────────────────────────────────────────────────────*/
// Portfolio media
export async function addPortfolioFiles(files: File[]): Promise<string[]> {
  if (BACKEND === "SUPABASE") { const ids = await sbUploadMany(SB_BUCKET_PORTFOLIO, files); dispatchPortfolioEvent("added-many", ids); return ids; }
  const recs = files.map(f => ({ id: uuid(), name: f.name, type: mediaKindFromMime(f.type), blob: f, createdAt: Date.now() })) as LocalRec[];
  await idbAddMany("portfolio", recs); dispatchPortfolioEvent("added-many", recs.map(r => r.id)); return recs.map(r => r.id);
}
export async function deletePortfolioItem(id: string): Promise<void> {
  if (BACKEND === "SUPABASE") await sbDelete(SB_BUCKET_PORTFOLIO, id); else await idbDelete("portfolio", id);
  dispatchPortfolioEvent("deleted", id);
}
export async function listPortfolioItems(): Promise<MediaItem[]> {
  if (BACKEND === "SUPABASE") return sbList(SB_BUCKET_PORTFOLIO);
  const rows = await idbList("portfolio"); return toItemsFromLocal(rows);
}
export async function loadPortfolioItems(): Promise<MediaItem[]> { return listPortfolioItems(); }

// Blog attachments (media only – used by createPost)
export async function addBlogFiles(files: File[]): Promise<string[]> {
  if (BACKEND === "SUPABASE") return sbUploadMany(SB_BUCKET_BLOG, files);
  const recs = files.map(f => ({ id: uuid(), name: f.name, type: mediaKindFromMime(f.type), blob: f, createdAt: Date.now() })) as LocalRec[];
  await idbAddMany("blog", recs); return recs.map(r => r.id);
}
export async function listBlogItems(): Promise<MediaItem[]> {
  if (BACKEND === "SUPABASE") return sbList(SB_BUCKET_BLOG);
  const rows = await idbList("blog"); return toItemsFromLocal(rows);
}
export async function deleteBlogItem(id: string): Promise<void> {
  if (BACKEND === "SUPABASE") await sbDelete(SB_BUCKET_BLOG, id); else await idbDelete("blog", id);
}

// event for UI refresh (portfolio page listens to `detail.scope === "portfolio"`)
function dispatchPortfolioEvent(kind: string, payload?: unknown) {
  window.dispatchEvent(new CustomEvent("kabuto:data", { detail: { scope: "portfolio", kind, payload } }));
}

/* ─────────────────────────────────────────────────────────────────────────────
   BLOG POSTS  (permanent; Supabase table)
   ───────────────────────────────────────────────────────────────────────────*/
export type BlogAttachment = { id: string; type: "image" | "video"; src: string };
export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  published: boolean;
  updated_at: string;
  attachments: BlogAttachment[];
};

/** Upload files to blog/<postTempId>/... and return attachments with public URLs */
export async function uploadBlogFiles(postTempId: string, files: File[]): Promise<BlogAttachment[]> {
  const supabase = await sb();
  const out: BlogAttachment[] = [];
  for (const f of files) {
    const key = `${postTempId}/${uuid()}_${f.name}`;
    const up = await supabase.storage.from(SB_BUCKET_BLOG).upload(key, f, { upsert: false });
    if (up.error) throw up.error;
    const { data } = supabase.storage.from(SB_BUCKET_BLOG).getPublicUrl(key);
    out.push({ id: uuid(), type: mediaKindFromMime(f.type) === "video" || extIsVideo(f.name) ? "video" : "image", src: data.publicUrl });
  }
  return out;
}

/** Create a post row (attachments stored as JSON array with public URLs) */
export async function createPost(input: {
  slug: string; title: string; date: string; summary: string; content: string; published: boolean;
}, files: File[]): Promise<BlogPostRow> {
  const supabase = await sb();
  const tempId = uuid();
  const atts = files.length ? await uploadBlogFiles(tempId, files) : [];
  const { data, error } = await supabase
    .from("posts")
    .insert({ ...input, attachments: atts })
    .select("*")
    .single();
  if (error) throw error;
  return data as BlogPostRow;
}

/** Admin list (all, including drafts) */
export async function listPostsAdmin(): Promise<BlogPostRow[]> {
  const supabase = await sb();
  const { data, error } = await supabase.from("posts").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlogPostRow[];
}

/** Delete a post (does not remove blog/ files; optional later) */
export async function deletePost(id: string): Promise<void> {
  const supabase = await sb();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

/* ─────────────────────────────────────────────────────────────────────────────
   compat re-exports so older imports keep working
   ───────────────────────────────────────────────────────────────────────────*/
export { loadEvents, saveEvents, loadPosts, savePosts, uid } from "./content";
