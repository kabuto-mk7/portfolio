// src/lib/theme.ts
import type { CSSProperties } from "react";

export const BRAND = {
  title: "kabuto",
  primary: "#d7e6b6",
  primarySoft: "#e6f2cf",
  bg: "#2c3528",
  panel: "#3a4538",
  accent: "#d7c65a",
};

export const appStyles: CSSProperties = {
  "--primary": BRAND.primary,
  "--primarySoft": BRAND.primarySoft,
  "--bg": BRAND.bg,
  "--panel": BRAND.panel,
  "--accent": BRAND.accent,
} as CSSProperties;
