// src/hooks/portfolioStage.ts
import React from "react";


/**
 * 1920×1080 stage mapper with optional mobile focus-crop.
 * - Keeps the logical stage at 1920×1080 for perfect alignment.
 * - On small viewports, centers the given focus rect AND clamps scale so the
 *   stage ALWAYS covers the viewport (no letterboxing).
 */
// src/hooks/portfolioStage.ts
type FocusRect = { x: number; y: number; w: number; h: number };

export function useStageAnchor(opts?: { focus?: FocusRect; scaleMul?: number; backfill?: boolean }) {
  const [m, setM] = React.useState({ scale: 1, ox: 0, oy: 0 });

  React.useEffect(() => {
    const recalc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mul = opts?.scaleMul ?? 1;
      const backfill = !!opts?.backfill;

      const isMobileish = vw < 900 || vh > vw;

      if (isMobileish && opts?.focus) {
        const { x, y, w, h } = opts.focus;

        const coverFocus = Math.max(vw / w, vh / h);
        const coverStage = Math.max(vw / 1920, vh / 1080);

        let s = Math.max(coverFocus, coverStage);
        s = s * mul;

        // If backfill=false, still force cover. If true, allow underfill.
        if (!backfill) s = Math.max(s, coverStage);

        const cx = x + w / 2;
        const cy = y + h / 2;
        const ox = vw / 2 - cx * s;
        const oy = vh / 2 - cy * s;

        setM({ scale: s, ox, oy });
        return;
      }

      // desktop/default
      const coverStage = Math.max(vw / 1920, vh / 1080);
      let s = coverStage * mul;
      if (!opts?.backfill) s = Math.max(s, coverStage);
      const rw = 1920 * s, rh = 1080 * s;
      setM({ scale: s, ox: (vw - rw) / 2, oy: (vh - rh) / 2 });
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [opts?.focus?.x, opts?.focus?.y, opts?.focus?.w, opts?.focus?.h, opts?.scaleMul, opts?.backfill]);

  return m;
}


type Person = { key: "rates" | "portfolio" | "contact"; src: string; onClick: () => void };

/** Alpha-hit hover using pre-rendered canvases + picker for taps */
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
        c.width = 1920;
        c.height = 1080;
        const cx = c.getContext("2d", { willReadFrequently: true });
        cx?.drawImage(img, 0, 0, 1920, 1080);
        canv.current[p.key] = cx;
      };
    });
  }, [persons]);

  const pickAt = React.useCallback(
    (clientX: number, clientY: number) => {
      const x = (clientX - anchor.ox) / anchor.scale;
      const y = (clientY - anchor.oy) / anchor.scale;
      if (x < 0 || y < 0 || x >= 1920 || y >= 1080) return null;
      for (const p of persons) {
        const cx = canv.current[p.key];
        if (!cx) continue;
        const a = cx.getImageData(x | 0, y | 0, 1, 1).data[3];
        if (a > 10) return p.key;
      }
      return null;
    },
    [anchor.ox, anchor.oy, anchor.scale, persons]
  );

  // Desktop hover
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => setHover(pickAt(e.clientX, e.clientY));
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [pickAt]);

  return { hover, pickAt };
}

/** Smooth weapon sway in stage space */
export function useWeaponSway(
  anchor: { scale: number; ox: number; oy: number },
  enabled = true,
  opts: { ampX?: number; ampY?: number; smooth?: number } = {}
) {
  const { ampX = 46, ampY = 22, smooth = 0.18 } = opts;
  const [txTy, setTxTy] = React.useState({ tx: 0, ty: 0 });

  React.useEffect(() => {
    if (!enabled) {
      setTxTy({ tx: 0, ty: 0 });
      return;
    }

    const target = { x: 0, y: 0 };
    const state = { x: 0, y: 0 };

    const toStage = (clientX: number, clientY: number) => {
      const sx = (clientX - anchor.ox) / anchor.scale;
      const sy = (clientY - anchor.oy) / anchor.scale;
      const nx = Math.max(-1, Math.min(1, (sx - 960) / 960));
      const ny = Math.max(-1, Math.min(1, (sy - 540) / 540));
      return { nx, ny, inBounds: sx >= 0 && sy >= 0 && sx <= 1920 && sy <= 1080 };
    };

    const onMove = (e: MouseEvent) => {
      const s = toStage(e.clientX, e.clientY);
      if (!s.inBounds) {
        target.x = 0;
        target.y = 0;
        return;
      }
      target.x = s.nx;
      target.y = s.ny;
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
