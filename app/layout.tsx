import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="ko">
      <body className="min-h-screen bg-kkang-ivory text-kkang-ink">
        {children}
      </body>
    </html>
  );
}
