import "./globals.css";
import { BridgeSessionProvider } from "./components/BridgeSessionContext.jsx";
import DevEditorOverlay from "./components/DevEditorOverlay.jsx";

export const metadata = {
  title: "Northstar Studio",
  description: "Local-first site editing with a development-only Codex overlay.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="siteBody">
        <BridgeSessionProvider>
          {children}
          {process.env.NODE_ENV === "development" ? <DevEditorOverlay /> : null}
        </BridgeSessionProvider>
      </body>
    </html>
  );
}
