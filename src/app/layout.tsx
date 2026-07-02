import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { AuthProvider } from "@/components/auth/AuthProvider";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "はしGO｜次、どこ行く？を10秒で。",
  description:
    "飲み会の2軒目・3軒目に、今すぐ入れる近くの居酒屋を提案。空席×現在地×人数でサクッと決まる。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "はしGO",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1E3A5F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={noto.variable}>
      <body className="bg-bg font-sans text-ink antialiased">
        {/* モバイルファースト：アプリ幅を中央寄せ */}
        <div className="mx-auto min-h-dvh w-full max-w-app bg-bg">
          <AuthProvider>{children}</AuthProvider>
        </div>
        <PwaRegister />
      </body>
    </html>
  );
}
