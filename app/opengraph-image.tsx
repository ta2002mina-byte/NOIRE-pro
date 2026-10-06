import { ImageResponse } from "next/og";

export const alt = "NOIRÉ — Your table. Your taste. Your story.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default OG/Twitter card image for every page that doesn't define its own —
 * brand name and tagline only, nothing that could go stale or misrepresent
 * a specific dish/offer. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0C0B0A",
          color: "#EFE9DF",
        }}
      >
        <div style={{ fontSize: 108, letterSpacing: 14, fontFamily: "serif" }}>NOIRÉ</div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#A9A195",
          }}
        >
          Your table. Your taste. Your story.
        </div>
      </div>
    ),
    { ...size },
  );
}
