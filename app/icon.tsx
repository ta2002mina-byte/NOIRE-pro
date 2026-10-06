import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Same "N" monogram used as components/ui/media.tsx's no-image placeholder — one brand mark, not a separate invented logo. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0C0B0A",
          color: "#EFE9DF",
          fontSize: 20,
          fontFamily: "serif",
        }}
      >
        N
      </div>
    ),
    { ...size },
  );
}
