import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description: "The 5-step learning loop: Learn, Practice, Battle Test, Earn a Power, Reinforce. How ChessWhiz turns games into mastery.",
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
