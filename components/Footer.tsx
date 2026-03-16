import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="mt-24 border-t"
      style={{ borderColor: "#1e1e2a", background: "#0a0a0f" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "#7c3aed", fontFamily: "Georgia, serif" }}
            >
              S
            </div>
            <span className="text-sm font-semibold" style={{ color: "#f0f0f5" }}>
              Sorell
            </span>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" style={{ color: "#5a5a72" }}>
            <Link href="/pricing" className="hover:text-[#9090aa] transition-colors">
              Tarifs
            </Link>
            <Link href="/demo" className="hover:text-[#9090aa] transition-colors">
              Démo
            </Link>
            <Link href="/login" className="hover:text-[#9090aa] transition-colors">
              Connexion
            </Link>
            <span style={{ color: "#2a2a3a" }}>•</span>
            <Link href="#" className="hover:text-[#9090aa] transition-colors">
              Mentions légales
            </Link>
            <Link href="#" className="hover:text-[#9090aa] transition-colors">
              Confidentialité
            </Link>
            <Link href="mailto:contact@sorell.fr" className="hover:text-[#9090aa] transition-colors">
              Contact
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm" style={{ color: "#5a5a72" }}>
            © 2026 Sorell. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
