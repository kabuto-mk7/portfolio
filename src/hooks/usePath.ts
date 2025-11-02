import { useEffect, useState } from "react";

export function usePath() {
  const [path, setPath] = useState<string>(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return [path, setPath] as const;
}
export default usePath;
