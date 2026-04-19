import "./globals.css";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Votaciones";

export const metadata = {
  title: APP_NAME,
  description: "Sistema de votaciones en línea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
