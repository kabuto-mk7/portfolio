/* sw.js — precache + local media cache (blog/portfolio)
   ------------------------------------------------------------
   - Fix: keep the /local cache on activate (no more wiped uploads)
   - Adds: cache-put-begin message so UI can show progress immediately
   - Supports: Range requests for /local/* so <video> seeking works
*/

const SW_VERSION = "2025-11-02.2";

/* ---------- Cache names ---------- */
const PRECACHE_NAME   = "kabuto-precache-v2";  // bump when URLS list changes
const LOCAL_CACHE_NAME = "kabuto-local-v2";    // bump when media logic changes

// Back-compat alias if your app referenced MEDIA_CACHE before
const MEDIA_CACHE = LOCAL_CACHE_NAME;

/* ---------- Precache list (same files you listed) ---------- */
const URLS = [
  "/",
  "/index.html",

  // SFX
  "/sfx/click.mp3",
  "/sfx/transition.mp3",
  "/sfx/fire.mp3",

  // UI images
  "/assets/kabuto/ui/logo.png",
  "/assets/kabuto/ui/favicon.png",
  "/assets/kabuto/ui/feature-hero.png",
  "/assets/smoker.jpg",

  // Portfolio / desktop
  "/assets/kabuto/portfolio/win95.jpg",
  "/assets/kabuto/portfolio/portal.png",
  "/assets/kabuto/portfolio/vlc.png",
  "/assets/kabuto/portfolio/steam.png",
  "/assets/kabuto/portfolio/fraps.png",
  "/assets/kabuto/portfolio/photo.png",
  "/assets/kabuto/portfolio/notepad.jpg",
  "/assets/kabuto/portfolio/start-icon.png",
  "/assets/kabuto/portfolio/icon-portfolio.png",
  "/assets/kabuto/portfolio/viewmodel.webp",
  "/assets/kabuto/portfolio/hana256.bmp",
  "/assets/kabuto/portfolio/splash-portfolio.jpg",
  "/assets/kabuto/portfolio/self.png",
  "/assets/kabuto/portfolio/BG.png",
  "/assets/kabuto/portfolio/overlay.png",
  "/assets/kabuto/portfolio/ipad.png",
  "/assets/kabuto/portfolio/person01.png",
  "/assets/kabuto/portfolio/person02.png",
  "/assets/kabuto/portfolio/person03.png",

  // E-sports sidebar
  "/assets/kabuto/esports_sidebar/avatar.png",
  "/assets/kabuto/esports_sidebar/mousepad.jpg",
  "/assets/kabuto/esports_sidebar/rig.jpg",
  "/assets/kabuto/esports_sidebar/trophy.jpg",

  // Rates thumbs
  "/assets/kabuto/comisions/thumbs/short-30.jpg",
  "/assets/kabuto/comisions/thumbs/short-60.jpg",
  "/assets/kabuto/comisions/thumbs/short-120.jpg",
  "/assets/kabuto/comisions/thumbs/yt-6.jpg",
  "/assets/kabuto/comisions/thumbs/yt-12.jpg",
  "/assets/kabuto/comisions/thumbs/yt-20.jpg",
];

/* ---------- Install / Activate ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME)
      .then((cache) => cache.addAll(URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([PRECACHE_NAME, LOCAL_CACHE_NAME]); // IMPORTANT: keep local cache
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (keep.has(k) ? undefined : caches.delete(k))));
    await self.clients.claim();
  })());
});

/* ---------- Helpers ---------- */
const guessMime = (name = "") => {
  const n = name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".svg")) return "image/svg+xml";
  if (n.endsWith(".mp4")) return "video/mp4";
  if (n.endsWith(".webm")) return "video/webm";
  if (n.endsWith(".mov")) return "video/quicktime";
  return "application/octet-stream";
};

function postToClient(clientId, msg) {
  if (!clientId) return;
  // @ts-ignore
  self.clients.get(clientId).then((c) => c && c.postMessage(msg)).catch(() => {});
}

/* ---------- Receive blobs from the app, store under /local/<bucket>/<id> ---------- */
self.addEventListener("message", async (event) => {
  const msg = event.data || {};
  if (msg.type !== "cache-put") return;

  const { id, blob, bucket } = msg.payload || {};
  const sourceId = event.source && event.source.id;

  if (!id || !blob || !bucket) {
    postToClient(sourceId, { type: "cache-put-error", payload: { id, bucket, reason: "bad-payload" } });
    return;
  }

  const urlPath = `/local/${bucket}/${id}`;

  // Notify UI right away (so your UploadStatusBar shows pending)
  postToClient(sourceId, { type: "cache-put-begin", payload: { id, bucket, filename: blob.name || id } });

  try {
    const cache = await caches.open(LOCAL_CACHE_NAME);
    const headers = new Headers({
      "Content-Type": blob.type || guessMime(id),
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    // Put using the path so same-origin GET /local/... matches this key
    await cache.put(new Request(urlPath, { method: "GET" }), new Response(blob, { headers }));

    postToClient(sourceId, { type: "cache-put-ok", payload: { id, bucket } });
  } catch (err) {
    postToClient(sourceId, { type: "cache-put-error", payload: { id, bucket, reason: String(err) } });
  }
});

/* ---------- Fetch handler ---------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Serve /local/* from LOCAL cache, with Range support for video seeking
  if (url.origin === location.origin && url.pathname.startsWith("/local/")) {
    event.respondWith((async () => {
      const cache = await caches.open(LOCAL_CACHE_NAME);
      const hit = await cache.match(url.pathname);
      if (!hit) return new Response("Not found", { status: 404 });

      // Support Range requests (206) for media
      const rangeHeader = req.headers.get("Range");
      if (!rangeHeader) {
        return hit;
      }

      try {
        const blob = await hit.blob();
        const size = blob.size;

        const m = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
        if (!m) return new Response(null, { status: 416 });

        const start = Number(m[1]);
        const end = m[2] ? Number(m[2]) : size - 1;
        const chunk = blob.slice(start, end + 1);

        return new Response(chunk, {
          status: 206,
          statusText: "Partial Content",
          headers: {
            "Content-Type": hit.headers.get("Content-Type") || guessMime(url.pathname),
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes ${start}-${end}/${size}`,
            "Content-Length": String(chunk.size),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch {
        // Fallback to the full response if slicing fails
        return hit;
      }
    })());
    return;
  }

  // Optional: cache-first for precached root assets; otherwise network
  if (req.method === "GET" && url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(PRECACHE_NAME);
      const cached = await cache.match(url.pathname);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        return res;
      } catch {
        // If offline and not precached
        return new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // default: let it go to network
});
