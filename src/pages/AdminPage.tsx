import { Panel, Window } from "@/ui/Window";
import type { EventRow, Post, MediaItem } from "@/types";
import { ADMIN_HASH_KEY, loadEvents, saveEvents, loadPosts, savePosts, loadPortfolioItems, savePortfolioItems, uid, setAdminPassword, verifyAdminPassword } from "@/lib/storage";
import { Plus, Save, Trash2, PencilLine, Lock, Unlock, X } from "lucide-react";
import React from "react";

export function AdminPage() {
  const [authed, setAuthed] = React.useState<boolean>(false);
  const [hasPass, setHasPass] = React.useState<boolean>(!!localStorage.getItem(ADMIN_HASH_KEY));
  const [mode, setMode] = React.useState<"events"|"posts"|"portfolio">("events");

  async function handleSetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pw = String(new FormData(e.currentTarget).get("pw") || "").trim();
    if (!pw) return;
    await setAdminPassword(pw); setHasPass(true); setAuthed(true);
  }
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pw = String(new FormData(e.currentTarget).get("pw") || "").trim();
    if (await verifyAdminPassword(pw)) setAuthed(true); else alert("Wrong password");
  }

  if (!hasPass) return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="Admin – Set Password">
        <form onSubmit={handleSetPassword} className="grid gap-3 max-w-sm">
          <label className="text-sm">New password</label>
          <input name="pw" type="password" className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1 text-sm"/>
          <button className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
            <Unlock className="h-4 w-4"/> Set password
          </button>
        </form>
      </Window>
    </main>
  );

  if (!authed) return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="Admin – Login">
        <form onSubmit={handleLogin} className="grid gap-3 max-w-sm">
          <label className="text-sm">Password</label>
          <input name="pw" type="password" className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1 text-sm"/>
          <button className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
            <Lock className="h-4 w-4"/> Login
          </button>
        </form>
      </Window>
    </main>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="Admin">
        <div className="flex gap-2 mb-4">
          <button onClick={()=>setMode("events")} className={`rounded px-3 py-1 text-sm border ${mode==="events"?"border-[var(--primary)] bg-[#404b3f]":"border-[#4a5a45] bg-[#3a4538]"}`}>Events</button>
          <button onClick={()=>setMode("posts")}  className={`rounded px-3 py-1 text-sm border ${mode==="posts" ?"border-[var(--primary)] bg-[#404b3f]":"border-[#4a5a45] bg-[#3a4538]"}`}>Posts</button>
          <button onClick={()=>setMode("portfolio")}  className={`rounded px-3 py-1 text-sm border ${mode==="portfolio" ?"border-[var(--primary)] bg-[#404b3f]":"border-[#4a5a45] bg-[#3a4538]"}`}>Portfolio</button>
        </div>
        {mode==="events" ? <AdminEvents/> : mode === "posts" ? <AdminPosts/> : <AdminPortfolio/>}
      </Window>
    </main>
  );
}

/* ------------------ Events ------------------ */
function AdminEvents() {
  const [rows, setRows] = React.useState<EventRow[]>(() => loadEvents());
  const [draft, setDraft] = React.useState<EventRow>({ id:"", game:"", date:"", location:"", event:"", placement:"", published:true });

  function saveAll(next: EventRow[]) { setRows(next); saveEvents(next); }
  function addRow() {
    if (!draft.game || !draft.date) return alert("Game and date required");
    const row: EventRow = { ...draft, id: uid() };
    const next = [row, ...rows];
    setDraft({ id:"", game:"", date:"", location:"", event:"", placement:"", published:true });
    saveAll(next);
  }
  function delRow(id: string) { saveAll(rows.filter(r=>r.id !== id)); }
  function updRow(id: string, patch: Partial<EventRow>) { saveAll(rows.map(r=> r.id===id ? { ...r, ...patch } : r)); }

  return (
    <div className="grid gap-4">
      <Panel title="Add event" rightTag="new">
        <div className="grid md:grid-cols-6 gap-2 text-xs">
          <input placeholder="Game" value={draft.game} onChange={e=>setDraft({...draft, game:e.target.value})} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"/>
          <input placeholder="Date (YYYY-MM-DD)" value={draft.date} onChange={e=>setDraft({...draft, date:e.target.value})} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"/>
          <input placeholder="Location" value={draft.location} onChange={e=>setDraft({...draft, location:e.target.value})} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"/>
          <input placeholder="Event" value={draft.event} onChange={e=>setDraft({...draft, event:e.target.value})} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"/>
          <input placeholder="Placement (e.g., 12/128 or 1st)" value={draft.placement} onChange={e=>setDraft({...draft, placement:e.target.value})} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"/>
          <label className="inline-flex items-center gap-2 px-1"><input type="checkbox" checked={draft.published} onChange={e=>setDraft({...draft, published:e.target.checked})}/><span>Published</span></label>
        </div>
        <div className="mt-2">
          <button onClick={addRow} className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
            <Plus className="h-4 w-4"/> Add
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
                {rows.slice().sort((a,b)=> (new Date(b.date).getTime()||0) - (new Date(a.date).getTime()||0)).map(r=>(
                  <tr key={r.id} className="border-t border-[#2a3328]">
                    <td className="px-2 py-2"><input value={r.game} onChange={e=>updRow(r.id,{game:e.target.value})} className="w-full bg-transparent outline-none"/></td>
                    <td className="px-2 py-2"><input value={r.date} onChange={e=>updRow(r.id,{date:e.target.value})} className="w-full bg-transparent outline-none"/></td>
                    <td className="px-2 py-2"><input value={r.location} onChange={e=>updRow(r.id,{location:e.target.value})} className="w-full bg-transparent outline-none"/></td>
                    <td className="px-2 py-2"><input value={r.event} onChange={e=>updRow(r.id,{event:e.target.value})} className="w-full bg-transparent outline-none"/></td>
                    <td className="px-2 py-2"><input value={r.placement} onChange={e=>updRow(r.id,{placement:e.target.value})} className="w-full bg-transparent outline-none"/></td>
                    <td className="px-2 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={r.published} onChange={e=>updRow(r.id,{published:e.target.checked})}/>
                        <span className="opacity-70">{r.published ? "Yes" : "No"}</span>
                      </label>
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={()=>delRow(r.id)} className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 hover:border-red-400">
                        <Trash2 className="h-4 w-4"/> Delete
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

/* ------------------ Posts (+attachments) ------------------ */
function AdminPosts() {
  const [rows, setRows] = React.useState<Post[]>(() => loadPosts());
  const empty: Post = { id:"", slug:"", title:"", date:"", summary:"", content:"", published:false, updatedAt:Date.now(), attachments: [] };
  const [draft, setDraft] = React.useState<Post>(empty);
  const [attUploads, setAttUploads] = React.useState<{ file: File; progress: number; dataUrl?: string; type?: "image"|"video"; }[]>([]);

  function genSlug(title:string) {
    const base = title.toLowerCase().replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,64) || "post";
    let slug = base, i = 2; const existing = new Set(rows.map(r=>r.slug));
    while (existing.has(slug)) slug = `${base}-${i++}`;
    return slug;
  }
  function addPost() {
    if (!draft.title) return alert("Title required");
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const slug = draft.slug || genSlug(draft.title);
    const next: Post = { ...draft, id: uid(), slug, updatedAt: Date.now(), date };
    setRows([next, ...rows]); savePosts([next, ...rows]); setDraft(empty); setAttUploads([]);
  }
  function delPost(id:string) { const next = rows.filter(r=>r.id!==id); setRows(next); savePosts(next); }
  function updPost(id:string, patch: Partial<Post>) {
    const next = rows.map(r => r.id===id ? { ...r, ...patch, updatedAt: Date.now() } : r);
    setRows(next); savePosts(next);
  }

  function addAttachments(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      setAttUploads((prev) => [...prev, { file, progress: 0 }]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const fileType = file.type.startsWith("video/") ? "video" : "image";
        setAttUploads((prev) => prev.map((u) => u.file === file ? { ...u, dataUrl, progress: 100, type: fileType } : u));
        const newItem: MediaItem = { id: uid(), src: dataUrl, type: fileType };
        setDraft((d) => ({ ...d, attachments: [newItem, ...(d.attachments ?? [])] }));
      };
      reader.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const percent = Math.round((ev.loaded / ev.total) * 100);
          setAttUploads((prev) => prev.map((u) => u.file === file ? { ...u, progress: percent } : u));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeAttachment(id: string) {
    setDraft((d) => ({ ...d, attachments: (d.attachments ?? []).filter((a) => a.id !== id) }));
  }

  return (
    <div className="grid gap-4">
      <Panel title="New post" rightTag="compose.md">
        <div className="grid gap-2 text-xs">
          <input placeholder="Title" value={draft.title} onChange={e=>setDraft({...draft, title:e.target.value})} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"/>
          <input placeholder="Custom slug (optional)" value={draft.slug} onChange={e=>setDraft({...draft, slug:e.target.value})} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"/>
          <input placeholder="Summary" value={draft.summary} onChange={e=>setDraft({...draft, summary:e.target.value})} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"/>
          <textarea placeholder="Content (Markdown-lite)" value={draft.content} onChange={e=>setDraft({...draft, content:e.target.value})} rows={8} className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1 font-mono"/>
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={draft.published} onChange={e=>setDraft({...draft, published:e.target.checked})}/> Published
          </label>

          <div className="grid gap-2">
            <label className="text-xs">Attachments (images/videos)</label>
            <input type="file" multiple accept="image/*,video/*" onChange={addAttachments} className="block w-full text-sm" />
            {attUploads.map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs truncate max-w-[100px]">{u.file.name}</span>
                <div className="flex-1 h-2 bg-[#2a3328] rounded"><div className="h-full bg-[var(--accent)] rounded" style={{ width: `${u.progress}%` }} /></div>
                {u.progress === 100 && <span className="text-xs">✓</span>}
              </div>
            ))}
            {(draft.attachments ?? []).length > 0 && (
              <div className="grid gap-2 sm:grid-cols-3">
                {(draft.attachments ?? []).map((att) => (
                  <div key={att.id} className="relative">
                    {att.type === "image" ? (
                      <img src={att.src} alt="att" className="w-full h-auto object-contain rounded" />
                    ) : (
                      <video src={att.src} className="w-full h-auto object-contain rounded" muted autoPlay loop playsInline />
                    )}
                    <button onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={addPost} className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
            <Save className="h-4 w-4"/> Save post
          </button>
        </div>
      </Panel>

      <Panel title="All posts" rightTag={`${rows.length}`}>
        {rows.length === 0 ? (
          <div className="text-sm opacity-70">No posts.</div>
        ) : (
          <div className="grid gap-3">
            {rows.map(p=>(
              <div key={p.id} className="rounded border border-[#4a5a45] p-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="font-medium text-[var(--accent)]">{p.title}</div>
                  <div className="text-xs opacity-70">{p.date} • {p.published ? "Published":"Draft"}</div>
                </div>
                <div className="text-xs opacity-80 break-all">/blog/{p.slug}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={()=>window.dispatchEvent(new CustomEvent("kabuto:pre-navigate",{detail:{nextPath:`/blog/${p.slug}`}}))}
                          className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 text-xs hover:border-[var(--primary)]">
                    <PencilLine className="h-4 w-4"/> Open
                  </button>
                  <button onClick={()=>delPost(p.id)} className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 text-xs hover:border-red-400">
                    <Trash2 className="h-4 w-4"/> Delete
                  </button>
                  <label className="inline-flex items-center gap-2 text-xs ml-auto">
                    <input type="checkbox" checked={p.published} onChange={e=>updPost(p.id,{published:e.target.checked})}/> Published
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ------------------ Portfolio (uploads) ------------------ */
function AdminPortfolio() {
  const [items, setItems] = React.useState<MediaItem[]>(() => loadPortfolioItems());
  const [uploads, setUploads] = React.useState<{ file: File; progress: number; dataUrl?: string; type?: "image"|"video"; }[]>([]);

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      setUploads((prev) => [...prev, { file, progress: 0 }]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const fileType = file.type.startsWith("video/") ? "video" : "image";
        setUploads((prev) => prev.map((u) => u.file === file ? { ...u, progress: 100, dataUrl, type: fileType } : u));
        const newItem: MediaItem = { id: uid(), src: dataUrl, type: fileType };
        setItems((prev) => { const updated = [newItem, ...prev]; savePortfolioItems(updated); return updated; });
      };
      reader.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const percent = Math.round((ev.loaded / ev.total) * 100);
          setUploads((prev) => prev.map((u) => u.file === file ? { ...u, progress: percent } : u));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeItem(id: string) {
    const next = items.filter((it) => it.id !== id);
    setItems(next); savePortfolioItems(next);
  }

  return (
    <div className="grid gap-4">
      <Panel title="Add portfolio item" rightTag="upload">
        <div className="grid gap-2 text-xs">
          <input type="file" multiple accept="image/*,video/*" onChange={addFiles} className="block w-full text-sm" />
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs truncate max-w-[100px]">{u.file.name}</span>
              <div className="flex-1 h-2 bg-[#2a3328] rounded"><div className="h-full bg-[var(--accent)] rounded" style={{ width: `${u.progress}%` }} /></div>
              {u.progress === 100 && <span className="text-xs">✓</span>}
            </div>
          ))}
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
                <button onClick={() => removeItem(it.id)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80" title="Delete">
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
