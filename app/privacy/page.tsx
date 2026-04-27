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
  title: "Privacy · ChessWhiz",
  description: "What ChessWhiz collects, what it doesn't, and how kid data is protected.",
};

export default function PrivacyPage() {
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
        <span style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: P.gold }}>the short version →</span>
        <h1 style={{ fontSize: 40, fontWeight: 900, fontFamily: "var(--font-cormorant), serif", letterSpacing: -1, margin: "8px 0 24px" }}>Privacy</h1>

        <p style={{ fontSize: 17, color: P.inkSoft, marginBottom: 24 }}>
          ChessWhiz is built for kids. We collect as little as possible, and we never sell, share, or advertise to anyone. Here&apos;s exactly what happens with your data.
        </p>

        <p style={{ fontSize: 13, color: P.inkLight, marginBottom: 32 }}>Last updated: April 25, 2026</p>

        <Section title="What we collect">
          <ul>
            <li><strong>Name &amp; age group</strong> — entered during onboarding so Coach Pawn can speak at the right level. Stored locally in your browser.</li>
            <li><strong>Game state &amp; progress</strong> — XP, kingdoms, Powers earned. Stored locally in your browser (<code>localStorage</code>).</li>
            <li><strong>Coaching prompts</strong> — when Coach Pawn responds, we send the current chess position and your kid&apos;s first name to Anthropic&apos;s Claude API to generate the response. We do not store these requests on our servers.</li>
          </ul>
        </Section>

        <Section title="What we don't collect">
          <ul>
            <li>No accounts. No passwords. No email collection in the free tier.</li>
            <li>No location data, contacts, or device identifiers.</li>
            <li>No third-party advertising trackers, pixels, or analytics SDKs that profile children.</li>
            <li>No social features. No chat with other users. No way for strangers to contact your kid.</li>
          </ul>
        </Section>

        <Section title="Third parties">
          <ul>
            <li><strong>Anthropic (Claude API)</strong> — generates the coaching responses. Anthropic&apos;s data policy applies to those API calls; we send the minimum needed (position, age group, first name only).</li>
            <li><strong>Vercel</strong> — hosts the site. Standard server logs (IP, user agent, timestamp) are retained briefly per Vercel&apos;s policy.</li>
          </ul>
        </Section>

        <Section title="COPPA &amp; kid safety">
          <p>ChessWhiz does not knowingly collect personal information from children under 13 beyond what is stored locally in their own browser. The product is designed to function without any account or remote storage of personal data. If you believe a child has provided personal information beyond local storage, contact us at <a href="mailto:hello@chesswhiz.com" style={{ color: P.emerald }}>hello@chesswhiz.com</a> and we&apos;ll investigate.</p>
        </Section>

        <Section title="Your control">
          <p>To delete everything ChessWhiz knows about your kid: clear your browser&apos;s site data for <code>chesswhiz.vercel.app</code>. That&apos;s it. There is no remote profile to wipe.</p>
        </Section>

        <Section title="Contact">
          <p>Questions? Email <a href="mailto:hello@chesswhiz.com" style={{ color: P.emerald }}>hello@chesswhiz.com</a>. A real human (the chess dad who built this) will reply.</p>
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
