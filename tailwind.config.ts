import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy — primary identity color
        navy: {
          50: "#f3f6fa",
          100: "#e4ebf4",
          200: "#c5d4e6",
          300: "#97b2d0",
          400: "#628bb6",
          500: "#3f6d9e",
          600: "#2e5684",
          700: "#27466b",
          800: "#243c5a",
          900: "#16263c",
          950: "#0d1826",
        },
        // Warm off-white surfaces
        cream: {
          50: "#fbfaf7",
          100: "#f6f4ee",
          200: "#ece8dd",
          300: "#ddd6c4",
        },
        // Subtle warm accent (restrained bronze/amber)
        accent: {
          400: "#d3a94f",
          500: "#c2953a",
          600: "#a87c2c",
          700: "#8a6524",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(13, 24, 38, 0.05), 0 4px 16px rgba(13, 24, 38, 0.06)",
        lift: "0 2px 4px rgba(13, 24, 38, 0.06), 0 10px 28px rgba(13, 24, 38, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
