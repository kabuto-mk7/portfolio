import React from "react";

export function PortfolioWin95Window({ items, onClose }: { items: {type:"image"|"video"; src:string}[]; onClose: () => void; }) {
  const bevelUp: React.CSSProperties = { borderTop:"1px solid #fff", borderLeft:"1px solid #fff", borderRight:"1px solid #404040", borderBottom:"1px solid #404040" };
  const bevelDown: React.CSSProperties = { borderTop:"1px solid #808080", borderLeft:"1px solid #808080", borderRight:"1px solid #fff", borderBottom:"1px solid #fff" };
  const [viewer, setViewer] = React.useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-[210] bg-black/45">
      <div className="mx-auto mt-[6vh] bg-[#c0c0c0] shadow-[0_20px_80px_rgba(0,0,0,.6)]" style={{ ...bevelDown, width:"min(980px, 92vw)", maxHeight:"88vh" }}>
        <div className="h-7 flex items-center justify-between px-2 select-none" style={{ background:"#000080", borderBottom:"1px solid #000040", color:"#fff" }}>
          <div className="text-[12px]">My Work</div>
          <button onClick={onClose} className="h-5 w-5 grid place-items-center text-black bg-[#c0c0c0]" style={{ ...bevelUp, lineHeight:"1" }} aria-label="Close" title="Close">×</button>
        </div>
        <div className="px-2 py-1 text-[12px] flex items-center gap-3" style={{ background:"#dfdfdf", borderBottom:"1px solid #a0a0a0", color:"#000" }}>
          <span>File</span><span>Edit</span><span>View</span><span>Help</span>
        </div>
        <div className="p-3 overflow-auto" style={{ maxHeight:"calc(88vh - 56px)" }}>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {items.map((it, i) => (
              <button key={i} onClick={() => setViewer(i)} className="rounded-[4px] bg-white border border-[#7b7b7b] aspect-[4/3] overflow-hidden" title={`work ${i+1}`}
                      style={{ boxShadow:"inset -1px -1px #808080, inset 1px 1px #ffffff" }}>
                <div className="w-full h-full grid place-items-center bg-[#eaeaea]">
                  {it.type === "image" ? (
                    <img src={it.src} alt="" className="max-w-[85%] max-h-[85%] object-contain" loading="lazy" decoding="async"/>
                  ) : (
                    <video src={it.src} className="max-w-[85%] max-h-[85%] object-contain" autoPlay muted loop playsInline />
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-black/80">Double-click (tap) an icon to preview. Close returns to the scene.</div>
        </div>
        <div className="h-6 px-2 text-[12px] flex items-center justify-between" style={{ background:"#dfdfdf", borderTop:"1px solid #a0a0a0", color:"#404040" }}>
          <span>Ready</span><span>Items: {items.length}</span>
        </div>
      </div>

      {viewer !== null && (
        <div className="fixed inset-0 z-[220] bg-black/80 grid place-items-center">
          <button className="absolute right-6 top-6 h-9 px-3 rounded bg-white/15 text-white" onClick={() => setViewer(null)} title="Close">Close</button>
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
