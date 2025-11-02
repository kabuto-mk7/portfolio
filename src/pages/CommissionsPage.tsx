import { Panel, Window } from "@/ui/Window";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import { RATES_THUMBS } from "@/lib/assets";

export function CommissionsPage() {
  usePreloadImages(RATES_THUMBS);
  type PriceItem = { name:string; price:string; note?:string; includes?:string[] };
  type PriceGroup = { title:string; items: PriceItem[] };
  const pricing: PriceGroup[] = [
    { title:"Short-form (9:16 / 1:1)", items:[ {name:"≤ 30s",price:"£25 / 24–48h"}, {name:"31–60s",price:"£35 / 24–48h"}, {name:"61–120s",price:"£50 / 48–72h"} ] },
    { title:"YouTube (16:9)", items:[ {name:"≤ 6 min",price:"£80 / 2–4d"}, {name:"6–12 min",price:"£120 / 3–5d"}, {name:"12–20 min",price:"£170 / 5–7d"} ] },
    { title:"Thumbnails & metadata", items:[ {name:"Thumbnail design",price:"£20"}, {name:"Title & tags research",price:"£10"}, {name:"Bundle (thumb + copy)",price:"£25"} ] },
    { title:"IRL assistance (London)", items:[ {name:"Camera op / runner",price:"£120 / 4h • £220 / 8h"}, {name:"Live producing / OBS",price:"£160 / 4h • £280 / 8h"}, {name:"Kit (mics, lights)",price:"£20–40 / session"} ] },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="Editing rates">
        <Panel title="About my editing" rightTag="@100k+ audience">
          <p className="text-sm opacity-85 leading-relaxed">
            I manage and edit for creators and brands across YouTube, TikTok and IG — over <strong>100k followers</strong> across my managed socials.
            I focus on hooks, pacing, on-beat cuts, clean captions and consistent packaging (titles, thumbnails, metadata).
          </p>
          <p className="mt-2 text-center text-sm opacity-85">
            please contact me if you wish to work together — <a href="mailto:contact@kabuto.studio" className="underline">contact@kabuto.studio</a>
          </p>
        </Panel>

        <Panel title="Example thumbnails" rightTag={`x${RATES_THUMBS.length}`}>
          <div className="grid gap-3 sm:grid-cols-3">
            {RATES_THUMBS.map((src,i)=>(
              <div key={i} className="rounded-[6px] border border-[#4a5a45] overflow-hidden aspect-video bg-[#2f3a2d]">
                <img src={src} alt={`thumb ${i+1}`} className="h-full w-full object-cover" loading="lazy"/>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Price list" rightTag="GBP">
          <div className="grid gap-3 md:grid-cols-2">
            {pricing.map((group, gi)=>(
              <div key={gi} className="rounded-[6px] border border-[#4a5a45] bg-[#3a4538]">
                <div className="px-2.5 py-1.5 border-b border-[#4a5a45] text-[var(--accent)] text-[13px]">{group.title}</div>
                <div className="p-2.5">
                  <div className="grid gap-1">
                    {group.items.map((it,ii)=>(
                      <div key={ii} className="grid grid-cols-[1fr_auto] gap-x-3 items-start border-b border-dashed border-[#2a3328] pb-1.5 last:border-b-0">
                        <div className="min-w-0">
                          <div className="text-[13px] leading-tight">{it.name}</div>
                          {it.note && <div className="text-[10px] opacity-70 leading-tight">{it.note}</div>}
                          {it.includes && <ul className="mt-1 list-disc pl-4 text-[11px] opacity-80 space-y-0.5">{it.includes.map((inc,k)=>(<li key={k}>{inc}</li>))}</ul>}
                        </div>
                        <div className="text-[var(--accent)] text-[13px] leading-tight whitespace-nowrap">{it.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </Window>
    </main>
  );
}
