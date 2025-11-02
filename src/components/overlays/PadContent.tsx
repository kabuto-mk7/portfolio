import { RATES_THUMBS, PORTFOLIO_SAMPLES } from "@/lib/assets";
import React from "react";

export function PortfolioPadContent() {
  const items = PORTFOLIO_SAMPLES.map(x => x.type === "image" ? { type:"img" as const, src:x.src } : { type:"video" as const, src:x.src });
  const [viewer, setViewer] = React.useState<number | null>(null);
  return (
    <div className="w-full h-full p-3">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-3">
        {items.map((it, i) => (
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
          {items[viewer].type === "img" ? (
            <img src={items[viewer].src} className="max-w-[92vw] max-h-[86vh] object-contain" />
          ) : (
            <video src={items[viewer].src} className="max-w-[92vw] max-h-[86vh] object-contain" muted autoPlay loop playsInline />
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
  return (
    <div className="w-full h-full relative text-white/90 text-[14px]">
      <div className="p-4 pr-[180px] pb-[180px] md:pr-[220px] md:pb-[220px]">
        <div className="space-y-2">
          <div>contact – <a className="underline" href="mailto:contact@kabuto.studio">contact@kabuto.studio</a></div>
          <div>discord: kabuto.</div>
          <div>IG – <a className="underline" href="https://instagram.com/kbt2k" target="_blank" rel="noreferrer">kbt2k</a></div>
        </div>
      </div>
      <img src="/assets/kabuto/portfolio/self.png" alt="profile" loading="lazy" decoding="async"
           className="absolute bottom-3 right-3 w-[160px] h-[160px] md:w-[200px] md:h-[200px] rounded-[10px] object-cover border border-white/25 shadow-[0_8px_26px_rgba(0,0,0,.55)] bg-black/20"/>
    </div>
  );
}
