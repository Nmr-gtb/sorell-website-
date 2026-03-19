"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import frTranslations from "@/lib/translations/fr";
import enTranslations from "@/lib/translations/en";

type Language = "fr" | "en";

const allTranslations: Record<Language, Record<string, string>> = {
  fr: frTranslations,
  en: enTranslations,
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "fr",
  setLang: () => {},
  t: (key) => frTranslations[key] || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("sorell-lang") as Language;
    if (saved === "en" || saved === "fr") {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("sorell-lang", newLang);
  };

  const t = (key: string): string => {
    return allTranslations[lang][key] || allTranslations["fr"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
