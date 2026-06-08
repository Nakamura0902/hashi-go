"use client";

import { useEffect } from "react";

// Service Worker を登録（PWA: オフライン・ホーム画面追加）
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.warn("SW登録に失敗:", e);
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
