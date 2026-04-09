"use client";

import { createContext, useContext } from "react";

import { useBridgeSession } from "./useBridgeSession.js";

const BridgeSessionContext = createContext(null);

export function BridgeSessionProvider({ children }) {
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
    throw new Error("useBridgeSessionContext must be used within BridgeSessionProvider");
  }

  return session;
}
