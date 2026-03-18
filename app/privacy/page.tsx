import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Politique de confidentialité — Sorell",
};

export default function PrivacyPage() {
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
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "3rem" }}>
          Dernière mise à jour : 18 mars 2026
        </p>

        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données personnelles est Noé Mur, entrepreneur individuel.
          </p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li>Email : <a href="mailto:murnoe@outlook.com" style={{ color: "var(--accent)" }}>murnoe@outlook.com</a></li>
          </ul>
        </Section>

        <Section title="2. Données collectées">
          <p>Dans le cadre de l'utilisation du service Sorell, nous collectons les données suivantes :</p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li><strong>Données d'inscription</strong> : nom, adresse email, mot de passe (chiffré)</li>
            <li><strong>Données de configuration</strong> : thématiques, sources, fréquence, brief personnalisé</li>
            <li><strong>Données des destinataires</strong> : noms et adresses email des destinataires configurés par l'utilisateur</li>
            <li><strong>Données de paiement</strong> : traitées directement par Stripe (nous ne stockons pas les numéros de carte)</li>
            <li><strong>Données d'utilisation</strong> : statistiques d'ouverture et de clic des newsletters, pages visitées</li>
            <li><strong>Données de connexion</strong> : adresse IP, type de navigateur (via les logs serveur)</li>
          </ul>
        </Section>

        <Section title="3. Finalité du traitement">
          <p>Les données personnelles sont collectées pour :</p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li>Fournir et personnaliser le service de newsletter</li>
            <li>Gérer les comptes utilisateurs et les abonnements</li>
            <li>Envoyer des newsletters aux destinataires configurés</li>
            <li>Mesurer les performances (taux d'ouverture, clics)</li>
            <li>Assurer le support client</li>
            <li>Améliorer le service</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <p>Le traitement des données repose sur :</p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li>L'exécution du contrat (fourniture du service)</li>
            <li>Le consentement de l'utilisateur (inscription, configuration des destinataires)</li>
            <li>L'intérêt légitime (amélioration du service, statistiques)</li>
          </ul>
        </Section>

        <Section title="5. Sous-traitants">
          <p>Nous faisons appel aux sous-traitants suivants :</p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li><strong>Supabase</strong> (Singapour/UE) : hébergement de la base de données</li>
            <li><strong>Vercel</strong> (États-Unis) : hébergement du site web</li>
            <li><strong>Stripe</strong> (États-Unis) : traitement des paiements</li>
            <li><strong>Resend</strong> (États-Unis) : envoi des emails</li>
            <li><strong>Anthropic</strong> (États-Unis) : génération de contenu par IA</li>
          </ul>
          <p style={{ marginTop: "1rem" }}>
            Des garanties appropriées (clauses contractuelles types) encadrent les transferts de données
            hors UE.
          </p>
        </Section>

        <Section title="6. Durée de conservation">
          <ul>
            <li>Données de compte : conservées pendant la durée de l'inscription + 3 ans après suppression du compte</li>
            <li>Données de paiement : conservées conformément aux obligations légales (10 ans)</li>
            <li>Données de newsletter : conservées 1 an après l'envoi</li>
            <li>Cookies : 13 mois maximum</li>
          </ul>
        </Section>

        <Section title="7. Droits des utilisateurs">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> : corriger vos données</li>
            <li><strong>Droit à l'effacement</strong> : supprimer vos données</li>
            <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
            <li><strong>Droit à la limitation</strong> : demander la suspension du traitement</li>
          </ul>
          <p style={{ marginTop: "1rem" }}>
            Pour exercer vos droits, contactez-nous à{" "}
            <a href="mailto:murnoe@outlook.com" style={{ color: "var(--accent)" }}>murnoe@outlook.com</a>.
            Nous répondrons dans un délai de 30 jours.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Sorell utilise des cookies strictement nécessaires au fonctionnement du service
            (authentification, session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </Section>

        <Section title="9. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
            vos données : chiffrement des mots de passe, connexions HTTPS, accès restreint aux données.
          </p>
        </Section>

        <Section title="10. Modification de la politique">
          <p>
            Cette politique peut être mise à jour. La date de dernière mise à jour est indiquée en haut
            du document. Les modifications significatives seront communiquées par email.
          </p>
        </Section>

        <Section title="11. Réclamation">
          <p>
            Si vous estimez que le traitement de vos données n'est pas conforme, vous pouvez introduire
            une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :{" "}
            <a href="https://www.cnil.fr" style={{ color: "var(--accent)" }}>www.cnil.fr</a>
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
