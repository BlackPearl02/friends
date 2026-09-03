import type { CSSProperties } from "react";

export const colors = {
  bg: "#140e12",
  surface: "#21181c",
  surface2: "#2c2227",
  border: "rgba(255, 214, 180, 0.14)",
  text: "#f6efe8",
  muted: "#c4b4aa",
  accent: "#ff8a5b",
  accent2: "#ffd29b",
} as const;

export const shellStyle: CSSProperties = {
  minHeight: "100%",
  fontFamily: 'ui-rounded, "Segoe UI", system-ui, sans-serif',
  background: `radial-gradient(1200px 600px at 10% -10%, #3a1f28 0%, ${colors.bg} 55%)`,
  color: colors.text,
};

export const cardStyle: CSSProperties = {
  marginTop: "1rem",
  padding: "1rem 1.1rem",
  borderRadius: "1rem",
  background: colors.surface,
  border: `1px solid ${colors.border}`,
};

export const btnPrimaryStyle: CSSProperties = {
  border: 0,
  borderRadius: "999px",
  padding: "0.55rem 1rem",
  fontWeight: 700,
  cursor: "pointer",
  background: colors.accent,
  color: "#2a120c",
};

export const btnGhostStyle: CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: "999px",
  padding: "0.5rem 0.9rem",
  fontWeight: 600,
  cursor: "pointer",
  background: "transparent",
  color: colors.text,
};
