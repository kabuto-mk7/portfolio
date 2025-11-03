// src/pages/PortfolioPage.tsx
import { ClassicTaskbar } from "@/ui/Taskbar";
import PortfolioWin95Window from "@/components/overlays/PortfolioWin95Window";
import { RatesPadContent, ContactPadContent, PortfolioPadContent } from "@/components/overlays/PadContent";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import { useStageAnchor, useAlphaHover, useWeaponSway } from "@/hooks/portfolioStage";
import { navigate } from "@/lib/router";
import {
  PF_BG as BG,
  PF_OVERLAY as OV,
  PF_P1 as P1,
  PF_P2 as P2,
  PF_P3 as P3,
  PF_IPAD as IPAD,
  PF_VIEWMODEL,
  PORTFOLIO_SAMPLES,
} from "@/lib/assets";
import { loadPortfolioItems } from "@/lib/storage";
import type { MediaItem } from "@/types";
import React from "react";

type PadMode = "portfolio" | "rates" | "contact" | null;

/** Portrait background used only as a FULL-VIEWPORT UNDERLAY on mobile. */
const BG_MOBILE = "/assets/kabuto/portfolio/bg-mobile.jpeg";

/** Small-screen heuristic with resize updates. */
function useIsSmall() {
  const get = () =>
    typeof window !== "undefined" &&
    (window.innerWidth < 900 || window.innerHeight > window.innerWidth);
  const [small, setSmall] = React.useState(get);
  React.useEffect(() => {
    const on = () => setSmall(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return small;
}

/** Build a focus rect from base + zoom factor + pan in stage px. */
function buildFocus(
  base: { x: number; y: number; w: number; h: number },
  factor: number,
  dx: number,
  dy: number
) {
  const cx = base.x + base.w / 2;
  const cy = base.y + base.h / 2;
  const w = base.w * factor;
  const h = base.h * factor;
  return { x: cx - w / 2 + dx, y: cy - h / 2 + dy, w, h };
}

export function PortfolioPage() {
  // gunshot SFX
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

  // preload (include mobile underlay)
  usePreloadImages([BG, BG_MOBILE, OV, P1, P2, P3, IPAD, PF_VIEWMODEL]);

  const isSmall = useIsSmall();

  // Stage base (logical authored stage)
  const base = React.useMemo(() => ({ x: 50, y: 10, w: 1920, h: 1080 }), []);

  /* ── Mobile composition knobs ────────────────────────────────────────────
     - MOBILE_ZOOM affects the "focus rect" (composition feel).
     - MOBILE_PAN_X/Y recenters the focus.
     - MOBILE_SCALE_MUL is the *real* zoom (applied after cover); with backfill
       enabled, values < 1 zoom OUT beyond cover; > 1 zoom IN.               */
  const MOBILE_ZOOM = 1.12;
  const MOBILE_PAN_X = 10;
  const MOBILE_PAN_Y = 0;
  const MOBILE_SCALE_MUL = 0.55; // gentle zoom-out; try 0.92 or 0.90 for wider

  const focus = React.useMemo(
    () => (isSmall ? buildFocus(base, MOBILE_ZOOM, MOBILE_PAN_X, MOBILE_PAN_Y) : undefined),
    [isSmall, base, MOBILE_ZOOM, MOBILE_PAN_X, MOBILE_PAN_Y]
  );

  // Map stage to viewport. On mobile, allow underfill (backfill=true) so scaleMul < 1 takes effect.
  const m = useStageAnchor({
    focus,
    scaleMul: isSmall ? MOBILE_SCALE_MUL : 1,
    backfill: isSmall ? true : false,
  });

  // pads / animations
  const [pad, setPad] = React.useState<PadMode>(null);
  const [padVisible, setPadVisible] = React.useState(false);
  const [gunDown, setGunDown] = React.useState(false);
  const anim = React.useRef(false);

  // Mobile gun placement tweaks
  const baseLift = isSmall ? -120 : 0; // negative lifts up
  const gunScale = isSmall ? 1.18 : 1;

  const openPad = async (kind: Exclude<PadMode, null>) => {
    if (anim.current) return;
    anim.current = true;
    fire();
    setGunDown(true);
    await new Promise((r) => setTimeout(r, 380));
    setPad(kind);
    await new Promise((r) => setTimeout(r, 20));
    setPadVisible(true);
    await new Promise((r) => setTimeout(r, 420));
    anim.current = false;
  };

  const closePad = async () => {
    if (anim.current) return;
    anim.current = true;
    fire();
    setPadVisible(false);
    await new Promise((r) => setTimeout(r, 420));
    setPad(null);
    setGunDown(false);
    await new Promise((r) => setTimeout(r, 360));
    anim.current = false;
  };

  // smooth weapon sway
  const { tx, ty } = useWeaponSway(m, true, { ampX: 46, ampY: 22, smooth: 0.18 });

  // portfolio window state
  const [pfWinOpen, setPfWinOpen] = React.useState(false);

  // async load + live updates
  const [pfItems, setPfItems] = React.useState<MediaItem[]>([]);
  React.useEffect(() => {
    let alive = true;
    const init = async () => {
      const rows = await loadPortfolioItems();
      if (alive) setPfItems(rows);
    };
    void init();

    const onData = async (e: any) => {
      const scope = e?.detail?.scope ?? e?.detail?.type;
      if (scope === "portfolio") {
        const rows = await loadPortfolioItems();
        if (alive) setPfItems(rows);
      }
    };
    window.addEventListener("kabuto:data", onData);
    return () => {
      alive = false;
      window.removeEventListener("kabuto:data", onData);
    };
  }, []);

  // clickable silhouettes
  const persons = React.useMemo(
    () => [
      { key: "rates" as const, src: P1, onClick: () => openPad("rates") },
      { key: "portfolio" as const, src: P2, onClick: () => { fire(); setPfWinOpen(true); } },
      { key: "contact" as const, src: P3, onClick: () => openPad("contact") },
    ],
    [] // handlers stable
  );

  const { hover, pickAt } = useAlphaHover(persons as any, m);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#000" }}>
      {/* ── MOBILE UNDERLAY (bg-mobile) — lives OUTSIDE the scaled stage ── */}
      {isSmall && (
        <img
          src={BG_MOBILE}
          alt=""
          className="fixed inset-0 pointer-events-none select-none"
          style={{
            zIndex: 0,
            width: "120vw",
            height: "120vh",
            objectFit: "cover",
            // optional cosmetics:
            // filter: "blur(24px)",
            // transform: "scale(1.04)",
          }}
        />
      )}

      {/* 1920×1080 stage */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transform: `translate(${m.ox}px,${m.oy}px) scale(${m.scale})`,
          transformOrigin: "top left",
          zIndex: 2, // sits above underlay
        }}
      >
        {/* IMPORTANT: keep the authored 1920×1080 background inside the stage
            so overlays/silhouettes line up perfectly on all devices. */}
        <img
          src={BG}
          alt=""
          draggable={false}
          className="absolute left-0 top-0"
          style={{ width: 1920, height: 1080 }}
        />

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

        <img
          src={OV}
          alt=""
          className="absolute left-0 top-0 pointer-events-none"
          style={{ width: 1920, height: 1080, zIndex: 3 }}
        />

        {/* Unified pointer surface (tap-to-open on mobile) */}
        <button
          aria-label={hover ?? "scene"}
          onPointerDown={(e) => {
            const key = pickAt(e.clientX, e.clientY);
            if (!key) return;
            const t = (persons as any).find((pp: any) => pp.key === key);
            if (t) t.onClick();
          }}
          className="absolute left-0 top-0"
          style={{
            width: 1920,
            height: 1080,
            zIndex: 4,
            background: "transparent",
            border: "none",
            touchAction: "manipulation",
          }}
        />
      </div>

      {/* Weapon: outer wraps sway, inner slides when pad opens */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: isSmall ? "-190px" : "-26px",
          bottom: isSmall ? "-100px" : "-22px",
          width: isSmall ? "9000px" : "600px",
          maxWidth: isSmall ? "110vw" : "52vw",
          zIndex: 4,
          transform: `translate(${tx}px, ${ty + baseLift}px)`,
        }}
      >
        <img
          src={PF_VIEWMODEL}
          alt=""
          style={{
            width: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 12px rgba(0,0,0,.45))",
            transform: `translateY(${gunDown ? 520 : 0}px) scale(${gunScale})`,
            transition: "transform 420ms cubic-bezier(.22,.61,.36,1)",
          }}
        />
      </div>

      {/* iPad pad */}
      {pad && (
        <>
          <div
            className="absolute inset-0 bg-black/45"
            style={{ zIndex: 5, opacity: padVisible ? 1 : 0, transition: "opacity 420ms ease" }}
            onClick={closePad}
          />
          <div className="absolute inset-x-0" style={{ bottom: isSmall ? "-2px" : "-10px", zIndex: 6 }}>
            <div
              className="relative mx-auto"
              style={{
                width: isSmall ? "min(1200px, 100vw)" : "min(1200px, 92vw)",
                transform: `translateY(${padVisible ? "0%" : "106%"})`,
                transition: "transform 420ms cubic-bezier(.22,.61,.36,1)",
                filter: "drop-shadow(0 24px 60px rgba(0,0,0,.55))",
              }}
            >
              <img src={IPAD} alt="" className="w-full h-auto block select-none" draggable={false} />
              <div
                className="absolute overflow-hidden rounded-[8px] bg-[#0f0f0f]"
                style={{
                  left: isSmall ? "18%" : "25%",
                  right: isSmall ? "18%" : "26.4583%",
                  top: isSmall ? "12%" : "14.0741%",
                  bottom: isSmall ? "17%" : "21.2037%",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
                }}
              >
                {pad === "portfolio" && <PortfolioPadContent />}
                {pad === "rates" && <RatesPadContent />}
                {pad === "contact" && <ContactPadContent />}
              </div>
              <button
                onClick={closePad}
                className="absolute h-8 w-8 grid place-items-center rounded-full bg-black/70 text-white text-[14px] shadow-[0_2px_10px_rgba(0,0,0,.4)] hover:bg-black/80"
                style={{ top: isSmall ? "3%" : "5%", right: isSmall ? "6%" : "150px", zIndex: 7 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </>
      )}

      {/* Win95 portfolio window */}
      {pfWinOpen && (
        <PortfolioWin95Window
          items={
            pfItems.length > 0
              ? pfItems.map((it) => ({ type: it.type, src: it.src }))
              : PORTFOLIO_SAMPLES.map((x) =>
                  x.type === "image" ? ({ type: "image" as const, src: x.src }) : ({ type: "video" as const, src: x.src })
                )
          }
          onClose={() => setPfWinOpen(false)}
        />
      )}

      {/* taskbar */}
      <ClassicTaskbar onStart={() => navigate("/lab")} />
    </div>
  );
}
