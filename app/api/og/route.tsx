import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");

    const inter = await fetch(new URL("../../../public/assets/inter/regular.ttf", import.meta.url)).then((res) => res.arrayBuffer());

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "40px",
          fontFamily: "Inter",
          fontSize: "24px",
          letterSpacing: "-0.47px",
          backgroundColor: "black",
          color: "rgba(255,255,255,0.92)",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>Koko Quran</div>
          {title ? <div style={{ color: "rgba(255,255,255,0.45)" }}>/ {title}</div> : null}
        </div>
      </div>,
      {
        width: 1200,
        height: 600,
        fonts: [
          {
            name: "Inter",
            data: inter,
            weight: 400,
          },
        ],
      },
    );
  } catch {
    return new Response("Failed to generate the image", {
      status: 500,
    });
  }
}
