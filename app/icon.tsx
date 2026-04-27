import { ImageResponse } from "next/og";

// App icon — auto-served as favicon/apple-touch-icon by Next.
// 32×32 king piece in a gold-foil tile.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          background:
            "linear-gradient(135deg, #C7940A 0%, #FCD34D 25%, #F5B638 50%, #FFE9A8 65%, #C7940A 100%)",
          borderRadius: 6,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="kBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF6E1" />
              <stop offset="50%" stopColor="#F0DCAD" />
              <stop offset="100%" stopColor="#9C7A3F" />
            </linearGradient>
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
            d="M52 17 L68 17 M56 12 L64 12 M60 8 L60 22"
            stroke="#B07A0E"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="60" cy="9" r="3" fill="#B07A0E" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
