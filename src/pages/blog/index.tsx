import React from "react";
import { Window } from "@/ui/Window";
import { navigate } from "@/lib/router";
import type { Post } from "@/types";

// Supabase-backed public readers + local fallback
import { listPostsPublic, loadPosts } from "@/lib/storage";

export default function BlogIndexPage() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) Try Supabase (published only)
        const supa = await listPostsPublic();
        if (!alive) return;

        if (supa.length > 0) {
          setPosts(supa);
        } else {
          // 2) Fallback to local cache (what Admin writes to LS)
          const local = loadPosts().filter(p => p.published);
          if (!alive) return;
          setPosts(local);
        }
      } catch {
        // Fallback on any error
        const local = loadPosts().filter(p => p.published);
        if (!alive) return;
        setPosts(local);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="Blog">
        {loading ? (
          <div className="rounded border border-[#4a5a45] p-6 text-center text-sm opacity-80">
            Loading…
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded border border-[#4a5a45] p-6 text-center text-sm opacity-80">
            No posts yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {posts
              .slice()
              .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
              .map((p) => (
                <article
                  key={p.id}
                  className="rounded border border-[#4a5a45] p-4 hover:border-[var(--primary)] transition-colors"
                >
                  <header className="flex items-start justify-between gap-3">
                    <h2
                      className="text-[var(--accent)] text-lg font-semibold hover:underline cursor-pointer"
                      onClick={() => navigate(`/blog/${encodeURIComponent(p.slug)}`)}
                    >
                      {p.title || p.slug}
                    </h2>
                    <div className="text-xs opacity-70 whitespace-nowrap">
                      {p.date || new Date(p.updatedAt || Date.now()).toISOString().slice(0,10)}
                    </div>
                  </header>

                  {p.summary && (
                    <p className="mt-2 text-sm opacity-85">{p.summary}</p>
                  )}

                  {/* simple attachments preview row */}
                  {Array.isArray(p.attachments) && p.attachments.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {p.attachments.slice(0,3).map(att => (
                        <div key={att.id} className="rounded overflow-hidden border border-[#394636]">
                          {att.type === "video" ? (
                            <video src={att.src} className="w-full h-auto object-cover" muted autoPlay loop playsInline />
                          ) : (
                            <img src={att.src} className="w-full h-auto object-cover" alt="" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
          </div>
        )}
      </Window>
    </main>
  );
}
