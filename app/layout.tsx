import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "ChessWhiz — AI Chess Coach for Kids",
  description: "Learn chess with your personal AI coach. Play, make mistakes, and grow!",
  other: {
    "chesswhiz-version": COMMIT_SHA,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable} ${caveat.variable} ${jetbrainsMono.variable}`}>
      <body style={{ margin: 0, background: "#07050F" }}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
