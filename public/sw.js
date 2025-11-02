const CACHE = "kabuto-precache-v1";
const URLS = [
  // Same list as the manifest (can be injected at build time if you prefer)
  "/",
  "/index.html",
  "/sfx/click.mp3",
  "/sfx/transition.mp3",
  "/sfx/fire.mp3",

  // Images
  "/assets/kabuto/ui/logo.png",
  "/assets/kabuto/ui/favicon.png",
  "/assets/kabuto/ui/feature-hero.png",
  "/assets/smoker.jpg",
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
  "/assets/kabuto/esports_sidebar/avatar.png",
  "/assets/kabuto/esports_sidebar/mousepad.jpg",
  "/assets/kabuto/esports_sidebar/rig.jpg",
  "/assets/kabuto/esports_sidebar/trophy.jpg",
  "/assets/kabuto/comisions/thumbs/short-30.jpg",
  "/assets/kabuto/comisions/thumbs/short-60.jpg",
  "/assets/kabuto/comisions/thumbs/short-120.jpg",
  "/assets/kabuto/comisions/thumbs/yt-6.jpg",
  "/assets/kabuto/comisions/thumbs/yt-12.jpg",
  "/assets/kabuto/comisions/thumbs/yt-20.jpg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? undefined : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Only same-origin GET
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
