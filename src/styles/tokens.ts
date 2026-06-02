// src/styles/tokens.ts – design tokens for the portal
export const colors = {
  // neutrals
  background: "#F9F6F0",
  surface: "#FFFFFF",
  text: "#3A2B1D",
  subtle: "#9F9278",
  // accents
  primary: "#2E7D32",
  secondary: "#00695C",
  accentGold: "#F9A825",
  // dark mode – will be swapped via CSS custom props
  dmBackground: "#1E1A1A",
  dmSurface: "#2A2626",
  dmText: "#E2E0DF",
  dmPrimary: "#81C784",
  dmAccentGold: "#FFEB3B",
};

export const typography = {
  display: "'Merriweather', serif, Georgia, 'Times New Roman', serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
  caps: "'Playfair Display SC', serif",
};

export const spacing = {
  xxxs: "4px",
  xs: "8px",
  sm: "12px",
  md: "20px",
  lg: "32px",
  xl: "48px",
  xxl: "72px",
};

export const radius = {
  sm: "6px",
  md: "12px",
  lg: "24px",
};

export const shadow = {
  subtle: "0 2px 8px rgba(0,0,0,0.08)",
  medium: "0 8px 24px rgba(0,0,0,0.15)",
  strong: "0 12px 40px rgba(0,0,0,0.25)",
};
