// src/lib/storage.ts
/* Unified storage layer for portfolio media and blog posts.
   - Uses Supabase (preferred) when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY exist.
   - Falls back to Service Worker + localStorage when Supabase isn’t configured.
*/

import type { MediaItem, Post, EventRow } from "@/types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ────────────────────────────────────────────────────────────────────────── */
/* Config / Client                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SB_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  SB_URL && SB_ANON ? createClient(SB_URL, SB_ANON) : null;

// Buckets / table names
const PORTFOLIO_BUCKET = import.meta.env.VITE_BUCKET_PORTFOLIO || "portfolio";
const POSTS_BUCKET = import.meta.env.VITE_BUCKET_POSTS || "posts";
const POSTS_TABLE = import.meta.env.VITE_TABLE_POSTS || "posts";

// localStorage keys (fallback + client read)
const LS_PORTFOLIO = "kabuto:portfolio";
const LS_POSTS = "kabuto:posts";
const LS_EVENTS = "kabuto:events";

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function extToType(path: string): MediaItem["type"] {
  const p = path.toLowerCase();
  if (p.endsWith(".mp4") || p.endsWith(".webm") || p.endsWith(".mov")) return "video";
  return "image";
}

function fileType(f: File): MediaItem["type"] {
  const t = f.type.toLowerCase();
  if (t.startsWith("video/")) return "video";
  return "image";
}

function readLocalJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocalJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function randomId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getPublicUrl(bucket: string, path: string): string {
  if (!supabase) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function removeFolder(bucket: string, prefix: string): Promise<void> {
  const { data: list, error } = await supabase!.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });
  if (error || !list || list.length === 0) return;
  const paths = list.map((f) => `${prefix}/${f.name}`);
  await supabase!.storage.from(bucket).remove(paths);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Types used for DB rows                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export type BlogAttachment = { id: string; type: "image" | "video"; src: string };

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  date?: string | null;
  summary?: string | null;
  content?: string | null;
  published: boolean;
  attachments?: BlogAttachment[] | null;
  updated_at?: string | null;
};

function rowToPost(r: BlogPostRow): Post {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    date: r.date ?? "",
    summary: r.summary ?? "",
    content: r.content ?? "",
    published: !!r.published,
    attachments: (r.attachments ?? []).map((a) => ({ id: a.id, type: a.type, src: a.src })),
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Portfolio API                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export async function listPortfolioItems(): Promise<MediaItem[]> {
  if (supabase) {
    const { data, error } = await supabase.storage.from(PORTFOLIO_BUCKET).list("", {
      limit: 1000,
      offset: 0,
      sortBy: { column: "updated_at", order: "desc" },
    });
    if (error || !data) return [];

    const rootFiles = data.map((d) => ({ folder: "", name: d.name }));

    // list subfolders too
    const folders = data.filter((d: any) => d?.id === null && d?.name && d?.metadata?.size === null);
    const subFiles: { folder: string; name: string }[] = [];
    for (const f of folders) {
      const sub = await supabase.storage.from(PORTFOLIO_BUCKET).list(f.name, {
        limit: 1000,
        sortBy: { column: "updated_at", order: "desc" },
      });
      (sub.data || []).forEach((sf) => subFiles.push({ folder: f.name, name: sf.name }));
    }

    const all = [...rootFiles, ...subFiles];
    return all.map(({ folder, name }) => {
      const path = folder ? `${folder}/${name}` : name;
      return { id: path, type: extToType(path), src: getPublicUrl(PORTFOLIO_BUCKET, path) } as MediaItem;
    });
  }
  return readLocalJSON<MediaItem[]>(LS_PORTFOLIO, []);
}

// Back-compat alias for pages that import loadPortfolioItems
export async function loadPortfolioItems(): Promise<MediaItem[]> {
  return listPortfolioItems();
}

/**
 * Upload files. `onProgress` is optional (0..100).
 */
export async function addPortfolioFiles(files: File[]): Promise<string[]>;
export async function addPortfolioFiles(files: File[], onProgress: (p: number) => void): Promise<string[]>;
export async function addPortfolioFiles(files: File[], onProgress?: (p: number) => void): Promise<string[]> {
  if (!files || files.length === 0) return [];

  if (supabase) {
    const ids: string[] = [];
    let uploaded = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const id = `${Date.now()}_${i}_${f.name.replace(/\s+/g, "_")}`;
      const path = id;

      const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, f, {
        upsert: true,
        cacheControl: "31536000",
        contentType: f.type || undefined,
      });
      if (error) throw error;

      ids.push(path);
      uploaded++;
      onProgress?.(Math.round((uploaded / files.length) * 100));
    }
    return ids;
  }

  // Fallback: SW + local index
  const existing = readLocalJSON<MediaItem[]>(LS_PORTFOLIO, []);
  const ids: string[] = [];
  let completed = 0;

  const post = () => onProgress?.(Math.round((completed / files.length) * 100));

  for (const f of files) {
    const id = randomId("pf");
    ids.push(id);

    try {
      navigator.serviceWorker?.controller?.postMessage({
        type: "cache-put",
        payload: { id, blob: f, bucket: "portfolio" },
      });
    } catch {}

    existing.unshift({ id, type: fileType(f), src: `/local/portfolio/${id}` });
    completed++;
    post();
  }

  writeLocalJSON(LS_PORTFOLIO, existing);
  return ids;
}

export async function deletePortfolioItem(id: string): Promise<void> {
  if (!id) return;

  if (supabase) {
    if (id.endsWith("/")) {
      await removeFolder(PORTFOLIO_BUCKET, id.replace(/\/+$/, ""));
    } else {
      await supabase.storage.from(PORTFOLIO_BUCKET).remove([id]);
    }
    return;
  }

  const list = readLocalJSON<MediaItem[]>(LS_PORTFOLIO, []);
  writeLocalJSON(LS_PORTFOLIO, list.filter((x) => x.id !== id));

  try {
    navigator.serviceWorker?.controller?.postMessage({
      type: "cache-delete",
      payload: { path: `/local/portfolio/${id}` },
    });
  } catch {}
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Blog (Admin)                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

export async function listPostsAdmin(): Promise<BlogPostRow[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from(POSTS_TABLE)
      .select("*")
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r: any) => ({
      ...r,
      attachments: Array.isArray(r.attachments) ? r.attachments : [],
    })) as BlogPostRow[];
  }
  return readLocalJSON<BlogPostRow[]>(LS_POSTS, []);
}

export async function createPost(
  post: { slug: string; title: string; date?: string; summary?: string; content?: string; published?: boolean },
  files: File[] = []
): Promise<string> {
  if (supabase) {
    // insert
    const { data: inserted, error: insErr } = await supabase
      .from(POSTS_TABLE)
      .insert({
        slug: post.slug,
        title: post.title,
        date: post.date ?? null,
        summary: post.summary ?? null,
        content: post.content ?? null,
        published: !!post.published,
      })
      .select("*")
      .single();
    if (insErr || !inserted) throw insErr || new Error("Insert failed");
    const rowId = inserted.id as string;

    // attachments
    const attachments: BlogAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const path = `${rowId}/${Date.now()}_${i}_${f.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage.from(POSTS_BUCKET).upload(path, f, {
        upsert: true,
        cacheControl: "31536000",
        contentType: f.type || undefined,
      });
      if (error) throw error;
      attachments.push({ id: path, type: fileType(f), src: getPublicUrl(POSTS_BUCKET, path) });
    }

    if (attachments.length > 0) {
      const { error: updErr } = await supabase.from(POSTS_TABLE).update({ attachments }).eq("id", rowId);
      if (updErr) throw updErr;
    }
    return rowId;
  }

  // Fallback local
  const list = readLocalJSON<BlogPostRow[]>(LS_POSTS, []);
  const id = randomId("post");
  const attachments: BlogAttachment[] = [];

  for (const f of files) {
    const aid = `${id}_${randomId("att")}`;
    try {
      navigator.serviceWorker?.controller?.postMessage({
        type: "cache-put",
        payload: { id: aid, blob: f, bucket: "posts" },
      });
    } catch {}
    attachments.push({ id: aid, type: fileType(f), src: `/local/posts/${aid}` });
  }

  const row: BlogPostRow = {
    id,
    slug: post.slug,
    title: post.title,
    date: post.date ?? "",
    summary: post.summary ?? "",
    content: post.content ?? "",
    published: !!post.published,
    attachments,
    updated_at: new Date().toISOString(),
  };

  list.unshift(row);
  writeLocalJSON(LS_POSTS, list);
  return id;
}

export async function deletePost(id: string): Promise<void> {
  if (!id) return;

  if (supabase) {
    await removeFolder(POSTS_BUCKET, id);
    await supabase.from(POSTS_TABLE).delete().eq("id", id);
    return;
  }

  const list = readLocalJSON<BlogPostRow[]>(LS_POSTS, []);
  writeLocalJSON(LS_POSTS, list.filter((r) => r.id !== id));

  try {
    navigator.serviceWorker?.controller?.postMessage({
      type: "cache-delete-prefix",
      payload: { prefix: `/local/posts/${id}` },
    });
  } catch {}
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Read helpers for pages (typed)                                             */
/* ────────────────────────────────────────────────────────────────────────── */

// Blog pages read a simple Post[] that Admin writes to LS via savePosts.
// We derive it from BlogPostRow (local fallback) so typing is preserved.
export function loadPosts(): Post[] {
  const rows = readLocalJSON<BlogPostRow[]>(LS_POSTS, []);
  return rows.map(rowToPost);
}

// Esports page expects EventRow[] from LS.
export function loadEvents(): EventRow[] {
  return readLocalJSON<EventRow[]>(LS_EVENTS, []);
}
