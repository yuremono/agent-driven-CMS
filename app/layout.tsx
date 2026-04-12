import "./globals.scss";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import RootClientShell from "./components/RootClientShell";

export const metadata: Metadata = {
  title: "A",
  description: "Local-first site editing with a development-only Codex overlay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="siteBody">
        <RootClientShell>{children}</RootClientShell>
      </body>
    </html>
  );
}
