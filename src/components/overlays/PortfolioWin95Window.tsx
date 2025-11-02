// src/components/overlays/PortfolioWin95Window.tsx
import React from "react";

export function PortfolioWin95Window({
  items,
  onClose,
}: {
  items: { type: "image" | "video"; src: string }[];
  onClose: () => void;
}) {
  const bevelUp: React.CSSProperties = { borderTop:"1px solid #fff", borderLeft:"1px solid #fff", borderRight:"1px solid #404040", borderBottom:"1px solid #404040" };
  const bevelDown: React.CSSProperties = { borderTop:"1px solid #808080", borderLeft:"1px solid #808080", borderRight:"1px solid #fff", borderBottom:"1px solid #fff" };
  const [viewer, setViewer] = React.useState<number | null>(null);

  const next = React.useCallback(() => setViewer(v => v===null ? 0 : (v+1) % items.length), [items.length]);
  const prev = React.useCallback(() => setViewer(v => v===null ? 0 : (v-1+items.length) % items.length), [items.length]);

  return (
    <div className="fixed inset-0 z-[210] bg-black/45">
      {/* Title bar */}
      <div className="fixed left-0 right-0 top-0 h-7 flex items-center justify-between px-2 select-none"
           style={{ background:"#000080", borderBottom:"1px solid #000040", color:"#fff" }}>
        <div className="text-[12px]">My Work</div>
        <button onClick={onClose} className="h-5 w-5 grid place-items-center text-black bg-[#c0c0c0]" style={{ ...bevelUp, lineHeight:"1" }} aria-label="Close" title="Close">×</button>
      </div>

      {/* Fill viewport below title bar */}
      <div className="fixed left-0 right-0 bottom-0 top-7 bg-[#c0c0c0]" style={{ ...bevelDown }}>
        {/* faux menu strip */}
        <div className="px-2 py-1 text-[12px] flex items-center gap-3"
             style={{ background:"#dfdfdf", borderBottom:"1px solid #a0a0a0", color:"#000" }}>
          <span>File</span><span>Edit</span><span>View</span><span>Help</span>
        </div>

        {/* Scrollable content area */}
        <div className="absolute left-0 right-0 bottom-0 top-[28px] overflow-auto">
          <div className="mx-auto max-w-[1400px] p-3">
            <div className="grid gap-4"
                 style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              {items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setViewer(i)}
                  className="rounded-[6px] overflow-hidden bg-transparent border border-[#9a9a9a]/40 hover:border-[#000] transition-colors"
                  title={`work ${i+1}`}
                >
                  <div className="w-full h-40 grid place-items-center bg-[#e7e7e7]">
                    {it.type === "image" ? (
                      <img src={it.src} alt="" className="max-w-full max-h-full object-contain" loading="lazy" decoding="async"/>
                    ) : (
                      <video src={it.src} className="max-w-full max-h-full object-contain" muted autoPlay loop playsInline />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-black/80 text-center">
              Double-click (tap) an icon to preview. Close returns to the scene.
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen viewer with arrows */}
      {viewer !== null && (
        <div className="fixed inset-0 z-[220] bg-black/85 grid place-items-center">
          <button className="absolute right-6 top-6 h-9 px-3 rounded bg-white/15 text-white" onClick={() => setViewer(null)} title="Close">Close</button>
          <button className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white text-2xl" onClick={prev} aria-label="Previous">‹</button>
          <button className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center rounded-full bg-white/10 text-white text-2xl" onClick={next} aria-label="Next">›</button>
          <div className="max-w-[92vw] max-h-[84vh]">
            {items[viewer].type === "image" ? (
              <img src={items[viewer].src} alt="" className="max-w-[92vw] max-h-[84vh] object-contain"/>
            ) : (
              <video src={items[viewer].src} className="max-w-[92vw] max-h-[84vh] object-contain" autoPlay muted loop playsInline />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
