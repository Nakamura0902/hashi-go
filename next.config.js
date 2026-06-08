/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy（既知の通信先のみ許可）
// 通信先: Supabase(API/Realtime wss), Mapbox(タイル/イベント/ワーカー), Unsplash(画像)
const csp = [
  "default-src 'self'",
  // Nextのインラインスクリプト用に unsafe-inline、開発のHMRには eval を許可
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.mapbox.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.mapbox.com https://api.mapbox.com https://events.mapbox.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // 位置情報は自サイトのみ許可、カメラ/マイクは無効
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // X-Powered-By を隠す
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
