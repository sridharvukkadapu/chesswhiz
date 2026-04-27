import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Chess Kingdom",
  description: "7 kingdoms, 7 bosses, 19 powers. The full map of the ChessWhiz progression — from Pawn Village to the Endgame Throne.",
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
