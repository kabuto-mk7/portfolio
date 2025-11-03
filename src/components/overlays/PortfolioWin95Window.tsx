import React from "react";

type Item = { type: "image" | "video"; src: string };

/* (kept) ratio probe — still useful for the fullscreen viewer,
   but NOT used to size the grid tiles anymore */
function useMediaRatios(items: Item[]) {
  const [ratios, setRatios] = React.useState<(number | null)[]>(
    () => items.map(() => null)
  );

  React.useEffect(() => {
    let alive = true;

    const loaders = items.map((it, i) => {
      if (it.type === "image") {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.loading = "eager";
          img.src = it.src;
          img.onload = () => {
            if (!alive) return;
            setRatios((prev) => {
              const next = [...prev];
              next[i] =
                img.naturalWidth && img.naturalHeight
                  ? img.naturalWidth / img.naturalHeight
                  : 1.6;
              return next;
            });
            resolve();
          };
          img.onerror = () => resolve();
        });
      } else {
        return new Promise<void>((resolve) => {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.src = it.src;
          const done = () => {
            if (!alive) return resolve();
            const r =
              v.videoWidth && v.videoHeight
                ? v.videoWidth / v.videoHeight
                : 16 / 9;
            setRatios((prev) => {
              const next = [...prev];
              next[i] = r;
              return next;
            });
            resolve();
          };
          v.onloadedmetadata = done;
          v.onerror = () => resolve();
        });
      }
    });

    void Promise.all(loaders);
    return () => {
      alive = false;
    };
  }, [items]);

  return ratios;
}

export function PortfolioWin95Window({
  items,
  onClose,
}: {
  items: Item[];
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
  const ratios = useMediaRatios(items); // used for fullscreen viewer only

  const next = React.useCallback(
    () => setViewer((v) => (v === null ? 0 : (v + 1) % items.length)),
    [items.length]
  );
  const prev = React.useCallback(
    () => setViewer((v) => (v === null ? 0 : (v - 1 + items.length) % items.length)),
    [items.length]
  );

  // uniform tile sizing (matches img 2 look)
  const TILE_W = 260;            // px
  const TILE_RATIO = 4 / 3;      // 4:3 like classic thumbnails

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

        {/* Scrollable content; left-aligned neat grid */}
        <div className="absolute left-0 right-0 bottom-0 top-[28px] overflow-auto">
          <div className="mx-auto max-w-[1600px] px-6 pt-5 pb-12">
            <div
              className="grid gap-6 justify-start"
              style={{
                gridTemplateColumns: `repeat(auto-fill, ${TILE_W}px)`,
              }}
            >
              {items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setViewer(i)}
                  title={`work ${i + 1}`}
                  className="rounded-[10px] overflow-hidden bg-white/80 border border-black/15 shadow-[0_2px_12px_rgba(0,0,0,.15)] hover:shadow-[0_4px_18px_rgba(0,0,0,.25)] transition-shadow focus:outline-none focus:ring-2 focus:ring-black/50"
                  style={{
                    width: TILE_W,
                    aspectRatio: `${TILE_RATIO}`, // UNIFORM tile ratio
                  }}
                >
                  {/* media is contained; no stretching; small padding for the framed look */}
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
