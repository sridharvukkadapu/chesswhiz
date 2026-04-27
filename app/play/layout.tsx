import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play",
  description: "Play chess with Coach Pawn — your AI chess coach that explains every move.",
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
