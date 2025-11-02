import React from "react";

export function usePreloadImages(urls: string[]) {
  React.useEffect(() => {
    const links: HTMLLinkElement[] = [];
    urls.forEach((src) => {
      const l = document.createElement("link");
      l.rel = "preload"; l.as = "image"; l.href = src;
      document.head.appendChild(l); links.push(l);
      const i = new Image(); (i as any).decoding = "async"; (i as any).loading = "eager"; i.src = src;
    });
    return () => links.forEach(l => l.remove());
  }, [urls.join("|")]);
}
