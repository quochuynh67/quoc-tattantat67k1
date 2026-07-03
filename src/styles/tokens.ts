// src/styles/tokens.ts – design tokens for the portal
export const colors = {
  // neutrals
  background: "#FAF8F3",
  backgroundAlt: "#F3EFE6",
  surface: "#FFFFFF",
  text: "#2B241B",
  subtle: "#9A8F79",
  border: "rgba(43, 36, 27, 0.10)",
  // accents
  primary: "#2E7D32",
  secondary: "#00695C",
  accentGold: "#F9A825",
  // dark mode – will be swapped via CSS custom props
  dmBackground: "#191613",
  dmBackgroundAlt: "#211D19",
  dmSurface: "#262220",
  dmText: "#EDE9E2",
  dmBorder: "rgba(255, 255, 255, 0.12)",
  dmPrimary: "#81C784",
  dmAccentGold: "#FFD54F",
};

export const typography = {
  display: "'Lora', 'Merriweather', Georgia, 'Times New Roman', serif",
  body: "'Be Vietnam Pro', 'Inter', system-ui, -apple-system, sans-serif",
  caps: "'Lora', 'Playfair Display SC', serif",
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
  sm: "8px",
  md: "14px",
  lg: "24px",
};

export const shadow = {
  subtle: "0 1px 2px rgba(43,36,27,0.05), 0 2px 10px rgba(43,36,27,0.07)",
  medium: "0 4px 12px rgba(43,36,27,0.08), 0 12px 28px rgba(43,36,27,0.13)",
  strong: "0 8px 20px rgba(43,36,27,0.14), 0 24px 48px rgba(43,36,27,0.22)",
};
