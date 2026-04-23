import type { Metadata } from "next";
import { Baloo_2, Comic_Neue } from "next/font/google";
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

export const metadata: Metadata = {
  title: "ChessWhiz — AI Chess Coach for Kids",
  description: "Learn chess with your personal AI coach. Play, make mistakes, and grow!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${comicNeue.variable}`}>
      <body style={{ margin: 0, background: "#0F172A" }}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
