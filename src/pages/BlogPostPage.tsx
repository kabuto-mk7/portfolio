import { useEffect, useState } from "react";
import { Window } from "@/ui/Window";
import type { Post } from "@/types";
import { getPostBySlug } from "@/lib/content";

export default function BlogPostPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const p = getPostBySlug(slug);
    setPost(p);

    // Only touch document head if we actually found a post
    if (p) {
      document.title = `kabuto – ${p.title}`;
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", p.summary || p.title);
    }
  }, [slug]);

  // ✅ Early null guard avoids "post is possibly null"
  if (!post) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Window title="Not found">
          <div className="text-sm opacity-70">Post not found.</div>
        </Window>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title={post.title ?? post.slug}>
        <div className="text-xs opacity-70 mb-3">
          {post.date || new Date(post.updatedAt || Date.now()).toISOString().slice(0, 10)}
        </div>

        {post.summary && <p className="opacity-90 mb-3">{post.summary}</p>}

        {/* very light Markdown-lite: just line breaks */}
        {post.content && (
          <div className="whitespace-pre-wrap leading-relaxed opacity-95">
            {post.content}
          </div>
        )}

        {Array.isArray(post.attachments) && post.attachments.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {post.attachments.map((att) => (
              <div key={att.id} className="rounded overflow-hidden border border-[#394636]">
                {att.type === "video" ? (
                  <video src={att.src} className="w-full h-auto" muted autoPlay loop playsInline />
                ) : (
                  <img src={att.src} className="w-full h-auto" alt="" />
                )}
              </div>
            ))}
          </div>
        )}
      </Window>
    </main>
  );
}
