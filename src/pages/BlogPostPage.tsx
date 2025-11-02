import React, { useEffect, useState } from "react";
import { loadPosts } from "@/lib/storage";
import { PageShell } from "@/ui/Window";
import { mdToHtml } from "@/lib/md";
import type { Post } from "@/types";

export default function BlogPostPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => {
    const p = loadPosts().find((p) => p.slug === slug && p.published);
    setPost(p || null);
    if (p) {
      document.title = `kabuto — ${p.title}`;
      const meta = (document.querySelector('meta[name="description"]') as HTMLMetaElement) ||
        document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
      meta.setAttribute("content", p.summary || p.title);
    }
  }, [slug]);
  return (
    <PageShell title={post ? post.title : "Not found"}>
      {!post ? <div className="text-sm opacity-70">This post doesn't exist or is unpublished.</div> : (
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: mdToHtml(post.content) }} />
      )}
    </PageShell>
  );
}
