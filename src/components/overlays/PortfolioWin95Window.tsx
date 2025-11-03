import React from "react";

type Item = { type: "image" | "video"; src: string };

function useMediaPreload(items: Item[]) {
  React.useEffect(() => {
    const loaders = items.map((it) =>
      it.type === "image"
        ? new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.loading = "eager";
            img.src = it.src;
            img.onload = img.onerror = () => resolve();
          })
        : new Promise<void>((resolve) => {
            const v = document.createElement("video");
            v.preload = "metadata";
            v.src = it.src;
            v.onloadedmetadata = v.onerror = () => resolve();
          })
    );
    void Promise.all(loaders);
  }, [items]);
}

export function PortfolioWin95Window({
  items,
  onClose,
}: {
  items: Item[];
  onClose: () => void;
}) {
  // subtle Win95-ish bevels
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

  // preload media so the viewer opens instantly
  useMediaPreload(items);

  const [viewer, setViewer] = React.useState<number | null>(null);

  const next = React.useCallback(
    () => setViewer((v) => (v === null ? 0 : (v + 1) % items.length)),
    [items.length]
  );
  const prev = React.useCallback(
    () => setViewer((v) => (v === null ? 0 : (v - 1 + items.length) % items.length)),
    [items.length]
  );

  // keyboard navigation in viewer
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

  // Uniform thumbnails (matches your reference)
  const TILE_W = 260; // px (adjust as you like)
  const TILE_RATIO = 4 / 3;

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

      {/* Body fills viewport */}
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

        {/* Scrollable content */}
        <div className="absolute left-0 right-0 bottom-0 top-[28px] overflow-auto">
          <div className="mx-auto max-w-[1600px] px-6 pt-5 pb-12">
            <div
              className="grid gap-6 justify-start"
              style={{ gridTemplateColumns: `repeat(auto-fill, ${TILE_W}px)` }}
            >
              {items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setViewer(i)}
                  title={`work ${i + 1}`}
                  className="rounded-[10px] overflow-hidden bg-white/80 border border-black/15 shadow-[0_2px_12px_rgba(0,0,0,.15)] hover:shadow-[0_4px_18px_rgba(0,0,0,.25)] transition-shadow focus:outline-none focus:ring-2 focus:ring-black/50"
                  style={{ width: TILE_W, aspectRatio: `${TILE_RATIO}` }}
                >
                  <div className="w-full h-full p-1.5">
                    {it.type === "image" ? (
                      <img
                        src={it.src}
                        alt=""
                        className="w-full h-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <video
                        src={it.src}
                        className="w-full h-full object-contain"
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 text-[11px] text-black/80">
              Double-click (tap) an icon to preview. Close returns to the scene.
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen viewer with arrows */}
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

export default PortfolioWin95Window;
