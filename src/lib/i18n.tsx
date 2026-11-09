import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "hi";
const dict = {
  en: { create: "Create your shop", createFree: "Create your free shop", login: "Log in", pricing: "Pricing", features: "Features", how: "How it works", examples: "Examples", tagline: "Your business deserves more than an Instagram bio.", sub: "Create your own online shop, showcase your products and get orders directly on WhatsApp." },
  hi: { create: "अपनी दुकान बनाएं", createFree: "अपनी मुफ़्त दुकान बनाएं", login: "लॉग इन", pricing: "कीमत", features: "विशेषताएँ", how: "यह कैसे काम करता है", examples: "उदाहरण", tagline: "आपका व्यवसाय एक इंस्टाग्राम बायो से कहीं ज़्यादा का हक़दार है।", sub: "अपनी ऑनलाइन दुकान बनाएं, अपने उत्पाद दिखाएं और सीधे WhatsApp पर ऑर्डर पाएं।" },
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
