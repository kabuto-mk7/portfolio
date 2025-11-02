import { Window, Panel, SpecList } from "@/ui/Window";
import { isInternalKabuto, navigate } from "@/lib/router";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import { COUNTER_SRC, FEATURE_IMAGE_PRIMARY, SMOKER_SRC, PF_BG, PF_OVERLAY, PF_IPAD, PF_P1, PF_P2, PF_P3 } from "@/lib/assets";
import React from "react";

const SECTIONS_TOP = [
  { label: "Blog", url: "/blog" },
  { label: "Design portfolio", url: "/portfolio" },
  { label: "E-Sports", url: "/esports" },
];
const SECTIONS_LOWER = [
  { label: "WNACRY", url: "https://wnacry.com" },
  { label: "Editing rates", url: "/commissions" },
];

export function LabHomePage() {
  const [cacheBust, setCacheBust] = React.useState("");
  React.useEffect(() => setCacheBust(String(Date.now())), []);
  usePreloadImages([FEATURE_IMAGE_PRIMARY, SMOKER_SRC, PF_BG, PF_OVERLAY, PF_IPAD, PF_P1, PF_P2, PF_P3]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <img src={`${FEATURE_IMAGE_PRIMARY}${cacheBust ? `?t=${cacheBust}` : ""}`} alt="feature artwork"
             className="w/full rounded-[6px] border border-[#4a5a45] shadow-[0_0_0_1px_#2d362b] object-cover" loading="eager" decoding="async"/>
      </div>
      <Window title="Launcher">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Panel title="About" rightTag="readme.md">
              <div className="space-y-3 text-sm opacity-80 leading-relaxed">
                <p>You can call me Kem. West London based. I run a 3D-printing business, a clothing line, and property broker. Before this I was working putting computers in people's brains. Most of my time goes into making things: hardware mods, camera work, code, and builds that end up useful.</p>
                <p>This is the lab. Build logs, e-sports kit + results, and projects that don’t fit anywhere else.</p>
                <p>Never give up.</p>
              </div>
            </Panel>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SECTIONS_TOP.map(s => {
                const internal = isInternalKabuto(s.url);
                return (
                  <a key={s.label} href={s.url} target={internal?undefined:"_blank"} rel={internal?undefined:"noreferrer"}
                     onClick={(e)=>{ if(internal){ e.preventDefault(); navigate(s.url);} }}
                     className="group relative rounded-[6px] border border-[#5a6a55] bg-[linear-gradient(180deg,#414c40_0%,#313b2f_100%)] px-4 py-3 shadow-[inset_0_1px_0_#566552,0_1px_0_#20281f] hover:border-[var(--primary)] hover:shadow-[inset_0_1px_0_var(--primary),0_0_0_2px_rgba(215,230,182,0.12)] transition-all">
                    <span className="flex items-center justify-center gap-2 text-[var(--accent)] tracking-wide">
                      <span className="h-2 w-2 rounded-sm bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                      <span className="uppercase text-[13px]">{s.label}</span>
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center justify-center text-sm">
                <span className="opacity-80">you are the&nbsp;</span>
                <img src={`${COUNTER_SRC}${cacheBust ? `&t=${cacheBust}` : ""}`} alt="site hit counter" className="h-24 md:h-28 lg:h-36 mx-3" loading="eager"/>
                <span className="opacity-80">&nbsp;th visitor</span>
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-[70%]">
                {SECTIONS_LOWER.map(s=>{
                  const internal = isInternalKabuto(s.url);
                  return (
                    <a key={s.label} href={s.url} target={internal?undefined:"_blank"} rel={internal?undefined:"noreferrer"}
                       onClick={(e)=>{ if(internal){ e.preventDefault(); navigate(s.url);} }}
                       className="group relative rounded-[6px] border border-[#5a6a55] bg-[linear-gradient(180deg,#414c40_0%,#313b2f_100%)] px-4 py-3 shadow-[inset_0_1px_0_#566552,0_1px_0_#20281f] hover:border-[var(--primary)] hover:shadow-[inset_0_1px_0_var(--primary),0_0_0_2px_rgba(215,230,182,0.12)] transition-all">
                      <span className="flex items-center justify-center gap-2 text-[var(--accent)] tracking-wide">
                        <span className="h-2 w-2 rounded-sm bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]"/>
                        <span className="uppercase text-[13px]">{s.label}</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Panel title="FAq" rightTag="profile">
              <SpecList specs={{
                age:"25", birthday:"10/09/2000", "where are you from?":"london, uk",
                major:"computer science", "what are you?":"full turkish cypriot",
                orientation:"straight", "whats your mbti":"infj",
              }}/>
            </Panel>
            <div className="rounded-[6px] border border-[#4a5a45] overflow-hidden">
              <img src={SMOKER_SRC} alt="smoker" className="w-full h-auto object-cover" loading="lazy"/>
            </div>
          </div>
        </div>
      </Window>
    </main>
  );
}
