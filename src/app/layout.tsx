import "./globals.css";
import { Crimson_Pro, Atkinson_Hyperlegible } from "next/font/google";
import { obtenerBranding } from "@/lib/branding";

const display = Crimson_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "700"],
});

export async function generateMetadata() {
  const branding = await obtenerBranding();
  return {
    title: branding.nombre,
    description: "Sistema de votaciones en línea",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await obtenerBranding();
  return (
    <html lang="es" data-theme={branding.tema} className={`${display.variable} ${body.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
