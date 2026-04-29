import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "하얀 토끼 깡총 / RabbitChat",
    short_name: "깡총이",
    description: "27개월 아이를 위한 텍스트 없는 인터랙티브 회상 동화 친구",
    start_url: "/",
    display: "fullscreen",
    orientation: "portrait",
    background_color: "#F6F1E8",
    theme_color: "#F6F1E8",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    categories: ["kids", "education", "books"],
  };
}
