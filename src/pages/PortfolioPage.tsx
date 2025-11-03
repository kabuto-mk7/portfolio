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
import sticky from "/assets/kabuto/ui/sticky.png";
import cracked from "/assets/kabuto/ui/cracked.jpg";
import tape from "/assets/kabuto/ui/tape.png";
const selfPNG = "/assets/kabuto/portfolio/self.png";

type PadMode = "portfolio" | "rates" | "contact" | null;

/** Portrait background used only as a FULL-VIEWPORT UNDERLAY on mobile. */
const BG_MOBILE = "/assets/kabuto/portfolio/bg-mobile.jpeg";
/** Your iPhone X mock image (adjust if your path differs). */
const IPHONE_X = "/assets/kabuto/ui/iphoneX.png";

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

/** Disable page scrolling while mounted. */
function useNoScroll(active: boolean = true) {
  React.useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOB = html.style.overscrollBehavior;
    const prevBodyOB = body.style.overscrollBehavior;
    const prevTouch = body.style.touchAction;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    body.style.touchAction = "none";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevHtmlOB;
      body.style.overscrollBehavior = prevBodyOB;
      body.style.touchAction = prevTouch;
    };
  }, [active]);
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

/* ──────────────────────────────────────────────────────────────────────────
   MOBILE CONTACT STICKY (no legibility panel; add taped photo below)
───────────────────────────────────────────────────────────────────────────*/
function MobileContactSticky() {
  usePreloadImages([sticky, cracked, tape, selfPNG]);

  const WRAP_MAX = "360px";
  const WRAP_MIN = "240px";
  const BG_SCALE = 1;

  return (
    <div className="relative w-full h-full flex items-start justify-center p-3">
      {/* Rotated cracked BG filling screen */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            width: `${BG_SCALE * 100}%`,
            height: `${BG_SCALE * 100}%`,
            transform: "translate(-50%, -50%) rotate(180deg)",
            transformOrigin: "center center",
            backgroundImage: `url(${cracked})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(.9)",
          }}
        />
      </div>

      {/* Subtle global darken */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1, background: "rgba(0,0,0,.15)" }}
      />

      {/* Content stack */}
      <div
        className="relative"
        style={{ zIndex: 2, width: `clamp(${WRAP_MIN}, 92%, ${WRAP_MAX})` }}
      >
        {/* Sticky note */}
        <div className="relative">
          <img
            src={sticky}
            alt="sticky note"
            className="w-full h-auto block select-none pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,.45)]"
            draggable={false}
          />
          {/* Text directly on the sticky (no white square) */}
          <div
            className="absolute inset-0"
            style={{
              padding: "75px 30px 28px 24px",
              color: "#171717",
              fontWeight: 600,
              fontSize: "clamp(13px, 3vw, 16px)",
              lineHeight: 1.5,
              WebkitFontSmoothing: "antialiased",
              textRendering: "optimizeLegibility",
              // light halo for texture without obvious box
              textShadow: "0 1px 0 rgba(255,255,255,.45), 0 0 1px rgba(0,0,0,.2)",
            }}
          >
            <div className="space-y-2">
              <div>
                <a
                  className="underline"
                  href="mailto:contact@kabuto.studio"
                  style={{ color: "#0b1220", fontWeight: 700 }}
                >
                  contact@kabuto.studio
                </a>
              </div>
              <div>discord: kabuto.</div>
              <div>
                IG —{" "}
                <a
                  href="https://instagram.com/kbt2k"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  style={{ color: "#0b1220", fontWeight: 700 }}
                >
                  @kbt2k
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Photo with duct tape BELOW the post-it */}
        <div className="relative mx-auto mt-4" style={{ width: "min(86%, 300px)" }}>
          <img
            src={selfPNG}
            alt="profile"
            loading="lazy"
            decoding="async"
            className="w-full h-auto rounded-[10px] object-cover border border-white/25 shadow-[0_8px_26px_rgba(0,0,0,.55)] bg-black/20"
          />
          <img
            src={tape}
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: "50%",
              top: "-30%",
              transform: "translateX(-50%) rotate(-8deg)",
              width: "64%",
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.55))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Mobile iPhone overlay — ONLY for 'rates' and 'contact'
───────────────────────────────────────────────────────────────────────────*/
function IPhonePadOverlay({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const SCREEN_INSETS = {
    left:  "10.2%",
    right: "35%",
    top:   "1.8%",
    bottom:"29.0%",
  };

  const SCREEN_BG = "#0b0b0b";

  return (
    <>
      <div
        className="fixed inset-0"
        style={{
          zIndex: 20,
          background: "rgba(0,0,0,.5)",
          opacity: visible ? 1 : 0,
          transition: "opacity 360ms ease",
        }}
        onClick={onClose}
      />

      <div
        className="fixed inset-x-0 bottom-0"
        style={{
          zIndex: 21,
          transform: `translateY(${visible ? "0%" : "104%"})`,
          transition: "transform 420ms cubic-bezier(.22,.61,.36,1)",
        }}
      >
        <div
          className="relative mx-auto"
          style={{
            width: "min(520px, 94vw)",
            maxHeight: "86vh",
            marginBottom: "1.5vh",
            filter: "drop-shadow(0 24px 60px rgba(0,0,0,.55))",
          }}
        >
          {/* Screen content behind PNG */}
          <div
            className="absolute"
            style={{
              zIndex: 21,
              left: "10.2%",
              right: "35%",
              top: "1.8%",
              bottom: "29.0%",
              overflow: "hidden",
              borderRadius: 24,
              background: SCREEN_BG,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: "100%",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {children}
            </div>
          </div>

          <img
            src={IPHONE_X}
            alt=""
            className="block select-none"
            draggable={false}
            style={{
              zIndex: 22,
              position: "relative",
              width: "100%",
              height: "auto",
              pointerEvents: "none",
            }}
          />

          <button
            onClick={onClose}
            className="absolute h-8 w-8 grid place-items-center rounded-full bg-black/70 text-white text-[14px] shadow-[0_2px_10px_rgba(0,0,0,.4)] hover:bg-black/80"
            style={{ top: "5%", right: "6%", zIndex: 23 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="h-2" />
      </div>
    </>
  );
}

export function PortfolioPage() {
  useNoScroll(true);

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

  usePreloadImages([BG, BG_MOBILE, OV, P1, P2, P3, IPAD, PF_VIEWMODEL, IPHONE_X]);

  const isSmall = useIsSmall();

  const base = React.useMemo(() => ({ x: 50, y: 10, w: 1920, h: 1080 }), []);

  const MOBILE_ZOOM = 1.12;
  const MOBILE_PAN_X = 10;
  const MOBILE_PAN_Y = 0;
  const MOBILE_SCALE_MUL = 0.55;

  const focus = React.useMemo(
    () => (isSmall ? buildFocus(base, MOBILE_ZOOM, MOBILE_PAN_X, MOBILE_PAN_Y) : undefined),
    [isSmall]
  );

  const m = useStageAnchor({
    focus,
    scaleMul: isSmall ? MOBILE_SCALE_MUL : 1,
    backfill: isSmall ? true : false,
  });

  const [pad, setPad] = React.useState<PadMode>(null);
  const [padVisible, setPadVisible] = React.useState(false);
  const [gunDown, setGunDown] = React.useState(false);
  const anim = React.useRef(false);

  const baseLift = isSmall ? -120 : 0;

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

  const { tx, ty } = useWeaponSway(m, true, { ampX: 46, ampY: 22, smooth: 0.18 });

  const [pfWinOpen, setPfWinOpen] = React.useState(false);

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

  const persons = React.useMemo(
    () => [
      { key: "rates" as const, src: P1, onClick: () => openPad("rates") },
      { key: "portfolio" as const, src: P2, onClick: () => { fire(); setPfWinOpen(true); } },
      { key: "contact" as const, src: P3, onClick: () => openPad("contact") },
    ],
    []
  );

  const { hover, pickAt } = useAlphaHover(persons as any, m);

  const stageFeatherMask = isSmall
    ? {
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 8%, rgba(0,0,0,1) 92%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 8%, rgba(0,0,0,1) 92%, rgba(0,0,0,0) 100%)",
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      } as React.CSSProperties
    : undefined;

  const useIPhoneOverlay = isSmall && (pad === "rates" || pad === "contact");

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: "#000",
        overscrollBehavior: "none",
        height: "100dvh",
      }}
    >
      {/* Mobile underlay */}
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
          zIndex: 2,
          ...(stageFeatherMask || {}),
        }}
      >
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

      {/* Weapon */}
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
            transform: `translateY(${gunDown ? 520 : 0}px) scale(${isSmall ? 1.18 : 1})`,
            transition: "transform 420ms cubic-bezier(.22,.61,.36,1)",
          }}
        />
      </div>

      {/* Mobile iPhone overlay for rates/contact */}
      {useIPhoneOverlay && (
        <IPhonePadOverlay visible={padVisible} onClose={closePad}>
          {pad === "rates" && <RatesPadContent />}
          {pad === "contact" && <MobileContactSticky />}
        </IPhonePadOverlay>
      )}

      {/* iPad overlay (desktop + mobile for portfolio) */}
      {pad && !useIPhoneOverlay && (
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
