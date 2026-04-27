import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent Dashboard",
  description: "Monitor your child's chess progress, manage settings, and upgrade to Champion.",
};

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
