import { ImageResponse } from "next/og";
import { getSongBySlugs } from "@/lib/firestore/songs";

export const alt = "AkorPro şarkı görseli";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ sanatciSlug: string; sarkiSlug: string }>;
}) {
  const { sanatciSlug, sarkiSlug } = await params;
  const song = await getSongBySlugs(sanatciSlug, sarkiSlug);

  const title = song?.title ?? "Şarkı bulunamadı";
  const artist = song?.artistName ?? "";
  const key = song?.originalKey ?? "";
  const difficulty = song?.difficulty ?? "";

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
            gap: "12px",
            marginBottom: "32px",
            fontSize: "24px",
            color: "#a1a1aa",
          }}
        >
          <span style={{ color: "#6D5DFC", fontWeight: 700 }}>AkorPro</span>
          <span>·</span>
          <span>Gitar Akorları</span>
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          {title}
        </div>
        {artist && (
          <div
            style={{
              fontSize: "32px",
              color: "#a1a1aa",
              marginTop: "20px",
            }}
          >
            {artist}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "40px",
            fontSize: "22px",
            color: "#71717a",
          }}
        >
          {key && <span>Ton: {key}</span>}
          {difficulty && <span style={{ textTransform: "capitalize" }}>Zorluk: {difficulty}</span>}
        </div>
      </div>
    ),
    { ...size },
  );
}
