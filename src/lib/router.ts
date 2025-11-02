import React from "react";

export function usePath() {
  const [path, setPath] = React.useState<string>(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  React.useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return [path, setPath] as const;
}

export function isInternalKabuto(url: string) {
  try {
    if (url.startsWith("/")) return true;
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin || u.hostname.endsWith("kabuto.studio");
  } catch { return false; }
}

/** Centralized navigate with pre-navigate event for splash/black */
export function navigate(url: string) {
  try {
    const u = new URL(url, window.location.origin);
    const internal = url.startsWith("/") || u.origin === window.location.origin || u.hostname.endsWith("kabuto.studio");

    window.dispatchEvent(new CustomEvent("kabuto:ui-click")); // SFX ping

    if (internal) {
      const nextPath = u.pathname || "/";
      window.dispatchEvent(new CustomEvent("kabuto:pre-navigate", { detail: { nextPath } }));
    } else {
      window.open(u.toString(), "_blank", "noopener,noreferrer");
    }
  } catch {
    window.location.href = url;
  }
}
