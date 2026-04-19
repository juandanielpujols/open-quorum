import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sb: {
          azul: "#0d3048",
          gris: "#5c7f91",
          verde: "#12C69F",
          terracota: "#D6490F",
          rojo: "#C13410",
          petroleo: "#47738C",
          claro: "#5A97B3",
          grisFondo: "#e1e7eb",
          fondoClaro: "#f0f3f5",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
