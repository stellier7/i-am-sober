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
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(12px, -18px) scale(1.06)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s ease-out both",
        float: "float 5s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
        "orb-drift": "orb-drift 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
