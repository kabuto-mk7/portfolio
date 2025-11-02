/* eslint-disable @typescript-eslint/no-misused-promises */
import React, {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Youtube,
  Twitter,
  Link2,
  Mail,
  Lock,
  Unlock,
  Plus,
  Save,
  Trash2,
  PencilLine,
  Image as ImageIcon,
  Clipboard as ClipboardIcon,
} from "lucide-react";
import { createPortal } from "react-dom";

const APP_BUILD = "2025-11-02.2"; // bump on each deploy

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${APP_BUILD}`)
      .then((reg) => reg.update().catch(() => {}))
      .catch(() => {});
  });
}

import { IMAGES, VIDEOS, AUDIOS } from "./assets.manifest";
import { injectPreloadLinks, warmDecode } from "./utils/preload";

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Types                                                                    │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
type SectionItem = { label: string; url: string };

type EventRow = {
  id: string;
  game: string;
  date: string; // YYYY-MM-DD
  location: string;
  event: string;
  placement: string;
  published: boolean;
};

type Post = {
  id: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  published: boolean;
  updatedAt: number;
};

/* ─────────────── Portfolio storage types ─────────────── */
type PortfolioItem = {
  id: string;
  title?: string;
  type: "image" | "video";
  url: string; // stable /local/portfolio/{id}
  filename?: string;
  mime?: string;
  createdAt: number;
  published: boolean;
};

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Theme                                                                    │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
const BRAND = {
  title: "kabuto",
  primary: "#d7e6b6",
  primarySoft: "#e6f2cf",
  bg: "#2c3528",
  panel: "#3a4538",
  accent: "#d7c65a",
};
const appStyles: CSSProperties = {
  "--primary": BRAND.primary,
  "--primarySoft": BRAND.primarySoft,
  "--bg": BRAND.bg,
  "--panel": BRAND.panel,
  "--accent": BRAND.accent,
} as CSSProperties;

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Assets                                                                   │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
const LOGO_SRC = "/assets/kabuto/ui/logo.png";
const FAVICON_SRC = "/assets/kabuto/ui/favicon.png";
const FEATURE_IMAGE_PRIMARY = "/assets/kabuto/ui/feature-hero.png";
const SMOKER_SRC = "/assets/smoker.jpg";

// --- CS scene layers ---
const PF_BG = "/assets/kabuto/portfolio/BG.png";
const PF_OVERLAY = "/assets/kabuto/portfolio/overlay.png";
const PF_IPAD = "/assets/kabuto/portfolio/ipad.png";
const PF_P1 = "/assets/kabuto/portfolio/person01.png"; // "rates"
const PF_P2 = "/assets/kabuto/portfolio/person02.png"; // "design_portfolio"
const PF_P3 = "/assets/kabuto/portfolio/person03.png"; // "contact_info"

// extra SFX
const FIRE_SFX_SRC = "/sfx/fire.mp3";

// Root desktop
const ROOT_WALL = "/assets/kabuto/portfolio/win95.jpg";
const ICON_PORTFOLIO = "/assets/kabuto/portfolio/portal.png";
const ICON_LAB = "/assets/kabuto/portfolio/vlc.png";
const ICON_IRL = "/assets/kabuto/portfolio/steam.png";
const ICON_CONTACT = "/assets/kabuto/portfolio/fraps.png";
const NOTEPAD_CHROME = "/assets/kabuto/portfolio/notepad.jpg";

// Portfolio desktop (lab-styled)
const PF_WALL = "/assets/kabuto/portfolio/hana256.bmp";
const PF_SPLASH = "/assets/kabuto/portfolio/splash-portfolio.jpg";
// Root uses the same splash as portfolio
const ROOT_SPLASH = PF_SPLASH;

const PF_START = "/assets/kabuto/portfolio/start-icon.png";
const PF_PCICON = "/assets/kabuto/portfolio/icon-portfolio.png";
const PF_VIEWMODEL = "/assets/kabuto/portfolio/viewmodel.webp";

// Esports sidebar
const RIGHT_STACK_IMAGES: string[] = [
  "/assets/kabuto/esports_sidebar/avatar.png",
  "/assets/kabuto/esports_sidebar/mousepad.jpg",
  "/assets/kabuto/esports_sidebar/rig.jpg",
  "/assets/kabuto/esports_sidebar/trophy.jpg",
];

// Rates thumbs
const RATES_THUMBS: string[] = [
  "/assets/kabuto/comisions/thumbs/short-30.jpg",
  "/assets/kabuto/comisions/thumbs/short-60.jpg",
  "/assets/kabuto/comisions/thumbs/short-120.jpg",
  "/assets/kabuto/comisions/thumbs/yt-6.jpg",
  "/assets/kabuto/comisions/thumbs/yt-12.jpg",
  "/assets/kabuto/comisions/thumbs/yt-20.jpg",
];

// External counter (kept)
const COUNTER_SRC =
  "https://count.getloli.com/get/@:kabuto-mk7?theme=gelbooru";

// Cursor with shadow
const CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
<g filter="url(#s)">
<path stroke="#00ff00" stroke-width="2.5" stroke-linecap="square" d="M16 1v10 M16 21v10 M1 16h10 M21 16h10"/>
</g>
<defs>
  <filter id="s">
    <feDropShadow dx="0" dy="0" stdDeviation="1.6" flood-color="#000" flood-opacity=".8"/>
  </filter>
</defs>
</svg>`;
const CURSOR_URL = `data:image/svg+xml;utf8,${encodeURIComponent(CURSOR_SVG)}`;

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Helpers                                                                   │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
const EVENTS_KEY = "kabuto.data.events.v1";
const POSTS_KEY = "kabuto.data.posts.v1";
const ADMIN_HASH_KEY = "kabuto.admin.hash";
const ADMIN_SALT = "kabuto.salt.v1";
const PORTFOLIO_KEY = "kabuto.data.portfolio.v1";

const localUrl = (bucket: "portfolio" | "blog", id: string) =>
  `/local/${bucket}/${id}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function loadEvents(): EventRow[] {
  const raw = safeParse<EventRow[]>(
    localStorage.getItem(EVENTS_KEY),
    [] as EventRow[],
  );
  return raw.map((r) => ({ ...r, published: r.published ?? true }));
}
function saveEvents(rows: EventRow[]) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(rows));
    window.dispatchEvent(
      new CustomEvent("kabuto:data", { detail: { type: "events" } }),
    );
  } catch {}
}
function loadPosts(): Post[] {
  return safeParse(localStorage.getItem(POSTS_KEY), [] as Post[]);
}
function savePosts(rows: Post[]) {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(rows));
    window.dispatchEvent(
      new CustomEvent("kabuto:data", { detail: { type: "posts" } }),
    );
  } catch {}
}

function loadPortfolio(): PortfolioItem[] {
  return safeParse<PortfolioItem[]>(localStorage.getItem(PORTFOLIO_KEY), []);
}
function savePortfolio(rows: PortfolioItem[]) {
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(rows));
    window.dispatchEvent(
      new CustomEvent("kabuto:data", { detail: { type: "portfolio" } }),
    );
  } catch {}
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function sha256Hex(s: string) {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function setAdminPassword(pw: string) {
  const hash = await sha256Hex(ADMIN_SALT + pw);
  localStorage.setItem(ADMIN_HASH_KEY, hash);
}
async function verifyAdminPassword(pw: string) {
  const hash = localStorage.getItem(ADMIN_HASH_KEY);
  if (!hash) return false;
  const attempt = await sha256Hex(ADMIN_SALT + pw);
  return attempt === hash;
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Markdown-lite (extended with links & images)                             │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function mdToHtml(md: string) {
  // basic escape
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // headers, emphasis
  html = html
    .replace(/^###\s(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s(.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  // links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );

  // images ![alt](src) — allow any src (including /local/... from SW)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%;height:auto;display:block;margin:12px 0;" />',
  );

  // paragraphs & line breaks
  html = html.replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br/>");
  return `<p>${html}</p>`;
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Image preloading                                                          │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function usePreloadImages(urls: string[]) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    urls.forEach((src) => {
      const l = document.createElement("link");
      l.rel = "preload";
      l.as = "image";
      l.href = src;
      document.head.appendChild(l);
      links.push(l);
      const i = new Image();
      (i as any).decoding = "async";
      (i as any).loading = "eager";
      i.src = src;
    });
    return () => links.forEach((l) => l.remove());
  }, [urls.join("|")]);
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Sections (Lab top buttons)                                               │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
const SECTIONS_TOP: SectionItem[] = [
  { label: "Blog", url: "/blog" },
  { label: "Design portfolio", url: "/portfolio" },
  { label: "E-Sports", url: "/esports" },
];
const SECTIONS_LOWER: SectionItem[] = [
  { label: "WNACRY", url: "https://wnacry.com" },
  { label: "Editing rates", url: "/commissions" },
];

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Lab Home (/lab) – your old homepage                                      │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function LabHomePage() {
  const [cacheBust, setCacheBust] = useState("");
  useEffect(() => setCacheBust(String(Date.now())), []);
  usePreloadImages([
    FEATURE_IMAGE_PRIMARY,
    SMOKER_SRC,
    PF_BG,
    PF_OVERLAY,
    PF_IPAD,
    PF_P1,
    PF_P2,
    PF_P3,
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <img
          src={`${FEATURE_IMAGE_PRIMARY}${cacheBust ? `?t=${cacheBust}` : ""}`}
          alt="feature artwork"
          className="w-full rounded-[6px] border border-[#4a5a45] shadow-[0_0_0_1px_#2d362b] object-cover"
          loading="eager"
          decoding="async"
        />
      </div>

      <Window title="Launcher">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Panel title="About" rightTag="readme.md">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-3"
              >
                <p className="text-sm opacity-80 leading-relaxed">
                  You can call me Kem. West London based. I run a 3D-printing
                  business, a clothing line, and property broker. Before this I
                  was working putting computers in people's brains. Most of my
                  time goes into making things: hardware mods, camera work,
                  code, and builds that end up useful.
                </p>
                <p className="text-sm opacity-80 leading-relaxed">
                  This is the lab. Build logs, e-sports kit + results, and
                  projects that don’t fit anywhere else.
                </p>
                <p className="text-sm opacity-80 leading-relaxed">
                  Never give up.
                </p>
              </motion.div>
            </Panel>

            {/* Top buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SECTIONS_TOP.map((s) => {
                const internal = isInternalKabuto(s.url);
                return (
                  <a
                    key={s.label}
                    href={s.url}
                    target={internal ? undefined : "_blank"}
                    rel={internal ? undefined : "noreferrer"}
                    onClick={(e) => {
                      if (internal) {
                        e.preventDefault();
                        navigate(s.url);
                      }
                    }}
                    className="group relative rounded-[6px] border border-[#5a6a55] bg-[linear-gradient(180deg,#414c40_0%,#313b2f_100%)] px-4 py-3 shadow-[inset_0_1px_0_#566552,0_1px_0_#20281f] hover:border-[var(--primary)] hover:shadow-[inset_0_1px_0_var(--primary),0_0_0_2px_rgba(215,230,182,0.12)] transition-all"
                  >
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[#5a6a55] opacity-70" />
                    <span className="pointer-events-none absolute left-1 top-1 h-1 w-1 bg-[var(--primary)]/70" />
                    <span className="pointer-events-none absolute right-1 top-1 h-1 w-1 bg-[var(--primary)]/30" />
                    <span className="flex items-center justify-center gap-2 text-[var(--accent)] tracking-wide">
                      <span className="h-2 w-2 rounded-sm bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                      <span className="uppercase text-[13px]">{s.label}</span>
                    </span>
                  </a>
                );
              })}
            </div>

            {/* Counter + lower buttons */}
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center justify-center text-sm">
                <span className="opacity-80">you are the&nbsp;</span>
                <img
                  src={`${COUNTER_SRC}${cacheBust ? `&t=${cacheBust}` : ""}`}
                  alt="site hit counter"
                  className="h-24 md:h-28 lg:h-36 mx-3"
                  loading="eager"
                />
                <span className="opacity-80">&nbsp;th visitor</span>
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-[70%]">
                {SECTIONS_LOWER.map((s) => {
                  const internal = isInternalKabuto(s.url);
                  return (
                    <a
                      key={s.label}
                      href={s.url}
                      target={internal ? undefined : "_blank"}
                      rel={internal ? undefined : "noreferrer"}
                      onClick={(e) => {
                        if (internal) {
                          e.preventDefault();
                          navigate(s.url);
                        }
                      }}
                      className="group relative rounded-[6px] border border-[#5a6a55] bg-[linear-gradient(180deg,#414c40_0%,#313b2f_100%)] px-4 py-3 shadow-[inset_0_1px_0_#566552,0_1px_0_#20281f] hover:border-[var(--primary)] hover:shadow-[inset_0_1px_0_var(--primary),0_0_0_2px_rgba(215,230,182,0.12)] transition-all"
                    >
                      <span className="flex items-center justify-center gap-2 text-[var(--accent)] tracking-wide">
                        <span className="h-2 w-2 rounded-sm bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                        <span className="uppercase text-[13px]">{s.label}</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT – FAQ + smoker image */}
          <div className="space-y-4">
            <Panel title="FAq" rightTag="profile">
              <SpecList
                specs={{
                  age: "25",
                  birthday: "10/09/2000",
                  "where are you from?": "london, uk",
                  major: "computer science",
                  "what are you?": "full turkish cypriot",
                  orientation: "straight",
                  "whats your mbti": "infj",
                }}
              />
            </Panel>
            <div className="rounded-[6px] border border-[#4a5a45] overflow-hidden">
              <img
                src={SMOKER_SRC}
                alt="smoker"
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </Window>
    </main>
  );
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Lightweight router + navigation                                          │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function usePath() {
  const [path, setPath] = useState<string>(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return [path, setPath] as const;
}

function isInternalKabuto(url: string) {
  try {
    if (url.startsWith("/")) return true;
    const u = new URL(url, window.location.origin);
    return (
      u.origin === window.location.origin || u.hostname.endsWith("kabuto.studio")
    );
  } catch {
    return false;
  }
}

/** Centralized navigate:
 *  - Internal routes: emit a pre-navigate event so the root can run
 *    the black → splash → page sequence *before* pushState.
 *  - External routes: open in new tab, but still ping a UI click so SFX plays.
 */
function navigate(url: string) {
  try {
    const u = new URL(url, window.location.origin);
    const internal =
      url.startsWith("/") ||
      u.origin === window.location.origin ||
      u.hostname.endsWith("kabuto.studio");

    // trigger click sfx for any navigation request
    window.dispatchEvent(new CustomEvent("kabuto:ui-click"));

    if (internal) {
      const nextPath = u.pathname || "/";
      window.dispatchEvent(
        new CustomEvent("kabuto:pre-navigate", { detail: { nextPath } }),
      );
    } else {
      window.open(u.toString(), "_blank", "noopener,noreferrer");
    }
  } catch {
    window.location.href = url;
  }
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Root Desktop (/)                                                         │
   ╰──────────────────────────────────────────────────────────────────────────╯ */

const ICON_VISITOR_LABEL = "/assets/kabuto/portfolio/photo.png";

function NotepadWindow({ onClose }: { onClose: () => void }): JSX.Element {
  const bevelUp = {
    borderTop: "1px solid #fff",
    borderLeft: "1px solid #fff",
    borderRight: "1px solid #404040",
    borderBottom: "1px solid #404040",
  } as React.CSSProperties;
  const bevelDown = {
    borderTop: "1px solid #808080",
    borderLeft: "1px solid #808080",
    borderRight: "1px solid #fff",
    borderBottom: "1px solid #fff",
  } as React.CSSProperties;

  const [pos, setPos] = React.useState<{ x: number; y: number }>(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    return { x: Math.max(8, (w - 520) / 2), y: 80 };
  });
  const dragRef = React.useRef<HTMLDivElement | null>(null);
  const dragging = React.useRef<{ ox: number; oy: number } | null>(null);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos(() => ({
        x: Math.max(0, e.clientX - dragging.current!.ox),
        y: Math.max(0, e.clientY - dragging.current!.oy),
      }));
    };
    const onUp = () => (dragging.current = null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    dragging.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/30" onMouseDown={() => {}}>
      <div
        className="bg-[#c0c0c0] fixed"
        style={{ ...bevelDown, width: 520, left: pos.x, top: pos.y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          ref={dragRef}
          onMouseDown={startDrag}
          className="h-7 flex items-center justify-between px-2 select-none"
          style={{ background: "#000080", borderBottom: "1px solid #000040", color: "#fff" }}
        >
          <div className="text-[12px]">Notepad - contact.txt</div>
          <button
            onClick={onClose}
            className="h-5 w-5 grid place-items-center text-black bg-[#c0c0c0]"
            style={{ ...bevelUp, lineHeight: "1" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          className="px-2 py-1 text-[12px]"
          style={{ background: "#dfdfdf", borderBottom: "1px solid #a0a0a0" }}
        >
          <span className="mr-4">File</span>
          <span className="mr-4">Edit</span>
          <span className="mr-4">Format</span>
          <span className="mr-4">View</span>
          <span>Help</span>
        </div>

        <div className="relative" style={{ background: "#ffffff", minHeight: 160 }}>
          <img
            src={NOTEPAD_CHROME}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.10] pointer-events-none select-none"
          />
          <div className="relative p-3 text-[13px] leading-6 text-black">
            <div>
              contact –{" "}
              <a href="mailto:contact@kabuto.studio" className="text-[#0645ad] underline">
                contact@kabuto.studio
              </a>
            </div>
            <div>discord: kabuto.</div>
            <div>
              IG –{" "}
              <a
                href="https://instagram.com/kbt2k"
                target="_blank"
                rel="noreferrer"
                className="text-[#0645ad] underline"
              >
                kbt2k
              </a>
            </div>
          </div>
        </div>

        <div
          className="h-6 px-2 text-[12px] flex items-center"
          style={{ background: "#dfdfdf", borderTop: "1px solid #a0a0a0", color: "#404040" }}
        >
          Ready
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────── Win95 Portfolio window ──────────────────────────────── */
function PortfolioWin95Window({
  items,
  onClose,
}: {
  items: { type: "image" | "video"; src: string }[];
  onClose: () => void;
}) {
  const bevelUp: React.CSSProperties = {
    borderTop: "1px solid #fff",
    borderLeft: "1px solid #fff",
    borderRight: "1px solid #404040",
    borderBottom: "1px solid #404040",
  };
  const bevelDown: React.CSSProperties = {
    borderTop: "1px solid #808080",
    borderLeft: "1px solid #808080",
    borderRight: "1px solid #fff",
    borderBottom: "1px solid #fff",
  };

  const [viewer, setViewer] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (viewer === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowLeft")
        setViewer((v) => ((v ?? 0) + items.length - 1) % items.length);
      if (e.key === "ArrowRight")
        setViewer((v) => ((v ?? 0) + 1) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, items.length]);

  return (
    <div className="fixed inset-0 z-[210] bg-black">
      <div
        className="absolute inset-0 bg-[#c0c0c0] grid grid-rows-[28px_26px_auto_24px]"
        style={{ ...bevelDown }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-2 select-none"
          style={{ background: "#000080", borderBottom: "1px solid #000040", color: "#fff", height: 28 }}
        >
          <div className="text-[12px]">My Work</div>
          <button
            onClick={onClose}
            className="h-5 w-5 grid place-items-center text-black bg-[#c0c0c0]"
            style={{ ...bevelUp, lineHeight: "1" }}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        <div
          className="px-2 py-1 text-[12px] flex items-center gap-3"
          style={{ background: "#dfdfdf", borderBottom: "1px solid #a0a0a0", color: "#000", height: 26 }}
        >
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Help</span>
        </div>

        <div className="h-[calc(100vh-28px-26px-24px)] overflow-auto bg-[#d0d0d0]">
          <div className="mx-auto px-3 max-w-[1600px]">
            <div
              className="flex flex-wrap justify-center content-start items-start gap-4"
              style={{ ["--tileH" as any]: "clamp(120px, 22vh, 220px)" }}
            >
              {items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setViewer(i)}
                  className="p-0 m-0 bg-transparent border-0"
                  style={{ lineHeight: 0 }}
                  title={`work ${i + 1}`}
                >
                  {it.type === "image" ? (
                    <img
                      src={it.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{
                        height: "var(--tileH)",
                        width: "auto",
                        display: "block",
                        objectFit: "contain",
                        verticalAlign: "top",
                      }}
                    />
                  ) : (
                    <video
                      src={it.src}
                      muted
                      autoPlay
                      loop
                      playsInline
                      style={{
                        height: "var(--tileH)",
                        width: "auto",
                        display: "block",
                        objectFit: "contain",
                        verticalAlign: "top",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="px-2 text-[12px] flex items-center justify-between"
          style={{ background: "#dfdfdf", borderTop: "1px solid #a0a0a0", color: "#404040", height: 24 }}
        >
          <span>Ready</span>
          <span>Items: {items.length}</span>
        </div>
      </div>

      {viewer !== null && (
        <div className="fixed inset-0 z-[220] bg-black/90 grid place-items-center">
          <button
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-12 w-12 rounded bg-white/10 text-white text-2xl"
            onClick={() =>
              setViewer((v) => ((v ?? 0) + items.length - 1) % items.length)
            }
            title="Previous"
          >
            ‹
          </button>
          <button
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-12 w-12 rounded bg-white/10 text-white text-2xl"
            onClick={() => setViewer((v) => ((v ?? 0) + 1) % items.length)}
            title="Next"
          >
            ›
          </button>
          <button
            className="absolute right-4 md:right-6 top-4 md:top-6 h-9 px-3 rounded bg-white/10 text-white"
            onClick={() => setViewer(null)}
            title="Close"
          >
            Close
          </button>

          <div className="max-w-[94vw] max-h-[88vh]">
            {items[viewer].type === "image" ? (
              <img
                src={items[viewer].src}
                alt=""
                className="max-w-[94vw] max-h-[88vh] object-contain"
              />
            ) : (
              <video
                src={items[viewer].src}
                className="max-w-[94vw] max-h-[88vh] object-contain"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- single, canonical IPadOverlay (used by PortfolioPage) ---
const IPadOverlay: React.FC<{
  kind: "portfolio" | "rates" | "contact";
  visible: boolean;
  onClose: () => void;
}> = ({ kind, visible, onClose }) => {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[215]"
      style={{
        background: visible ? "rgba(0,0,0,.85)" : "rgba(0,0,0,0)",
        transition: "background .35s ease",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "min(6vh, 32px) min(3vw, 24px)",
      }}
      aria-hidden={!visible}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative"
        style={{
          width: "min(900px, 92vw)",
          aspectRatio: "3/2",
          filter: "drop-shadow(0 20px 60px rgba(0,0,0,.6))",
          // slide from offscreen bottom
          transform: `translateY(${visible ? "0%" : "120%"}) scale(${
            visible ? 1 : 0.98
          })`,
          opacity: visible ? 1 : 0,
          transition:
            "transform .55s cubic-bezier(.22,1,.36,1), opacity .35s ease",
        }}
      >
        {/* iPad chrome */}
        <img
          src={PF_IPAD}
          alt="iPad frame"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
          draggable={false}
        />

        {/* screen contents */}
        <div
          className="absolute inset-[6%]"
          style={{
            background: "#101410",
            borderRadius: 18,
            overflow: "hidden",
            display: "grid",
            gridTemplateRows: "40px 1fr",
            border: "1px solid rgba(215,230,182,.15)",
          }}
        >
          <div
            className="flex items-center justify-between px-3"
            style={{
              background: "#1b231b",
              color: "#d7e6b6",
              borderBottom: "1px solid rgba(215,230,182,.12)",
            }}
          >
            <div className="text-sm tracking-wide">
              {kind === "rates"
                ? "Editing rates"
                : kind === "contact"
                ? "Contact"
                : "My Work"}
            </div>
            <button
              onClick={onClose}
              className="h-7 px-3 rounded text-sm"
              style={{ background: "#2b352a", border: "1px solid #445241" }}
              title="Close"
            >
              Close
            </button>
          </div>

          <div className="p-3 overflow-auto text-sm">
            {kind === "rates" && (
              <div className="space-y-3">
                <p className="opacity-85">
                  Full price list lives on{" "}
                  <a
                    href="/commissions"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/commissions");
                    }}
                    className="underline"
                  >
                    /commissions
                  </a>
                  .
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded border border-[#445241] p-2">
                    <div className="text-[var(--accent)] font-medium mb-1">
                      Short-form
                    </div>
                    <div className="text-xs opacity-85">
                      ≤30s £25 • 31–60s £35 • 61–120s £50
                    </div>
                  </div>
                  <div className="rounded border border-[#445241] p-2">
                    <div className="text-[var(--accent)] font-medium mb-1">
                      YouTube
                    </div>
                    <div className="text-xs opacity-85">
                      ≤6m £80 • 6–12m £120 • 12–20m £170
                    </div>
                  </div>
                </div>
              </div>
            )}

            {kind === "contact" && (
              <div className="space-y-2">
                <div>
                  email —{" "}
                  <a className="underline" href="mailto:contact@kabuto.studio">
                    contact@kabuto.studio
                  </a>
                </div>
                <div>discord — kabuto.</div>
                <div>
                  IG —{" "}
                  <a
                    className="underline"
                    href="https://instagram.com/kbt2k"
                    target="_blank"
                    rel="noreferrer"
                  >
                    kbt2k
                  </a>
                </div>
              </div>
            )}

            {kind === "portfolio" && (
              <div className="space-y-3">
                <p className="opacity-85">
                  Tap <strong>Open “My Work”</strong> to view the full Win95
                  gallery.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    // optional: setPfWinOpen(true); // hook from PortfolioPage if desired
                  }}
                  className="rounded px-3 py-2"
                  style={{ background: "#2b352a", border: "1px solid #445241" }}
                >
                  Open “My Work”
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────────── end window ──────────────────────────── */

function useCursorTrail(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      for (let i = 0; i < 10; i++) {
        const el = document.getElementById(`ktrail-${i}`) as HTMLElement | null;
        if (el) el.style.opacity = "0";
      }
      return;
    }

    const els: (HTMLElement | null)[] = Array.from({ length: 10 }, (_, i) => document.getElementById(`ktrail-${i}`) as HTMLElement | null);

    let head = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pts = Array.from({ length: 10 }, () => ({ x: head.x, y: head.y }));
    let lastMove = Date.now();
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      head.x = e.clientX;
      head.y = e.clientY;
      lastMove = Date.now();
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      // lead point eases toward cursor
      pts[0].x += (head.x - pts[0].x) * 0.25;
      pts[0].y += (head.y - pts[0].y) * 0.25;

      // followers ease toward the previous point
      for (let i = 1; i < pts.length; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.25;
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.25; // fixed
      }

      const idle = Date.now() - lastMove > 1200;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        const p = pts[i];
        el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        const base = 0.65 - i * 0.05;
        el.style.opacity = idle ? "0" : String(Math.max(0, base));
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [enabled]);
}

function RootDesktopPage() {
  const [contactOpen, setContactOpen] = useState(false);

  usePreloadImages([
    ROOT_WALL,
    ICON_PORTFOLIO,
    ICON_LAB,
    ICON_IRL,
    ICON_CONTACT,
    ICON_VISITOR_LABEL,
    NOTEPAD_CHROME,
  ]);

  const icons = [
    { x: "18vw", y: "18vh", label: "Design portfolio", icon: ICON_PORTFOLIO, onOpen: () => navigate("/portfolio") },
    { x: "26vw", y: "26vh", label: "Lab // blog", icon: ICON_LAB, onOpen: () => navigate("/lab") },
    { x: "34vw", y: "20vh", label: "buy cool stuff IRL", icon: ICON_IRL, onOpen: () => window.open("https://wnacry.com", "_blank", "noopener,noreferrer") },
    { x: "42vw", y: "26vh", label: "contact info", icon: ICON_CONTACT, onOpen: () => setContactOpen(true) },
  ];

  const [cacheBust] = useState(() => String(Date.now()));

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#2c3528" }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${ROOT_WALL}")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          zIndex: 1,
        }}
      />

      {icons.map((it, i) => (
        <button
          key={i}
          onClick={it.onOpen}
          className="group absolute"
          style={{
            left: it.x,
            top: it.y,
            zIndex: 3,
            filter:
              "drop-shadow(0 2px 6px rgba(0,0,0,.55)) drop-shadow(0 10px 24px rgba(0,0,0,.25))",
          }}
          title={it.label}
        >
          <img src={it.icon} alt="" className="h-20 w-20 object-contain" loading="eager" decoding="async" />
          <div className="mt-1 text-center text-[13px] leading-4">
            <span className="inline-block px-1.5 py-[3px] rounded-sm bg-black/40 text-white shadow-[0_0_0_1px_rgba(255,255,255,.15)]">
              {it.label}
            </span>
          </div>
        </button>
      ))}

      <div
        className="absolute flex items-end gap-2"
        style={{ right: "2vw", bottom: "12vh", zIndex: 3 }}
      >
        <div className="flex flex-col items-center">
          <img
            src={ICON_VISITOR_LABEL}
            alt=""
            className="h-20 w-20 object-contain"
            loading="eager"
            decoding="async"
          />
        </div>

        <img
          src={`${COUNTER_SRC}&t=${cacheBust}`}
          alt="site hit counter"
          className="h-20"
          loading="eager"
          decoding="async"
        />
      </div>

      {contactOpen && <NotepadWindow onClose={() => setContactOpen(false)} />}
    </div>
  );
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Portfolio Desktop (/portfolio)                                           │
   ╰──────────────────────────────────────────────────────────────────────────╯ */

/* ─────────────────────────────── Portfolio (CS scene) ─────────────────────────────── */

function useStageAnchor() {
  const [m, setM] = React.useState({ scale: 1, ox: 0, oy: 0 });
  React.useEffect(() => {
    const recalc = () => {
      const vw = window.innerWidth,
        vh = window.innerHeight;
      const s = Math.max(vw / 1920, vh / 1080);
      const rw = 1920 * s,
        rh = 1080 * s;
      setM({ scale: s, ox: (vw - rw) / 2, oy: (vh - rh) / 2 });
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);
  return m;
}

type Person = {
  key: "rates" | "portfolio" | "contact";
  src: string;
  onClick: () => void;
};
function useAlphaHover(
  persons: Person[],
  anchor: { scale: number; ox: number; oy: number },
) {
  const canv = React.useRef<Record<string, CanvasRenderingContext2D | null>>({});
  const [hover, setHover] = React.useState<string | null>(null);

  React.useEffect(() => {
    persons.forEach((p) => {
      if (canv.current[p.key]) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = p.src;
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 1920;
        c.height = 1080;
        const cx = c.getContext("2d", { willReadFrequently: true });
        cx?.drawImage(img, 0, 0, 1920, 1080);
        canv.current[p.key] = cx;
      };
    });
  }, [persons]);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX - anchor.ox) / anchor.scale;
      const y = (e.clientY - anchor.oy) / anchor.scale;
      if (x < 0 || y < 0 || x >= 1920 || y >= 1080) {
        setHover(null);
        return;
      }
      let hit: string | null = null;
      for (const p of persons) {
        const cx = canv.current[p.key];
        if (!cx) continue;
        const a = cx.getImageData(x | 0, y | 0, 1, 1).data[3];
        if (a > 10) {
          hit = p.key;
          break;
        }
      }
      setHover(hit);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [persons, anchor]);

  return hover;
}

function PortfolioPage(): JSX.Element {
  // ---------- SFX ----------
  const fireRef = React.useRef<HTMLAudioElement | null>(null);
  React.useEffect(() => {
    const a = new Audio("/sfx/fire.mp3");
    a.preload = "auto";
    a.volume = 0.25;
    fireRef.current = a;
  }, []);
  const fire = React.useCallback(() => {
    try {
      if (fireRef.current) {
        fireRef.current.currentTime = 0;
        void fireRef.current.play();
      }
    } catch {}
  }, []);

  // ---------- Preload scene ----------
  usePreloadImages([
    "/assets/kabuto/portfolio/BG.png",
    "/assets/kabuto/portfolio/overlay.png",
    "/assets/kabuto/portfolio/person01.png",
    "/assets/kabuto/portfolio/person02.png",
    "/assets/kabuto/portfolio/person03.png",
    "/assets/kabuto/portfolio/ipad.png",
    PF_VIEWMODEL,
  ]);

  // ---------- Stage sizing ----------
  const m = useStageAnchor();

  // ---------- Viewmodel sway ----------
  const [mouse, setMouse] = React.useState({ x: 0.5, y: 0.5 });
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      setMouse({ x: e.clientX / w, y: e.clientY / h });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  const gunTX = (mouse.x - 0.5) * 32;
  const gunTY = (mouse.y - 0.5) * 18;

  // ---------- iPad overlay state ----------
  const [pad, setPad] = React.useState<null | "portfolio" | "rates" | "contact">(null);
  const [padVisible, setPadVisible] = React.useState(false);
  const [gunDown, setGunDown] = React.useState(false);
  const anim = React.useRef(false);

  const openPad = async (kind: "portfolio" | "rates" | "contact") => {
    if (anim.current) return;
    anim.current = true;
    fire();
    setGunDown(true);
    await new Promise((r) => setTimeout(r, 380)); // bring gun down first
    setPad(kind);
    await new Promise((r) => setTimeout(r, 20)); // mount iPad
    setPadVisible(true);
    await new Promise((r) => setTimeout(r, 420)); // let the fade/slide finish
    anim.current = false;
  };

  const closePad = React.useCallback(async () => {
    if (!pad) return;
    setPadVisible(false);
    await new Promise((r) => setTimeout(r, 250)); // exit anim
    setPad(null);
    setGunDown(false); // return the gun
  }, [pad]);

  // ---------- Hit-test on people ----------
  const persons = React.useMemo(
    () => [
      { key: "rates" as const, src: "/assets/kabuto/portfolio/person01.png", onClick: () => openPad("rates") },
      { key: "portfolio" as const, src: "/assets/kabuto/portfolio/person02.png", onClick: () => { fire(); setPfWinOpen(true); } },
      { key: "contact" as const, src: "/assets/kabuto/portfolio/person03.png", onClick: () => openPad("contact") },
    ],
    [openPad, fire],
  );
  const hover = useAlphaHover(
    persons.map((p) => ({ key: p.key, src: p.src, onClick: p.onClick })),
    m,
  );

  // ---------- Portfolio items for Win95 window ----------
  const [pfWinOpen, setPfWinOpen] = React.useState(false);
  const [pfItems, setPfItems] = React.useState<PortfolioItem[]>(() =>
    loadPortfolio().filter((p) => p.published),
  );
  React.useEffect(() => {
    const onChange = (e: any) => {
      if (e.detail?.type === "portfolio") {
        setPfItems(loadPortfolio().filter((p) => p.published));
      }
    };
    window.addEventListener("kabuto:data", onChange as any);
    return () => window.removeEventListener("kabuto:data", onChange as any);
  }, []);

  // ---------- Render ----------
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#000" }}>
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transform: `translate(${m.ox}px, ${m.oy}px) scale(${m.scale})`,
          transformOrigin: "top left",
          zIndex: 1,
        }}
      >
        {/* Background */}
        <img
          src="/assets/kabuto/portfolio/BG.png"
          alt=""
          draggable={false}
          className="absolute left-0 top-0"
          style={{ width: 1920, height: 1080 }}
        />

        {/* People layers with hover scale */}
        {persons.map((p) => (
          <img
            key={p.key}
            src={p.src}
            alt=""
            draggable={false}
            className="absolute left-0 top-0 pointer-events-none"
            style={{
              width: 1920,
              height: 1080,
              zIndex: 2,
              transform: hover === p.key ? "scale(1.025)" : "scale(1)",
              transformOrigin: "center bottom",
              transition: "transform 140ms ease",
              filter: "drop-shadow(0 2px 12px rgba(0,0,0,.45))",
            }}
          />
        ))}

        {/* Overlay */}
        <img
          src="/assets/kabuto/portfolio/overlay.png"
          alt=""
          className="absolute left-0 top-0 pointer-events-none"
          style={{ width: 1920, height: 1080, zIndex: 3 }}
        />

        {/* Click catcher */}
        <button
          aria-label={hover ?? "scene"}
          onClick={() => {
            const target = persons.find((p) => p.key === hover);
            if (target) target.onClick();
          }}
          className="absolute left-0 top-0"
          style={{
            width: 1920,
            height: 1080,
            zIndex: 4,
            background: "transparent",
            border: "none",
          }}
        />
      </div>

      {/* Viewmodel gun */}
      <img
        src={PF_VIEWMODEL}
        alt=""
        className="absolute pointer-events-none"
        style={{
          right: "-26px",
          bottom: "-22px",
          width: "600px",
          maxWidth: "52vw",
          transform: `translate(${gunTX}px, ${gunTY + (gunDown ? 520 : 0)}px)`,
          transition: "transform 120ms linear",
          willChange: "transform",
          filter: "drop-shadow(0 0 12px rgba(0,0,0,.45))",
          objectFit: "contain",
          zIndex: 4,
        }}
      />

      {/* Win95 gallery (middle person) */}
      {pfWinOpen && (
        <PortfolioWin95Window
          items={pfItems.map((p) =>
            p.type === "image"
              ? { type: "image" as const, src: p.url }
              : { type: "video" as const, src: p.url },
          )}
          onClose={() => setPfWinOpen(false)}
        />
      )}

      {/* iPad overlay (left/right people) */}
      {pad && (
        <IPadOverlay kind={pad} visible={padVisible} onClose={closePad} />
      )}
    </div>
  );
}

/* ===================== iPad contents (portfolio LIVE) ===================== */

function ClassicTaskbar() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const bevelUp = {
    borderTop: "1px solid #fff",
    borderLeft: "1px solid #fff",
    borderRight: "1px solid #404040",
    borderBottom: "1px solid #404040",
  };
  const bevelDown = {
    borderTop: "1px solid #808080",
    borderLeft: "1px solid #808080",
    borderRight: "1px solid #fff",
    borderBottom: "1px solid #fff",
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 h-10 flex items-center px-2"
      style={{
        background: "#c0c0c0",
        zIndex: 120,
        ...bevelDown,
        boxShadow: "inset 0 1px 0 #dfdfdf, inset 0 -1px 0 #808080",
      }}
    >
      <button
        onClick={() => navigate("/")}
        className="h-7 px-3 flex items-center gap-2 text-black"
        style={{
          background: "#c0c0c0",
          ...bevelUp,
          boxShadow: "inset -1px -1px #808080, inset 1px 1px #ffffff",
        }}
        title="Start"
      >
        <img src={PF_START} className="h-4 w-4" alt="" />
        <span className="text-[12px] font-bold tracking-wide">kabuto</span>
      </button>

      <div
        className="ml-auto text-[12px] bg-white/70 px-2 py-1 border border-[#7b7b7b] min-w-[64px] text-right"
        style={{ color: "#000" }}
      >
        {time}
      </div>
    </div>
  );
}

function TaskbarPortal({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  if (!host) return null;
  return createPortal(children, host);
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Blog + BlogPost                                                          │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function BlogPage() {
  const posts = useMemo(
    () =>
      loadPosts()
        .filter((p) => p.published)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [],
  );
  return (
    <PageShell title="Blog">
      {posts.length === 0 ? (
        <div className="text-sm opacity-70">No posts yet.</div>
      ) : (
        <div className="grid gap-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="rounded-[6px] border border-[#4a5a45] bg-[#3a4538] p-3"
            >
              <div className="flex items-center justify-between">
                <a
                  className="text-[var(--accent)] hover:underline"
                  href={`/blog/${p.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/blog/${p.slug}`);
                  }}
                >
                  {p.title}
                </a>
                <span className="text-xs opacity-70">{p.date}</span>
              </div>
              {p.summary && (
                <p className="mt-1 text-xs opacity-80">{p.summary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function BlogPostPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => {
    const p = loadPosts().find((p) => p.slug === slug && p.published);
    setPost(p || null);
    if (p) {
      document.title = `kabuto — ${p.title}`;
      const meta =
        (document.querySelector(
          'meta[name="description"]',
        ) as HTMLMetaElement) ||
        document.head.appendChild(
          Object.assign(document.createElement("meta"), {
            name: "description",
          }),
        );
      meta.setAttribute("content", p.summary || p.title);
    }
  }, [slug]);
  return (
    <PageShell title={post ? post.title : "Not found"}>
      {!post ? (
        <div className="text-sm opacity-70">
          This post doesn't exist or is unpublished.
        </div>
      ) : (
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: mdToHtml(post.content) }}
        />
      )}
    </PageShell>
  );
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Placement helpers                                                         │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function placementTierLabel(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (/^\s*1(st)?\s*$/.test(s) || /champ/i.test(s)) return "Champion (1st)";
  if (/^\s*2(nd)?\s*$/.test(s) || /final/i.test(s)) return "Finalist (2nd)";
  if (/^\s*3(rd)?\s*$/.test(s) || /bronze/i.test(s)) return "Podium (3rd)";
  const m = s.match(/(\d+)\s*(?:\/|of)\s*(\d+)/i);
  if (m) {
    const place = parseInt(m[1], 10),
      field = parseInt(m[2], 10);
    const tops = [8, 12, 16, 32, 64, 128, 256];
    for (const N of tops) if (place <= N && field >= N) return `Top ${N}`;
    if (place <= 8) return "Top 8";
    if (place <= 16) return "Top 16";
    if (place <= 32) return "Top 32";
    if (place <= 64) return "Top 64";
    if (place <= 128) return "Top 128";
    return "Participant";
  }
  const t = s.match(/top\s*([0-9]+)/i);
  if (t) return `Top ${parseInt(t[1], 10)}`;
  return null;
}
function placementColor(tier: string | null): string {
  if (!tier) return "#2a3b2f";
  if (tier.startsWith("Champion")) return "#f5d142";
  if (tier.startsWith("Finalist")) return "#cfd8dc";
  if (tier.startsWith("Podium")) return "#d7a86e";
  if (tier.includes("Top 8")) return "#4ade80";
  if (tier.includes("Top 12")) return "#86efac";
  if (tier.includes("Top 16")) return "#a7f3d0";
  if (tier.includes("Top 32")) return "#60a5fa";
  if (tier.includes("Top 64")) return "#93c5fd";
  if (tier.includes("Top 128")) return "#a5b4fc";
  return "#33443a";
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ E-Sports                                                                  │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function EsportsPage() {
  function dateToNum(d: string | undefined): number {
    if (!d) return 0;
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = parseInt(m[1], 10),
        mo = parseInt(m[2], 10) - 1,
        da = parseInt(m[3], 10);
      return new Date(y, mo, da).getTime();
    }
    const t = Date.parse(d);
    return isNaN(t) ? 0 : t;
  }
  const [rows, setRows] = React.useState<EventRow[]>([]);
  React.useEffect(() => {
    const load = () => setRows(loadEvents());
    load();
    const onChange = (e: any) => {
      if (e.detail?.type === "events") load();
    };
    window.addEventListener("kabuto:data", onChange as any);
    return () => window.removeEventListener("kabuto:data", onChange as any);
  }, []);
  usePreloadImages([...RIGHT_STACK_IMAGES]);

  type RowAny = EventRow & { published?: boolean };
  const visibleSorted: RowAny[] = React.useMemo(() => {
    const vis = (rows as RowAny[]).filter((r) => r.published !== false);
    return vis.sort((a, b) => dateToNum(b.date) - dateToNum(a.date));
  }, [rows]);

  return (
    <PageShell title="E-Sports">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Panel title="Gear list" rightTag="kit.v1">
            <SpecList
              specs={{
                mouse: "Intellimouse Optical 1.1A",
                keyboard: "HHKB Professional Classic",
                monitor: "BenQ XL2720Z",
                headset: "Sennheiser HD598",
                pad: "SkyPAD 3.0 Yuki-Aim",
              }}
            />
          </Panel>
          <Panel title="Bio" rightTag="player.txt">
            <div className="text-sm opacity-80 space-y-3 leading-relaxed">
              <p>
                My E-sports journey started young — my dad played CS 1.6 and
                Source in ESEA and CAP. I played Team Fortress 2 competitively
                and attended 3 LANs. I switched to Apex Legends in 2019, and
                played Super Smash Bros. Ultimate from 2020–2023. I took a big
                hiatus and now I’m pursuing: Apex Legends, CS2, Tekken 8, and
                SF6.
              </p>
            </div>
          </Panel>
          <Panel title="Current Ranks" rightTag="mmr.v1">
            <SpecList
              specs={{
                "Apex Legends": "Master",
                CS2: "Premier 18,000",
                "Tekken 8": "Tekken Emperor",
                "Street Fighter 6": "Master",
              }}
            />
          </Panel>
          <Panel title="Events & placements" rightTag={`${visibleSorted.length}`}>
            {visibleSorted.length === 0 ? (
              <div className="text-sm opacity-70">No entries yet.</div>
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
                      <th className="px-2 py-2 text-left">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSorted.map((r) => {
                      const tier = placementTierLabel(r.placement);
                      const bg = placementColor(tier);
                      return (
                        <tr key={r.id} className="border-t border-[#2a3328]">
                          <td className="px-2 py-2">{r.game}</td>
                          <td className="px-2 py-2">{r.date}</td>
                          <td className="px-2 py-2">{r.location}</td>
                          <td className="px-2 py-2">{r.event}</td>
                          <td className="px-2 py-2">{r.placement}</td>
                          <td className="px-2 py-2">
                            <span
                              className="inline-block px-2 py-0.5 rounded-[4px]"
                              style={{ background: bg, color: "#132016" }}
                              title={tier || ""}
                            >
                              {tier || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          {RIGHT_STACK_IMAGES.map((src, i) => (
            <div
              key={i}
              className="rounded-[6px] border border-[#4a5a45] overflow-hidden"
            >
              <img
                src={src}
                alt={`sidebar art ${i + 1}`}
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Commissions                                                               │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function CommissionsPage() {
  usePreloadImages(RATES_THUMBS);
  type PriceItem = {
    name: string;
    price: string;
    note?: string;
    includes?: string[];
  };
  type PriceGroup = { title: string; items: PriceItem[] };
  const pricing: PriceGroup[] = [
    {
      title: "Short-form (9:16 / 1:1)",
      items: [
        { name: "≤ 30s", price: "£25 / 24–48h" },
        { name: "31–60s", price: "£35 / 24–48h" },
        { name: "61–120s", price: "£50 / 48–72h" },
      ],
    },
    {
      title: "YouTube (16:9)",
      items: [
        { name: "≤ 6 min", price: "£80 / 2–4d" },
        { name: "6–12 min", price: "£120 / 3–5d" },
        { name: "12–20 min", price: "£170 / 5–7d" },
      ],
    },
    {
      title: "Thumbnails & metadata",
      items: [
        { name: "Thumbnail design", price: "£20" },
        { name: "Title & tags research", price: "£10" },
        { name: "Bundle (thumb + copy)", price: "£25" },
      ],
    },
    {
      title: "IRL assistance (London)",
      items: [
        { name: "Camera op / runner", price: "£120 / 4h • £220 / 8h" },
        { name: "Live producing / OBS", price: "£160 / 4h • £280 / 8h" },
        { name: "Kit (mics, lights)", price: "£20–40 / session" },
      ],
    },
  ];

  return (
    <PageShell title="Editing rates">
      <Panel title="About my editing" rightTag="@100k+ audience">
        <p className="text-sm opacity-85 leading-relaxed">
          I manage and edit for creators and brands across YouTube, TikTok and
          IG — over <strong>100k followers</strong> across my managed socials. I
          focus on hooks, pacing, on-beat cuts, clean captions and consistent
          packaging (titles, thumbnails, metadata).
        </p>
        <p className="mt-2 text-center text-sm opacity-85">
          please contact me if you wish to work together —{" "}
          <a href="mailto:contact@kabuto.studio" className="underline">
            contact@kabuto.studio
          </a>
        </p>
      </Panel>

      <Panel title="Example thumbnails" rightTag={`x${RATES_THUMBS.length}`}>
        <div className="grid gap-3 sm:grid-cols-3">
          {RATES_THUMBS.map((src, i) => (
            <div
              key={i}
              className="rounded-[6px] border border-[#4a5a45] overflow-hidden aspect-video bg-[#2f3a2d]"
            >
              <img
                src={src}
                alt={`thumb ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Price list" rightTag="GBP">
        <div className="grid gap-3 md:grid-cols-2">
          {pricing.map((group, gi) => (
            <div
              key={gi}
              className="rounded-[6px] border border-[#4a5a45] bg-[#3a4538]"
            >
              <div className="px-2.5 py-1.5 border-b border-[#4a5a45] text-[13px] text-[var(--accent)]">
                {group.title}
              </div>
              <div className="p-2.5">
                <div className="grid gap-1">
                  {group.items.map((it, ii) => (
                    <div
                      key={ii}
                      className="grid grid-cols-[1fr_auto] gap-x-3 items-start border-b border-dashed border-[#2a3328] pb-1.5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] leading-tight">
                          {it.name}
                        </div>
                        {it.note && (
                          <div className="text-[10px] opacity-70 leading-tight">
                            {it.note}
                          </div>
                        )}
                        {it.includes && (
                          <ul className="mt-1 list-disc pl-4 text-[11px] opacity-80 space-y-0.5">
                            {it.includes.map((inc, k) => (
                              <li key={k}>{inc}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-[var(--accent)] text-[13px] leading-tight whitespace-nowrap">
                        {it.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}

/* ───────── Upload queue visibility (shared) ───────── */
type PendingUpload = {
  id: string;
  filename: string;
  bucket: "blog" | "portfolio";
  status: "pending" | "done" | "error";
};

function usePendingUploads() {
  const [list, setList] = React.useState<PendingUpload[]>([]);

  React.useEffect(() => {
    const addLocalBegin = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (!d?.id) return;
      setList((L) => [
        {
          id: d.id,
          filename: d.filename || d.id,
          bucket: d.bucket || "portfolio",
          status: "pending",
        },
        ...L,
      ]);
    };

    const onSW = (e: MessageEvent) => {
      const { type, payload } = (e.data || {}) as any;
      if (!payload?.id) return;

      if (type === "cache-put-ok") {
        setList((L) =>
          L.map((x) => (x.id === payload.id ? { ...x, status: "done" } : x)),
        );
        // remove a little after success
        setTimeout(() => {
          setList((L) => L.filter((x) => x.id !== payload.id));
        }, 1200);
      } else if (type === "cache-put-error") {
        setList((L) =>
          L.map((x) => (x.id === payload.id ? { ...x, status: "error" } : x)),
        );
      } else if (type === "cache-put-begin") {
        // supported by your newer sw.js; harmless if not sent
        setList((L) => {
          if (L.some((x) => x.id === payload.id)) return L;
          return [
            {
              id: payload.id,
              filename: payload.filename || payload.id,
              bucket: payload.bucket || "portfolio",
              status: "pending",
            },
            ...L,
          ];
        });
      }
    };

    window.addEventListener("kabuto:upload-begin", addLocalBegin as any);
    navigator.serviceWorker?.addEventListener("message", onSW);

    const beforeUnload = (ev: BeforeUnloadEvent) => {
      if (list.some((x) => x.status === "pending")) {
        ev.preventDefault();
        ev.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener(
        "kabuto:upload-begin",
        addLocalBegin as any,
      );
      navigator.serviceWorker?.removeEventListener("message", onSW);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [list]);

  return {
    list,
    anyPending: list.some((x) => x.status === "pending"),
  };
}

function UploadStatusBar({ list }: { list: PendingUpload[] }) {
  const pending = list.filter((x) => x.status === "pending");
  const done = list.filter((x) => x.status === "done");
  const errored = list.filter((x) => x.status === "error");
  const safe = list.length === 0;

  return (
    <div
      className="fixed left-3 bottom-[52px] z-[9999] rounded-[6px] border px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,.35)]"
      style={{
        borderColor: safe ? "rgba(72,187,120,.45)" : "rgba(215,198,90,.45)",
        background:
          "linear-gradient(180deg, rgba(49,59,47,.96) 0%, rgba(41,50,39,.96) 100%)",
        color: "#e7f1d6",
        minWidth: 240,
      }}
    >
      <div className="flex items-center justify-between">
        <strong className="tracking-wide">
          {safe ? "All uploads saved" : "Saving uploads…"}
        </strong>
        <span style={{ opacity: 0.75 }}>
          {pending.length} pending
          {done.length ? ` • ${done.length} done` : ""}
          {errored.length ? ` • ${errored.length} error` : ""}
        </span>
      </div>

      {list.length > 0 && (
        <div className="mt-1 max-h-36 overflow-auto space-y-1">
          {list.slice(0, 6).map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background:
                    u.status === "pending"
                      ? "#d7c65a"
                      : u.status === "done"
                      ? "#48bb78"
                      : "#f87171",
                }}
              />
              <span className="truncate">
                {u.filename} <span style={{ opacity: 0.6 }}>({u.bucket})</span>
              </span>
            </div>
          ))}
          {list.length > 6 && (
            <div style={{ opacity: 0.6 }}>+{list.length - 6} more…</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Admin                                                                     │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function AdminPage() {
  const uploads = usePendingUploads();

  const [authed, setAuthed] = useState<boolean>(false);
  const [hasPass, setHasPass] = useState<boolean>(
    !!localStorage.getItem(ADMIN_HASH_KEY),
  );
  const [mode, setMode] = useState<"events" | "posts" | "portfolio">("events");

  async function handleSetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("pw") || "").trim();
    if (!pw) return;
    await setAdminPassword(pw);
    setHasPass(true);
    setAuthed(true);
  }
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("pw") || "").trim();
    if (await verifyAdminPassword(pw)) setAuthed(true);
    else alert("Wrong password");
  }

  if (!hasPass)
    return (
      <PageShell title="Admin – Set Password">
        <form onSubmit={handleSetPassword} className="grid gap-3 max-w-sm">
          <label className="text-sm">New password</label>
          <input
            name="pw"
            type="password"
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1 text-sm"
          />
          <button className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
            <Unlock className="h-4 w-4" /> Set password
          </button>
        </form>
      </PageShell>
    );

  if (!authed)
    return (
      <PageShell title="Admin – Login">
        <form onSubmit={handleLogin} className="grid gap-3 max-w-sm">
          <label className="text-sm">Password</label>
          <input
            name="pw"
            type="password"
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1 text-sm"
          />
          <button className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]">
            <Lock className="h-4 w-4" /> Login
          </button>
        </form>
      </PageShell>
    );

  return (
    <PageShell title="Admin">
      <UploadStatusBar list={uploads.list} />
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("events")}
          className={`rounded px-3 py-1 text-sm border ${
            mode === "events"
              ? "border-[var(--primary)] bg-[#404b3f]"
              : "border-[#4a5a45] bg-[#3a4538]"
          }`}
        >
          Events
        </button>
        <button
          onClick={() => setMode("posts")}
          className={`rounded px-3 py-1 text-sm border ${
            mode === "posts"
              ? "border-[var(--primary)] bg-[#404b3f]"
              : "border-[#4a5a45] bg-[#3a4538]"
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setMode("portfolio")}
          className={`rounded px-3 py-1 text-sm border ${
            mode === "portfolio"
              ? "border-[var(--primary)] bg-[#404b3f]"
              : "border-[#4a5a45] bg-[#3a4538]"
          }`}
        >
          Portfolio
        </button>
      </div>
      {mode === "events" ? (
        <AdminEvents />
      ) : mode === "posts" ? (
        <AdminPosts />
      ) : (
        <AdminPortfolio />
      )}
    </PageShell>
  );
}

function AdminEvents() {
  const [rows, setRows] = useState<EventRow[]>(() => loadEvents());
  const [draft, setDraft] = useState<EventRow>({
    id: "",
    game: "",
    date: "",
    location: "",
    event: "",
    placement: "",
    published: true,
  });
  function saveAll(next: EventRow[]) {
    setRows(next);
    saveEvents(next);
  }
  function addRow() {
    if (!draft.game || !draft.date) return alert("Game and date required");
    const row: EventRow = { ...draft, id: uid() };
    const next = [row, ...rows];
    setDraft({
      id: "",
      game: "",
      date: "",
      location: "",
      event: "",
      placement: "",
      published: true,
    });
    saveAll(next);
  }
  function delRow(id: string) {
    saveAll(rows.filter((r) => r.id !== id));
  }
  function updRow(id: string, patch: Partial<EventRow>) {
    saveAll(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  return (
    <div className="grid gap-4">
      <Panel title="Add event" rightTag="new">
        <div className="grid md:grid-cols-6 gap-2 text-xs">
          <input
            placeholder="Game"
            value={draft.game}
            onChange={(e) => setDraft({ ...draft, game: e.target.value })}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />
          <input
            placeholder="Date (YYYY-MM-DD)"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />
          <input
            placeholder="Location"
            value={draft.location}
            onChange={(e) =>
              setDraft({ ...draft, location: e.target.value })
            }
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />
          <input
            placeholder="Event"
            value={draft.event}
            onChange={(e) => setDraft({ ...draft, event: e.target.value })}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />
          <input
            placeholder="Placement (e.g., 12/128 or 1st)"
            value={draft.placement}
            onChange={(e) =>
              setDraft({ ...draft, placement: e.target.value })
            }
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />
          <label className="inline-flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) =>
                setDraft({ ...draft, published: e.target.checked })
              }
            />
            <span>Published</span>
          </label>
        </div>
        <div className="mt-2">
          <button
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]"
          >
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
                {rows
                  .slice()
                  .sort(
                    (a, b) =>
                      (new Date(b.date).getTime() || 0) -
                      (new Date(a.date).getTime() || 0),
                  )
                  .map((r) => (
                    <tr key={r.id} className="border-t border-[#2a3328]">
                      <td className="px-2 py-2">
                        <input
                          value={r.game}
                          onChange={(e) =>
                            updRow(r.id, { game: e.target.value })
                          }
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={r.date}
                          onChange={(e) =>
                            updRow(r.id, { date: e.target.value })
                          }
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={r.location}
                          onChange={(e) =>
                            updRow(r.id, { location: e.target.value })
                          }
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={r.event}
                          onChange={(e) =>
                            updRow(r.id, { event: e.target.value })
                          }
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={r.placement}
                          onChange={(e) =>
                            updRow(r.id, { placement: e.target.value })
                          }
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={r.published}
                            onChange={(e) =>
                              updRow(r.id, { published: e.target.checked })
                            }
                          />
                          <span className="opacity-70">
                            {r.published ? "Yes" : "No"}
                          </span>
                        </label>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => delRow(r.id)}
                          className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 hover:border-red-400"
                        >
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
      <div className="text-xs opacity-60">
        Tip: Use exact YYYY-MM-DD so sorting stays perfect.
      </div>
    </div>
  );
}

/* ───────────────────── Blog media uploads inside AdminPosts ───────────────────── */
type BlogMedia = { id: string; url: string; filename: string; mime: string };

function AdminPosts() {
  const [rows, setRows] = useState<Post[]>(() => loadPosts());
  const empty: Post = {
    id: "",
    slug: "",
    title: "",
    date: "",
    summary: "",
    content: "",
    published: false,
    updatedAt: Date.now(),
  };
  const [draft, setDraft] = useState<Post>(empty);

  // session-only list for quick inserts
  const [media, setMedia] = useState<BlogMedia[]>([]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const { type, payload } = (e.data || {}) as any;
      if (type === "cache-put-ok" && payload?.id && payload?.bucket === "blog") {
        // SW confirmation; URL is deterministic so nothing to change
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, []);

  async function sendToSW(
    file: File,
    bucket: "blog" | "portfolio" = "blog",
    preId?: string,
  ) {
    const id = preId || uid();
    const reg = await navigator.serviceWorker.ready.catch(() => undefined);
    window.dispatchEvent(
      new CustomEvent("kabuto:upload-begin", {
        detail: { id, filename: file.name, bucket: "blog" },
      }),
    );

    if (reg?.active) {
      reg.active.postMessage({
        type: "cache-put",
        payload: { id, blob: file, bucket },
      });
    } else {
      alert("Service worker not active; cannot store media.");
    }
    return id;
  }

  async function handlePickFiles(files: FileList | null) {
    if (!files || !files.length) return;
    for (const f of Array.from(files)) {
      const id = uid();
      const url = localUrl("blog", id);
      const item: BlogMedia = {
        id,
        url,
        filename: f.name,
        mime: f.type || "",
      };
      // show immediately with stable URL
      setMedia((m) => [item, ...m]);
      void sendToSW(f, "blog", id);
    }
  }

  function insertAtEnd(text: string) {
    setDraft((d) => ({
      ...d,
      content:
        (d.content ? d.content + (d.content.endsWith("\n") ? "" : "\n") : "") +
        text +
        "\n",
    }));
  }

  function genSlug(title: string) {
    const base =
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 64) || "post";
    let slug = base,
      i = 2;
    const existing = new Set(rows.map((r) => r.slug));
    while (existing.has(slug)) slug = `${base}-${i++}`;
    return slug;
  }
  function addPost() {
    if (!draft.title) return alert("Title required");
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(now.getDate()).padStart(2, "0")}`;
    const slug = draft.slug || genSlug(draft.title);
    const next: Post = {
      ...draft,
      id: uid(),
      slug,
      updatedAt: Date.now(),
      date,
    };
    setRows([next, ...rows]);
    savePosts([next, ...rows]);
    setDraft(empty);
  }
  function delPost(id: string) {
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    savePosts(next);
  }
  function updPost(id: string, patch: Partial<Post>) {
    const next = rows.map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r,
    );
    setRows(next);
    savePosts(next);
  }

  return (
    <div className="grid gap-4">
      <Panel title="New post" rightTag="compose.md">
        <div className="grid gap-2 text-xs">
          <input
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />
          <input
            placeholder="Custom slug (optional)"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />
          <input
            placeholder="Summary"
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />

          {/* Blog media uploader */}
          <div className="rounded border border-[#4a5a45] p-2">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-90">
                Upload images/videos to use in this post
              </span>
            </div>
            <div
              className="grid gap-2 text-xs"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePickFiles(e.dataTransfer?.files || null);
              }}
            >
              <input
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                multiple
                onChange={(e) => handlePickFiles(e.currentTarget.files)}
                className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
              />
              <div className="text-[11px] opacity-70">
                Drag & drop or use the picker. Stored under{" "}
                <code>/local/blog/&lt;id&gt;</code>. Click “Copy tag” to insert
                into content.
              </div>

              {media.length > 0 && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {media.map((m) => {
                    const isImg = (m.mime || "").startsWith("image/");
                    const tag = isImg
                      ? `![${m.filename}](${m.url})`
                      : `[${m.filename}](${m.url})`;
                    return (
                      <div
                        key={m.id}
                        className="rounded border border-[#4a5a45] overflow-hidden bg-[#2a3328]"
                      >
                        <div
                          className="bg-[#222] grid place-items-center"
                          style={{ height: 140 }}
                        >
                          {isImg ? (
                            <img
                              src={m.url}
                              alt=""
                              style={{
                                maxHeight: 140,
                                maxWidth: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <video
                              src={m.url}
                              style={{
                                maxHeight: 140,
                                maxWidth: "100%",
                                objectFit: "contain",
                              }}
                              muted
                              autoPlay
                              loop
                              playsInline
                            />
                          )}
                        </div>
                        <div className="p-2 text-[11px] flex items-center gap-2">
                          <span className="truncate" title={m.filename}>
                            {m.filename}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard
                                ?.writeText(tag)
                                .catch(() => {});
                              insertAtEnd(tag);
                            }}
                            className="ml-auto inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-0.5 hover:border-[var(--primary)]"
                            title="Copy tag & insert"
                          >
                            <ClipboardIcon className="h-3.5 w-3.5" /> Copy tag
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <textarea
            placeholder="Content (Markdown-lite). Use ![alt](/local/blog/ID) for images, or links."
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            rows={10}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1 font-mono"
          />
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) =>
                setDraft({ ...draft, published: e.target.checked })
              }
            />{" "}
            Published
          </label>
          <button
            onClick={addPost}
            className="inline-flex items-center gap-2 rounded border border-[#4a5a45] bg-[#3a4538] px-3 py-1 text-sm hover:border-[var(--primary)]"
          >
            <Save className="h-4 w-4" /> Save post
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
                  <div className="font-medium text-[var(--accent)]">
                    {p.title}
                  </div>
                  <div className="text-xs opacity-70">
                    {p.date} • {p.published ? "Published" : "Draft"}
                  </div>
                </div>
                <div className="text-xs opacity-80 break-all">/blog/{p.slug}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => navigate(`/blog/${p.slug}`)}
                    className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 text-xs hover:border-[var(--primary)]"
                  >
                    <PencilLine className="h-4 w-4" /> Open
                  </button>
                  <button
                    onClick={() => delPost(p.id)}
                    className="inline-flex items-center gap-1 rounded border border-[#4a5a45] px-2 py-1 text-xs hover:border-red-400"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                  <label className="inline-flex items-center gap-2 text-xs ml-auto">
                    <input
                      type="checkbox"
                      checked={p.published}
                      onChange={(e) =>
                        updPost(p.id, { published: e.target.checked })
                      }
                    />{" "}
                    Published
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

/* ───────────── AdminPortfolio component ───────────── */
function AdminPortfolio() {
  const [rows, setRows] = useState<PortfolioItem[]>(() => loadPortfolio());
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  useEffect(() => {
    const onChange = (e: any) => {
      if (e.detail?.type === "portfolio") setRows(loadPortfolio());
    };
    window.addEventListener("kabuto:data", onChange as any);
    return () => window.removeEventListener("kabuto:data", onChange as any);
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const { type, payload } = (e.data || {}) as any;
      if (type === "cache-put-ok" && payload?.id && payload?.bucket === "portfolio") {
        // confirmation only — URL is deterministic already
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, []);

  async function addFiles(files: FileList | null) {
    if (!files || !files.length) return;
    for (const file of Array.from(files)) {
      const id = uid();
      window.dispatchEvent(
        new CustomEvent("kabuto:upload-begin", {
          detail: { id, filename: file.name, bucket: "portfolio" },
        }),
      );

      const mime = file.type || "";
      const type: "image" | "video" = mime.startsWith("image/")
        ? "image"
        : "video";
      const row: PortfolioItem = {
        id,
        title: file.name,
        type,
        url: localUrl("portfolio", id), // set immediately
        filename: file.name,
        mime,
        createdAt: Date.now(),
        published: true,
      };
      const next = [row, ...rows];
      setRows(next);
      savePortfolio(next);

      const reg = await navigator.serviceWorker.ready.catch(() => undefined);
      if (reg?.active) {
        reg.active.postMessage({
          type: "cache-put",
          payload: { id, blob: file, bucket: "portfolio" },
        });
      } else {
        alert("Service worker not active; cannot store media.");
      }
    }
  }

  function delRow(id: string) {
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    savePortfolio(next);
  }
  function updRow(id: string, patch: Partial<PortfolioItem>) {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRows(next);
    savePortfolio(next);
  }

  const visible = rows.filter((r) => (filter === "all" ? true : r.type === filter));

  return (
    <div className="grid gap-4">
      <Panel title="Upload media" rightTag="image / video">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid gap-3 text-xs"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addFiles(e.dataTransfer?.files || null);
          }}
        >
          <input
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            onChange={(e) => addFiles(e.currentTarget.files)}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          />
          <div className="opacity-75">
            Drag & drop or use the picker. Stored under{" "}
            <code>/local/portfolio/&lt;id&gt;</code>.
          </div>
        </form>
      </Panel>

      <Panel title="Library" rightTag={`${visible.length}`}>
        <div className="mb-2 flex items-center gap-2 text-xs">
          <label>Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded border border-[#4a5a45] bg-[#313b2f] px-2 py-1"
          >
            <option value="all">All</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>

        {visible.length === 0 ? (
          <div className="text-sm opacity-70">No portfolio items yet.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((r) => (
              <div
                key={r.id}
                className="rounded-[6px] border border-[#4a5a45] bg-[#3a4538] overflow-hidden"
              >
                <div className="px-2 py-1 border-b border-[#4a5a45] flex items-center gap-2">
                  <input
                    value={r.title || ""}
                    onChange={(e) => updRow(r.id, { title: e.target.value })}
                    placeholder="Title (optional)"
                    className="flex-1 bg-transparent outline-none text-xs"
                  />
                  <label className="inline-flex items-center gap-1 text-[10px]">
                    <input
                      type="checkbox"
                      checked={r.published}
                      onChange={(e) =>
                        updRow(r.id, { published: e.target.checked })
                      }
                    />
                    Published
                  </label>
                  <button
                    onClick={() => delRow(r.id)}
                    className="text-[10px] px-2 py-0.5 rounded border border-[#4a5a45] hover:border-red-400"
                  >
                    Delete
                  </button>
                </div>
                <div className="bg-[#222] grid place-items-center">
                  {r.type === "image" ? (
                    <img
                      src={r.url}
                      alt=""
                      style={{
                        height: 180,
                        width: "auto",
                        display: "block",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <video
                      src={r.url}
                      style={{
                        height: 180,
                        width: "auto",
                        display: "block",
                        objectFit: "contain",
                      }}
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  )}
                </div>
                <div className="px-2 py-1 text-[10px] opacity-75">
                  {r.filename || ""} {r.mime ? `• ${r.mime}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ Shell & routing                                                           │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
export default function KabutoHub90s() {
  useEffect(() => {
    injectPreloadLinks(IMAGES as unknown as string[], "image");
    if (VIDEOS.length) injectPreloadLinks(VIDEOS as unknown as string[], "video");
    if (AUDIOS.length) injectPreloadLinks(AUDIOS as unknown as string[], "audio");

    queueMicrotask(() => {
      warmDecode({
        images: [...IMAGES],
        videos: [...VIDEOS],
        audios: [...AUDIOS],
      }).catch(() => {
        /* ignore */
      });
    });
  }, []);

  const [path] = usePath();

  const addHtmlLock = () => {
    document.documentElement.classList.add("splash-lock");
  };
  const removeHtmlLock = () => {
    document.documentElement.classList.remove("splash-lock");
  };

  const isDesktopRoute = (p: string) => p === "/" || p === "/portfolio";

  const [transitioning, setTransitioning] = useState(false);
  const clickSfx = useRef<HTMLAudioElement | null>(null);
  const transSfx = useRef<HTMLAudioElement | null>(null);

  const [splashShowing, setSplashShowing] = useState<boolean>(false);
  const [splashImage, setSplashImage] = useState<string>("");

  useCursorTrail(!(transitioning || splashShowing));

  usePreloadImages([
    LOGO_SRC,
    FAVICON_SRC,
    FEATURE_IMAGE_PRIMARY,
    SMOKER_SRC,
    ROOT_WALL,
    ICON_PORTFOLIO,
    ICON_LAB,
    ICON_IRL,
    ICON_CONTACT,
    PF_WALL,
    PF_VIEWMODEL,
    PF_START,
    PF_PCICON,
    PF_SPLASH,
    ROOT_SPLASH,
    NOTEPAD_CHROME,
    ...RIGHT_STACK_IMAGES,
    ...RATES_THUMBS,
  ]);

  const fireSfx = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    try {
      clickSfx.current = new Audio("/sfx/click.mp3");
      transSfx.current = new Audio("/sfx/transition.mp3");
      fireSfx.current = new Audio(FIRE_SFX_SRC);

      [clickSfx.current, transSfx.current, fireSfx.current].forEach((a) => {
        if (!a) return;
        a.preload = "auto";
        a.volume = 0.65;
      });

      const unlock = () => {
        [clickSfx.current, transSfx.current, fireSfx.current].forEach((a) => {
          if (!a) return;
          a.muted = true;
          a.currentTime = 0;
          a.play()
            .then(() => {
              a.pause();
              a.muted = false;
            })
            .catch(() => {});
        });
        window.removeEventListener("pointerdown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { once: true });
    } catch {}
  }, []);

  useEffect(() => {
    const onPre = async (e: any) => {
      const nextPath: string = e.detail?.nextPath || "/";

      try {
        clickSfx.current &&
          ((clickSfx.current.currentTime = 0), clickSfx.current.play());
      } catch {}

      addHtmlLock();
      setTransitioning(true);

      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      const needsSplash = isDesktopRoute(nextPath);
      const splashImg =
        nextPath === "/" ? (ROOT_SPLASH || PF_SPLASH) : PF_SPLASH;

      window.history.pushState({}, "", nextPath);
      window.dispatchEvent(new PopStateEvent("popstate"));

      if (needsSplash) {
        setSplashImage(splashImg);
        setSplashShowing(true);
        try {
          transSfx.current &&
            ((transSfx.current.currentTime = 0), transSfx.current.play());
        } catch {}

        setTimeout(() => setTransitioning(false), 250);
      } else {
        const entered = new Promise<void>((resolve) => {
          const handler = () => {
            window.removeEventListener(
              "kabuto:page-entered",
              handler as any,
            );
            resolve();
          };
          window.addEventListener(
            "kabuto:page-entered",
            handler as any,
            { once: true },
          );
          setTimeout(resolve, 1200);
        });

        await entered;
        setTransitioning(false);
        removeHtmlLock();
      }
    };

    window.addEventListener("kabuto:pre-navigate", onPre);
    return () => window.removeEventListener("kabuto:pre-navigate", onPre);
  }, []);

  useEffect(() => {
    if (path === "/" || path === "/portfolio") {
      addHtmlLock();
      setTransitioning(true);
      setSplashImage(path === "/" ? (ROOT_SPLASH || PF_SPLASH) : PF_SPLASH);

      setTimeout(() => {
        setSplashShowing(true);
        try {
          if (transSfx.current) {
            transSfx.current.currentTime = 0;
            transSfx.current.play();
          }
        } catch {}
        setTimeout(() => setTransitioning(false), 250);
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (splashShowing) addHtmlLock();
    else removeHtmlLock();
    return () => removeHtmlLock();
  }, [splashShowing]);

  useEffect(() => {
    document.title =
      path === "/"
        ? "kabuto"
        : path === "/lab"
        ? "kabuto — lab"
        : `kabuto — ${path.replace("/", "")}`;

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = FAVICON_SRC;
  }, [path]);

  const [navH, setNavH] = useState(48);
  const navRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!navRef.current) return;
    const r = () => setNavH(navRef.current!.offsetHeight || 48);
    r();
    const ro = new ResizeObserver(r);
    ro.observe(navRef.current!);
    return () => ro.disconnect();
  }, []);

  const global = (
    <style>{`
    :root { --cs-cursor: url("${CURSOR_URL}") 16 16, crosshair; --taskbar-h: 40px; }
    html, body { margin: 0; background: var(--bg); color: var(--primarySoft); }
    html.splash-lock, html.splash-lock body { background:#000 !important; overflow:hidden !important; }
    body { padding-bottom: var(--taskbar-h); }
    html.splash-lock body { padding-bottom: 0; }
    a { color: var(--primarySoft); text-decoration: none; }
    a:hover { color: var(--accent); text-decoration: underline; }
    a:visited { color: var(--primarySoft); }
    a:focus { outline: none; }
    html, body, a, button, [role="button"], input, textarea, select, label, * {
      cursor: var(--cs-cursor) !important;
    }
  `}</style>
  );

  let view: JSX.Element | null = null;
  if (path === "/") view = <RootDesktopPage />;
  else if (path === "/lab") view = <LabHomePage />;
  else if (path === "/blog") view = <BlogPage />;
  else if (path.startsWith("/blog/"))
    view = (
      <BlogPostPage slug={decodeURIComponent(path.replace("/blog/", ""))} />
    );
  else if (path === "/esports") view = <EsportsPage />;
  else if (path === "/commissions") view = <CommissionsPage />;
  else if (path === "/portfolio") view = <PortfolioPage />;
  else if (path === "/admin") view = <AdminPage />;
  else
    view = (
      <PageShell title="404">
        <div className="text-sm opacity-70">Page not found.</div>
      </PageShell>
    );

  const homeTarget =
    path === "/lab" ||
    path.startsWith("/blog") ||
    path === "/esports" ||
    path === "/commissions" ||
    path === "/admin"
      ? "/lab"
      : "/";

  return (
    <div
      style={appStyles as CSSProperties}
      className={
        "min-h-screen text-[var(--primarySoft)] bg-[var(--bg)] subpixel-antialiased" +
        (path === "/" || path === "/portfolio" ? " overflow-hidden" : "")
      }
    >
      {global}

      {!(path === "/" || path === "/portfolio") && (
        <div
          ref={navRef}
          className="sticky top-0 z-40 border-b border-[#4a5a45] bg-[#3a4538]/90 backdrop-blur"
        >
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            {path !== homeTarget && (
              <button
                onClick={() => navigate(homeTarget)}
                className="rounded-[4px] border border-[#4a5a45] bg-[#3a4538] px-2 py-1 text-xs hover:border-[var(--primary)] hover:bg-[#404b3f] transition-colors"
              >
                Home
              </button>
            )}

            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center"
              title="kabuto desktop"
            >
              <img src={LOGO_SRC} alt="kabuto" className="h-8 w-8 object-contain" />
            </button>

            <h1 className="text-xl font-semibold tracking-[0.02em] text-[var(--accent)]">
              {BRAND.title}
            </h1>

            <div className="ml-auto flex items-center gap-2">
              {[
                {
                  name: "YouTube",
                  url: "https://www.youtube.com/@kabutoKunai",
                  icon: Youtube,
                },
                {
                  name: "TikTok",
                  url: "https://www.tiktok.com/@kabutokunai/",
                  icon: Link2,
                },
                {
                  name: "X / Twitter",
                  url: "https://x.com/kabutoKunai",
                  icon: Twitter,
                },
                {
                  name: "GitHub",
                  url: "https://github.com/kabuto-mk7",
                  icon: Github,
                },
                { name: "Contact", url: "mailto:contact@kabuto.studio", icon: Mail },
              ].map((s) => {
                const internal = isInternalKabuto(s.url);
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target={internal ? undefined : "_blank"}
                    rel={internal ? undefined : "noreferrer"}
                    onClick={(e) => {
                      if (internal) {
                        e.preventDefault();
                        navigate(s.url);
                      }
                    }}
                    className="group inline-flex items-center gap-1 rounded-[3px] border border-[#4a5a45] bg-[#3a4538] px-2 py-1 text-xs hover:border-[var(--primary)] hover:bg-[#404b3f] transition-colors text-[var(--primarySoft)]"
                  >
                    <s.icon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                    <span className="hidden sm:inline">{s.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className={path === "/" || path === "/portfolio" ? "" : "mx-auto max-w-6xl px-0"}>
        {path === "/" || path === "/portfolio" ? (
          <div>{view}</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={path}
              initial={{ opacity: 0.0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              onAnimationComplete={() => {
                window.dispatchEvent(new CustomEvent("kabuto:page-entered"));
              }}
            >
              {view}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {transitioning && (
          <motion.div
            className="fixed inset-0 z-[180] bg-black"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {splashShowing && splashImage && (
          <motion.div
            id="kabuto-splash"
            key={splashImage}
            className="fixed inset-0 z-[190] grid place-items-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            onAnimationComplete={() => {
              window.setTimeout(() => {
                setSplashShowing(false);
                removeHtmlLock();
              }, 1400);
            }}
          >
            <img
              src={splashImage}
              alt="splash"
              className="max-w-[70vw] w-[680px] h-auto object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!(path === "/" || path === "/portfolio") && (
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs opacity-60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span>built with love & sharp edges</span>
          </div>
        </footer>
      )}

      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          id={`ktrail-${i}`}
          className="pointer-events-none fixed"
          style={{
            left: 0,
            top: 0,
            width: 24,
            height: 24,
            backgroundImage: `url("${CURSOR_URL}")`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            filter:
              "drop-shadow(0 0 6px rgba(0,0,0,0.8)) drop-shadow(0 0 6px rgba(0,255,0,0.35))",
            zIndex: 2147483647,
            opacity: 0,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      <TaskbarPortal>
        <ClassicTaskbar />
      </TaskbarPortal>
    </div>
  );
}

/* ╭──────────────────────────────────────────────────────────────────────────╮
   │ UI bits                                                                   │
   ╰──────────────────────────────────────────────────────────────────────────╯ */
function PageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title={title}>
        <div className="space-y-6">{children}</div>
      </Window>
    </main>
  );
}

function Window({
  title,
  rightTag,
  children,
}: {
  title: string;
  rightTag?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 rounded-[6px] border border-[#4a5a45] bg-[#313b2f] shadow-[0_0_0_1px_#2d362b,inset_0_1px_0_#2a3328]">
      <div className="flex items-center justify-between rounded-t-[6px] border-b border-[#4a5a45] bg-[#3a4538] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-sm bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]" />
          <span className="text-sm tracking-wide text-[var(--accent)]">
            {title}
          </span>
        </div>
        {rightTag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] border border-[#284635] bg-[#313b2f]">
            {rightTag}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Panel({
  title,
  rightTag,
  children,
}: {
  title: string;
  rightTag?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[4px] border border-[#4a5a45] bg-[#3a4538] shadow-[inset_0_1px_0_#2a3328]">
      <div className="flex items-center justify-between border-b border-[#4a5a45] px-3 py-2">
        <span className="text-xs tracking-wide text-[var(--accent)]">
          {title}
        </span>
        {rightTag && <span className="text-[10px] opacity-70">{rightTag}</span>}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function SpecList({ specs }: { specs: Record<string, string> }) {
  return (
    <div className="grid gap-2 text-xs">
      {Object.entries(specs).map(([k, v]) => (
        <div
          key={k}
          className="flex justify-between gap-3 border-b border-dashed border-[#1e3329] pb-1"
        >
          <span className="opacity-60">{k}</span>
          <span className="text-[var(--accent)]">{v}</span>
        </div>
      ))}
    </div>
  );
}
