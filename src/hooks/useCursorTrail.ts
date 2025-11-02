import { useEffect } from "react";

/** Toggles the custom cursor trail elements with ids ktrail-0..9 */
export function useCursorTrail(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      for (let i = 0; i < 10; i++) {
        const el = document.getElementById(`ktrail-${i}`) as HTMLElement | null;
        if (el) el.style.opacity = "0";
      }
      return;
    }

    const els: (HTMLElement | null)[] = Array.from({ length: 10 }, (_, i) =>
      document.getElementById(`ktrail-${i}`) as HTMLElement | null
    );

    let head = { x: innerWidth / 2, y: innerHeight / 2 };
    const pts = Array.from({ length: 10 }, () => ({ x: head.x, y: head.y }));
    let lastMove = Date.now();
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      head.x = e.clientX;
      head.y = e.clientY;
      lastMove = Date.now();
    };
    addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      pts[0].x += (head.x - pts[0].x) * 0.25;
      pts[0].y += (head.y - pts[0].y) * 0.25;
      for (let i = 1; i < pts.length; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.25;
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.25; // fixed sign
      }
      const idle = Date.now() - lastMove > 1200;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        const p = pts[i];
        el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`;
        const base = 0.65 - i * 0.05;
        el.style.opacity = idle ? "0" : String(Math.max(0, base));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", onMove);
    };
  }, [enabled]);
}
