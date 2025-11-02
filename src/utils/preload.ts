// src/utils/preload.ts
type MediaKind = "image" | "video" | "audio";

/** Inject <link rel="preload"> hints for the browser fetch scheduler */
export function injectPreloadLinks(urls: string[], as: MediaKind) {
  const head = document.head;
  for (const href of urls) {
    // Avoid duplicates if hot-reloaded
    if ([...head.querySelectorAll<HTMLLinkElement>('link[rel="preload"]')]
      .some(l => l.href.endsWith(href))) continue;

    const l = document.createElement("link");
    l.rel = "preload";
    l.as = as;
    l.href = href;
    // Important for images used as <img src>:
    if (as === "image") (l as HTMLLinkElement).crossOrigin = "anonymous";
    head.appendChild(l);
  }
}

/** Warm the renderer: actually decode images/videos so there is no pop-in */
export async function warmDecode({
  images = [],
  videos = [],
  audios = [],
}: { images?: string[]; videos?: string[]; audios?: string[] }) {
  // Images: decoding=async + eager to make them ready to paint instantly
  const imageJobs = images.map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        (img as any).decoding = "async";
        (img as any).loading = "eager";
        img.onload = () => resolve();
        img.onerror = () => resolve(); // don't block on a miss
        img.src = src;
      }),
  );

  // Videos: create elements with preload="auto" (same-origin to take effect)
  const videoJobs = videos.map(
    (src) =>
      new Promise<void>((resolve) => {
        const v = document.createElement("video");
        v.preload = "auto";
        v.src = src;
        // try to read enough metadata to be paint-ready; fall back to resolve after timeout
        const done = () => resolve();
        v.onloadeddata = done;
        v.oncanplaythrough = done;
        v.onerror = done;
        // Safety timeout (in case the event never fires due to codec/platform)
        setTimeout(done, 2500);
      }),
  );

  // Audio: warm the buffer so first play has no lag
  const audioJobs = audios.map(
    (src) =>
      new Promise<void>((resolve) => {
        const a = new Audio();
        a.preload = "auto";
        a.src = src;
        const done = () => resolve();
        a.oncanplaythrough = done;
        a.onerror = done;
        setTimeout(done, 1500);
      }),
  );

  await Promise.all([...imageJobs, ...videoJobs, ...audioJobs]);
}
