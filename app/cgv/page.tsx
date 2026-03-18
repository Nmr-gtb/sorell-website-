import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Conditions Générales de Vente",
  description: "CGV de Sorell — Tarifs, paiement, résiliation, responsabilité.",
};


export default function CGVPage() {
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
          Conditions Générales de Vente
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "3rem" }}>
          Dernière mise à jour : 18 mars 2026
        </p>

        <Section title="1. Objet">
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles
            entre Noé Mur, entrepreneur individuel, exploitant le service Sorell accessible à l'adresse
            sorell.fr, et tout utilisateur souscrivant à un abonnement payant.
          </p>
        </Section>

        <Section title="2. Description du service">
          <p>
            Sorell est un service en ligne de génération automatisée de newsletters par intelligence
            artificielle. L'utilisateur configure ses thématiques, sources et fréquence d'envoi, et
            Sorell génère et envoie des newsletters personnalisées à ses destinataires.
          </p>
        </Section>

        <Section title="3. Tarifs et abonnements">
          <p>
            Les tarifs en vigueur sont affichés sur la page de tarification du site (sorell.fr/pricing).
            Les prix sont indiqués en euros TTC.
          </p>
          <p style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Plans disponibles :</p>
          <ul>
            <li><strong>Free</strong> : gratuit — 1 newsletter à l'inscription + 1 par mois</li>
            <li><strong>Solo</strong> : 10€/mois ou 96€/an — 1 newsletter personnalisée par semaine</li>
            <li><strong>Pro</strong> : 50€/mois ou 480€/an — newsletters illimitées, jusqu'à 10 destinataires, analytics complets</li>
            <li><strong>Enterprise</strong> : sur devis — fonctionnalités illimitées, support dédié</li>
          </ul>
          <p style={{ marginTop: "1rem" }}>
            Sorell se réserve le droit de modifier ses tarifs à tout moment. Les modifications
            n'affecteront pas les abonnements en cours.
          </p>
        </Section>

        <Section title="4. Paiement">
          <p>
            Les paiements sont effectués par carte bancaire via la plateforme sécurisée Stripe.
            L'abonnement est facturé de manière récurrente (mensuelle ou annuelle) selon le plan choisi.
          </p>
        </Section>

        <Section title="5. Droit de rétractation">
          <p>
            Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne
            s'applique pas aux contrats de fourniture de contenu numérique non fourni sur un support
            matériel dont l'exécution a commencé avec l'accord du consommateur.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Toutefois, l'utilisateur peut annuler son abonnement à tout moment depuis son espace client.
            L'accès au service sera maintenu jusqu'à la fin de la période en cours.
          </p>
        </Section>

        <Section title="6. Résiliation">
          <p>
            L'utilisateur peut résilier son abonnement à tout moment via le portail de gestion
            d'abonnement accessible depuis son profil. La résiliation prend effet à la fin de la période
            de facturation en cours. Aucun remboursement prorata ne sera effectué.
          </p>
        </Section>

        <Section title="7. Responsabilité">
          <p>
            Le contenu des newsletters est généré par intelligence artificielle (Claude, Anthropic).
            Sorell ne garantit pas l'exactitude, l'exhaustivité ou la pertinence du contenu généré.
            L'utilisateur est seul responsable de l'utilisation qu'il fait du contenu.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Sorell s'engage à mettre en œuvre les moyens nécessaires pour assurer la disponibilité du
            service, sans obligation de résultat.
          </p>
        </Section>

        <Section title="8. Force majeure">
          <p>
            Sorell ne pourra être tenu responsable en cas de non-exécution due à un cas de force
            majeure (panne technique, interruption de service des sous-traitants, etc.).
          </p>
        </Section>

        <Section title="9. Modification des CGV">
          <p>
            Sorell se réserve le droit de modifier les présentes CGV. Les utilisateurs seront informés
            par email de toute modification substantielle.
          </p>
        </Section>

        <Section title="10. Droit applicable et litiges">
          <p>
            Les présentes CGV sont régies par le droit français. En cas de litige, les parties
            s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les
            tribunaux de Paris seront seuls compétents.
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
