import type { Metadata, Viewport } from "next";
import { Caveat, Gaegu, Gowun_Batang, Gowun_Dodum } from "next/font/google";

import "./globals.css";

// Design v3 token fonts. Each `--font-*` CSS variable is consumed by
// tailwind.config.ts fontFamily.{display, sans, serif, accent}.
const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap",
});
const gowunDodum = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
  display: "swap",
});
const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-accent",
  display: "swap",
});

export const metadata: Metadata = {
  title: "하얀 토끼 깡총 / RabbitChat",
  description: "27개월 아이를 위한 텍스트 없는 인터랙티브 회상 동화 친구",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F6F1E8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${gaegu.variable} ${gowunDodum.variable} ${gowunBatang.variable} ${caveat.variable}`}
    >
      <body className="min-h-screen bg-kkang-ivory bg-kkang-paper font-sans text-kkang-ink">
        {children}
      </body>
    </html>
  );
}
