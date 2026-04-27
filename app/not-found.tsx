import Link from "next/link";

export const metadata = {
  title: "404 — Square Not Found",
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse at 50% 20%, #FFF8E8 0%, #F5ECDC 45%, #FBF6EC 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "40px 24px",
      fontFamily: "var(--font-jakarta), sans-serif",
      color: "#1F2A44",
    }}>
      <div style={{
        fontSize: 96,
        lineHeight: 1,
        marginBottom: 16,
        filter: "drop-shadow(0 8px 24px rgba(255,107,90,0.25))",
      }}>
        ♔
      </div>
      <div style={{
        fontFamily: "var(--font-caveat), cursive",
        fontSize: 22,
        color: "#FF6B5A",
        marginBottom: 8,
      }}>
        oops →
      </div>
      <h1 style={{
        fontFamily: "var(--font-dm-serif), serif",
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: "clamp(36px, 6vw, 64px)",
        letterSpacing: "-0.02em",
        margin: "0 0 16px",
        lineHeight: 1.1,
      }}>
        This square doesn&apos;t exist
      </h1>
      <p style={{
        fontSize: 16,
        color: "#9BA1B5",
        maxWidth: 400,
        lineHeight: 1.7,
        margin: "0 0 36px",
      }}>
        The king must have wandered off. Let&apos;s get you back to the board.
      </p>
      <Link href="/" style={{
        display: "inline-block",
        background: "#FF6B5A",
        color: "#FFFCF5",
        borderRadius: 100,
        padding: "16px 36px",
        fontSize: 16,
        fontWeight: 800,
        textDecoration: "none",
        letterSpacing: "0.03em",
        boxShadow: "0 0 20px rgba(255,107,90,0.45), 0 8px 24px rgba(255,107,90,0.25)",
      }}>
        Back to the board →
      </Link>
    </div>
  );
}
