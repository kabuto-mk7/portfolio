import { ClassicTaskbar } from "@/ui/Taskbar";
import { PortfolioWin95Window } from "@/components/overlays/PortfolioWin95Window";
import { RatesPadContent, ContactPadContent, PortfolioPadContent } from "@/components/overlays/PadContent";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import { useStageAnchor, useAlphaHover } from "@/hooks/portfolioStage";
import { navigate } from "@/lib/router";
import { PF_BG as BG, PF_OVERLAY as OV, PF_P1 as P1, PF_P2 as P2, PF_P3 as P3, PF_IPAD as IPAD, PF_VIEWMODEL, PORTFOLIO_SAMPLES } from "@/lib/assets";
import { loadPortfolioItems } from "@/lib/storage";
import type { MediaItem } from "@/types";
import React from "react";

type PadMode = "portfolio" | "rates" | "contact" | null;

export function PortfolioPage() {
  const fireRef = React.useRef<HTMLAudioElement | null>(null);
  React.useEffect(() => { const a = new Audio("/sfx/fire.mp3"); a.preload = "auto"; a.volume = 0.25; fireRef.current = a; }, []);
  const fire = React.useCallback(() => { try { if (fireRef.current) { fireRef.current.currentTime = 0; void fireRef.current.play(); } } catch {} }, []);

  usePreloadImages([BG, OV, P1, P2, P3, IPAD, PF_VIEWMODEL]);
  const m = useStageAnchor();

  const [pad, setPad] = React.useState<PadMode>(null);
  const [padVisible, setPadVisible] = React.useState(false);
  const [gunDown, setGunDown] = React.useState(false);
  const anim = React.useRef(false);

  const openPad = async (kind: Exclude<PadMode, null>) => {
    if (anim.current) return;
    anim.current = true; fire(); setGunDown(true);
    await new Promise(r=>setTimeout(r,380));
    setPad(kind); await new Promise(r=>setTimeout(r,20));
    setPadVisible(true); await new Promise(r=>setTimeout(r,420));
    anim.current = false;
  };
  const closePad = async () => {
    if (anim.current) return;
    anim.current = true; fire(); setPadVisible(false);
    await new Promise(r=>setTimeout(r,420));
    setPad(null); setGunDown(false);
    await new Promise(r=>setTimeout(r,360));
    anim.current = false;
  };

  const [mouse, setMouse] = React.useState({ x:0.5, y:0.5 });
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
      setMouse({ x:e.clientX/w, y:e.clientY/h });
    };
    window.addEventListener("mousemove", onMove, { passive:true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  const gunTX = (mouse.x - 0.5) * 40;
  const gunTY = (mouse.y - 0.5) * 20;

  const [pfWinOpen, setPfWinOpen] = React.useState(false);
  const [pfItems, setPfItems] = React.useState<MediaItem[]>(() => loadPortfolioItems());
  React.useEffect(() => {
    const update = (e: any) => { if (e.detail?.type === "portfolio") setPfItems(loadPortfolioItems()); };
    window.addEventListener("kabuto:data", update);
    return () => window.removeEventListener("kabuto:data", update);
  }, []);

  const persons = React.useMemo(()=>[
    { key:"rates"     as const, src:P1, onClick:()=>openPad("rates") },
    { key:"portfolio" as const, src:P2, onClick:()=>{ fire(); setPfWinOpen(true); } },
    { key:"contact"   as const, src:P3, onClick:()=>openPad("contact") },
  ],[]);
  const hover = useAlphaHover(persons as any, m);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background:"#000" }}>
      <div className="absolute" style={{ left:0, top:0, width:1920, height:1080, transform:`translate(${m.ox}px,${m.oy}px) scale(${m.scale})`, transformOrigin:"top left", zIndex:1 }}>
        <img src={BG} alt="" draggable={false} className="absolute left-0 top-0" style={{ width:1920, height:1080 }}/>
        {persons.map(p=>(
          <img key={p.key} src={p.src} alt="" draggable={false} className="absolute left-0 top-0 pointer-events-none"
               style={{ width:1920, height:1080, zIndex:2, transform: hover===p.key ? "scale(1.025)" : "scale(1)", transformOrigin:"center bottom", transition:"transform 140ms ease", filter:"drop-shadow(0 2px 12px rgba(0,0,0,.45))" }}/>
        ))}
        <img src={OV} alt="" className="absolute left-0 top-0 pointer-events-none" style={{ width:1920, height:1080, zIndex:3 }}/>
        <button aria-label={hover ?? "scene"} onClick={() => { const t = (persons as any).find((pp:any)=>pp.key===hover); if(t) t.onClick(); }}
                className="absolute left-0 top-0" style={{ width:1920, height:1080, zIndex:4, background:"transparent", border:"none" }}/>
      </div>

      <img src={PF_VIEWMODEL} alt="" className="absolute pointer-events-none transition-transform duration-[420ms]"
           style={{ right:"-26px", bottom:"-22px", width:"600px", maxWidth:"52vw", transform:`translate(${gunTX}px, ${gunTY + (gunDown ? 520 : 0)}px)`, filter:"drop-shadow(0 0 12px rgba(0,0,0,.45))", objectFit:"contain", zIndex:4 }}/>

      {pad && (
        <>
          <div className="absolute inset-0 bg-black/45" style={{ zIndex:5, opacity: padVisible ? 1 : 0, transition:"opacity 420ms ease" }} onClick={closePad}/>
          <div className="absolute inset-x-0" style={{ bottom:"-10px", zIndex:6 }}>
            <div className="relative mx-auto" style={{ width:"min(1200px, 92vw)", transform:`translateY(${padVisible ? "0%" : "106%"})`, transition:"transform 420ms cubic-bezier(.22,.61,.36,1)", filter:"drop-shadow(0 24px 60px rgba(0,0,0,.55))" }}>
              <img src={IPAD} alt="" className="w-full h-auto block select-none" draggable={false}/>
              <div className="absolute overflow-hidden rounded-[8px] bg-[#0f0f0f]"
                   style={{ left:"25%", right:"26.4583%", top:"14.0741%", bottom:"21.2037%", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.06)" }}>
                {pad==="portfolio" && <PortfolioPadContent/>}
                {pad==="rates" && <RatesPadContent/>}
                {pad==="contact" && <ContactPadContent/>}
              </div>
              <button onClick={closePad} className="absolute h-8 w-8 grid place-items-center rounded-full bg-black/70 text-white text-[14px] shadow-[0_2px_10px_rgba(0,0,0,.4)] hover:bg-black/80" style={{ top:"5%", right:"150px", zIndex:7 }} aria-label="Close">×</button>
            </div>
          </div>
        </>
      )}

      {pfWinOpen && (
        <PortfolioWin95Window
          items={pfItems.length > 0 ? pfItems.map((it) => ({ type: it.type, src: it.src })) : PORTFOLIO_SAMPLES.map(x => x.type === "image" ? ({ type: "image" as const, src: x.src }) : ({ type: "video" as const, src: x.src }))}
          onClose={()=>setPfWinOpen(false)}
        />
      )}

      <ClassicTaskbar onStart={() => navigate("/lab")} />
    </div>
  );
}
