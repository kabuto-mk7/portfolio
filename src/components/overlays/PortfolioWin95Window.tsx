// src/components/overlays/PortfolioWin95Window.tsx
import React from "react";

type Item = { type: "image" | "video"; src: string };

// small-screen heuristic (same breakpoint logic you’ve used elsewhere)
function useIsSmall() {
  const pick = () =>
    typeof window !== "undefined" &&
    (window.innerWidth < 900 || window.innerHeight > window.innerWidth);
  const [small, setSmall] = React.useState(pick);
  React.useEffect(() => {
    const on = () => setSmall(pick());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return small;
}

export default function PortfolioWin95Window({
  items,
  onClose,
}: {
  items: Item[];
  onClose: () => void;
}) {
  const isSmall = useIsSmall();

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
  const next = React.useCallback(
    () => setViewer((v) => (v === null ? 0 : (v + 1) % items.length)),
    [items.length]
  );
  const prev = React.useCallback(
    () => setViewer((v) => (v === null ? 0 : (v - 1 + items.length) % items.length)),
    [items.length]
  );

  // keyboard while viewing
  React.useEffect(() => {
    if (viewer === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, next, prev]);

  /* ── Layout tuning (desktop vs mobile) ───────────────────────────────── */
  // Desktop (keeps your current look)
  const DESKTOP = {
    MAX_THUMB_H: "clamp(90px, 14vh, 160px)",
    MAX_WRAP_W: "1760px",
    PAD_X: 48,
    GAP_X: 40, // tailwind gap-x-10
    GAP_Y: 56, // tailwind gap-y-14
  };

  // Mobile (denser rows + smaller margins)
  const MOBILE = {
    // slightly smaller height => more per row; vw keeps consistency across devices
    MAX_THUMB_H: "clamp(74px, 22vw, 120px)",
    MAX_WRAP_W: "1000px", // doesn’t really matter; we center anyway
    PAD_X: 12,
    GAP_X: 14,
    GAP_Y: 22,
  };

  const L = isSmall ? MOBILE : DESKTOP;

  // ── Touch swipe in fullscreen viewer ───────────────────────────────────
  const touchRef = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t0 = touchRef.current;
    const t = e.changedTouches[0];
    const dx = t.clientX - t0.x;
    const dy = t.clientY - t0.y;
    const dt = Date.now() - t0.t;
    const absX = Math.abs(dx),
      absY = Math.abs(dy);
    if (dt < 600 && absX > 40 && absX > absY) {
      if (dx < 0) next();
      else prev();
    }
    touchRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-[210] bg-black/45">
      {/* Title bar */}
      <div
        className="fixed left-0 right-0 top-0 h-7 flex items-center justify-between px-2 select-none"
        style={{ background: "#000080", borderBottom: "1px solid #000040", color: "#fff" }}
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

      {/* Body */}
      <div className="fixed left-0 right-0 bottom-0 top-7 bg-[#c0c0c0]" style={{ ...bevelDown }}>
        {/* Menu strip */}
        <div
          className="px-2 py-1 text-[12px] flex items-center gap-3"
          style={{ background: "#dfdfdf", borderBottom: "1px solid #a0a0a0", color: "#000" }}
        >
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Help</span>
        </div>

        {/* Scroll area */}
        <div className="absolute left-0 right-0 bottom-0 top-[28px] overflow-auto">
          <div
            className="mx-auto w-full"
            style={{
              maxWidth: L.MAX_WRAP_W,
              paddingLeft: L.PAD_X,
              paddingRight: L.PAD_X,
              paddingTop: isSmall ? 16 : 24,
              paddingBottom: isSmall ? 48 : 64,
            }}
          >
            <div
              // we can’t use responsive tailwind gap utilities here because values are dynamic,
              // so we apply them inline:
              className="flex flex-wrap items-start justify-center"
              style={
                {
                  ["--max-thumb-h" as any]: L.MAX_THUMB_H,
                  gap: `${L.GAP_Y}px ${L.GAP_X}px`,
                } as React.CSSProperties
              }
            >
              {items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setViewer(i)}
                  title={`work ${i + 1}`}
                  className="group relative inline-flex items-center justify-center outline-none"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-[10px] ring-0 ring-black/0 group-hover:ring-2 group-hover:ring-black/20 transition" />
                  {it.type === "image" ? (
                    <img
                      src={it.src}
                      alt=""
                      className="block w-auto h-auto max-h-[var(--max-thumb-h)] object-contain rounded-[10px]
                                 shadow-[0_6px_18px_rgba(0,0,0,.22)] group-hover:shadow-[0_10px_26px_rgba(0,0,0,.32)] transition-shadow"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  ) : (
                    <video
                      src={it.src}
                      className="block w-auto h-auto max-h-[var(--max-thumb-h)] object-contain rounded-[10px]
                                 shadow-[0_6px_18px_rgba(0,0,0,.22)] group-hover:shadow-[0_10px_26px_rgba(0,0,0,.32)] transition-shadow"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen viewer (now swipeable) */}
      {viewer !== null && (
        <div
          className="fixed inset-0 z-[220] bg-black/85 grid place-items-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            className="absolute right-6 top-6 h-9 px-3 rounded bg-white/15 text-white"
            onClick={() => setViewer(null)}
            title="Close"
          >
            Close
          </button>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white text-2xl"
            onClick={prev}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white text-2xl"
            onClick={next}
            aria-label="Next"
          >
            ›
          </button>
          <div className="max-w-[92vw] max-h-[84vh]">
            {items[viewer].type === "image" ? (
              <img
                src={items[viewer].src}
                alt=""
                className="max-w-[92vw] max-h-[84vh] object-contain"
              />
            ) : (
              <video
                src={items[viewer].src}
                className="max-w-[92vw] max-h-[84vh] object-contain"
                autoPlay
                muted
                loop
                playsInline
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
