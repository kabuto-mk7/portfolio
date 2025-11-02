import { Window } from "@/ui/Window";
import type { Post } from "@/types";
import { loadPosts } from "@/lib/storage";
import React from "react";

function mdToHtml(md: string) {
  let html = md.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  html = html
    .replace(/^###\s(.+)$/gm,"<h3>$1</h3>")
    .replace(/^##\s(.+)$/gm,"<h2>$1</h2>")
    .replace(/^#\s(.+)$/gm,"<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em>$1</em>")
    .replace(/\n\n/g,"</p><p>")
    .replace(/\n/g,"<br/>");
  return `<p>${html}</p>`;
}

export function BlogPage() {
  const posts = React.useMemo(()=> loadPosts().filter(p=>p.published).sort((a,b)=> (a.date < b.date ? 1 : -1)), []);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="Blog">
        {posts.length === 0 ? (
          <div className="text-sm opacity-70">No posts yet.</div>
        ) : (
          <div className="grid gap-4">
            {posts.map(p=>(
              <div key={p.id} className="rounded-[6px] border border-[#4a5a45] bg-[#3a4538] p-3">
                <div className="flex items-center justify-between">
                  <a className="text-[var(--accent)] hover:underline" href={`/blog/${p.slug}`}
                     onClick={(e)=>{ e.preventDefault(); window.dispatchEvent(new CustomEvent("kabuto:pre-navigate", { detail:{ nextPath:`/blog/${p.slug}` } })); }}>
                    {p.title}
                  </a>
                  <span className="text-xs opacity-70">{p.date}</span>
                </div>
                {p.summary && <p className="mt-1 text-xs opacity-80">{p.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </Window>
    </main>
  );
}

export function BlogPostPage({ slug }: { slug: string }) {
  const [post, setPost] = React.useState<Post | null>(null);
  React.useEffect(() => {
    const p = loadPosts().find(p=>p.slug === slug && p.published);
    setPost(p || null);
    if (p) {
      document.title = `kabuto — ${p.title}`;
      const meta = (document.querySelector('meta[name="description"]') as HTMLMetaElement)
        || document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
      meta.setAttribute("content", p.summary || p.title);
    }
  }, [slug]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title={post ? post.title : "Not found"}>
        {!post ? (
          <div className="text-sm opacity-70">This post doesn't exist or is unpublished.</div>
        ) : (
          <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: mdToHtml(post.content) }}/>
        )}
      </Window>
    </main>
  );
}
