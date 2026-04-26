import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kkang: {
          ivory: "#F6F1E8",
          cream: "#EDE8DC",
          beige: "#E4DCCF",
          pink: "#F7D7DA",
          sand: "#DCCFBE",
          ink: "#2B2B2B",
        },
      },
      fontFamily: {
        sans: [
          "ui-rounded",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 8px 24px rgba(43, 43, 43, 0.08)",
        pop: "0 2px 0 rgba(43, 43, 43, 0.10), 0 12px 28px rgba(43, 43, 43, 0.12)",
        hero: "0 4px 0 rgba(43, 43, 43, 0.06), 0 24px 60px rgba(247, 215, 218, 0.55), 0 12px 32px rgba(43, 43, 43, 0.14)",
        card: "0 2px 0 rgba(43, 43, 43, 0.05), 0 10px 30px rgba(43, 43, 43, 0.10)",
      },
      keyframes: {
        "ear-bounce": {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
        "ear-bounce-r": {
          "0%, 100%": { transform: "rotate(4deg)" },
          "50%": { transform: "rotate(-4deg)" },
        },
        "body-wobble": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-6px) scale(1.02)" },
        },
        "soft-land": {
          "0%": { transform: "translateY(-12px) scale(1.04)" },
          "60%": { transform: "translateY(2px) scale(0.98)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        "voice-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
      },
      animation: {
        "ear-bounce": "ear-bounce 1.6s ease-in-out infinite",
        "ear-bounce-r": "ear-bounce-r 1.6s ease-in-out infinite",
        "body-wobble": "body-wobble 1.2s ease-in-out infinite",
        "soft-land": "soft-land 0.6s ease-out 1",
        "voice-pulse": "voice-pulse 0.7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
