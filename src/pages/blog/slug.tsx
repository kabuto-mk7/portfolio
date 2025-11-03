import React from "react";
import { Window } from "@/ui/Window";
import { getPostBySlugPublic } from "@/lib/storage";
import type { Post } from "@/types";

export default function BlogSlugPage({ slug }: { slug: string }) {
  const [post, setPost] = React.useState<Post | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const decoded = decodeURIComponent(slug || "");
        const p = await getPostBySlugPublic(decoded);
        if (!cancelled) setPost(p);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title={post?.title || "Post"}>
        {loading ? (
          <div className="rounded border border-[#4a5a45] p-6 text-center text-sm opacity-80">
            Loading…
          </div>
        ) : !post ? (
          <div className="rounded border border-[#4a5a45] p-6 text-center text-sm opacity-80">
            Post not found.
          </div>
        ) : (
          <article className="prose prose-invert max-w-none">
            <header className="mb-4">
              <h1 className="text-2xl font-semibold text-[var(--accent)]">
                {post.title}
              </h1>
              <div className="text-xs opacity-70">
                {post.date ||
                  new Date(post.updatedAt || Date.now())
                    .toISOString()
                    .slice(0, 10)}
              </div>
            </header>

            {post.summary && (
              <p className="text-sm opacity-85 mb-4">{post.summary}</p>
            )}

            {Array.isArray(post.attachments) && post.attachments.length > 0 && (
              <div className="my-4 grid gap-3 sm:grid-cols-2">
                {post.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="rounded overflow-hidden border border-[#394636]"
                  >
                    {att.type === "video" ? (
                      <video
                        src={att.src}
                        className="w-full h-auto object-contain"
                        controls
                        playsInline
                      />
                    ) : (
                      <img
                        src={att.src}
                        className="w-full h-auto object-contain"
                        alt=""
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {post.content && (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed opacity-90">
                {post.content}
              </pre>
            )}
          </article>
        )}
      </Window>
    </main>
  );
}
