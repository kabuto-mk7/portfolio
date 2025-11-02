import React from "react";

// 1920×1080 stage mapper
export function useStageAnchor() {
  const [m, setM] = React.useState({ scale: 1, ox: 0, oy: 0 });
  React.useEffect(() => {
    const recalc = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = Math.max(vw / 1920, vh / 1080);
      const rw = 1920 * s, rh = 1080 * s;
      setM({ scale: s, ox: (vw - rw) / 2, oy: (vh - rh) / 2 });
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);
  return m;
}

type Person = { key: "rates" | "portfolio" | "contact"; src: string; onClick: () => void };
// Alpha-hit hover
export function useAlphaHover(persons: Person[], anchor: { scale: number; ox: number; oy: number }) {
  const canv = React.useRef<Record<string, CanvasRenderingContext2D | null>>({});
  const [hover, setHover] = React.useState<string | null>(null);

  React.useEffect(() => {
    persons.forEach((p) => {
      if (canv.current[p.key]) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = p.src;
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 1920; c.height = 1080;
        const cx = c.getContext("2d", { willReadFrequently: true });
        cx?.drawImage(img, 0, 0, 1920, 1080);
        canv.current[p.key] = cx;
      };
    });
  }, [persons]);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX - anchor.ox) / anchor.scale;
      const y = (e.clientY - anchor.oy) / anchor.scale;
      if (x < 0 || y < 0 || x >= 1920 || y >= 1080) { setHover(null); return; }
      let hit: string | null = null;
      for (const p of persons) {
        const cx = canv.current[p.key]; if (!cx) continue;
        const a = cx.getImageData(x | 0, y | 0, 1, 1).data[3];
        if (a > 10) { hit = p.key; break; }
      }
      setHover(hit);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [persons, anchor]);

  return hover;
}
