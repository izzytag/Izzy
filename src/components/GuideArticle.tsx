import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";

/**
 * Shared shell for guide articles (Step 08): consistent article
 * typography in the Step 01 design system, a back link to the guides
 * index, and the standard closing call to action. Guide content is
 * practical and honest — no invented statistics, no testimonials.
 */
export function GuideArticle({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <Section className="py-12 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <Link to="/guides" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" /> All guides
          </Link>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight">{title}</h1>
          <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{intro}</p>
          {children}
        </article>
      </Section>
      <Section className="pt-0">
        <div className="mx-auto max-w-3xl rounded-xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-10">
          <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Your products deserve their own space.</h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-primary-foreground/85">
            Create your shop free — add your products, share one link, and receive enquiries directly on WhatsApp.
          </p>
          <Button asChild size="lg" className="mt-7 min-h-[52px] bg-white text-primary hover:bg-white/90">
            <Link to="/auth">Create your free shop</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}

export function GuideH2({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 text-2xl font-bold tracking-tight">{children}</h2>;
}

export function GuideP({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{children}</p>;
}

export function GuideList({ ordered, children }: { ordered?: boolean; children: ReactNode }) {
  const cls = "mt-4 space-y-2 pl-6 text-lg leading-relaxed text-muted-foreground";
  return ordered ? <ol className={`list-decimal ${cls}`}>{children}</ol> : <ul className={`list-disc ${cls}`}>{children}</ul>;
}
