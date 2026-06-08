"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ScoredStore } from "@/lib/types";
import { MAPBOX_TOKEN } from "@/lib/config";

const PIN_HEX: Record<string, string> = {
  open: "#16A34A",
  few: "#F97316",
  soon: "#EAB308",
  full: "#9CA3AF",
  closed: "#9CA3AF",
};

// 本物のMapbox地図（NEXT_PUBLIC_MAPBOX_TOKEN がある場合）
export function MapboxMap({
  stores,
  center,
  selectedId,
  onSelect,
}: {
  stores: ScoredStore[];
  center: { lat: number; lng: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center.lng, center.lat],
      zoom: 15,
    });
    // 現在地
    new mapboxgl.Marker({ color: "#2563EB" })
      .setLngLat([center.lng, center.lat])
      .addTo(mapRef.current);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = stores.map((s) => {
      const el = document.createElement("button");
      const selected = s.store.id === selectedId;
      el.className = "rounded-md px-2 py-1 text-[11px] font-bold text-white shadow";
      el.style.background = PIN_HEX[s.seat.availability];
      el.style.transform = selected ? "scale(1.15)" : "scale(1)";
      el.style.border = selected ? "2px solid #fff" : "none";
      el.textContent = s.store.name.slice(-4);
      el.onclick = () => onSelect(s.store.id);
      return new mapboxgl.Marker({ element: el })
        .setLngLat([s.store.lng, s.store.lat])
        .addTo(map);
    });
  }, [stores, selectedId, onSelect]);

  return <div ref={ref} className="h-full w-full" />;
}
