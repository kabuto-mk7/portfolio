import React from "react";
import { Panel, Window } from "@/ui/Window";
import type { EventRow, Post, MediaItem } from "@/types";

// Events stay in local content:
import { loadEvents, saveEvents, loadPosts, savePosts } from "@/lib/content";

// Portfolio (Supabase/IndexedDB layer):
import { addPortfolioFiles, deletePortfolioItem, listPortfolioItems } from "@/lib/storage";

// Posts (Supabase table + blog bucket):
import { createPost, listPostsAdmin, deletePost } from "@/lib/storage";

import { supabase } from "@/lib/supabase";
import { Plus, Save, Trash2, PencilLine, X } from "lucide-react";

/* =========================
   Admin Page (auth)
   ========================= */
export function AdminPage() {
  const [user, setUser] = React.useState<any>(null);
  const [email, setEmail] = React.useState("");
  const [mode, setMode] = React.useState<"events" | "posts" | "portfolio">("events");

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) alert(error.message);
    else alert("Magic link sent. Check your email.");
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Window title="Admin – Sign in">
          <form onSubmit={sendMagicLink} className="grid gap-3 max-w-sm">
            <label className="text-sm">Email</label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1 text-sm"
              placeholder="you@your-domain.com"
            />
            <button className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
              Send magic link
            </button>
          </form>
        </Window>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="Admin">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setMode("events")}
            className={`rounded px-3 py-1 text-sm border ${mode === "events" ? "border-[var(--primary)] bg-[#404b3f]" : "border-[#4a5a45] bg-[#3a4538]"}`}
          >
            Events
          </button>
          <button
            onClick={() => setMode("posts")}
            className={`rounded px-3 py-1 text-sm border ${mode === "posts" ? "border-[var(--primary)] bg-[#404b3f]" : "border-[#4a5a45] bg-[#3a4538]"}`}
          >
            Posts
          </button>
          <button
            onClick={() => setMode("portfolio")}
            className={`rounded px-3 py-1 text-sm border ${mode === "portfolio" ? "border-[var(--primary)] bg-[#404b3f]" : "border-[#4a5a45] bg-[#3a4538]"}`}
          >
            Portfolio
          </button>
        </div>

        {mode === "events" ? <AdminEvents /> : mode === "posts" ? <AdminPosts /> : <AdminPortfolio />}
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
    published: true,
  });

  function saveAll(next: EventRow[]) { setRows(next); saveEvents(next); }
  function addRow() {
    if (!draft.game || !draft.date) return alert("Game and date required");
    const row: EventRow = { ...draft, id: (crypto as any).randomUUID?.() ?? String(Date.now()) };
    const next = [row, ...rows];
    setDraft({ id: "", game: "", date: "", location: "", event: "", placement: "", published: true });
    saveAll(next);
  }
  function delRow(id: string) { saveAll(rows.filter((r) => r.id !== id)); }
  function updRow(id: string, patch: Partial<EventRow>) { saveAll(rows.map((r) => (r.id === id ? { ...r, ...patch } : r))); }

  return (
    <div className="grid gap-4">
      <Panel title="Add event" rightTag="new">
        <div className="grid md:grid-cols-6 gap-2 text-xs">
          <input placeholder="Game" value={draft.game} onChange={(e) => setDraft({ ...draft, game: e.target.value })} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1" />
          <input placeholder="Date (YYYY-MM-DD)" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1" />
          <input placeholder="Location" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1" />
          <input placeholder="Event" value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1" />
          <input placeholder="Placement (e.g., 12/128 or 1st)" value={draft.placement} onChange={(e) => setDraft({ ...draft, placement: e.target.value })} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1" />
          <label className="inline-flex items-center gap-2 px-1"><input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /><span>Published</span></label>
        </div>
        <div className="mt-2">
          <button onClick={addRow} className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </Panel>

      <Panel title="Events" rightTag={`${rows.length}`}>
        {rows.length === 0 ? (
          <div className="text-sm opacity-70">No entries.</div>
        ) : (
          <div className="overflow-x-auto rounded-[6px] border border-[#4a5a45]">
            <table className="w-full text-xs">
              <thead className="bg-[#334031] text-[var(--accent)]">
                <tr>
                  <th className="px-2 py-2 text-left">Game</th>
                  <th className="px-2 py-2 text-left">Date</th>
                  <th className="px-2 py-2 text-left">Location</th>
                  <th className="px-2 py-2 text-left">Event</th>
                  <th className="px-2 py-2 text-left">Placement</th>
                  <th className="px-2 py-2 text-left">Published</th>
                  <th className="px-2 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice().sort((a,b)=> (new Date(b.date).getTime()||0) - (new Date(a.date).getTime()||0)).map((r) => (
                  <tr key={r.id} className="border-t border-[#2a3328]">
                    <td className="px-2 py-2"><input value={r.game}      onChange={(e) => updRow(r.id, { game: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                    <td className="px-2 py-2"><input value={r.date}      onChange={(e) => updRow(r.id, { date: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                    <td className="px-2 py-2"><input value={r.location}  onChange={(e) => updRow(r.id, { location: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                    <td className="px-2 py-2"><input value={r.event}     onChange={(e) => updRow(r.id, { event: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                    <td className="px-2 py-2"><input value={r.placement} onChange={(e) => updRow(r.id, { placement: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                    <td className="px-2 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={r.published} onChange={(e) => updRow(r.id, { published: e.target.checked })} />
                        <span className="opacity-70">{r.published ? "Yes" : "No"}</span>
                      </label>
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => delRow(r.id)} className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 hover:border-red-400">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <div className="text-xs opacity-60">Tip: Use exact YYYY-MM-DD so sorting stays perfect.</div>
    </div>
  );
}

/* ───────────────────────── Posts (Supabase) ───────────────────────── */
function AdminPosts() {
  const [rows, setRows] = React.useState<any[]>([]);
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
    listPostsAdmin().then(setRows).catch(console.error);
  }, []);

  function genSlug(title: string) {
    const base = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 64) || "post";
    let s = base, i = 2;
    const existing = new Set(rows.map((r) => r.slug));
    while (existing.has(s)) s = `${base}-${i++}`;
    return s;
  }

  async function onCreate() {
    if (!draft.title) return alert("Title required");
    setBusy(true);
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
      const slug = draft.slug || genSlug(draft.title);

      const created = await createPost(
        { slug, title: draft.title, date, summary: draft.summary, content: draft.content, published: draft.published },
        files
      );

      setRows((r) => [created, ...r]);
      setDraft({ slug: "", title: "", summary: "", content: "", published: false });
      setFiles([]);
    } catch (e: any) {
      alert(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  async function onDelete(id: string) {
    if (!confirm("Delete post?")) return;
    await deletePost(id);
    setRows((r) => r.filter((p) => p.id !== id));
  }

  return (
    <div className="grid gap-4">
      <Panel title="New post" rightTag="compose.md">
        <div className="grid gap-2 text-xs">
          <input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1" />
          <input placeholder="Custom slug (optional)" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1" />
          <input placeholder="Summary" value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1" />
          <textarea placeholder="Content (Markdown-lite)" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={8} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1 font-mono" />
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Published
          </label>

          <div className="grid gap-2">
            <label className="text-xs">Attachments (images/videos)</label>
            <input type="file" multiple accept="image/*,video/*" onChange={onPick} className="block w-full text-sm" />
            {files.length > 0 && <div className="text-xs opacity-70">{files.length} file(s) selected</div>}
          </div>

          <button disabled={busy} onClick={onCreate} className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
            <Save className="h-4 w-4" /> {busy ? "Saving..." : "Save post"}
          </button>
        </div>
      </Panel>

      <Panel title="All posts" rightTag={`${rows.length}`}>
        {rows.length === 0 ? (
          <div className="text-sm opacity-70">No posts.</div>
        ) : (
          <div className="grid gap-3">
            {rows.map((p) => (
              <div key={p.id} className="rounded border border-[#4a5a45] p-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="font-medium text-[var(--accent)]">{p.title}</div>
                  <div className="text-xs opacity-70">{p.date} • {p.published ? "Published" : "Draft"}</div>
                </div>
                <div className="text-xs opacity-80 break-all">/blog/{p.slug}</div>

                {Array.isArray(p.attachments) && p.attachments.length > 0 && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {p.attachments.map((a: any) =>
                      a.type === "video" ? (
                        <video key={a.id} src={a.src} className="w-full h-auto rounded" muted autoPlay loop playsInline />
                      ) : (
                        <img key={a.id} src={a.src} className="w-full h-auto rounded" />
                      )
                    )}
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("kabuto:pre-navigate", { detail: { nextPath: `/blog/${p.slug}` } }))}
                    className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 text-xs hover:border-[var(--primary)]"
                  >
                    <PencilLine className="h-4 w-4" /> Open
                  </button>
                  <button onClick={() => onDelete(p.id)} className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 text-xs hover:border-red-400">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ───────────────────────── Portfolio (media) ───────────────────────── */
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
    const onData = async (e: any) => { if (e?.detail?.scope === "portfolio") await refresh(); };
    window.addEventListener("kabuto:data", onData);
    return () => window.removeEventListener("kabuto:data", onData);
  }, [refresh]);

  async function onPick(ev: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(ev.target.files ?? []);
    if (!files.length) return;
    setBusy(true); setProgress(0);
    const tick = setInterval(() => setProgress((p) => (p === null || p >= 90 ? 90 : p + 3)), 80);
    try {
      await addPortfolioFiles(files);
      setProgress(100);
      setTimeout(() => setProgress(null), 350);
    } finally {
      clearInterval(tick);
      setBusy(false);
      await refresh();
      ev.target.value = "";
    }
  }
  async function onDrop(ev: React.DragEvent) {
    ev.preventDefault();
    const files = Array.from(ev.dataTransfer.files ?? []);
    if (!files.length) return;
    setBusy(true); setProgress(0);
    const tick = setInterval(() => setProgress((p) => (p === null || p >= 90 ? 90 : p + 3)), 80);
    try {
      await addPortfolioFiles(files);
      setProgress(100);
      setTimeout(() => setProgress(null), 350);
    } finally {
      clearInterval(tick);
      setBusy(false);
      await refresh();
    }
  }

  return (
    <div className="grid gap-4">
      <Panel title="Add portfolio item" rightTag="upload">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-lg border border-white/15 bg-white/5 p-6 flex flex-col items-center gap-3"
        >
          <div className="text-sm opacity-80">Drag & drop images/videos here</div>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded border border-white/15 bg-white/10 hover:bg-white/15">
            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onPick} />
            Choose files…
          </label>
          {busy && (
            <div className="w-full max-w-md h-2 rounded bg-black/30 overflow-hidden">
              <div className="h-full bg-white/70" style={{ width: `${progress ?? 0}%`, transition: "width 160ms linear" }} />
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Portfolio items" rightTag={`${items.length}`}>
        {items.length === 0 ? (
          <div className="text-sm opacity-70">No portfolio items uploaded.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4 sm:grid-cols-2">
            {items.map((it) => (
              <div key={it.id} className="relative rounded border border-[#4a5a45] p-2">
                {it.type === "image" ? (
                  <img src={it.src} alt="item" className="w-full h-auto object-contain rounded" />
                ) : (
                  <video src={it.src} className="w-full h-auto object-contain rounded" muted autoPlay loop playsInline />
                )}
                <button
                  onClick={() => deletePortfolioItem(it.id)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
                  title="Delete"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
