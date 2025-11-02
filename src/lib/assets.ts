// Brand / theme (exported so App can consume as CSS vars)
export const BRAND = {
  title: "kabuto",
  primary: "#d7e6b6",
  primarySoft: "#e6f2cf",
  bg: "#2c3528",
  panel: "#3a4538",
  accent: "#d7c65a",
};

// UI assets
export const LOGO_SRC      = "/assets/kabuto/ui/logo.png";
export const FAVICON_SRC   = "/assets/kabuto/ui/favicon.png";
export const FEATURE_IMAGE_PRIMARY = "/assets/kabuto/ui/feature-hero.png";
export const SMOKER_SRC    = "/assets/smoker.jpg";

// CS scene layers
export const PF_BG        = "/assets/kabuto/portfolio/BG.png";
export const PF_OVERLAY   = "/assets/kabuto/portfolio/overlay.png";
export const PF_IPAD      = "/assets/kabuto/portfolio/ipad.png";
export const PF_P1        = "/assets/kabuto/portfolio/person01.png"; // rates
export const PF_P2        = "/assets/kabuto/portfolio/person02.png"; // portfolio
export const PF_P3        = "/assets/kabuto/portfolio/person03.png"; // contact
export const PF_VIEWMODEL = "/assets/kabuto/portfolio/viewmodel.webp";

// Root desktop
export const ROOT_WALL        = "/assets/kabuto/portfolio/win95.jpg";
export const ICON_PORTFOLIO   = "/assets/kabuto/portfolio/portal.png";
export const ICON_LAB         = "/assets/kabuto/portfolio/vlc.png";
export const ICON_IRL         = "/assets/kabuto/portfolio/steam.png";
export const ICON_CONTACT     = "/assets/kabuto/portfolio/fraps.png";
export const NOTEPAD_CHROME   = "/assets/kabuto/portfolio/notepad.jpg";
export const ICON_VISITOR_LABEL = "/assets/kabuto/portfolio/photo.png";

// Portfolio desktop (lab-styled)
export const PF_WALL   = "/assets/kabuto/portfolio/hana256.bmp";
export const PF_SPLASH = "/assets/kabuto/portfolio/splash-portfolio.jpg";
// Root uses same splash
export const ROOT_SPLASH = PF_SPLASH;

export const PF_START  = "/assets/kabuto/portfolio/start-icon.png";
export const PF_PCICON = "/assets/kabuto/portfolio/icon-portfolio.png";

// Esports sidebar
export const RIGHT_STACK_IMAGES: string[] = [
  "/assets/kabuto/esports_sidebar/avatar.png",
  "/assets/kabuto/esports_sidebar/mousepad.jpg",
  "/assets/kabuto/esports_sidebar/rig.jpg",
  "/assets/kabuto/esports_sidebar/trophy.jpg",
];

// Rates thumbs
export const RATES_THUMBS: string[] = [
  "/assets/kabuto/comisions/thumbs/short-30.jpg",
  "/assets/kabuto/comisions/thumbs/short-60.jpg",
  "/assets/kabuto/comisions/thumbs/short-120.jpg",
  "/assets/kabuto/comisions/thumbs/yt-6.jpg",
  "/assets/kabuto/comisions/thumbs/yt-12.jpg",
  "/assets/kabuto/comisions/thumbs/yt-20.jpg",
];

// SFX
export const SFX_FIRE       = "/sfx/fire.mp3";
export const SFX_CLICK      = "/sfx/click.mp3";
export const SFX_TRANSITION = "/sfx/transition.mp3";

// External counter (kept)
export const COUNTER_SRC =
  "https://count.getloli.com/get/@:kabuto-mk7?theme=gelbooru";

// Cursor (SVG -> data URL)
const CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
<g filter="url(#s)"><path stroke="#00ff00" stroke-width="2.5" stroke-linecap="square" d="M16 1v10 M16 21v10 M1 16h10 M21 16h10"/></g>
<defs><filter id="s"><feDropShadow dx="0" dy="0" stdDeviation="1.6" flood-color="#000" flood-opacity=".8"/></filter></defs></svg>`;
export const CURSOR_URL = `data:image/svg+xml;utf8,${encodeURIComponent(CURSOR_SVG)}`;

// Sample portfolio items (used by pad + Win95 window)
export const PORTFOLIO_SAMPLES = [
  { type: "image", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1517817748490-58fdd8d1f774?w=1600&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80" },
  { type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { type: "image", src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80" },
];
