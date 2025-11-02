import { NOTEPAD_CHROME } from "@/lib/assets";
import React from "react";

export function NotepadWindow({ onClose }: { onClose: () => void }) {
  const bevelUp: React.CSSProperties = { borderTop:"1px solid #fff", borderLeft:"1px solid #fff", borderRight:"1px solid #404040", borderBottom:"1px solid #404040" };
  const bevelDown: React.CSSProperties = { borderTop:"1px solid #808080", borderLeft:"1px solid #808080", borderRight:"1px solid #fff", borderBottom:"1px solid #fff" };

  const [pos, setPos] = React.useState<{x:number;y:number}>(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    return { x: Math.max(8, (w - 520) / 2), y: 80 };
  });
  const dragging = React.useRef<{ox:number; oy:number} | null>(null);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos(p => ({ x: Math.max(0, e.clientX - dragging.current!.ox), y: Math.max(0, e.clientY - dragging.current!.oy) }));
    };
    const onUp = () => (dragging.current = null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    dragging.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/30" onMouseDown={() => {}}>
      <div className="bg-[#c0c0c0] fixed" style={{ ...bevelDown, width:520, left:pos.x, top:pos.y }} onMouseDown={(e)=>e.stopPropagation()}>
        <div onMouseDown={startDrag} className="h-7 flex items-center justify-between px-2 select-none"
             style={{ background:"#000080", borderBottom:"1px solid #000040", color:"#fff" }}>
          <div className="text-[12px]">Notepad - contact.txt</div>
          <button onClick={onClose} className="h-5 w-5 grid place-items-center text-black bg-[#c0c0c0]" style={{ ...bevelUp, lineHeight:"1" }} aria-label="Close">×</button>
        </div>
        <div className="px-2 py-1 text-[12px]" style={{ background:"#dfdfdf", borderBottom:"1px solid #a0a0a0" }}>
          <span className="mr-4">File</span><span className="mr-4">Edit</span><span className="mr-4">Format</span><span className="mr-4">View</span><span>Help</span>
        </div>
        <div className="relative" style={{ background:"#ffffff", minHeight:160 }}>
          <img src={NOTEPAD_CHROME} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.10] pointer-events-none select-none"/>
          <div className="relative p-3 text-[13px] leading-6 text-black">
            <div>contact – <a href="mailto:contact@kabuto.studio" className="text-[#0645ad] underline">contact@kabuto.studio</a></div>
            <div>discord: kabuto.</div>
            <div>IG – <a href="https://instagram.com/kbt2k" target="_blank" rel="noreferrer" className="text-[#0645ad] underline">kbt2k</a></div>
          </div>
        </div>
        <div className="h-6 px-2 text-[12px] flex items-center" style={{ background:"#dfdfdf", borderTop:"1px solid #a0a0a0", color:"#404040" }}>Ready</div>
      </div>
    </div>
  );
}
