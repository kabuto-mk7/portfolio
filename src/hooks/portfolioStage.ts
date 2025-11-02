import React from "react";

/** 1920×1080 stage mapper: computes scale + offsets to center the stage */
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

/** Alpha-hit hover using pre-rendered canvases per-person silhouette */
export function useAlphaHover(
  persons: Person[],
  anchor: { scale: number; ox: number; oy: number }
) {
  const canv = React.useRef<Record<string, CanvasRenderingContext2D | null>>({});
  const [hover, setHover] = React.useState<string | null>(null);

  // Build alpha canvases once per person image
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

  // Hit-test mouse against alpha
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX - anchor.ox) / anchor.scale;
      const y = (e.clientY - anchor.oy) / anchor.scale;
      if (x < 0 || y < 0 || x >= 1920 || y >= 1080) { setHover(null); return; }
      let hit: string | null = null;
      for (const p of persons) {
        const cx = canv.current[p.key]; if (!cx) continue;
        const a = cx.getImageData((x | 0), (y | 0), 1, 1).data[3];
        if (a > 10) { hit = p.key; break; }
      }
      setHover(hit);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [persons, anchor.ox, anchor.oy, anchor.scale]);

  return hover;
}

/**
 * Weapon sway that respects the 1920×1080 stage (scale/offsets) and eases smoothly.
 * Returns pixel translation { tx, ty } to apply to your viewmodel image.
 */
export function useWeaponSway(
  anchor: { scale: number; ox: number; oy: number },
  enabled = true,
  opts: { ampX?: number; ampY?: number; smooth?: number } = {}
) {
  const { ampX = 46, ampY = 22, smooth = 0.18 } = opts;
  const [txTy, setTxTy] = React.useState({ tx: 0, ty: 0 });

  React.useEffect(() => {
    if (!enabled) { setTxTy({ tx: 0, ty: 0 }); return; }

    // target in normalized stage coords (-1..1 around center)
    const target = { x: 0, y: 0 };
    const state  = { x: 0, y: 0 };

    const toStage = (clientX: number, clientY: number) => {
      // map to stage pixels (0..1920, 0..1080)
      const sx = (clientX - anchor.ox) / anchor.scale;
      const sy = (clientY - anchor.oy) / anchor.scale;
      // center at (960,540) and normalize to [-1,1]
      const nx = Math.max(-1, Math.min(1, (sx - 960) / 960));
      const ny = Math.max(-1, Math.min(1, (sy - 540) / 540));
      return { nx, ny, inBounds: sx >= 0 && sy >= 0 && sx <= 1920 && sy <= 1080 };
    };

    const onMove = (e: MouseEvent) => {
      const s = toStage(e.clientX, e.clientY);
      if (!s.inBounds) { target.x = 0; target.y = 0; return; }
      target.x = s.nx; target.y = s.ny;
    };

    let raf = 0;
    const tick = () => {
      state.x += (target.x - state.x) * smooth;
      state.y += (target.y - state.y) * smooth;
      setTxTy({ tx: state.x * ampX, ty: state.y * ampY });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [anchor.ox, anchor.oy, anchor.scale, enabled, ampX, ampY, smooth]);

  return txTy;
}
