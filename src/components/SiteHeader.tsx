import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useLang } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  return (
    <header className="sticky top-0 z-20 border-b border-black/[0.08] bg-[rgba(251,251,253,0.8)] backdrop-blur-[20px] backdrop-saturate-[180%]">
      <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 py-3 sm:px-5">
        <Logo />
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link to="/pricing" className="flex h-11 items-center px-2 text-base font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">{t.pricing}</Link>
          <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="flex h-11 w-11 items-center justify-center rounded-full border border-input bg-card text-sm transition-colors duration-200 hover:bg-accent" aria-label="Switch language">
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <Link to="/auth" className="flex h-11 items-center rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover">{t.login}</Link>
        </nav>
      </div>
    </header>
  );
}
