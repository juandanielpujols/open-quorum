import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1E3A5F",
          navyDeep: "#0F1F3A",
          navySoft: "#2C4D73",
          crimson: "#C62828",
          crimsonDeep: "#8F1F1F",
          cream: "#F8F6F1",
          creamDeep: "#F0EBDF",
          paper: "#FFFFFF",
          ink: "#0F1F3A",
          body: "#334155",
          muted: "#64748B",
          border: "#E5E1D8",
        },
        sb: {
          azul: "#1E3A5F",
          gris: "#64748B",
          verde: "#12C69F",
          terracota: "#C62828",
          rojo: "#8F1F1F",
          petroleo: "#2C4D73",
          claro: "#5A97B3",
          grisFondo: "#E5E1D8",
          fondoClaro: "#F8F6F1",
        },
      },
      fontFamily: {
        display: ['"Crimson Pro"', "Georgia", "serif"],
        sans: ['"Atkinson Hyperlegible"', "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
