import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Marketing section shell: consistent vertical rhythm and container
 * width for every homepage section (and future marketing pages).
 */
export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-16 sm:py-24", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/** Centred section heading: large editorial title + optional support line. */
export function SectionHeading({ title, sub, className }: { title: string; sub?: string; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}
