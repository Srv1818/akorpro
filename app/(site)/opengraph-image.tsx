import { ImageResponse } from "next/og";

export const alt = "AkorPro — Gitar akorları ve müzik araçları";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: "#6D5DFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "#6D5DFC",
            }}
          >
            AkorPro
          </span>
        </div>
        <div
          style={{
            fontSize: "60px",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: "900px",
          }}
        >
          Gitar akorları ve müzik araçları
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            textAlign: "center",
            marginTop: "24px",
            maxWidth: "800px",
            lineHeight: 1.5,
          }}
        >
          Şarkı akorları · Akor kütüphanesi · Gamlar · 5'li çember
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "48px",
          }}
        >
          {["Türkçe içerik", "Ücretsiz", "Topluluk odaklı"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "1.5px solid #3f3f46",
                fontSize: "18px",
                color: "#71717a",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
