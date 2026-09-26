import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        garnet: "#7A1F2B",
        "garnet-dim": "#5C1720",
        gold: "#C9A66B",
        bg: "#141010",
        panel: "#1D1717",
        panel2: "#251D1D",
        line: "#3A2D2D",
        ink: "#F2EAE3",
        "ink-dim": "#B8A9A2",
        up: "#5FA876",
        down: "#C1554A",
      },
      fontFamily: {
        display: ["var(--font-oswald)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
