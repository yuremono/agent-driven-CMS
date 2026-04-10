"use client";

import { BridgeSessionProvider } from "./BridgeSessionContext.jsx";
import DevEditorOverlay from "./DevEditorOverlay.jsx";

export default function DevBridgeLayer({ children }) {
  return (
    <BridgeSessionProvider>
      {children}
      <DevEditorOverlay />
    </BridgeSessionProvider>
  );
}
