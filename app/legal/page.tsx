import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site sorell.fr — Éditeur, hébergement, propriété intellectuelle.",
};

export const metadata = {
  title: "Mentions légales — Sorell",
};

export default function LegalPage() {
  return (
    <main style={{ background: "var(--bg)" }}>
      <Navbar />

      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "80px 1.5rem 4rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            color: "var(--text)",
            marginBottom: "0.5rem",
          }}
        >
          Mentions légales
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "3rem" }}>
          Dernière mise à jour : 18 mars 2026
        </p>

        <Section title="1. Éditeur du site">
          <p>
            Le site sorell.fr est édité par Noé Mur, entrepreneur individuel.
          </p>
          <ul>
            <li>Email : <a href="mailto:murnoe@outlook.fr" style={{ color: "var(--accent)" }}>murnoe@outlook.fr</a></li>
            <li>Site : <a href="https://sorell.fr" style={{ color: "var(--accent)" }}>https://sorell.fr</a></li>
          </ul>
        </Section>

        <Section title="2. Hébergement">
          <p>Le site est hébergé par Vercel Inc.</p>
          <ul>
            <li>Adresse : 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
            <li>Site : <a href="https://vercel.com" style={{ color: "var(--accent)" }}>https://vercel.com</a></li>
          </ul>
        </Section>

        <Section title="3. Propriété intellectuelle">
          <p>
            L'ensemble du contenu du site sorell.fr (textes, images, logos, design) est la propriété de
            Noé Mur ou de ses partenaires. Toute reproduction, même partielle, est interdite sans
            autorisation préalable.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Le nom &quot;Sorell&quot; et le logo associé sont la propriété de Noé Mur.
          </p>
        </Section>

        <Section title="4. Responsabilité">
          <p>
            Sorell s'efforce de fournir des informations aussi précises que possible. Toutefois, il ne
            pourra être tenu responsable des omissions, des inexactitudes et des carences dans la mise
            à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces
            informations.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Les newsletters générées par Sorell utilisent l'intelligence artificielle et peuvent contenir
            des approximations. Le contenu généré ne constitue pas un conseil professionnel.
          </p>
        </Section>

        <Section title="5. Liens hypertextes">
          <p>
            Le site peut contenir des liens vers d'autres sites. Sorell ne dispose d'aucun moyen pour
            contrôler le contenu de ces sites tiers et n'assume aucune responsabilité de ce fait.
          </p>
        </Section>

        <Section title="6. Droit applicable">
          <p>
            Les présentes mentions légales sont régies par le droit français. En cas de litige, les
            tribunaux français seront seuls compétents.
          </p>
        </Section>
      </div>

      <Footer />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontWeight: 600,
          fontSize: "18px",
          color: "var(--text)",
          marginBottom: "0.75rem",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: "15px",
          lineHeight: 1.7,
          color: "var(--text-secondary)",
        }}
      >
        {children}
      </div>
    </section>
  );
}
