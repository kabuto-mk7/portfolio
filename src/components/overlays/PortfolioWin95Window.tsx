// src/components/overlays/PortfolioWin95Window.tsx
import React from "react";

type Item = { type: "image" | "video"; src: string };

export default function PortfolioWin95Window({
  items,
  onClose,
}: {
  items: Item[];
  onClose: () => void;
}) {
  // Win95 bevel helpers
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

  // viewer state
  const [viewer, setViewer] = React.useState<number | null>(null);
  const next = React.useCallback(
    () => setViewer((v) => (v === null ? 0 : (v + 1) % items.length)),
    [items.length]
  );
  const prev = React.useCallback(
    () => setViewer((v) => (v === null ? 0 : (v - 1 + items.length) % items.length)),
    [items.length]
  );

  // keyboard controls while viewing
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

  // --- Row height: equal row height, varied widths (Apple Photos look)
  // tweak as you like; clamp keeps it responsive
  const ROW_H = "clamp(120px, 18vh, 200px)";

  return (
    <div className="fixed inset-0 z-[210] bg-black/45">
      {/* title bar */}
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

      {/* body */}
      <div className="fixed left-0 right-0 bottom-0 top-7 bg-[#c0c0c0]" style={{ ...bevelDown }}>
        {/* menu strip */}
        <div
          className="px-2 py-1 text-[12px] flex items-center gap-3"
          style={{ background: "#dfdfdf", borderBottom: "1px solid #a0a0a0", color: "#000" }}
        >
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Help</span>
        </div>

        {/* scroll area */}
        <div className="absolute left-0 right-0 bottom-0 top-[28px] overflow-auto">
          {/* wrapper is centered on the page and grows up to a max width */}
          <div className="mx-auto w-full max-w-[1680px] px-[40px] pt-6 pb-16">
            {/* FLEX ROWS: equal height, variable width thumbs, top-aligned lines */}
            <div
              className="flex flex-wrap items-start justify-start gap-x-10 gap-y-18"
              style={
                {
                  // a CSS var for row height used by each thumb
                  // (so you can adjust from one place)
                  ["--row-h" as any]: ROW_H,
                } as React.CSSProperties
              }
            >
              {items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setViewer(i)}
                  title={`work ${i + 1}`}
                  className="group relative inline-flex items-stretch justify-center outline-none"
                  style={{
                    height: `var(--row-h)`,
                    // let width be defined by the media's natural aspect (via w-auto on the media)
                    // so each thumbnail keeps its intrinsic ratio
                    borderRadius: 8,
                  }}
                >
                  {/* subtle hover ring like the sample, no card/background */}
                  <span className="pointer-events-none absolute inset-0 rounded-[8px] ring-0 ring-black/0 group-hover:ring-2 group-hover:ring-black/20 transition" />
                  {it.type === "image" ? (
                    <img
                      src={it.src}
                      alt=""
                      className="h-full w-auto object-contain block"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  ) : (
                    <video
                      src={it.src}
                      className="h-full w-auto object-contain block"
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

      {/* fullscreen viewer */}
      {viewer !== null && (
        <div className="fixed inset-0 z-[220] bg-black/85 grid place-items-center">
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
