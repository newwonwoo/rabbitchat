import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F6F1E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Body */}
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: "48%",
            background: "#F6F1E8",
            border: "12px solid #2B2B2B",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Eyes */}
          <div style={{ position: "absolute", top: 110, left: 90, width: 32, height: 32, borderRadius: "50%", background: "#2B2B2B" }} />
          <div style={{ position: "absolute", top: 110, right: 90, width: 32, height: 32, borderRadius: "50%", background: "#2B2B2B" }} />
          {/* Nose */}
          <div style={{ position: "absolute", top: 170, width: 36, height: 22, borderRadius: "50%", background: "#2B2B2B" }} />
          {/* Cheek */}
          <div style={{ position: "absolute", top: 175, left: 50, width: 36, height: 24, borderRadius: "50%", background: "#F7D7DA" }} />
          <div style={{ position: "absolute", top: 175, right: 50, width: 36, height: 24, borderRadius: "50%", background: "#F7D7DA" }} />
        </div>
        {/* Ears */}
        <div style={{ position: "absolute", top: 30, left: 180, width: 50, height: 160, borderRadius: 25, background: "#F6F1E8", border: "10px solid #2B2B2B", borderTopColor: "#F7D7DA", borderTopWidth: 30 }} />
        <div style={{ position: "absolute", top: 30, right: 180, width: 50, height: 160, borderRadius: 25, background: "#F6F1E8", border: "10px solid #2B2B2B", borderTopColor: "#F7D7DA", borderTopWidth: 30 }} />
      </div>
    ),
    size,
  );
}
