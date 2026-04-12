"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useEffect } from "react";
import CanvasEffectLayer from "./CanvasEffectLayer";
import EffectWarpDefs from "./EffectWarpDefs";
import {
  cancelEveryOtherAnimationFrame,
  requestEveryOtherAnimationFrame,
} from "./everyOtherAnimationFrame";

const DevBridgeLayer = dynamic(
  () =>
    import("./DevBridgeLayer.jsx").then(
      (mod) => mod.default as unknown as ComponentType<Record<string, never>>,
    ),
  { ssr: false },
);

function syncEffectText(root = document) {
  const nodes = root.querySelectorAll(".effect, .effect > *");

  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;

    const text = node.textContent?.replace(/\s+/g, " ").trim();
    if (!text) return;

    if (node.dataset.effectText !== text) {
      node.dataset.effectText = text;
    }
  });
}

export default function RootClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showDevBridge = process.env.NODE_ENV === "development" && pathname !== "/admin";

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    let rafId = 0;

    const scheduleSync = () => {
      if (rafId) return;

      rafId = requestEveryOtherAnimationFrame(() => {
        rafId = 0;
        syncEffectText();
      });
    };

    syncEffectText();

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();

      if (rafId) {
        cancelEveryOtherAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <>
      <EffectWarpDefs />
      <CanvasEffectLayer />
      {children}
      {showDevBridge ? <DevBridgeLayer /> : null}
    </>
  );
}
