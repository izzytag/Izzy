import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "hi";
const dict = {
  en: { create: "Create your shop", login: "Log in", pricing: "Pricing", tagline: "Your shop in one link.", sub: "Your whole catalogue — products and services with photos and prices — on one page. Share it, and customers order on WhatsApp." },
  hi: { create: "अपनी दुकान बनाएं", login: "लॉग इन", pricing: "कीमत", tagline: "आपकी दुकान, एक ही लिंक में।", sub: "आपके सारे उत्पाद और सेवाएँ — फ़ोटो और कीमतों के साथ — एक ही पेज पर। लिंक शेयर करें, ग्राहक WhatsApp पर ऑर्डर करें।" },
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
