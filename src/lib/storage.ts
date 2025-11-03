/* src/lib/storage.ts
   Unified storage layer for portfolio media, blog posts, and events.
   - Uses Supabase when VITE_SUPABASE_* are set
   - RLS-friendly: admin-only writes enforced via VITE_ADMIN_EMAIL
*/

import type { MediaItem, Post, EventRow } from "@/types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ────────────────────────────────────────────────────────────────────────── */
/* Supabase setup                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

export const SB_URL  = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SB_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  SB_URL && SB_ANON ? createClient(SB_URL, SB_ANON) : null;

const ADMIN_EMAIL      = (import.meta.env.VITE_ADMIN_EMAIL || "").trim();

const PORTFOLIO_BUCKET = import.meta.env.VITE_BUCKET_PORTFOLIO || "portfolio";
const POSTS_BUCKET     = import.meta.env.VITE_BUCKET_POSTS     || "posts";
const POSTS_TABLE      = import.meta.env.VITE_TABLE_POSTS      || "posts";
const EVENTS_TABLE     = import.meta.env.VITE_TABLE_EVENTS     || "events";

/* Local keys (back-compat) */
const LS_PORTFOLIO = "kabuto:portfolio";
const LS_POSTS     = "kabuto:posts";

/* ────────────────────────────────────────────────────────────────────────── */
/* Small utils                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function readLocalJSON<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : fallback; }
  catch { return fallback; }
}
function writeLocalJSON<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function randomId(prefix = "id") { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

function fileType(f: File): MediaItem["type"] {
  return (f.type || "").toLowerCase().startsWith("video/") ? "video" : "image";
}
function extToType(path: string): MediaItem["type"] {
  const p = path.toLowerCase();
  return p.endsWith(".mp4") || p.endsWith(".webm") || p.endsWith(".mov") ? "video" : "image";
}

function getPublicUrl(bucket: string, path: string): string {
  if (!supabase) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || "";
}

async function removeFolder(bucket: string, prefix: string) {
  const { data } = await supabase!.storage.from(bucket).list(prefix, {
    limit: 1000, sortBy: { column: "name", order: "asc" },
  });
  const paths = (data || []).map(f => `${prefix}/${f.name}`);
  if (paths.length) await supabase!.storage.from(bucket).remove(paths);
}

/** Ensure current session is the admin (matches VITE_ADMIN_EMAIL). */
async function ensureAdmin(): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email || "";
  if (!email) throw new Error("Not authenticated (open the Admin page and sign in via magic link).");
  if (ADMIN_EMAIL && email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error("Signed-in user is not authorized for writes.");
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Portfolio (Storage)                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export async function listPortfolioItems(): Promise<MediaItem[]> {
  if (supabase) {
    const { data, error } = await supabase.storage.from(PORTFOLIO_BUCKET).list("", {
      limit: 1000, offset: 0, sortBy: { column: "updated_at", order: "desc" },
    });
    if (error || !data) return [];

    // list subfolders too
    const rootFiles = data.map(d => ({ folder: "", name: d.name }));
    const folders = data.filter((d: any) => d?.id === null && d?.name && d?.metadata?.size === null);
    const subFiles: { folder: string; name: string }[] = [];
    for (const f of folders) {
      const sub = await supabase.storage.from(PORTFOLIO_BUCKET).list(f.name, {
        limit: 1000, sortBy: { column: "updated_at", order: "desc" },
      });
      (sub.data || []).forEach(sf => subFiles.push({ folder: f.name, name: sf.name }));
    }

    const all = [...rootFiles, ...subFiles];
    return all.map(({ folder, name }) => {
      const path = folder ? `${folder}/${name}` : name;
      return { id: path, type: extToType(path), src: getPublicUrl(PORTFOLIO_BUCKET, path) } as MediaItem;
    });
  }

  // fallback
  return readLocalJSON<MediaItem[]>(LS_PORTFOLIO, []);
}

// Back-compat alias used by PortfolioPage
export async function loadPortfolioItems(): Promise<MediaItem[]> { return listPortfolioItems(); }

export async function addPortfolioFiles(files: File[]): Promise<string[]>;
export async function addPortfolioFiles(files: File[], onProgress: (p: number) => void): Promise<string[]>;
export async function addPortfolioFiles(files: File[], onProgress?: (p: number) => void): Promise<string[]> {
  if (!files.length) return [];

  if (supabase) {
    const ids: string[] = [];
    let uploaded = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const path = `${Date.now()}_${i}_${f.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, f, {
        upsert: true, cacheControl: "31536000", contentType: f.type || undefined,
      });
      if (error) throw error;
      ids.push(path);
      uploaded++; onProgress?.(Math.round((uploaded / files.length) * 100));
    }
    return ids;
  }

  // fallback (SW cache + LS index)
  const existing = readLocalJSON<MediaItem[]>(LS_PORTFOLIO, []);
  const ids: string[] = []; let done = 0;
  const tick = () => onProgress?.(Math.round((done / files.length) * 100));

  for (const f of files) {
    const id = randomId("pf"); ids.push(id);
    try {
      navigator.serviceWorker?.controller?.postMessage({ type: "cache-put", payload: { id, blob: f, bucket: "portfolio" } });
    } catch {}
    existing.unshift({ id, type: fileType(f), src: `/local/portfolio/${id}` });
    done++; tick();
  }
  writeLocalJSON(LS_PORTFOLIO, existing);
  return ids;
}

export async function deletePortfolioItem(id: string): Promise<void> {
  if (!id) return;
  if (supabase) {
    if (id.endsWith("/")) await removeFolder(PORTFOLIO_BUCKET, id.replace(/\/+$/,""));
    else await supabase.storage.from(PORTFOLIO_BUCKET).remove([id]);
    return;
  }
  const list = readLocalJSON<MediaItem[]>(LS_PORTFOLIO, []);
  writeLocalJSON(LS_PORTFOLIO, list.filter(x => x.id !== id));
  try { navigator.serviceWorker?.controller?.postMessage({ type: "cache-delete", payload: { path: `/local/portfolio/${id}` } }); } catch {}
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Blog posts (table + attachments bucket)                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export type BlogAttachment = { id: string; type: "image" | "video"; src: string };
export type BlogPostRow = {
  id: string; slug: string; title: string;
  date?: string | null; summary?: string | null; content?: string | null;
  published: boolean; attachments?: BlogAttachment[] | null; updated_at?: string | null;
};

function rowToPost(r: BlogPostRow): Post {
  return {
    id: r.id, slug: r.slug, title: r.title, date: r.date ?? "",
    summary: r.summary ?? "", content: r.content ?? "", published: !!r.published,
    attachments: (r.attachments ?? []).map(a => ({ id: a.id, type: a.type, src: a.src })),
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
  };
}

export async function listPostsAdmin(): Promise<BlogPostRow[]> {
  if (supabase) {
    const { data, error } = await supabase.from(POSTS_TABLE).select("*").order("updated_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r: any) => ({ ...r, attachments: Array.isArray(r.attachments) ? r.attachments : [] })) as BlogPostRow[];
  }
  return readLocalJSON<BlogPostRow[]>(LS_POSTS, []);
}

/** legacy LS accessors (kept for BlogIndexPage that reads LS) */
export function loadPosts(): Post[] {
  const rows = readLocalJSON<BlogPostRow[]>(LS_POSTS, []);
  return rows.map(rowToPost);
}
export function savePosts(posts: Post[]) {
  writeLocalJSON<Post[]>(LS_POSTS, posts);
}

/** Upload single post attachment and return {id,type,src} with PUBLIC URL. */
export async function uploadPostAttachment(file: File): Promise<BlogAttachment> {
  if (!supabase) throw new Error("Supabase not configured");
  await ensureAdmin();

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const id = crypto.randomUUID();
  const key = `attachments/${id}.${ext}`;

  const { error: upErr } = await supabase
    .storage
    .from(POSTS_BUCKET)
    .upload(key, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (upErr) {
    // clearer guidance
    if ((upErr as any)?.statusCode === "404") {
      throw new Error(`Storage bucket "${POSTS_BUCKET}" not found. Create it in Supabase Storage or set VITE_BUCKET_POSTS.`);
    }
    throw upErr;
  }

  const publicUrl = getPublicUrl(POSTS_BUCKET, key);
  const type: "image" | "video" = (file.type || "").startsWith("video/") ? "video" : "image";
  return { id: key, type, src: publicUrl };
}

export async function createPost(
  post: { slug: string; title: string; date?: string; summary?: string; content?: string; published?: boolean },
  files: File[] = []
): Promise<string> {
  if (supabase) {
    await ensureAdmin();

    // unique slug generation (avoid 23505)
    let base = (post.slug || post.title || "post")
      .toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0,64);
    if (!base) base = "post";
    let slug = base, suffix = 2;
    const { data: existing } = await supabase.from(POSTS_TABLE).select("slug").ilike("slug", `${base}%`).limit(500);
    const taken = new Set((existing || []).map((r: any) => r.slug as string));
    while (taken.has(slug)) slug = `${base}-${suffix++}`;

    const { data: inserted, error: insErr } = await supabase
      .from(POSTS_TABLE)
      .insert({
        slug, title: post.title,
        date: post.date ?? null, summary: post.summary ?? null, content: post.content ?? null,
        published: !!post.published,
      })
      .select("*").single();
    if (insErr || !inserted) throw insErr || new Error("Insert failed");
    const rowId = inserted.id as string;

    // attachments
    if (files.length) {
      const attachments: BlogAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const path = `${rowId}/${Date.now()}_${i}_${f.name.replace(/\s+/g, "_")}`;
        const { error } = await supabase.storage.from(POSTS_BUCKET).upload(path, f, {
          upsert: true, cacheControl: "31536000", contentType: f.type || undefined,
        });
        if (error) {
          if ((error as any)?.statusCode === "404")
            throw new Error(`Storage bucket "${POSTS_BUCKET}" not found. Create it or set VITE_BUCKET_POSTS.`);
          throw error;
        }
        attachments.push({ id: path, type: fileType(f), src: getPublicUrl(POSTS_BUCKET, path) });
      }
      const { error: updErr } = await supabase.from(POSTS_TABLE).update({ attachments }).eq("id", rowId);
      if (updErr) throw updErr;
    }

    return rowId;
  }

  // fallback local
  const list = readLocalJSON<BlogPostRow[]>(LS_POSTS, []);
  let base = (post.slug || post.title || "post")
    .toLowerCase().replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,64);
  if (!base) base = "post";
  let slug = base, suffix = 2;
  const taken = new Set(list.map(r=>r.slug));
  while (taken.has(slug)) slug = `${base}-${suffix++}`;

  const id = randomId("post");
  const attachments: BlogAttachment[] = [];
  for (const f of files){
    const aid = `${id}_${randomId("att")}`;
    try { navigator.serviceWorker?.controller?.postMessage({ type:"cache-put", payload:{ id:aid, blob:f, bucket:"posts" } }); } catch {}
    attachments.push({ id: aid, type: fileType(f), src: `/local/posts/${aid}` });
  }
  const row: BlogPostRow = {
    id, slug, title: post.title, date: post.date ?? "", summary: post.summary ?? "",
    content: post.content ?? "", published: !!post.published, attachments, updated_at: new Date().toISOString(),
  };
  list.unshift(row); writeLocalJSON(LS_POSTS, list); return id;
}

export async function deletePost(id: string): Promise<void> {
  if (!id) return;
  if (supabase) {
    await ensureAdmin();
    await removeFolder(POSTS_BUCKET, id);     // remove /{postId}/* if used
    await supabase.from(POSTS_TABLE).delete().eq("id", id);
    return;
  }
  const list = readLocalJSON<BlogPostRow[]>(LS_POSTS, []);
  writeLocalJSON(LS_POSTS, list.filter(r=>r.id!==id));
  try { navigator.serviceWorker?.controller?.postMessage({ type:"cache-delete-prefix", payload:{ prefix:`/local/posts/${id}` } }); } catch {}
}

export async function listPostsPublic(): Promise<Post[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(POSTS_TABLE)
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    date: r.date ?? "",
    summary: r.summary ?? "",
    content: r.content ?? "",
    published: !!r.published,
    attachments: Array.isArray(r.attachments)
      ? r.attachments.map((a: any) => ({ id: a.id, type: a.type, src: a.src }))
      : [],
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
  }));
}

/** Public: fetch a single published post by slug */
export async function getPostBySlugPublic(slug: string): Promise<Post | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(POSTS_TABLE)
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    date: data.date ?? "",
    summary: data.summary ?? "",
    content: data.content ?? "",
    published: !!data.published,
    attachments: Array.isArray(data.attachments)
      ? data.attachments.map((a: any) => ({ id: a.id, type: a.type, src: a.src }))
      : [],
    updatedAt: data.updated_at ? Date.parse(data.updated_at) : Date.now(),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Events (Supabase table with RLS)                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/** Public list (used by EsportsPage). Only published rows. */
export async function listEvents(): Promise<EventRow[]> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .select("*")
    .neq("published", false)              // treat null/true as visible
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    game: r.game ?? "",
    date: r.date ? String(r.date) : "",
    location: r.location ?? "",
    event: r.event ?? "",
    placement: r.placement ?? "",
    published: !!r.published,
  }));
}

/** Admin list (shows everything). */
export async function listEventsAdmin(): Promise<EventRow[]> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    game: r.game ?? "",
    date: r.date ? String(r.date) : "",
    location: r.location ?? "",
    event: r.event ?? "",
    placement: r.placement ?? "",
    published: !!r.published,
  }));
}

export async function createEvent(row: Omit<EventRow,"id">): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  await ensureAdmin();

  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .insert({
      game: row.game ?? "",
      date: row.date || null,                // backend DATE column will cast "YYYY-MM-DD"
      location: row.location ?? "",
      event: row.event ?? "",
      placement: row.placement ?? "",
      published: row.published ?? true,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id as string;
}

export async function updateEvent(id: string, patch: Partial<Omit<EventRow,"id">>): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  await ensureAdmin();

  const { error } = await supabase
    .from(EVENTS_TABLE)
    .update({
      ...("game" in patch ? { game: patch.game } : {}),
      ...("date" in patch ? { date: patch.date || null } : {}),
      ...("location" in patch ? { location: patch.location } : {}),
      ...("event" in patch ? { event: patch.event } : {}),
      ...("placement" in patch ? { placement: patch.placement } : {}),
      ...("published" in patch ? { published: patch.published } : {}),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  await ensureAdmin();

  const { error } = await supabase.from(EVENTS_TABLE).delete().eq("id", id);
  if (error) throw error;
}

/** Back-compat alias for EsportsPage */
export async function loadEvents(): Promise<EventRow[]> {
  return listEvents();
}
