import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knight Card",
  description: "Your shareable chess identity — rank, powers earned, bosses defeated.",
};

export default function CardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
