import { Check } from "lucide-react";
import type { ReactNode } from "react";

const FREE = ["Up to 5 links", "Light & Dark themes", "WhatsApp & UPI buttons", "7-day analytics", "\"Made with Izzy\" footer"];
const PRO = ["Unlimited links", "All 8 themes", "No izzy branding", "30-day analytics", "Downloadable QR code", "Priority support"];

export function PricingCards({ freeCta, proCta }: { freeCta: ReactNode; proCta: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border bg-card p-6">
        <h3 className="text-lg font-bold">Free</h3>
        <p className="mt-2 font-display text-4xl font-extrabold">$0</p>
        <p className="text-sm text-muted-foreground">forever</p>
        <ul className="my-6 space-y-2.5 text-sm">{FREE.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>)}</ul>
        {freeCta}
      </div>
      <div className="relative rounded-3xl border-2 border-primary bg-card p-6 shadow-soft">
        <span className="absolute -top-3 right-5 rounded-full bg-highlight px-3 py-1 text-xs font-bold text-foreground">Best value</span>
        <h3 className="text-lg font-bold">Pro</h3>
        <p className="mt-2 font-display text-4xl font-extrabold">$1<span className="text-base font-medium text-muted-foreground">/month</span></p>
        <p className="text-sm text-muted-foreground">cancel anytime</p>
        <ul className="my-6 space-y-2.5 text-sm">{PRO.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>)}</ul>
        {proCta}
      </div>
    </div>
  );
}
