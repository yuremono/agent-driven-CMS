"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { useBridgeSession } from "./useBridgeSession";

type BridgeSession = ReturnType<typeof useBridgeSession>;

const BridgeSessionContext = createContext<BridgeSession | null>(null);

export function BridgeSessionProvider({ children }: { children: ReactNode }) {
  const session = useBridgeSession();

  return (
    <BridgeSessionContext.Provider value={session}>
      {children}
    </BridgeSessionContext.Provider>
  );
}

export function useBridgeSessionContext() {
  const session = useContext(BridgeSessionContext);

  if (!session) {
    throw new Error(
      "useBridgeSessionContext must be used within BridgeSessionProvider",
    );
  }

  return session;
}
