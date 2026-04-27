import Link from "next/link";

const P = {
  cream: "#1A1238",
  creamDeep: "rgba(36,24,69,0.85)",
  parchment: "rgba(245,230,200,0.12)",
  ink: "#FBF6E8",
  inkSoft: "#FBF6E8",
  inkMed: "#D6C8A8",
  inkLight: "#9A8FB5",
  inkFaint: "#6B6285",
  inkGhost: "rgba(245,230,200,0.22)",
  emerald: "#34D399",
  emeraldBright: "#6EE7B7",
  emeraldPale: "rgba(52,211,153,0.10)",
  gold: "#F5B638",
  goldLight: "#FCD34D",
  goldPale: "rgba(245,182,56,0.10)",
};

export const metadata = {
  title: "Terms · ChessWhiz",
  description: "The rules for using ChessWhiz.",
};

export default function TermsPage() {
  return (
    <div style={{
      minHeight: "100dvh", background: "radial-gradient(ellipse at 50% 30%, #2D1B5C 0%, #15102A 45%, #07050F 100%)", color: P.ink,
      fontFamily: "var(--font-jakarta), sans-serif",
    }}>
      <header style={{
        padding: "12px 20px",
        borderBottom: `1px solid ${P.inkGhost}40`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8,
          color: P.inkMed, textDecoration: "none", fontSize: 13, fontWeight: 700,
        }}>← Home</Link>
        <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-cormorant), serif" }}>♟ ChessWhiz</span>
        <span style={{ width: 60 }} />
      </header>

      <article style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px", lineHeight: 1.8 }}>
        <span style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: P.gold }}>plain-English version →</span>
        <h1 style={{ fontSize: 40, fontWeight: 900, fontFamily: "var(--font-cormorant), serif", letterSpacing: -1, margin: "8px 0 24px" }}>Terms of Use</h1>

        <p style={{ fontSize: 17, color: P.inkSoft, marginBottom: 24 }}>
          These are the rules for using ChessWhiz. They&apos;re short on purpose.
        </p>

        <p style={{ fontSize: 13, color: P.inkLight, marginBottom: 32 }}>Last updated: April 25, 2026</p>

        <Section title="Use it for kids">
          <p>ChessWhiz is designed for children learning chess. A parent or guardian should set it up and supervise. By using the site you confirm you&apos;re a parent/guardian (or 18+ using it for yourself).</p>
        </Section>

        <Section title="No guarantees">
          <p>ChessWhiz is provided as-is. Coach Pawn is an AI — it occasionally gets things wrong. Use it as a learning aid, not as the final word on chess instruction. Don&apos;t use coaching responses as authoritative chess analysis for tournament play.</p>
        </Section>

        <Section title="Don't break it">
          <p>Don&apos;t scrape the site, abuse the API, or try to extract Coach Pawn&apos;s prompts via prompt injection. Don&apos;t use ChessWhiz to harass anyone or generate harmful content.</p>
        </Section>

        <Section title="Free tier limits">
          <p>The free tier includes 3 games per day and Pawn Village. We may change these limits with reasonable notice. The Champion subscription, if you sign up, is billed monthly and can be cancelled anytime.</p>
        </Section>

        <Section title="Liability">
          <p>To the fullest extent permitted by law, ChessWhiz and its maker are not liable for indirect or consequential damages arising from your use of the site. Maximum liability is capped at fees you paid in the prior 12 months (which is zero for free-tier users).</p>
        </Section>

        <Section title="Changes">
          <p>We may update these terms. We&apos;ll update the &ldquo;last updated&rdquo; date above when we do. Continued use after changes means you accept them.</p>
        </Section>

        <Section title="Contact">
          <p>Questions? Email <a href="mailto:hello@chesswhiz.com" style={{ color: P.emerald }}>hello@chesswhiz.com</a>.</p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{
        fontSize: 18, fontWeight: 900, fontFamily: "var(--font-cormorant), serif",
        margin: "0 0 8px", color: P.ink, letterSpacing: -0.3,
      }}>{title}</h2>
      <div style={{ fontSize: 15, color: P.inkSoft }}>{children}</div>
    </section>
  );
}
