import type { CSSProperties } from "react";

/** Discord-adjacent navy / blurple, magenta from the crew art. */
export const colors = {
  bg: "#1e1f22",
  surface: "rgba(30, 31, 34, 0.94)",
  surface2: "#2b2d31",
  border: "rgba(255, 255, 255, 0.14)",
  text: "#f2f3f5",
  muted: "#b5bac1",
  accent: "#eb459e",
  accent2: "#5865f2",
  cyan: "#5865f2",
} as const;

export const shellStyle: CSSProperties = {
  minHeight: "100%",
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
  color: colors.text,
};

export const cardStyle: CSSProperties = {
  marginTop: "0.85rem",
  padding: "1rem 1rem 1.15rem",
  borderRadius: "1rem",
  background: "rgba(30, 31, 34, 0.94)",
  border: `1px solid ${colors.border}`,
  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  color: colors.text,
};
