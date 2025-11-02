import React from "react";

export function PortfolioWin95Window({
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

  // Navigate to previous item in the gallery (wrap around)
  const prevItem = () => {
    setViewer((idx) =>
      idx === null ? 0 : (idx - 1 + items.length) % items.length
    );
  };

  // Navigate to next item in the gallery (wrap around)
  const nextItem = () => {
    setViewer((idx) =>
      idx === null ? 0 : (idx + 1) % items.length
    );
  };

  return (
    <div className="fixed inset-0 z-[210] bg-black/45">
      {/* Full‑screen Win95 window */}
      <div
        className="fixed inset-0 bg-[#c0c0c0] shadow-[0_20px_80px_rgba(0,0,0,.6)] overflow-hidden"
        style={{
          ...bevelDown,
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto", // Title bar, menu bar, content, status bar
        }}
      >
        {/* Title bar */}
        <div
          className="h-7 flex items-center justify-between px-2 select-none"
          style={{
            background: "#000080",
            borderBottom: "1px solid #000040",
            color: "#fff",
          }}
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

        {/* Menu bar */}
        <div
          className="px-2 py-1 text-[12px] flex items-center gap-3"
          style={{
            background: "#dfdfdf",
            borderBottom: "1px solid #a0a0a0",
            color: "#000",
          }}
        >
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Help</span>
        </div>

        {/* Content area with responsive grid */}
        <div
          className="p-3 overflow-auto"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            justifyItems: "center",
            alignItems: "start",
          }}
        >
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setViewer(i)}
              title={`work ${i + 1}`}
              className="rounded-[4px] border border-[#7b7b7b] p-2 overflow-hidden"
              style={{
                boxShadow:
                  "inset -1px -1px #808080, inset 1px 1px #ffffff",
              }}
            >
              {it.type === "image" ? (
                <img
                  src={it.src}
                  alt=""
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <video
                  src={it.src}
                  className="w-full h-auto object-contain"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
            </button>
          ))}
          {/* Helper text spanning all columns */}
          <div
            style={{ gridColumn: "1 / -1" }}
            className="mt-2 text-[11px] text-black/80 text-center"
          >
            Double‑click (tap) an icon to preview. Close returns to the scene.
          </div>
        </div>

        {/* Status bar */}
        <div
          className="h-6 px-2 text-[12px] flex items-center justify-between"
          style={{
            background: "#dfdfdf",
            borderTop: "1px solid #a0a0a0",
            color: "#404040",
          }}
        >
          <span>Ready</span>
          <span>Items: {items.length}</span>
        </div>
      </div>

      {/* Viewer overlay with navigation arrows */}
      {viewer !== null && (
        <div className="fixed inset-0 z-[220] bg-black/80 grid place-items-center">
          {/* Close viewer */}
          <button
            className="absolute right-6 top-6 h-9 px-3 rounded bg-white/15 text-white"
            onClick={() => setViewer(null)}
            title="Close"
          >
            Close
          </button>

          {/* Navigation arrows (show only if more than one item) */}
          {items.length > 1 && (
            <>
              <button
                onClick={prevItem}
                aria-label="Previous"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white text-2xl flex items-center justify-center"
              >
                ‹
              </button>
              <button
                onClick={nextItem}
                aria-label="Next"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white text-2xl flex items-center justify-center"
              >
                ›
              </button>
            </>
          )}

          {/* Current item preview */}
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
