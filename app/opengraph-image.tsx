import { ImageResponse } from "next/og";

// Open Graph image — 1200×630, served at /opengraph-image.
// Used as og:image automatically by Next 16 across the whole app.
// Also serves as the Twitter card image.

export const alt = "ChessWhiz — The chess coach your kid always wanted";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
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
          padding: "60px",
          background:
            "radial-gradient(ellipse at 50% 20%, #FFF8E8 0%, #F5ECDC 50%, #EDE0C8 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle starry dots */}
        {[
          [180, 120, 3], [240, 380, 2], [320, 200, 2.5], [420, 90, 3],
          [560, 320, 2], [680, 150, 2.5], [820, 240, 3], [960, 100, 2],
          [1020, 380, 2.5], [1100, 220, 3], [140, 480, 2], [400, 540, 2.5],
          [720, 520, 2], [880, 460, 3], [60, 280, 2], [560, 60, 3],
        ].map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r as number,
              height: r as number,
              background: "#FF6B5A",
              borderRadius: "50%",
              opacity: 0.35,
              boxShadow: "0 0 8px rgba(255,107,90,0.5)",
            }}
          />
        ))}

        {/* King piece */}
        <div
          style={{
            display: "flex",
            filter:
              "drop-shadow(0 0 60px rgba(255,107,90,0.40)) drop-shadow(0 12px 24px rgba(31,42,68,0.25))",
            marginBottom: 30,
          }}
        >
          <svg width="220" height="220" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="kBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF6E1" />
                <stop offset="50%" stopColor="#F0DCAD" />
                <stop offset="100%" stopColor="#9C7A3F" />
              </linearGradient>
              <radialGradient id="kHi" cx="0.4" cy="0.3" r="0.6">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="60" cy="104" rx="28" ry="4" fill="rgba(0,0,0,0.45)" />
            <path
              d="M42 78 L78 78 L82 88 L86 100 L34 100 L38 88 Z"
              fill="url(#kBody)"
              stroke="#7A5418"
              strokeWidth="1.5"
            />
            <path
              d="M60 12 L60 22 M52 17 L68 17 M60 22 C45 22 38 32 38 44 C38 54 44 60 50 62 L48 78 L72 78 L70 62 C76 60 82 54 82 44 C82 32 75 22 60 22 Z"
              fill="url(#kBody)"
              stroke="#7A5418"
              strokeWidth="1.5"
            />
            <path
              d="M60 12 L60 22 M52 17 L68 17 M60 22 C45 22 38 32 38 44 C38 54 44 60 50 62 L48 78 L72 78 L70 62 C76 60 82 54 82 44 C82 32 75 22 60 22 Z"
              fill="url(#kHi)"
              opacity="0.9"
            />
            <path
              d="M52 17 L68 17 M56 12 L64 12 M60 8 L60 22"
              stroke="#B07A0E"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="60" cy="9" r="3" fill="#B07A0E" />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 124,
            fontWeight: 700,
            fontStyle: "italic",
            letterSpacing: -2,
            background:
              "linear-gradient(135deg, #C8441A 0%, #FF6B5A 25%, #FF8E70 50%, #F2C94C 75%, #C8441A 100%)",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1,
          }}
        >
          ChessWhiz
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 26,
            color: "#5C6580",
            letterSpacing: 8,
            textTransform: "uppercase",
            paddingLeft: 8,
          }}
        >
          Every move is a lesson
        </div>

        {/* Footer pitch */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 50,
            fontSize: 18,
            color: "#9BA1B5",
            letterSpacing: 1.5,
          }}
        >
          The chess coach your kid always wanted · ages 5–12 · free to start
        </div>
      </div>
    ),
    { ...size },
  );
}
