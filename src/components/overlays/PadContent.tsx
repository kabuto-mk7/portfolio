import { RATES_THUMBS, PORTFOLIO_SAMPLES } from "@/lib/assets";
import React from "react";
import tape from "/assets/kabuto/ui/tape.png";
import sticky from "/assets/kabuto/ui/sticky.png";
import cracked from "/assets/kabuto/ui/cracked.jpg";
import { listPortfolioItems } from "@/lib/storage";
import type { MediaItem } from "@/types";
import { usePreloadImages } from "@/hooks/usePreloadImages";
const selfPNG = "/assets/kabuto/portfolio/self.png";

export function PortfolioPadContent() {
  const [items, setItems] = React.useState<MediaItem[]>([]);

  const load = React.useCallback(async () => {
    // if you kept loadPortfolioItems, just await that instead
    const rows = await listPortfolioItems();
    setItems(rows);
    const onChange = (e: any) => { if (e.detail?.type === "portfolio") load(); };
    window.addEventListener("kabuto:data", onChange);
    return () => window.removeEventListener("kabuto:data", onChange);
  }, []);
  const display = items.length > 0
    ? items.map((it) => ({ type: it.type === "image" ? "img" as const : "video" as const, src: it.src }))
    : PORTFOLIO_SAMPLES.map(x => x.type === "image" ? { type:"img" as const, src:x.src } : { type:"video" as const, src:x.src });

  const [viewer, setViewer] = React.useState<number | null>(null);
  return (
    <div className="w-full h-full p-3">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-3">
        {display.map((it, i) => (
          <button key={i} onClick={() => setViewer(i)} className="aspect-video overflow-hidden rounded-md bg-black/30">
            {it.type === "img" ? (
              <img src={it.src} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <video src={it.src} className="h-full w-full object-cover" muted autoPlay loop playsInline />
            )}
          </button>
        ))}
      </div>
      {viewer !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/85 grid place-items-center">
          <button className="absolute right-6 top-6 h-10 w-10 rounded bg-white/15 text-white text-xl" onClick={()=>setViewer(null)}>×</button>
          {display[viewer].type === "img" ? (
            <img src={display[viewer].src} className="max-w-[92vw] max-h-[86vh] object-contain" />
          ) : (
            <video src={display[viewer].src} className="max-w-[92vw] max-h-[86vh] object-contain" muted autoPlay loop playsInline />
          )}
        </div>
      )}
    </div>
  );
}

export function RatesPadContent() {
  type PriceItem = { name:string; price:string; note?:string; includes?:string[] };
  type PriceGroup = { title:string; items: PriceItem[] };
  const pricing: PriceGroup[] = [
    { title:"Short-form (9:16 / 1:1)", items:[ {name:"≤ 30s",price:"£25 / 24–48h"}, {name:"31–60s",price:"£35 / 24–48h"}, {name:"61–120s",price:"£50 / 48–72h"} ] },
    { title:"YouTube (16:9)", items:[ {name:"≤ 6 min",price:"£80 / 2–4d"}, {name:"6–12 min",price:"£120 / 3–5d"}, {name:"12–20 min",price:"£170 / 5–7d"} ] },
    { title:"Thumbnails & metadata", items:[ {name:"Thumbnail design",price:"£20"}, {name:"Title & tags research",price:"£10"}, {name:"Bundle (thumb + copy)",price:"£25"} ] },
    { title:"IRL assistance (London)", items:[ {name:"Camera op / runner",price:"£120 / 4h • £220 / 8h"}, {name:"Live producing / OBS",price:"£160 / 4h • £280 / 8h"}, {name:"Kit (mics, lights)",price:"£20–40 / session"} ] },
  ];
  return (
    <div className="w-full h-full overflow-auto px-4 py-3 text-white/90 text-[13px]">
      <div className="grid gap-3 md:grid-cols-2">
        {pricing.map((group, gi) => (
          <div key={gi} className="rounded-[8px] border border-white/10 bg-[#141414] shadow-[0_8px_24px_rgba(0,0,0,.35)]">
            <div className="px-3 py-2 border-b border-white/10 text-[var(--accent)] font-medium">{group.title}</div>
            <div className="p-3">
              <div className="grid gap-1">
                {group.items.map((it, ii) => (
                  <div key={ii} className="grid grid-cols-[1fr_auto] items-start gap-x-3 border-b border-dashed border-white/10 pb-1.5 last:border-b-0">
                    <div className="min-w-0">
                      <div className="leading-tight">{it.name}</div>
                      {it.note && <div className="text-[11px] opacity-70 leading-tight">{it.note}</div>}
                      {it.includes && <ul className="mt-1 list-disc pl-4 text-[11px] opacity-80 space-y-0.5">{it.includes.map((inc,k)=>(<li key={k}>{inc}</li>))}</ul>}
                    </div>
                    <div className="text-[var(--accent)] whitespace-nowrap leading-tight">{it.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[11px] opacity-60">Turnaround is typical; rush or retainer options available on request.</div>
      {/* Optional sample thumbs */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {RATES_THUMBS.slice(0,6).map((src,i)=>(
          <div key={i} className="rounded-md overflow-hidden bg-black/25 aspect-video">
            <img src={src} alt={`rate ${i+1}`} className="w-full h-full object-cover"/>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactPadContent() {
  usePreloadImages([sticky, tape, cracked, selfPNG]);
  return (
    // The cracked background is applied to the entire contact pad container
    <div
      className="w-full h-full relative"
      style={{
        backgroundImage: `url(${cracked})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Sticky note anchored at top‑left */}
      <div
        className="absolute top-6 left-[-15] z-10"
        style={{ width: "clamp(200px, 45vw, 340px)" }}
      >
        <img
          src={sticky}
          alt="sticky note"
          className="w-full h-auto pointer-events-none select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
        />
        {/* Contact info on the sticky note; adjust padding and colors for legibility */}
        <div
          className="absolute inset-0 px-6 py-40 text-[14px] leading-relaxed text-black"
          style={{
            color: "#222", // darken the text for legibility
            textShadow: "0 0px 15px rgba(0, 0, 0, 1)", // heavy halo behind text for contrast
          }}
        >
          <div className="space-y-2">
            <div>
              <a
                className="underline text-blue-600"
                href="mailto:contact@kabuto.studio"
              >
                contact@kabuto.studio
              </a>
            </div>
            <div>discord: kabuto.</div>
            <div>
              IG —{" "}
              <a
                href="https://instagram.com/kbt2k"
                target="_blank"
                rel="noreferrer"
                className="underline text-blue-600"
                style={{ color: "#1e40af" }}  // tailwind’s blue-700 value
              >
                kbt2k
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Photo anchored at bottom‑right with duct‑tape on top */}
      <div
        className="absolute bottom-6 right-6"
        style={{ width: "clamp(160px, 40vw, 280px)" }}
      >
        <img
          src="/assets/kabuto/portfolio/self.png"
          alt="profile"
          loading="lazy"
          decoding="async"
          className="w-full h-full rounded-[10px] object-cover border border-white/25 shadow-[0_8px_26px_rgba(0,0,0,.55)] bg-black/20"
        />
        {/* Tape overlaps the top of the photo; drop‑shadow adds depth without a square outline */}
        <img
          src={tape}
          alt=""
          className="absolute -top-20 left-1/2 transform -translate-x-1/2 rotate-[-10deg] pointer-events-none select-none"
          style={{
            width: "70%",
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
          }}
        />
      </div>
    </div>
  );
}