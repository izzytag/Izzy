import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useLang } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
      <Logo />
      <nav className="flex items-center gap-3 text-sm font-medium">
        <Link to="/pricing" className="hidden text-muted-foreground hover:text-foreground sm:inline">{t.pricing}</Link>
        <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="rounded-full border px-2.5 py-1 text-xs" aria-label="Switch language">
          {lang === "en" ? "हिं" : "EN"}
        </button>
        <Link to="/auth" className="text-muted-foreground hover:text-foreground">{t.login}</Link>
      </nav>
    </header>
  );
}
