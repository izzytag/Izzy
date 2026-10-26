import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "hi";
const dict = {
  en: { create: "Create your page", login: "Log in", pricing: "Pricing", tagline: "One link for everything you sell, share and create.", sub: "Your Instagram bio link, WhatsApp, UPI payments and all your links — on one beautiful page. $1/month." },
  hi: { create: "अपना पेज बनाएं", login: "लॉग इन", pricing: "कीमत", tagline: "जो भी आप बेचते, शेयर करते और बनाते हैं — सब एक लिंक में।", sub: "Instagram बायो लिंक, WhatsApp, UPI पेमेंट और आपके सारे लिंक — एक सुंदर पेज पर। सिर्फ़ $1/महीना।" },
};
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (typeof dict)["en"] }>({ lang: "en", setLang: () => {}, t: dict.en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>("en");
  useEffect(() => {
    const s = localStorage.getItem("izzy-lang");
    if (s === "hi" || s === "en") setLangS(s);
  }, []);
  const setLang = (l: Lang) => { setLangS(l); localStorage.setItem("izzy-lang", l); };
  return <Ctx.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
