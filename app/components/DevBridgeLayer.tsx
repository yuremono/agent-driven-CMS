"use client";

import type { ReactNode } from "react";

import { BridgeSessionProvider } from "./BridgeSessionContext";
import DevEditorOverlay from "./DevEditorOverlay";

export default function DevBridgeLayer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <BridgeSessionProvider>
      {children}
      <DevEditorOverlay />
    </BridgeSessionProvider>
  );
}
