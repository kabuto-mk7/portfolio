import { NotepadWindow } from "@/components/windows/NotepadWindow";
import { navigate } from "@/lib/router";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import {
  ROOT_WALL,
  ICON_PORTFOLIO,
  ICON_LAB,
  ICON_IRL,
  ICON_CONTACT,
  ICON_VISITOR_LABEL,
  NOTEPAD_CHROME,
  COUNTER_SRC,
} from "@/lib/assets";
import React from "react";

type IconItem = {
  label: string;
  icon: string;
  onOpen: () => void;
  x: string; // authored coords for desktop (vw/vh) or mobile (%/vh)
  y: string;
};

type Pos = { left: number; top: number };

const LS_KEY = "rootDesktopIconPositions/v1";
const DRAG_THRESHOLD_PX = 4; // movement needed to count as a drag

export function RootDesktopPage() {
  const [contactOpen, setContactOpen] = React.useState(false);
  usePreloadImages([
    ROOT_WALL,
    ICON_PORTFOLIO,
    ICON_LAB,
    ICON_IRL,
    ICON_CONTACT,
    ICON_VISITOR_LABEL,
    NOTEPAD_CHROME,
  ]);

  // viewport checks
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTiny, setIsTiny] = React.useState(false);
  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 768);
      setIsTiny(w <= 380);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  React.useEffect(() => {
  // Stop the browser from restoring scroll from the previous route
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // In case some parent/container is scrollable:
  const el = document.scrollingElement || document.documentElement;

  // Run at next frame to beat any layout thrash
  requestAnimationFrame(() => {
    // Hard reset
    el.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });
}, []);

  // --- Authoring icon definitions ---
  const desktopAuthoring: IconItem[] = [
    {
      x: "18vw",
      y: "18vh",
      label: "Design portfolio",
      icon: ICON_PORTFOLIO,
      onOpen: () => navigate("/portfolio"),
    },
    {
      x: "26vw",
      y: "26vh",
      label: "Lab // blog",
      icon: ICON_LAB,
      onOpen: () => navigate("/lab"),
    },
    {
      x: "34vw",
      y: "20vh",
      label: "buy cool stuff IRL",
      icon: ICON_IRL,
      onOpen: () =>
        window.open("https://wnacry.com", "_blank", "noopener,noreferrer"),
    },
    {
      x: "42vw",
      y: "26vh",
      label: "contact info",
      icon: ICON_CONTACT,
      onOpen: () => setContactOpen(true),
    },
  ];

  const mobileAuthoring: IconItem[] = [
    {
      x: "16%",
      y: "14vh",
      label: "Design portfolio",
      icon: ICON_PORTFOLIO,
      onOpen: () => navigate("/portfolio"),
    },
    {
      x: "56%",
      y: "19vh",
      label: "Lab // blog",
      icon: ICON_LAB,
      onOpen: () => navigate("/lab"),
    },
    {
      x: "30%",
      y: "46vh",
      label: "buy cool stuff IRL",
      icon: ICON_IRL,
      onOpen: () =>
        window.open("https://wnacry.com", "_blank", "noopener,noreferrer"),
    },
    {
      x: "78%",
      y: "64vh",
      label: "contact info",
      icon: ICON_CONTACT,
      onOpen: () => setContactOpen(true),
    },
  ];

  // Helpers to convert units to px
  const toPxX = (val: string) => {
    if (val.endsWith("vw")) return (parseFloat(val) / 100) * window.innerWidth;
    if (val.endsWith("%")) return (parseFloat(val) / 100) * window.innerWidth;
    if (val.endsWith("px")) return parseFloat(val);
    return parseFloat(val) || 0;
  };
  const toPxY = (val: string) => {
    if (val.endsWith("vh")) return (parseFloat(val) / 100) * window.innerHeight;
    if (val.endsWith("%")) return (parseFloat(val) / 100) * window.innerHeight;
    if (val.endsWith("px")) return parseFloat(val);
    return parseFloat(val) || 0;
  };

  // Desktop positions (draggable): init from localStorage or authored vw/vh
  const [desktopPositions, setDesktopPositions] = React.useState<Pos[] | null>(null);
  const desktopIconsRef = React.useRef(desktopAuthoring);

  React.useEffect(() => {
    if (isMobile) return; // manage positions only for desktop
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Pos[];
        if (Array.isArray(parsed) && parsed.length === desktopIconsRef.current.length) {
          setDesktopPositions(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    const init = desktopIconsRef.current.map((it) => ({
      left: toPxX(it.x),
      top: toPxY(it.y),
    }));
    setDesktopPositions(init);
  }, [isMobile]);

  React.useEffect(() => {
    if (!desktopPositions || isMobile) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(desktopPositions));
    } catch {
      // ignore
    }
  }, [desktopPositions, isMobile]);

  // Drag logic (desktop only)
  const dragRef = React.useRef<{
    index: number;
    dx: number;
    dy: number;
    iconSize: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  // A flag to suppress click if we just dragged
  const wasDraggingRef = React.useRef(false);

  const handleMouseDown =
    (index: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isMobile || !desktopPositions) return;
      e.preventDefault();
      const size = isTiny ? 64 : 80;
      const cur = desktopPositions[index];
      dragRef.current = {
        index,
        dx: e.clientX - cur.left,
        dy: e.clientY - cur.top,
        iconSize: size,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp, { once: true });
      (e.currentTarget as HTMLButtonElement).style.cursor = "grabbing";
    };

  const onMove = (e: MouseEvent) => {
    if (!dragRef.current || !desktopPositions) return;
    const { index, dx, dy, iconSize, startX, startY, moved } = dragRef.current;

    // Check if we've exceeded the movement threshold
    const distX = e.clientX - startX;
    const distY = e.clientY - startY;
    const dist2 = distX * distX + distY * distY;
    if (!moved && dist2 >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
      dragRef.current.moved = true;
    }

    const newLeft = e.clientX - dx;
    const newTop = e.clientY - dy;

    const maxLeft = window.innerWidth - iconSize;
    const maxTop = window.innerHeight - (iconSize + 24);
    const next: Pos = {
      left: Math.max(0, Math.min(maxLeft, newLeft)),
      top: Math.max(0, Math.min(maxTop, newTop)),
    };
    setDesktopPositions((prev) => {
      if (!prev) return prev;
      const copy = prev.slice();
      copy[index] = next;
      return copy;
    });
  };

  const onUp = () => {
    if (dragRef.current?.moved) {
      wasDraggingRef.current = true; // mark that a drag occurred
      // allow click suppression only for the immediate next click
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 0);
    }
    dragRef.current = null;
    window.removeEventListener("mousemove", onMove);
  };

  React.useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Choose icon set based on viewport
  const icons = React.useMemo<IconItem[]>(
    () => (isMobile ? mobileAuthoring : desktopAuthoring),
    [isMobile]
  );

  const [cacheBust] = React.useState(() => String(Date.now()));

  // Click handler that respects drag
  const handleIconClick = (onOpen: () => void) => (e: React.MouseEvent) => {
    if (!isMobile && wasDraggingRef.current) {
      // just dragged; suppress this click
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onOpen();
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#2c3528" }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${ROOT_WALL}")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          zIndex: 1,
        }}
      />

      {icons.map((it, i) => {
        if (isMobile) {
          return (
            <button
              key={i}
              onClick={handleIconClick(it.onOpen)}
              className="group absolute"
              style={{
                left: it.x,
                top: it.y,
                zIndex: 3,
                filter:
                  "drop-shadow(0 2px 6px rgba(0,0,0,.55)) drop-shadow(0 10px 24px rgba(0,0,0,.25))",
                transform: "translateX(-50%)",
              }}
              title={it.label}
            >
              <img
                src={it.icon}
                alt=""
                className={(isTiny ? "h-16 w-16" : "h-20 w-20") + " object-contain"}
                loading="eager"
              />
              <div className="mt-1 text-center text-[13px] leading-4">
                <span className="inline-block px-1.5 py-[3px] rounded-sm bg-black/40 text-white shadow-[0_0_0_1px_rgba(255,255,255,.15)]">
                  {it.label}
                </span>
              </div>
            </button>
          );
        }

        const pos = desktopPositions?.[i] ?? {
          left: toPxX(it.x),
          top: toPxY(it.y),
        };

        return (
          <button
            key={i}
            onClick={handleIconClick(it.onOpen)}
            onMouseDown={handleMouseDown(i)}
            className="group absolute"
            style={{
              left: pos.left,
              top: pos.top,
              zIndex: 3,
              cursor: "grab",
              userSelect: "none",
              filter:
                "drop-shadow(0 2px 6px rgba(0,0,0,.55)) drop-shadow(0 10px 24px rgba(0,0,0,.25))",
            }}
            title={it.label}
          >
            <img
              src={it.icon}
              alt=""
              className={(isTiny ? "h-16 w-16" : "h-20 w-20") + " object-contain pointer-events-none"}
              loading="eager"
              draggable={false}
            />
            <div className="mt-1 text-center text-[13px] leading-4 pointer-events-none">
              <span className="inline-block px-1.5 py-[3px] rounded-sm bg-black/40 text-white shadow-[0_0_0_1px_rgba(255,255,255,.15)]">
                {it.label}
              </span>
            </div>
          </button>
        );
      })}

      <div
        className="absolute flex items-end gap-2"
        style={{ right: "2vw", bottom: "6vh", zIndex: 3 }}
      >
        <div className="flex flex-col items-center">
          <img
            src={ICON_VISITOR_LABEL}
            alt=""
            className={(isTiny ? "h-16 w-16" : "h-20 w-20") + " object-contain"}
            loading="eager"
          />
          <div className="mt-1 text-center text-[13px] leading-4">
            <span className="inline-block px-1.5 py-[3px] rounded-sm bg-black/40 text-white shadow-[0_0_0_1px_rgba(255,255,255,.15)]">
              you are visitor number:
            </span>
          </div>
        </div>
        <img
          src={`${COUNTER_SRC}&t=${cacheBust}`}
          alt="site hit counter"
          className={isTiny ? "h-16" : "h-20"}
          loading="eager"
        />
      </div>

      {contactOpen && <NotepadWindow onClose={() => setContactOpen(false)} />}
    </div>
  );
}
