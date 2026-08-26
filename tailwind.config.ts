import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171F",
        surface: "#1E2230",
        surface2: "#262B3D",
        mist: "#A8B0C3",
        paper: "#EFEAE0",
        gold: "#E8A857",
        rose: "#D97A82",
        dusk: "#5B5F8A",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-work-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        dawn: "linear-gradient(180deg, #5B5F8A 0%, #D97A82 55%, #E8A857 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
