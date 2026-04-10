"use client";

import dynamic from "next/dynamic";

const DevBridgeLayer = dynamic(() => import("./DevBridgeLayer.jsx"), {
  ssr: false,
});

export default function RootClientShell({ children }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === "development" ? <DevBridgeLayer /> : null}
    </>
  );
}
