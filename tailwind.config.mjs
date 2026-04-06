/**
 * Tasarım sistemi (ARCHITECTURE Faz 1):
 * - Vurgu: green-500 (#22c55e) tabanlı `accent` token’ları (--color-accent, globals.css).
 * - Nötr krom: yerleşik `zinc-*` paleti (hover, ikon, kenarlık vurguları).
 * - Akor semantiği: `chord.*` → maj / min / dim / aug / extension.
 */
const config = {
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        /** Başlık, şarkı adı, marka — gece modunda --color-display (taş 200) */
        display: "rgb(var(--color-display) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        /** Ana vurgu — green-500 (#22c55e) tabanlı token */
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          foreground: "rgb(var(--color-accent-foreground) / <alpha-value>)",
          muted: "rgb(var(--color-accent-muted) / <alpha-value>)",
        },
        /** Akor satırı / tip semantiği (maj, min, dim, aug, 7/sus) */
        chord: {
          root: "rgb(var(--chord-root) / <alpha-value>)",
          major: "rgb(var(--chord-major) / <alpha-value>)",
          minor: "rgb(var(--chord-minor) / <alpha-value>)",
          diminished: "rgb(var(--chord-diminished) / <alpha-value>)",
          augmented: "rgb(var(--chord-augmented) / <alpha-value>)",
          extension: "rgb(var(--chord-extension) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
};

export default config;
