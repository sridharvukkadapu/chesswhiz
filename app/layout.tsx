import type { Metadata } from "next";
import { Baloo_2, Caveat, Cinzel, Comic_Neue, Playfair_Display, Quicksand } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-nunito",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
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
    <html lang="en" className={`${baloo.variable} ${comicNeue.variable} ${playfair.variable} ${caveat.variable} ${cinzel.variable} ${quicksand.variable}`}>
      <body style={{ margin: 0, background: "#0F172A" }}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
