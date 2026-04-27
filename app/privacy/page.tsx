import Link from "next/link";

const P = {
  cream: "#FBF6EC",
  creamDeep: "#FFFCF5",
  parchment: "rgba(31,42,68,0.06)",
  ink: "#1F2A44",
  inkSoft: "#1F2A44",
  inkMed: "#5C6580",
  inkLight: "#9BA1B5",
  inkFaint: "#B8BDD0",
  inkGhost: "rgba(31,42,68,0.12)",
  emerald: "#7CB69E",
  emeraldBright: "#A8D4C2",
  emeraldPale: "rgba(124,182,158,0.12)",
  gold: "#FF6B5A",
  goldLight: "#FF8E70",
  goldPale: "rgba(255,107,90,0.10)",
};

export const metadata = {
  title: "Privacy · ChessWhiz",
  description: "What ChessWhiz collects, what it doesn't, and how kid data is protected.",
};

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100dvh", background: "radial-gradient(ellipse at 50% 20%, #FFF8E8 0%, #F5ECDC 45%, #FBF6EC 100%)", color: P.ink,
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
        <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-dm-serif), serif" }}>♟ ChessWhiz</span>
        <span style={{ width: 60 }} />
      </header>

      <article style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px", lineHeight: 1.8 }}>
        <span style={{ fontFamily: "'Caveat', cursive", fontSize: 20, color: P.gold }}>the short version →</span>
        <h1 style={{ fontSize: 40, fontWeight: 900, fontFamily: "var(--font-dm-serif), serif", letterSpacing: -1, margin: "8px 0 24px" }}>Privacy</h1>

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
        fontSize: 18, fontWeight: 900, fontFamily: "var(--font-dm-serif), serif",
        margin: "0 0 8px", color: P.ink, letterSpacing: -0.3,
      }}>{title}</h2>
      <div style={{ fontSize: 15, color: P.inkSoft }}>{children}</div>
    </section>
  );
}
