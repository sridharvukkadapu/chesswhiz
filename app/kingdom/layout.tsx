import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kingdom Map",
  description: "Explore the 7 kingdoms of the Chess Kingdom. Defeat bosses, earn powers, and climb from Pawn to King.",
};

export default function KingdomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
