// src/components/overlays/IPadOverlay.tsx
import React from "react";
import { PF_IPAD } from "@/lib/assets";

type Kind = "portfolio" | "rates" | "contact";

function IPadOverlay({
  kind,
  visible,
  onClose,
  onOpenPortfolio,
}: {
  kind: Kind;
  visible: boolean;
  onClose: () => void;
  onOpenPortfolio?: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[215]"
      style={{
        background: visible ? "rgba(0,0,0,.85)" : "rgba(0,0,0,0)",
        transition: "background .35s ease",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "min(6vh, 32px) min(3vw, 24px)",
      }}
      aria-hidden={!visible}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative"
        style={{
          width: "min(900px, 92vw)",
          aspectRatio: "3/2",
          filter: "drop-shadow(0 20px 60px rgba(0,0,0,.6))",
          transform: `translateY(${visible ? "0%" : "120%"}) scale(${
            visible ? 1 : 0.98
          })`,
          opacity: visible ? 1 : 0,
          transition:
            "transform .55s cubic-bezier(.22,1,.36,1), opacity .35s ease",
        }}
      >
        <img
          src={PF_IPAD}
          alt="iPad"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          draggable={false}
        />
        <div
          className="absolute inset-[6%]"
          style={{
            background: "#101410",
            borderRadius: 18,
            overflow: "hidden",
            display: "grid",
            gridTemplateRows: "40px 1fr",
            border: "1px solid rgba(215,230,182,.15)",
          }}
        >
          <div
            className="flex items-center justify-between px-3"
            style={{
              background: "#1b231b",
              color: "#d7e6b6",
              borderBottom: "1px solid rgba(215,230,182,.12)",
            }}
          >
            <div className="text-sm tracking-wide">
              {kind === "rates" ? "Editing rates" : kind === "contact" ? "Contact" : "My Work"}
            </div>
            <button
              onClick={onClose}
              className="h-7 px-3 rounded text-sm"
              style={{ background: "#2b352a", border: "1px solid #445241" }}
              title="Close"
            >
              Close
            </button>
          </div>

          <div className="p-3 overflow-auto text-sm">
            {kind === "rates" && (
              <div className="space-y-3">
                <div className="text-xs opacity-85">
                  Short-form: ≤30s £25 • 31–60s £35 • 61–120s £50
                </div>
                <div className="text-xs opacity-85">YouTube: ≤6m £80 • 6–12m £120 • 12–20m £170</div>
              </div>
            )}
            {kind === "contact" && (
              <div className="space-y-2">
                <div>
                  email —{" "}
                  <a className="underline" href="mailto:contact@kabuto.studio">
                    contact@kabuto.studio
                  </a>
                </div>
                <div>discord — kabuto.</div>
                <div>
                  IG —{" "}
                  <a
                    className="underline"
                    href="https://instagram.com/kbt2k"
                    target="_blank"
                    rel="noreferrer"
                  >
                    kbt2k
                  </a>
                </div>
              </div>
            )}
            {kind === "portfolio" && (
              <div className="space-y-3">
                <p className="opacity-85">
                  Tap <strong>Open “My Work”</strong> to view the full Win95 gallery.
                </p>
                <button
                  onClick={() => onOpenPortfolio?.()}
                  className="rounded px-3 py-2"
                  style={{ background: "#2b352a", border: "1px solid #445241" }}
                >
                  Open “My Work”
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IPadOverlay;
export { IPadOverlay };
