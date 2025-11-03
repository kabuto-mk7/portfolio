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

  // --- MOBILE COORDS aligned to your green dots ---
  // portfolio  ~ left/top, blog ~ upper-right-ish, irl ~ mid-left, contact ~ lower-right
  const icons = React.useMemo(
    () =>
      isMobile
        ? [
            {
              // Design portfolio (top-left-ish)
              x: "16%",
              y: "14vh",
              label: "Design portfolio",
              icon: ICON_PORTFOLIO,
              onOpen: () => navigate("/portfolio"),
            },
            {
              // Lab // blog (upper mid/right)
              x: "56%",
              y: "19vh",
              label: "Lab // blog",
              icon: ICON_LAB,
              onOpen: () => navigate("/lab"),
            },
            {
              // buy cool stuff IRL (mid-left)
              x: "30%",
              y: "46vh",
              label: "buy cool stuff IRL",
              icon: ICON_IRL,
              onOpen: () =>
                window.open("https://wnacry.com", "_blank", "noopener,noreferrer"),
            },
            {
              // contact info (lower-right, above counter area)
              x: "78%",
              y: "64vh",
              label: "contact info",
              icon: ICON_CONTACT,
              onOpen: () => setContactOpen(true),
            },
          ]
        : [
            // DESKTOP (unchanged)
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
          ],
    [isMobile]
  );

  const [cacheBust] = React.useState(() => String(Date.now()));

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

      {icons.map((it, i) => (
        <button
          key={i}
          onClick={it.onOpen}
          className="group absolute"
          style={{
            left: it.x,
            top: it.y,
            zIndex: 3,
            filter:
              "drop-shadow(0 2px 6px rgba(0,0,0,.55)) drop-shadow(0 10px 24px rgba(0,0,0,.25))",
            ...(isMobile && { transform: "translateX(-50%)" }),
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
      ))}

      <div
        className="absolute flex items-end gap-2"
        style={{ right: "2vw", bottom: "12vh", zIndex: 3 }}
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
