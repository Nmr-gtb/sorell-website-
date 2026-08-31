"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

// ID de mesure Google Analytics 4. Public par nature (exposé dans le HTML rendu
// à chaque visiteur) : ce n'est pas un secret, il est volontairement en clair.
const GA_MEASUREMENT_ID = "G-2J5JGJRHJ6";

// Clé partagée avec CookieBanner (localStorage) et nom de l'événement diffusé
// quand l'utilisateur fait son choix, pour démarrer/arrêter GA sans rechargement.
const CONSENT_STORAGE_KEY = "cookie_consent";
export const CONSENT_EVENT = "cookie-consent-change";

/**
 * Charge Google Analytics uniquement si l'utilisateur a accepté les cookies.
 * Tant que le consentement n'est pas "accepted" (refus ou choix non fait),
 * aucun script GA n'est injecté et aucun cookie de mesure n'est déposé — conforme
 * RGPD (consentement préalable) et cohérent avec la bannière du site.
 */
export default function GoogleAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const readConsent = () => {
      try {
        setConsented(localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted");
      } catch {
        setConsented(false);
      }
    };

    readConsent();
    window.addEventListener(CONSENT_EVENT, readConsent);
    return () => window.removeEventListener(CONSENT_EVENT, readConsent);
  }, []);

  if (!consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
