import "./globals.scss";
import { Shippori_Mincho } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import RootClientShell from "./components/RootClientShell";

const shipporiMincho = Shippori_Mincho({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-shippori-mincho",
  weight: ["400", "800"],
});

export const metadata: Metadata = {
  title: "Northstar Studio",
  description: "Local-first site editing with a development-only Codex overlay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={shipporiMincho.variable}>
      <body className="siteBody">
        <RootClientShell>{children}</RootClientShell>
      </body>
    </html>
  );
}
