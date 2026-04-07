import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Conditions Générales de Vente",
  description: "CGV de Sorell - Tarifs, paiement, résiliation, responsabilité.",
};


export default function CGVPage() {
  return (
    <main style={{ background: "var(--bg)" }}>
      <Navbar />

      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "120px 1.5rem 4rem",
          overflowWrap: "break-word",
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
          Dernière mise à jour : 3 avril 2026
        </p>

        <Section title="1. Objet">
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles
            entre Noé Mur, entrepreneur individuel, exploitant le service Sorell accessible à l&apos;adresse
            sorell.fr, et tout utilisateur souscrivant à un abonnement payant.
          </p>
        </Section>

        <Section title="2. Description du service">
          <p>
            Sorell est un service en ligne de génération automatisée de newsletters par intelligence
            artificielle. L&apos;utilisateur configure ses thématiques, sources et fréquence d&apos;envoi, et
            Sorell génère et envoie des newsletters personnalisées à ses destinataires.
          </p>
        </Section>

        <Section title="3. Tarifs et abonnements">
          <p>
            Les tarifs en vigueur sont affichés sur la page de tarification du site (sorell.fr/tarifs).
            Les prix sont indiqués en euros TTC. TVA non applicable, article 293 B du CGI.
          </p>
          <p style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Plans disponibles :</p>
          <ul>
            <li><strong>Free</strong> : gratuit - 1 newsletter automatique par mois, 1 destinataire, thématiques prédéfinies</li>
            <li><strong>Pro</strong> : 19€/mois ou 190€/an - newsletters illimitées, jusqu&apos;à 10 destinataires, thématiques et sources au choix, aperçu avant envoi, historique, analytics complets. Essai gratuit de 15 jours.</li>
            <li><strong>Business</strong> : 49€/mois ou 490€/an - newsletters illimitées, jusqu&apos;à 50 destinataires, logo personnalisé, fréquence quotidienne à mensuelle, toutes les fonctionnalités Pro incluses. Essai gratuit de 15 jours.</li>
            <li><strong>Enterprise</strong> : sur devis - destinataires illimités, API et intégrations, CRM connecté, CSM dédié, SLA 99,9%</li>
          </ul>
          <p style={{ marginTop: "1rem" }}>
            Sorell se réserve le droit de modifier ses tarifs à tout moment. Les modifications
            n&apos;affecteront pas les abonnements en cours.
          </p>
        </Section>

        <Section title="4. Essai gratuit">
          <p>
            Les plans Pro et Business incluent un essai gratuit de 15 jours. Durant cette période,
            l&apos;utilisateur bénéficie de l&apos;intégralité des fonctionnalités du plan choisi. À l&apos;issue des
            15 jours, l&apos;abonnement est automatiquement activé et le premier prélèvement effectué, sauf
            si l&apos;utilisateur résilie avant la fin de la période d&apos;essai.
          </p>
        </Section>

        <Section title="5. Paiement">
          <p>
            Les paiements sont effectués par carte bancaire via la plateforme sécurisée Stripe.
            L&apos;abonnement est facturé de manière récurrente (mensuelle ou annuelle) selon le plan choisi.
          </p>
        </Section>

        <Section title="6. Droit de rétractation">
          <p>
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne
            s&apos;applique pas aux contrats de fourniture de contenu numérique non fourni sur un support
            matériel dont l&apos;exécution a commencé avec l&apos;accord du consommateur.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Toutefois, l&apos;utilisateur peut annuler son abonnement à tout moment depuis son espace client.
            L&apos;accès au service sera maintenu jusqu&apos;à la fin de la période en cours.
          </p>
        </Section>

        <Section title="7. Résiliation">
          <p>
            L&apos;utilisateur peut résilier son abonnement à tout moment via le portail de gestion
            d&apos;abonnement accessible depuis son profil. La résiliation prend effet à la fin de la période
            de facturation en cours. Aucun remboursement prorata ne sera effectué.
          </p>
        </Section>

        <Section title="8. Responsabilité">
          <p>
            Le contenu des newsletters est généré par intelligence artificielle (Claude, Anthropic).
            Sorell ne garantit pas l&apos;exactitude, l&apos;exhaustivité ou la pertinence du contenu généré.
            L&apos;utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait du contenu.
          </p>
          <p style={{ marginTop: "1rem" }}>
            L&apos;assistant Soly, intégré au site, utilise l&apos;intelligence artificielle (Claude, Anthropic)
            pour aider les utilisateurs à configurer leur service. Les réponses de Soly sont fournies à
            titre indicatif et ne constituent pas des conseils professionnels. Sorell ne garantit pas
            l&apos;exactitude des réponses fournies par l&apos;assistant.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Sorell s&apos;engage à mettre en œuvre les moyens nécessaires pour assurer la disponibilité du
            service, sans obligation de résultat.
          </p>
        </Section>

        <Section title="9. Force majeure">
          <p>
            Sorell ne pourra être tenu responsable en cas de non-exécution due à un cas de force
            majeure (panne technique, interruption de service des sous-traitants, etc.).
          </p>
        </Section>

        <Section title="10. Modification des CGV">
          <p>
            Sorell se réserve le droit de modifier les présentes CGV. Les utilisateurs seront informés
            par email de toute modification substantielle.
          </p>
        </Section>

        <Section title="11. Propriété intellectuelle du contenu généré">
          <p>
            Les newsletters générées par Sorell sont créées par intelligence artificielle à partir
            de sources publiques. L&apos;utilisateur est libre d&apos;utiliser, partager et diffuser le contenu
            de ses newsletters dans le cadre de son activité professionnelle.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Sorell ne revendique aucun droit de propriété intellectuelle sur le contenu généré pour
            l&apos;utilisateur. L&apos;utilisateur reste toutefois responsable de l&apos;usage qu&apos;il fait de ce contenu.
          </p>
        </Section>

        <Section title="12. Médiation">
          <p>
            Conformément aux articles L611-1 et suivants du Code de la consommation, en cas de litige
            non résolu, l&apos;utilisateur peut recourir gratuitement à un médiateur de la consommation.
          </p>
          <p style={{ marginTop: "1rem" }}>
            Plateforme de règlement en ligne des litiges de la Commission européenne :{" "}
            <a href="https://ec.europa.eu/consumers/odr" style={{ color: "var(--accent)" }}>
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
        </Section>

        <Section title="13. Droit applicable et litiges">
          <p>
            Les présentes CGV sont régies par le droit français. En cas de litige, les parties
            s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les
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
        <style>{`
          section ul { list-style-type: disc; padding-left: 1.5rem; }
          section li { margin-bottom: 0.25rem; }
        `}</style>
        {children}
      </div>
    </section>
  );
}
