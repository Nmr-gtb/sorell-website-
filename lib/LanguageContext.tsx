"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "fr" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "fr",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("fr");
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("sorell-lang") as Language;
    if (saved === "en" || saved === "fr") {
      setLangState(saved);
    }
  }, []);

  useEffect(() => {
    import(`@/lib/translations/${lang}`).then((mod) => {
      setTranslations(mod.default);
    });
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("sorell-lang", newLang);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
