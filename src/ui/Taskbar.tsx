import React from "react";
import { PF_START } from "@/lib/assets";
import { Youtube, Twitter, Instagram } from "lucide-react";

// Minimal TikTok SVG (filled brand glyph)
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M12.5 2h3.6c.2 1.8 1.5 3.5 3.3 4.3 1 .5 2.1.7 3.1.7v3.7c-2.1-.1-4.1-.8-5.9-2v7.6c0 4.1-3.3 7.5-7.4 7.7C5.1 24.2 1.8 21 1.6 17c-.1-4.1 3.1-7.6 7.2-7.8h.7v4.1c-1-.3-2.1.1-2.8.8-.8.8-1.1 2-.6 3.1.5 1.2 1.7 1.9 3 1.8.5 0 1-.1 1.3-.3.8-.4 1.4-1 1.8-1.8.2-.4.3-.8.3-1.2V2z"
    />
  </svg>
);

type Btn = { label: string; to: string };

export function ClassicTaskbar({
  onStart,
  buttons = [
    { label: "Portfolio", to: "/portfolio" },
    { label: "Lab", to: "/lab" },
  ],
}: {
  onStart: () => void;
  buttons?: Btn[];
}) {
  const [time, setTime] = React.useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  React.useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      15000
    );
    return () => clearInterval(id);
  }, []);

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

  const go = (to: string) => {
    window.dispatchEvent(new CustomEvent("kabuto:pre-navigate", { detail: { nextPath: to } }));
  };

  const social = [
    { title: "YouTube", href: "https://www.youtube.com/@kabutoKunai", Icon: Youtube },
    { title: "TikTok", href: "https://www.tiktok.com/@kabutokunai/", Icon: TikTokIcon },
    { title: "Instagram", href: "https://www.instagram.com/kbt2k/", Icon: Instagram },
    { title: "Twitter / X", href: "https://twitter.com/kabutoKunai", Icon: Twitter },
  ] as const;

  const btnBox: React.CSSProperties = {
    background: "#c0c0c0",
    ...bevelUp,
    boxShadow: "inset -1px -1px #808080, inset 1px 1px #ffffff",
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 h-10 flex items-center gap-2 px-2"
      style={{
        background: "#c0c0c0",
        ...bevelDown,
        boxShadow: "inset 0 1px 0 #dfdfdf, inset 0 -1px 0 #808080",
        zIndex: 100,
      }}
    >
      <button
        onClick={onStart}
        className="h-7 px-3 flex items-center gap-2 text-black"
        style={btnBox}
        title="Start"
      >
        <img src={PF_START} className="h-4 w-4" alt="" />
        <span className="text-[12px] font-bold tracking-wide">Home</span>
      </button>

      {/* left-aligned route buttons */}
      <div className="flex items-center gap-2">
        {buttons.map((b) => (
          <button
            key={b.label}
            onClick={() => go(b.to)}
            className="h-7 px-3 text-[12px] text-black"
            style={btnBox}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* right-aligned: socials (desktop only) + clock (always) */}
      <div className="ml-auto flex items-center gap-2">
        {/* Socials: hidden on mobile, visible from md+ */}
        <div className="hidden md:flex items-center gap-2">
          {social.map(({ title, href, Icon }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={title}
              aria-label={title}
              className="h-7 w-7 grid place-items-center"
              style={{ ...btnBox, color: "#000" }} // Force icons to black
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>

        {/* Clock: always visible */}
        <div
          className="text-[12px] bg-white/70 px-2 py-1 border border-[#7b7b7b] min-w-[64px] text-right"
          style={{ color: "#000" }}
          aria-label="clock"
        >
          {time}
        </div>
      </div>
    </div>
  );
}
