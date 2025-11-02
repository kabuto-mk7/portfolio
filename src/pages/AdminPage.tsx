// src/pages/AdminPage.tsx
import React from "react";
import { Window, Panel } from "@/ui/Window";
import type { EventRow, Post, MediaItem } from "@/types";
import { loadEvents, saveEvents, savePosts } from "@/lib/content";
import {
  listPortfolioItems,
  addPortfolioFiles,   // <- single-arg in your repo
  deletePortfolioItem,
  listPostsAdmin,
  createPost,
  deletePost,
} from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";
import { Plus, Save, Trash2 } from "lucide-react";

/* ───────────────────────── Supabase Auth (Magic Link, allowlisted) ───────────────────────── */

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SB_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.toLowerCase() ?? "";

const supabase =
  SB_URL && SB_ANON
    ? createClient(SB_URL, SB_ANON, { auth: { persistSession: true } })
    : null;

/* ───────────────────────── Types/Transforms ───────────────────────── */

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  date?: string | null;
  summary?: string | null;
  content?: string | null;
  published: boolean;
  attachments?: { id: string; type: "image" | "video"; src: string }[] | null;
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

/* ───────────────────────── Admin Page ───────────────────────── */

export function AdminPage() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<null | string>(null);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();

    const input = email.trim().toLowerCase();
    if (!ADMIN_EMAIL || input !== ADMIN_EMAIL) {
      setStatus("Not authorized (email not on allowlist).");
      return;
    }
    if (!supabase) {
      setStatus("Supabase not configured (missing VITE_SUPABASE_* envs).");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: input,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin` },
    });

    setStatus(error ? `Error: ${error.message}` : "Magic link sent. Check your email.");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="Admin">
        <Panel title="Login" rightTag="magic link">
          <form onSubmit={handleSendLink} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-xs uppercase opacity-70 mb-1">Admin email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourdomain.com"
                className="w-full rounded border border-white/15 bg-white/5 px-3 py-2 outline-none"
              />
              <div className="text-xs mt-1 opacity-70">
                Only <code>VITE_ADMIN_EMAIL</code> is allowed. Sign-ups are disabled.
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-3 py-2 bg-[#3a4538] hover:bg-[#404b3f]"
            >
              Send link
            </button>
          </form>
          {status && <div className="mt-2 text-sm opacity-80">{status}</div>}
        </Panel>

        <div className="grid gap-6 mt-6">
          <AdminEvents />
          <AdminPosts />
          <AdminPortfolio />
        </div>
      </Window>
    </main>
  );
}

/* ───────────────────────── Events (local content) ───────────────────────── */

function AdminEvents() {
  const [rows, setRows] = React.useState<EventRow[]>(() => loadEvents());

  const [draft, setDraft] = React.useState<EventRow>({
    id: "",
    game: "",
    date: "",
    location: "",
    event: "",
    placement: "",
    published: false,
  });

  function onChange<K extends keyof EventRow>(k: K, v: EventRow[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function addRow() {
    const id = crypto.randomUUID();
    const next = [{ ...draft, id }, ...rows];
    setRows(next);
    saveEvents(next);

    setDraft({
      id: "",
      game: "",
      date: "",
      location: "",
      event: "",
      placement: "",
      published: false,
    });
  }

  function delRow(id: string) {
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    saveEvents(next);
  }

  return (
    <Panel title="Events" rightTag={`${rows.length}`}>
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-5">
          <input value={draft.game} onChange={(e) => onChange("game", e.target.value)} placeholder="Game" className="rounded border border-white/15 bg-white/5 px-2 py-2" />
          <input value={draft.date} onChange={(e) => onChange("date", e.target.value)} placeholder="YYYY-MM-DD" className="rounded border border-white/15 bg-white/5 px-2 py-2" />
          <input value={draft.location} onChange={(e) => onChange("location", e.target.value)} placeholder="Location" className="rounded border border-white/15 bg-white/5 px-2 py-2" />
          <input value={draft.event} onChange={(e) => onChange("event", e.target.value)} placeholder="Event" className="rounded border border-white/15 bg-white/5 px-2 py-2" />
          <div className="flex gap-2">
            <input value={draft.placement} onChange={(e) => onChange("placement", e.target.value)} placeholder="Place" className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-2" />
            <button onClick={addRow} className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="opacity-70">
              <tr>
                <th className="text-left py-1 pr-3">Game</th>
                <th className="text-left py-1 pr-3">Date</th>
                <th className="text-left py-1 pr-3">Location</th>
                <th className="text-left py-1 pr-3">Event</th>
                <th className="text-left py-1 pr-3">Place</th>
                <th className="py-1 pr-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="py-1 pr-3">{r.game}</td>
                  <td className="py-1 pr-3">{r.date}</td>
                  <td className="py-1 pr-3">{r.location}</td>
                  <td className="py-1 pr-3">{r.event}</td>
                  <td className="py-1 pr-3">{r.placement}</td>
                  <td className="py-1 pr-3 text-right">
                    <button onClick={() => delRow(r.id)} className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 hover:border-red-400">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs opacity-60">Tip: use exact YYYY-MM-DD so sorting stays perfect.</div>
      </div>
    </Panel>
  );
}

/* ───────────────────────── Posts (Supabase → sync to localStorage) ───────────────────────── */

function AdminPosts() {
  const [rows, setRows] = React.useState<BlogPostRow[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [draft, setDraft] = React.useState({
    slug: "",
    title: "",
    summary: "",
    content: "",
    published: false,
  });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await listPostsAdmin();
      if (!mounted) return;
      setRows(data as BlogPostRow[]);
      savePosts((data as BlogPostRow[]).map(rowToPost));
    })().catch(console.error);
    return () => {
      mounted = false;
    };
  }, []);

  function genSlug(title: string) {
    const base = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 64) || "post";
    let s = base;
    let i = 2;
    const existing = new Set(rows.map((r) => r.slug));
    while (existing.has(s)) s = `${base}-${i++}`;
    return s;
  }

  async function onCreate() {
    if (!draft.title) return alert("Title required");
    setBusy(true);
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const slug = draft.slug || genSlug(draft.title);

      await createPost(
        { slug, title: draft.title, date, summary: draft.summary, content: draft.content, published: draft.published },
        files
      );

      const data = (await listPostsAdmin()) as BlogPostRow[];
      setRows(data);
      savePosts(data.map(rowToPost));

      setFiles([]);
      setDraft({ slug: "", title: "", summary: "", content: "", published: false });
    } catch (err) {
      console.error(err);
      alert(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete post?")) return;
    setBusy(true);
    try {
      await deletePost(id);
      const data = (await listPostsAdmin()) as BlogPostRow[];
      setRows(data);
      savePosts(data.map(rowToPost));
    } catch (err) {
      console.error(err);
      alert(String(err));
    } finally {
      setBusy(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files || []);
    setFiles((cur) => [...cur, ...fs]);
  }

  return (
    <Panel title="Posts" rightTag={`${rows.length}`}>
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs uppercase opacity-70">Title</label>
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="rounded border border-white/15 bg-white/5 px-3 py-2" placeholder="Post title" />
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase opacity-70">Slug</label>
            <input value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} className="rounded border border-white/15 bg-white/5 px-3 py-2" placeholder="auto if blank" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-xs uppercase opacity-70">Summary</label>
            <input value={draft.summary} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} className="rounded border border-white/15 bg-white/5 px-3 py-2" placeholder="Short summary" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-xs uppercase opacity-70">Content</label>
            <textarea value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} rows={6} className="rounded border border-white/15 bg-white/5 px-3 py-2" placeholder="Markdown or plain text" />
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))} />
              Published
            </label>
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase opacity-70">Attachments</label>
            <input type="file" multiple accept="image/*,video/*" onChange={onPick} />
            {files.length > 0 && <div className="text-xs opacity-70">{files.length} file(s) queued</div>}
          </div>
          <div className="sm:col-span-2">
            <button disabled={busy} onClick={onCreate} className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-3 py-2 bg-[#3a4538] hover:bg-[#404b3f]">
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save post"}
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3 grid gap-2">
          {rows.length === 0 ? (
            <div className="text-sm opacity-70">No posts yet.</div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded border border-[#4a5a45] p-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs opacity-70">
                    {r.slug} · {r.date ?? "—"} · {r.published ? "published" : "draft"}
                  </div>
                </div>
                <button onClick={() => onDelete(r.id)} className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 hover:border-red-400">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ───────────────────────── Portfolio (Supabase storage) ───────────────────────── */

function AdminPortfolio() {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);

  const refresh = React.useCallback(async () => {
    const rows = await listPortfolioItems();
    setItems(rows);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // ⚠️ single-arg addPortfolioFiles — progress is synthetic
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBusy(true);
    setProgress(0);

    let finished = false;
    const tick = window.setInterval(() => {
      setProgress((p) => {
        const cur = p ?? 0;
        if (finished) return cur;
        return Math.min(90, cur + 3);
      });
    }, 80);

    try {
      await addPortfolioFiles(files); // <-- ONE ARG
      finished = true;
      setProgress(100);
      await refresh();
    } finally {
      clearInterval(tick);
      setBusy(false);
      setTimeout(() => setProgress(null), 350);
      (e.target as HTMLInputElement).value = "";
    }
  }

  async function onDrop(ev: React.DragEvent) {
    ev.preventDefault();
    const files = Array.from(ev.dataTransfer.files ?? []);
    if (!files.length) return;

    setBusy(true);
    setProgress(0);

    let finished = false;
    const tick = window.setInterval(() => {
      setProgress((p) => {
        const cur = p ?? 0;
        if (finished) return cur;
        return Math.min(90, cur + 3);
      });
    }, 80);

    try {
      await addPortfolioFiles(files); // <-- ONE ARG
      finished = true;
      setProgress(100);
      await refresh();
    } finally {
      clearInterval(tick);
      setBusy(false);
      setTimeout(() => setProgress(null), 350);
    }
  }

  return (
    <Panel title="Portfolio" rightTag={`${items.length}`}>
      <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="rounded-lg border border-white/15 bg-white/5 p-6 flex flex-col items-center gap-3">
        <div className="text-sm opacity-80">Drag & drop images/videos here</div>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded border border-white/15 bg-white/10 hover:bg-white/15">
          <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onPick} />
          <span className="opacity-80">Select files</span>
        </label>
        {busy && <div className="mt-2 text-xs">Uploading… {progress !== null ? `${progress}%` : ""}</div>}
      </div>

      {items.length === 0 ? (
        <div className="text-sm opacity-70 mt-3">No items.</div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="relative rounded border border-[#4a5a45] p-2">
              {item.type === "video" ? <video src={item.src} className="w-full h-auto rounded" controls /> : <img src={item.src} className="w-full h-auto rounded" alt="" />}
              <button
                onClick={() => {
                  if (!confirm("Delete item?")) return;
                  deletePortfolioItem(item.id).then(() => refresh());
                }}
                className="absolute top-1 right-1 inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 text-xs hover:border-red-400"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
