import { Panel, SpecList, Window } from "@/ui/Window";
import type { EventRow } from "@/types";
import { loadEvents } from "@/lib/storage";
import { usePreloadImages } from "@/hooks/usePreloadImages";
import { RIGHT_STACK_IMAGES } from "@/lib/assets";
import React from "react";

function placementTierLabel(raw?: string): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (/^\s*1(st)?\s*$/.test(s) || /champ/i.test(s)) return "Champion (1st)";
  if (/^\s*2(nd)?\s*$/.test(s) || /final/i.test(s)) return "Finalist (2nd)";
  if (/^\s*3(rd)?\s*$/.test(s) || /bronze/i.test(s)) return "Podium (3rd)";
  const m = s.match(/(\d+)\s*(?:\/|of)\s*(\d+)/i);
  if (m) {
    const place = parseInt(m[1], 10), field = parseInt(m[2], 10);
    const tops = [8, 12, 16, 32, 64, 128, 256];
    for (const N of tops) if (place <= N && field >= N) return `Top ${N}`;
    if (place <= 8) return "Top 8";
    if (place <= 16) return "Top 16";
    if (place <= 32) return "Top 32";
    if (place <= 64) return "Top 64";
    if (place <= 128) return "Top 128";
    return "Participant";
  }
  const t = s.match(/top\s*([0-9]+)/i);
  if (t) return `Top ${parseInt(t[1], 10)}`;
  return null;
}
function placementColor(tier: string | null): string {
  if (!tier) return "#2a3b2f";
  if (tier.startsWith("Champion")) return "#f5d142";
  if (tier.startsWith("Finalist")) return "#cfd8dc";
  if (tier.startsWith("Podium")) return "#d7a86e";
  if (tier.includes("Top 8")) return "#4ade80";
  if (tier.includes("Top 12")) return "#86efac";
  if (tier.includes("Top 16")) return "#a7f3d0";
  if (tier.includes("Top 32")) return "#60a5fa";
  if (tier.includes("Top 64")) return "#93c5fd";
  if (tier.includes("Top 128")) return "#a5b4fc";
  return "#33443a";
}

export function EsportsPage() {
  function dateToNum(d?: string): number {
    if (!d) return 0;
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(+m[1], +m[2]-1, +m[3]).getTime();
    const t = Date.parse(d);
    return isNaN(t) ? 0 : t;
  }
  const [rows, setRows] = React.useState<EventRow[]>([]);
  React.useEffect(() => {
    const load = async () => setRows(await loadEvents());
    load();
    const onChange = (e: any) => { if (e.detail?.type === "events") load(); };
    window.addEventListener("kabuto:data", onChange as any);
    return () => window.removeEventListener("kabuto:data", onChange as any);
  }, []);
  usePreloadImages([...RIGHT_STACK_IMAGES]);

  const visibleSorted = React.useMemo(() => {
    const vis = (rows as (EventRow & {published?:boolean})[]).filter(r=>r.published !== false);
    return vis.sort((a,b)=> dateToNum(b.date) - dateToNum(a.date));
  }, [rows]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Window title="E-Sports">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <Panel title="Gear list" rightTag="kit.v1">
              <SpecList specs={{ mouse:"Intellimouse Optical 1.1A", keyboard:"HHKB Professional Classic", monitor:"BenQ XL2720Z", headset:"Sennheiser HD598", pad:"SkyPAD 3.0 Yuki-Aim" }}/>
            </Panel>
            <Panel title="Bio" rightTag="player.txt">
              <div className="text-sm opacity-80 space-y-3 leading-relaxed">
                <p>My E-sports journey started young — my dad played CS 1.6 and Source in ESEA and CAP. I played Team Fortress 2 competitively and attended 3 LANs. I switched to Apex Legends in 2019, and played Super Smash Bros. Ultimate from 2020–2023. I took a big hiatus and now I’m pursuing: Apex Legends, CS2, Tekken 8, and SF6.</p>
              </div>
            </Panel>
            <Panel title="Current Ranks" rightTag="mmr.v1">
              <SpecList specs={{ "Apex Legends":"Master", CS2:"Premier 18,000", "Tekken 8":"Tekken Emperor", "Street Fighter 6":"Master" }}/>
            </Panel>
            <Panel title="Events & placements" rightTag={`${visibleSorted.length}`}>
              {visibleSorted.length === 0 ? (
                <div className="text-sm opacity-70">No entries yet.</div>
              ) : (
                <div className="overflow-x-auto rounded-[6px] border border-[#4a5a45]">
                  <table className="w-full text-xs">
                    <thead className="bg-[#334031] text-[var(--accent)]">
                      <tr>
                        <th className="px-2 py-2 text-left">Game</th>
                        <th className="px-2 py-2 text-left">Date</th>
                        <th className="px-2 py-2 text-left">Location</th>
                        <th className="px-2 py-2 text-left">Event</th>
                        <th className="px-2 py-2 text-left">Placement</th>
                        <th className="px-2 py-2 text-left">Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSorted.map((r) => {
                        const tier = placementTierLabel(r.placement);
                        const bg = placementColor(tier);
                        return (
                          <tr key={r.id} className="border-t border-[#2a3328]">
                            <td className="px-2 py-2">{r.game}</td>
                            <td className="px-2 py-2">{r.date}</td>
                            <td className="px-2 py-2">{r.location}</td>
                            <td className="px-2 py-2">{r.event}</td>
                            <td className="px-2 py-2">{r.placement}</td>
                            <td className="px-2 py-2">
                              <span className="inline-block px-2 py-0.5 rounded-[4px]" style={{ background:bg, color:"#132016" }} title={tier || ""}>{tier || "—"}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-4">
            {RIGHT_STACK_IMAGES.map((src,i)=>(
              <div key={i} className="rounded-[6px] border border-[#4a5a45] overflow-hidden">
                <img src={src} alt={`sidebar art ${i+1}`} className="w-full h-auto object-cover" loading="lazy"/>
              </div>
            ))}
          </div>
        </div>
      </Window>
    </main>
  );
}
