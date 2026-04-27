import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Playing",
  description: "Set up your coach in 10 seconds. Tell Coach Pawn your name and age — no signup, no credit card.",
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
