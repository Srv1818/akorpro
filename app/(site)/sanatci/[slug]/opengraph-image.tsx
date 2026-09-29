import { ImageResponse } from "next/og";
import { getArtistBySlug } from "@/lib/firestore/artists";

export const alt = "AkorPro sanatçı görseli";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);

  const name = artist?.name ?? "Sanatçı";
  const genre = artist?.genre ?? "";
  const songCount = artist?.songCount ?? 0;

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
          <span>Sanatçı</span>
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "32px",
            fontSize: "24px",
            color: "#71717a",
          }}
        >
          {genre && <span>{genre}</span>}
          {songCount > 0 && <span>{songCount} şarkı</span>}
        </div>
      </div>
    ),
    { ...size },
  );
}
