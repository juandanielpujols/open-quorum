import "./globals.css";
import { Crimson_Pro, Atkinson_Hyperlegible } from "next/font/google";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Votaciones";

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

export const metadata = {
  title: APP_NAME,
  description: "Sistema de votaciones en línea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
