import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// ChessWhiz Reimagined — fonts match the design handoff bundle.
//   Cormorant Garamond — premium fantasy serif (display, brand, italics)
//   Plus Jakarta Sans  — friendly modern UI sans
//   Caveat             — handwritten coach annotations
//   JetBrains Mono     — move history, stat labels, FEN

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Vercel injects VERCEL_GIT_COMMIT_SHA at build time; falls back to "dev"
// for local builds. Used as a version stamp so cache problems are
// instantly diagnosable: "view source, search chesswhiz-version".
const COMMIT_SHA = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7);

const TITLE = "ChessWhiz — The chess coach your kid always wanted";
const DESCRIPTION =
  "Free AI chess coach that plays alongside your child and explains every move in their language. Ages 5–12. The Chess Kingdom — 7 regions, 7 bosses, 20 powers, and Coach Pawn.";

export const metadata: Metadata = {
  metadataBase: new URL("https://chesswhiz.vercel.app"),
  title: {
    default: TITLE,
    template: "%s · ChessWhiz",
  },
  description: DESCRIPTION,
  applicationName: "ChessWhiz",
  authors: [{ name: "ChessWhiz" }],
  keywords: [
    "chess for kids", "AI chess coach", "chess tutor", "chess lessons",
    "Coach Pawn", "Chess Kingdom", "kids chess app", "chess learning",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "https://chesswhiz.vercel.app",
    siteName: "ChessWhiz",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "chesswhiz-version": COMMIT_SHA,
  },
};

export const viewport: Viewport = {
  themeColor: "#07050F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable} ${caveat.variable} ${jetbrainsMono.variable}`}>
      <body style={{ margin: 0, background: "#07050F" }}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <noscript>
          <div style={{
            padding: "24px 28px",
            margin: "40px auto",
            maxWidth: 480,
            borderRadius: 16,
            background: "#1A1238",
            border: "1.5px solid rgba(245,230,200,0.22)",
            color: "#FBF6E8",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            textAlign: "center",
            lineHeight: 1.6,
          }}>
            <strong style={{ display: "block", fontSize: 22, marginBottom: 8 }}>
              ChessWhiz needs JavaScript
            </strong>
            <span style={{ fontStyle: "normal", fontSize: 14, color: "#D6C8A8" }}>
              Please enable JavaScript in your browser to play. Coach Pawn is waiting!
            </span>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
