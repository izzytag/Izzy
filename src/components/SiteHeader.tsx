import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useLang } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  return (
    <header className="sticky top-0 z-20 mx-auto flex w-full max-w-6xl items-center justify-between bg-background/90 px-4 py-3 backdrop-blur sm:px-5">
      <Logo />
      <nav className="flex items-center gap-3 text-sm font-medium">
        <Link to="/pricing" className="flex h-11 items-center px-2 text-base font-medium text-muted-foreground hover:text-foreground">{t.pricing}</Link>
        <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="flex h-11 w-11 items-center justify-center rounded-full border text-sm" aria-label="Switch language">
          {lang === "en" ? "हिं" : "EN"}
        </button>
        <Link to="/auth" className="flex h-11 items-center rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground">{t.login}</Link>
      </nav>
    </header>
  );
}
