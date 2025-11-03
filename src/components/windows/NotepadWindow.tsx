import React from "react";
import { NOTEPAD_CHROME } from "@/lib/assets";

export function NotepadWindow({ onClose }: { onClose: () => void }) {
  // ── Win95 bevel styles
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

  // ── Width & positioning
  const [winWidth, setWinWidth] = React.useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    return Math.min(560, Math.max(300, w - 32));
  });

  React.useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setWinWidth(Math.min(560, Math.max(300, w - 32)));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [pos, setPos] = React.useState<{ x: number; y: number }>(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const width = Math.min(560, Math.max(300, w - 32));
    return { x: Math.max(8, (w - width) / 2), y: 80 };
  });

  React.useEffect(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    setPos((p) => ({ ...p, x: Math.max(8, (w - winWidth) / 2) }));
  }, [winWidth]);

  const dragging = React.useRef<{ ox: number; oy: number } | null>(null);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        x: Math.max(0, e.clientX - dragging.current.ox),
        y: Math.max(0, e.clientY - dragging.current.oy),
      });
    };
    const onUp = () => (dragging.current = null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    dragging.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
  };

  // Esc to close
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/35"
      onMouseDown={onClose}
      aria-modal
      role="dialog"
    >
      <div
        className="fixed"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          ...bevelDown,
          width: winWidth,
          left: pos.x,
          top: pos.y,
          background: "#c0c0c0",
          // Soft outer drop shadow so it lifts off the page a bit
          boxShadow:
            "0 2px 0 #000, 0 4px 0 #000, 0 6px 12px rgba(0,0,0,0.35)",
        }}
      >
        {/* Title bar */}
        <div
          onMouseDown={startDrag}
          className="h-7 flex items-center justify-between px-2 select-none"
          style={{
            background:
              "linear-gradient(90deg, #000080 0%, #0000a8 35%, #0000d0 100%)",
            borderBottom: "1px solid #000040",
            color: "#fff",
            textShadow: "1px 1px 0 #000",
          }}
        >
          <div className="text-[12px] font-bold tracking-wide">
            Notepad - contact.txt
          </div>
          <button
            onClick={onClose}
            className="h-5 w-5 grid place-items-center text-black bg-[#c0c0c0]"
            style={{ ...bevelUp, lineHeight: "1" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Menu strip (purely visual) */}
        <div
          className="px-2 text-[12px] h-6 flex items-center gap-4 select-none"
          style={{ background: "#dfdfdf", borderBottom: "1px solid #a0a0a0" }}
        >
        </div>

        {/* Paper area */}
        <div
          className="relative"
          style={{
            background: "#ffffff",
            minHeight: 184,
            // Subtle inset to mimic Notepad text area well
            boxShadow: "inset 0 0 0 1px #e5e5e5, inset 0 0 32px rgba(0,0,0,0.03)",
          }}
        >
          {/* chrome watermark kept extra faint so text pops */}
          <img
            src={NOTEPAD_CHROME}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none select-none"
          />
          <div
            className="relative"
            style={{
              padding: "14px 16px 18px 16px",
              // A readable mono for the Notepad vibe
              fontFamily:
                "'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
              fontSize: 14,
              lineHeight: "22px",
              color: "#111",
              // keep crisp on Windows-like rendering
              WebkitFontSmoothing: "none",
              MozOsxFontSmoothing: "auto",
            }}
          >
            <div style={{ marginBottom: 6 }}>
              contact —{" "}
              <a
                href="mailto:contact@kabuto.studio"
                className="underline"
                style={{
                  color: "#0000EE", // classic link blue
                }}
              >
                contact@kabuto.studio
              </a>
            </div>
            <div style={{ marginBottom: 6 }}>
              discord: <span style={{ color: "#222" }}>kabuto.</span>
            </div>
            <div>
              IG —{" "}
              <a
                href="https://instagram.com/kbt2k"
                target="_blank"
                rel="noreferrer"
                className="underline"
                style={{ color: "#0000EE" }}
              >
                kbt2k
              </a>
            </div>

            {/* hover/focus treatment for accessibility */}
            <style>{`
              a:hover { text-decoration: underline; filter: brightness(0.85); }
              a:focus { outline: 1px dotted #000; outline-offset: 2px; }
              a:visited { color: #551A8B; } /* Win95 purple */
            `}</style>
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
          <span className="text-[11px]">Windows™ 95</span>
        </div>
      </div>
    </div>
  );
}
