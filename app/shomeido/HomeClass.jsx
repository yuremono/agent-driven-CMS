"use client";

import { useEffect } from "react";

export default function HomeClass() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("home");
    return () => {
      root.classList.remove("home");
    };
  }, []);

  return null;
}
