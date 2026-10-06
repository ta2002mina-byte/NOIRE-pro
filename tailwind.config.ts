import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0C0B0A",
        surface: "#151312",
        raised: "#1D1A18",
        line: "#2E2A27",
        ivory: "#EFE9DF",
        mute: "#A9A195",
        claret: { DEFAULT: "#9B2C3B", hover: "#B23546" },
        // Claret is too dark to read as small text on ink (2.6:1). Blush is the text/icon accent (6.6:1 on ink).
        blush: "#DB7887",
        danger: "#F2A6A0",
        good: "#9FD3B0",
      },
      fontFamily: {
        display: ["var(--font-display)", ...fontFamily.serif],
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
};

export default config;
