"use client";

// ブラウザ通知（Notification API）のヘルパー。
// アプリを開いている間、Realtimeイベントに連動してローカル通知を出す。
// （アプリ終了中のWeb Pushは送信バックエンド＋VAPIDが必要なため将来対応）

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function notify(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon.svg", badge: "/icon.svg" });
  } catch {
    // 一部ブラウザはSW経由のみ許可。失敗しても画面内通知で代替するため握りつぶす。
  }
}
