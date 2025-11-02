import { AnimatePresence, motion } from "framer-motion";
import { Github, Youtube, Twitter, Link2, Mail } from "lucide-react";
import { Window } from "@/ui/Window";
import { RootDesktopPage } from "@/pages/RootDesktopPage";
import { LabHomePage } from "@/pages/LabHomePage";
import { BlogPage, BlogPostPage } from "@/pages/BlogPage";
import { EsportsPage } from "@/pages/EsportsPage";
import { CommissionsPage } from "@/pages/CommissionsPage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { AdminPage } from "@/pages/AdminPage";
import { ClassicTaskbar } from "@/ui/Taskbar";


import { usePath, isInternalKabuto, navigate } from "@/lib/router";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import { BRAND, LOGO_SRC, FAVICON_SRC, CURSOR_URL, PF_VIEWMODEL, PF_START, PF_PCICON, PF_SPLASH, ROOT_SPLASH,
  FEATURE_IMAGE_PRIMARY, SMOKER_SRC, ROOT_WALL, ICON_PORTFOLIO, ICON_LAB, ICON_IRL, ICON_CONTACT,
  RIGHT_STACK_IMAGES, RATES_THUMBS, SFX_CLICK, SFX_TRANSITION, SFX_FIRE } from "@/lib/assets";
import React, { type JSX } from "react";

export default function KabutoHub90s() {
  const [path] = usePath();

  // Splash lock helpers
  const addHtmlLock = () => document.documentElement.classList.add("splash-lock");
  const removeHtmlLock = () => document.documentElement.classList.remove("splash-lock");
  const isDesktopRoute = (p:string) => p === "/" || p === "/portfolio";

  // transitions & sfx
  const [transitioning, setTransitioning] = React.useState(false);
  const navRef = React.useRef<HTMLDivElement | null>(null);
  const clickSfx = React.useRef<HTMLAudioElement | null>(null);
  const transSfx = React.useRef<HTMLAudioElement | null>(null);
  const fireSfx  = React.useRef<HTMLAudioElement | null>(null);

  const [hardBlack] = React.useState<boolean>(path === "/" || path === "/portfolio");
  const [splashShowing, setSplashShowing] = React.useState<boolean>(false);
  const [splashImage, setSplashImage] = React.useState<string>("");

  // cursor trail
  useCursorTrail(!(transitioning || splashShowing));

  // preload global assets
  usePreloadImages([
    LOGO_SRC, FAVICON_SRC, FEATURE_IMAGE_PRIMARY, SMOKER_SRC, ROOT_WALL,
    ICON_PORTFOLIO, ICON_LAB, ICON_IRL, ICON_CONTACT, PF_VIEWMODEL, PF_START, PF_PCICON,
    PF_SPLASH, ROOT_SPLASH, ...RIGHT_STACK_IMAGES, ...RATES_THUMBS,
  ]);

  // sfx init/unlock
  React.useEffect(() => {
    try {
      clickSfx.current = new Audio(SFX_CLICK);
      transSfx.current = new Audio(SFX_TRANSITION);
      fireSfx.current  = new Audio(SFX_FIRE);
      [clickSfx.current, transSfx.current, fireSfx.current].forEach(a=>{
        if (!a) return; a.preload="auto"; a.volume=0.65;
      });
      const unlock = () => {
        [clickSfx.current, transSfx.current, fireSfx.current].forEach(a=>{
          if (!a) return; a.muted = true; a.currentTime = 0;
          a.play().then(()=>{ a.pause(); a.muted = false; }).catch(()=>{});
        });
        window.removeEventListener("pointerdown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { once:true });
    } catch {}
  }, []);

  // pre-navigate interception
  React.useEffect(() => {
    const onPre = (e:any) => {
      const nextPath: string = e.detail?.nextPath || "/";
      try { clickSfx.current && ((clickSfx.current.currentTime = 0), clickSfx.current.play()); } catch {}
      addHtmlLock(); setTransitioning(true);

      window.setTimeout(() => {
        const needsSplash = isDesktopRoute(nextPath);
        const splashImg = nextPath === "/" ? (ROOT_SPLASH || PF_SPLASH) : PF_SPLASH;

        window.history.pushState({}, "", nextPath);
        window.dispatchEvent(new PopStateEvent("popstate"));

        if (needsSplash) {
          setSplashImage(splashImg); setSplashShowing(true);
          try { transSfx.current && ((transSfx.current.currentTime = 0), transSfx.current.play()); } catch {}
          window.setTimeout(()=> setTransitioning(false), 250);
        } else {
          window.setTimeout(() => { setTransitioning(false); removeHtmlLock(); }, 350);
        }
      }, 120);
    };
    window.addEventListener("kabuto:pre-navigate", onPre);
    return () => window.removeEventListener("kabuto:pre-navigate", onPre);
  }, []);

  // initial splash if landing on desktop routes
  React.useEffect(() => {
    if (path === "/" || path === "/portfolio") {
      setTransitioning(true);
      setSplashImage(path === "/" ? (ROOT_SPLASH || PF_SPLASH) : PF_SPLASH);
      setTimeout(() => {
        setSplashShowing(true);
        try { if (transSfx.current) { transSfx.current.currentTime = 0; transSfx.current.play(); } } catch {}
        setTimeout(()=> setTransitioning(false), 250);
      }, 200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    const el = document.documentElement;
    if (splashShowing) el.classList.add("splash-lock"); else el.classList.remove("splash-lock");
    return () => el.classList.remove("splash-lock");
  }, [splashShowing]);

  // titles + favicon
  React.useEffect(() => {
    document.title =
      path === "/" ? "kabuto" :
      path === "/lab" ? "kabuto — lab" :
      `kabuto — ${path.replace("/", "")}`;

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = FAVICON_SRC;
  }, [path]);

  // nav height (reserved)
  const [navH, setNavH] = React.useState(48);
  React.useEffect(() => {
    if (!navRef.current) return;
    const r = () => setNavH(navRef.current!.offsetHeight || 48);
    r(); const ro = new ResizeObserver(r);
    ro.observe(navRef.current!);
    return () => ro.disconnect();
  }, []);

  // global CSS
  const global = (
    <style>{`
      :root { --primary:${BRAND.primary}; --primarySoft:${BRAND.primarySoft}; --bg:${BRAND.bg}; --panel:${BRAND.panel}; --accent:${BRAND.accent}; --cs-cursor: url("${CURSOR_URL}") 16 16, crosshair; }
      html, body { margin: 0; background: var(--bg); color: var(--primarySoft); }
      html.splash-lock, html.splash-lock body { background:#000 !important; }
      a { color: var(--primarySoft); text-decoration: none; }
      a:hover { color: var(--accent); text-decoration: underline; }
      a:visited { color: var(--primarySoft); }
      a:focus { outline: none; }
      html, body, a, button, [role="button"], input, textarea, select, label, * { cursor: var(--cs-cursor) !important; }
    `}</style>
  );

  // route view
  let view: JSX.Element | null = null;
  if (path === "/") view = <RootDesktopPage/>;
  else if (path === "/lab") view = <LabHomePage/>;
  else if (path === "/blog") view = <BlogPage/>;
  else if (path.startsWith("/blog/")) view = <BlogPostPage slug={decodeURIComponent(path.replace("/blog/",""))}/>;
  else if (path === "/esports") view = <EsportsPage/>;
  else if (path === "/commissions") view = <CommissionsPage/>;
  else if (path === "/portfolio") view = <PortfolioPage/>;
  else if (path === "/admin") view = <AdminPage/>;
  else view = (<main className="mx-auto max-w-6xl px-4 py-8"><Window title="404"><div className="text-sm opacity-70">Page not found.</div></Window></main>);

  const homeTarget = (path === "/lab" || path.startsWith("/blog") || path === "/esports" || path === "/commissions" || path === "/admin") ? "/lab" : "/";

  return (
    <div className={"min-h-screen text-[var(--primarySoft)] bg-[var(--bg)] subpixel-antialiased" + (path === "/" || path === "/portfolio" ? " overflow-hidden" : "")}>
      {global}

      {/* top bar – hidden on desktops */}
      {!(path === "/" || path === "/portfolio") && (
        <div ref={navRef} className="fixed top-0 left-0 right-0 z-40 border-b border-[#4a5a45] bg-[#3a4538]/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            {path !== homeTarget && (
              <button onClick={()=>navigate(homeTarget)} className="rounded-[4px] border border-[#4a5a45] bg-[#3a4538] px-2 py-1 text-xs hover:border-[var(--primary)] hover:bg-[#404b3f] transition-colors">Home</button>
            )}
            <button onClick={()=>navigate("/")} className="inline-flex items-center" title="kabuto desktop">
              <img src={LOGO_SRC} alt="kabuto" className="h-8 w-8 object-contain"/>
            </button>
            <h1 className="text-xl font-semibold tracking-[0.02em] text-[var(--accent)]">{BRAND.title}</h1>
            <div className="ml-auto flex items-center gap-2">
              {[
                { name:"YouTube", url:"https://www.youtube.com/@kabutoKunai", icon:Youtube },
                { name:"TikTok",  url:"https://www.tiktok.com/@kabutokunai/", icon:Link2 },
                { name:"X / Twitter", url:"https://x.com/kabutoKunai", icon:Twitter },
                { name:"GitHub", url:"https://github.com/kabuto-mk7", icon:Github },
                { name:"Contact", url:"mailto:contact@kabuto.studio", icon:Mail },
              ].map(s=>{
                const internal = isInternalKabuto(s.url);
                return (
                  <a key={s.name} href={s.url} target={internal?undefined:"_blank"} rel={internal?undefined:"noreferrer"}
                     onClick={(e)=>{ if(internal){ e.preventDefault(); navigate(s.url);} }}
                     className="group inline-flex items-center gap-1 rounded-[3px] border border-[#4a5a45] bg-[#3a4538] px-2 py-1 text-xs hover:border-[var(--primary)] hover:bg-[#404b3f] transition-colors text-[var(--primarySoft)]">
                    <s.icon className="h-4 w-4 opacity-80 group-hover:opacity-100"/>
                    <span className="hidden sm:inline">{s.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
          
        </div>
      )}

      {/* content */}
      <div className={path === "/" || path === "/portfolio" ? "" : "mx-auto max-w-6xl px-0"}>
        {path === "/" || path === "/portfolio" ? (
          <div>{view}</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={path} initial={{ opacity:0, filter:"blur(6px)" }} animate={{ opacity:1, filter:"blur(0px)" }} exit={{ opacity:0, filter:"blur(6px)" }} transition={{ duration:0.45, ease:"easeInOut" }}>
              {view}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* black overlay */}
      <AnimatePresence>
        {transitioning && (
          <motion.div className="fixed inset-0 z-[180] bg-black" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.5 }}/>
        )}
      </AnimatePresence>

      {/* splash layer */}
      <AnimatePresence>
        {splashShowing && splashImage && (
          <motion.div id="kabuto-splash" key={splashImage} className="fixed inset-0 z-[190] grid place-items-center bg-black"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.45 }}
            onAnimationComplete={() => { const id = window.setTimeout(()=>{ setSplashShowing(false); removeHtmlLock(); }, 1400); }}>
            <img src={splashImage} alt="splash" className="max-w-[70vw] w-[680px] h-auto object-contain"/>
          </motion.div>
        )}
      </AnimatePresence>

      {!(transitioning || splashShowing) && (
      <ClassicTaskbar onStart={() => navigate("/")} />
      )}

      {/* cursor trail */}
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} id={`ktrail-${i}`} className="pointer-events-none fixed"
          style={{ left:0, top:0, width:24, height:24, backgroundImage:`url("${CURSOR_URL}")`, backgroundRepeat:"no-repeat", backgroundSize:"contain",
                   filter:"drop-shadow(0 0 6px rgba(0,0,0,0.8)) drop-shadow(0 0 6px rgba(0,255,0,0.35))", zIndex:2147483647, opacity:0, transform:"translate(-50%, -50%)" }}/>
      ))}
    </div>

  );
}

/* ————— utilities from your file ————— */
function useCursorTrail(enabled: boolean) {
  React.useEffect(() => {
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
    let lastMove = Date.now(); let raf = 0;
    const onMove = (e: MouseEvent) => { head.x = e.clientX; head.y = e.clientY; lastMove = Date.now(); };
    window.addEventListener("mousemove", onMove, { passive: true });
    const tick = () => {
      pts[0].x += (head.x - pts[0].x) * 0.25; pts[0].y += (head.y - pts[0].y) * 0.25;
      for (let i = 1; i < pts.length; i++) { pts[i].x += (pts[i-1].x - pts[i].x) * 0.25; pts[i].y += (pts[i-1].y - pts[i].y) * 0.25; }
      const idle = Date.now() - lastMove > 1200;
      for (let i = 0; i < els.length; i++) {
        const el = els[i]; if (!el) continue; const p = pts[i];
        el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        const base = 0.65 - i * 0.05; el.style.opacity = idle ? "0" : String(Math.max(0, base));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); };
  }, [enabled]);
}
