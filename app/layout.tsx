import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NINE.OS — Class 9 Operating System",
    template: "%s · NINE.OS",
  },
  description:
    "Ruang digital kelas untuk agenda, refleksi, komunikasi, dan perjalanan bersama.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16263c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
