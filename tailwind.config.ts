import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#f5f5f7",
          surface: "#ffffff",
          subtle: "#f2f2f4",
          border: "rgba(0, 0, 0, 0.08)",
          text: "#1d1d1f",
          secondary: "#86868b",
          tertiary: "#6e6e73",
          blue: "#0071e3",
          blueHover: "#0077ed",
          green: "#34c759",
          red: "#ff3b30",
          amber: "#ff9500",
          darkBg: "#000000",
          darkSurface: "#1c1c1e",
          darkSubtle: "#2c2c2e",
          darkBorder: "rgba(255, 255, 255, 0.12)",
          darkText: "#f5f5f7",
          darkSecondary: "#a1a1a6",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "ui-monospace",
          "Menlo",
          "Monaco",
          '"Cascadia Mono"',
          '"Segoe UI Mono"',
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        apple: "18px",
        "apple-sm": "12px",
        "apple-lg": "24px",
      },
      boxShadow: {
        apple: "0 4px 24px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        "apple-lg": "0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)",
        "apple-floating": "0 20px 48px -8px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.06)",
        "apple-dark": "0 4px 24px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
