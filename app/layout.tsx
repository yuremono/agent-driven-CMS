import "./globals.scss";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import RootClientShell from "./components/RootClientShell";

export const metadata: Metadata = {
  title: "Northstar Studio",
  description: "Local-first site editing with a development-only Codex overlay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;800&display=swap"
        />
      </head>
      <body className="siteBody">
        <RootClientShell>{children}</RootClientShell>
      </body>
    </html>
  );
}
