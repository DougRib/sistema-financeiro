import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FinControl — Sistema de controle financeiro pessoal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "radial-gradient(circle at 30% 30%, rgba(20,37,74,0.9) 0%, transparent 60%), linear-gradient(180deg, #0a1224 0%, #060c1c 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: 80,
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Gold accent ring */}
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 80,
            width: 120,
            height: 120,
            borderRadius: 9999,
            background: "linear-gradient(135deg, #e6c879 0%, #b8893f 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            fontWeight: 900,
            color: "#1a1208",
            boxShadow: "0 12px 32px rgba(184,137,63,0.55)",
          }}
        >
          FC
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1,
            display: "flex",
            gap: 0,
          }}
        >
          <span style={{ color: "#f5f5f7" }}>Fin</span>
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #e6c879, #b8893f)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Control
          </span>
        </div>

        <div
          style={{
            fontSize: 30,
            color: "#b0b8c9",
            marginTop: 24,
            maxWidth: 800,
            lineHeight: 1.3,
          }}
        >
          Controle total das suas finanças
        </div>

        <div
          style={{
            fontSize: 18,
            color: "#5a6378",
            marginTop: 48,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Sistema de Controle Financeiro
        </div>
      </div>
    ),
    { ...size },
  );
}
