import { PF_START } from "@/lib/assets";
import React from "react";

export function ClassicTaskbar({ onStart }: { onStart: () => void }) {
  const [time, setTime] = React.useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  React.useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const bevelUp: React.CSSProperties = { borderTop: "1px solid #fff", borderLeft: "1px solid #fff", borderRight: "1px solid #404040", borderBottom: "1px solid #404040" };
  const bevelDown: React.CSSProperties = { borderTop: "1px solid #808080", borderLeft: "1px solid #808080", borderRight: "1px solid #fff", borderBottom: "1px solid #fff" };

  return (
    <div className="absolute left-0 right-0 bottom-0 h-10 flex items-center px-2"
         style={{ background:"#c0c0c0", ...bevelDown, boxShadow:"inset 0 1px 0 #dfdfdf, inset 0 -1px 0 #808080", zIndex:100 }}>
      <button onClick={onStart} className="h-7 px-3 flex items-center gap-2 text-black"
              style={{ background:"#c0c0c0", ...bevelUp, boxShadow:"inset -1px -1px #808080, inset 1px 1px #ffffff" }} title="Start">
        <img src={PF_START} className="h-4 w-4" alt="" />
        <span className="text-[12px] font-bold tracking-wide">kabuto</span>
      </button>
      <div className="ml-auto text-[12px] bg-white/70 px-2 py-1 border border-[#7b7b7b] min-w-[64px] text-right" style={{ color:"#000" }}>
        {time}
      </div>
    </div>
  );
}
