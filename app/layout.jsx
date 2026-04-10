import "./globals.css";
import RootClientShell from "./components/RootClientShell.jsx";

export const metadata = {
  title: "Northstar Studio",
  description: "Local-first site editing with a development-only Codex overlay.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="siteBody">
        <RootClientShell>{children}</RootClientShell>
      </body>
    </html>
  );
}
