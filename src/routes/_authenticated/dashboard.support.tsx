import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { accountQuery } from "@/lib/account";
import { SUPPORT_CATEGORIES } from "@/lib/admin";
import { submitSupportTicket } from "@/lib/admin.functions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/dashboard/support")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: SupportPage,
});

/**
 * Help & support for signed-in sellers (Step 06 §6). The form lands in
 * the same contact_messages inbox as the public /contact page, tagged
 * with the seller's account — and replies come back by email: izzy has
 * no email provider configured in-app, so nothing here promises an
 * in-app reply or a notification. There is no attachment field because
 * there is no secure upload for support files.
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: "How do customers order from my shop?",
    a: "Customers browse your shop link, open a product, and tap the WhatsApp order button. WhatsApp opens with a ready-written message about that product — the customer reviews it and sends it themselves, and the conversation happens between you and them on WhatsApp. An order is only an order once you've agreed it there.",
  },
  {
    q: "How do I add or change products?",
    a: "Go to Products in your dashboard to add, edit, hide or delete items. New items start as drafts; switch them on when they're ready and they'll appear on your shop straight away.",
  },
  {
    q: "How do I change my WhatsApp number?",
    a: "Open My Shop and edit the WhatsApp number there. Double-check it carefully — every future customer enquiry goes to the number you save, and the example message on that page shows exactly what customers will send.",
  },
  {
    q: "How does Pro billing work?",
    a: "Pro is billed monthly through Razorpay (₹99/month in India). Your subscription renews automatically each month until you cancel. You can cancel anytime from the Plan page — Pro then stays on until the end of the period you've already paid for.",
  },
  {
    q: "What happens when Pro ends?",
    a: "Your shop goes back to the Free plan and nothing is deleted — all your products and services stay live. If you have more than 5 items you just can't add new ones until you're under the Free limit or back on Pro. Pro themes stop applying and analytics go back to the last 7 days.",
  },
  {
    q: "What does izzy count in Analytics?",
    a: "Shop visits (once per visitor session), product views (when a customer opens a product's details) and WhatsApp button taps, with a simple source label like Instagram or your QR code when the link provides one. We don't collect your visitors' names, phone numbers or messages, and only you can see your shop's analytics.",
  },
];

function SupportPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const [category, setCategory] = useState<string>(SUPPORT_CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // Beta feedback (Step 07 §3): four short questions, landed in the
  // same support inbox as a ticket (category "Other", subject "Beta
  // feedback") so nothing new had to be built to read it — the izzy
  // team reads it there alongside support messages.
  const [fbConfusing, setFbConfusing] = useState("");
  const [fbUseful, setFbUseful] = useState("");
  const [fbContinue, setFbContinue] = useState("Yes");
  const [fbPay, setFbPay] = useState("Not sure");
  const [fbBusy, setFbBusy] = useState(false);
  const [fbSent, setFbSent] = useState(false);

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!fbConfusing.trim() && !fbUseful.trim()) {
      toast.error("Tell us at least one thing — even a sentence helps.");
      return;
    }
    const body = [
      "What was the most confusing part of creating your shop?",
      fbConfusing.trim() || "—",
      "",
      "What would make izzy more useful for your business?",
      fbUseful.trim() || "—",
      "",
      `Would you continue using izzy? ${fbContinue}`,
      `Would you consider paying for additional features? ${fbPay}`,
    ].join("\n");
    setFbBusy(true);
    const res = await submitSupportTicket({ data: { category: "Other", subject: "Beta feedback", message: body } }).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Couldn't send your feedback. Please try again.");
      return null;
    });
    setFbBusy(false);
    if (res?.ok) setFbSent(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await submitSupportTicket({ data: { category, subject, message } }).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Couldn't send your message. Please try again.");
      return null;
    });
    setBusy(false);
    if (res?.ok) setSent(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Help &amp; support</h1>
        <p className="mt-1 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Quick answers first — and if you're still stuck, send us a message. We reply by email to{" "}
          <span className="font-medium text-foreground">{acc.user.email}</span>.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Common questions</h2>
        <Accordion type="single" collapsible className="mt-2">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Contact support</h2>
        {sent ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-muted p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-lg font-semibold">Message sent</p>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Thanks for writing in — we'll reply to {acc.user.email}. Keep an eye on your inbox (and the spam folder, just in case).
            </p>
            <Button
              variant="outline"
              className="mt-2 min-h-[44px]"
              onClick={() => { setSent(false); setSubject(""); setMessage(""); }}
            >
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="support-category">What's it about?</Label>
              <select
                id="support-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              >
                {SUPPORT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support-subject">Subject</Label>
              <Input
                id="support-subject"
                required
                maxLength={120}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="A short line about the problem"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support-message">How can we help?</Label>
              <Textarea
                id="support-message"
                required
                minLength={10}
                maxLength={2000}
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what happened and what you were trying to do…"
              />
            </div>
            <Button type="submit" disabled={busy} className="min-h-[48px] w-full text-base sm:w-auto sm:px-8">
              {busy ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Beta feedback</h2>
        <p className="mt-1 max-w-2xl text-base leading-relaxed text-muted-foreground">
          izzy is still in beta, and your answers shape what we fix and build next. They go to the izzy team
          and are read in our support inbox — four quick questions, nothing else is collected.
        </p>
        {fbSent ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-muted p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-lg font-semibold">Thank you!</p>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Your feedback is with the izzy team. It genuinely helps us make izzy easier for shops like yours.
            </p>
          </div>
        ) : (
          <form onSubmit={submitFeedback} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fb-confusing">What was the most confusing part of creating your shop?</Label>
              <Textarea
                id="fb-confusing"
                maxLength={400}
                rows={3}
                value={fbConfusing}
                onChange={(e) => setFbConfusing(e.target.value)}
                placeholder="Anything that made you pause, guess, or ask for help…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-useful">What would make izzy more useful for your business?</Label>
              <Textarea
                id="fb-useful"
                maxLength={400}
                rows={3}
                value={fbUseful}
                onChange={(e) => setFbUseful(e.target.value)}
                placeholder="A feature you expected, or something that would save you time…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fb-continue">Would you continue using izzy?</Label>
                <select
                  id="fb-continue"
                  value={fbContinue}
                  onChange={(e) => setFbContinue(e.target.value)}
                  className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                >
                  {["Yes", "No", "Not sure"].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fb-pay">Would you consider paying for additional features?</Label>
                <select
                  id="fb-pay"
                  value={fbPay}
                  onChange={(e) => setFbPay(e.target.value)}
                  className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                >
                  {["Yes", "No", "Not sure"].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={fbBusy} className="min-h-[48px] w-full text-base sm:w-auto sm:px-8">
              {fbBusy ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
