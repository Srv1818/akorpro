import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        chord: "rgb(var(--color-chord) / <alpha-value>)",
      },
    },
  },
} satisfies Config;
