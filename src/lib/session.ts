"use client";

// MVPの簡易セッション（モックログイン）。本番はSupabase Auth / NextAuthに置換。
import { mockStores } from "./mockData";

const MERCHANT_KEY = "hashigo-merchant-store";
const ADMIN_KEY = "hashigo-admin";

// 店舗ログイン中の店舗ID（デフォルトは先頭店舗）
export function getMerchantStoreId(): string {
  if (typeof window === "undefined") return mockStores[0].id;
  return window.localStorage.getItem(MERCHANT_KEY) ?? mockStores[0].id;
}

export function setMerchantStoreId(id: string) {
  window.localStorage.setItem(MERCHANT_KEY, id);
}

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_KEY) === "1";
}

export function setAdmin(on: boolean) {
  if (on) window.localStorage.setItem(ADMIN_KEY, "1");
  else window.localStorage.removeItem(ADMIN_KEY);
}
