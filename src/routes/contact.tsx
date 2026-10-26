import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — izzy" },
      { name: "description", content: "Questions, feedback or help with your Izzy page — send us a message." },
      { property: "og:title", content: "Contact us — izzy" },
      { property: "og:description", content: "Questions, feedback or help with your Izzy page — send us a message." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({ email: email.trim(), message: message.trim().slice(0, 2000) });
    setBusy(false);
    if (error) return void toast.error("Couldn't send your message. Please try again.");
    setSent(true);
  }

  return (
    <div className="min-h-screen">
      <div className="bg-hero"><SiteHeader /></div>
      <main className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-3xl font-extrabold">Contact us</h1>
        <p className="mt-2 text-sm text-muted-foreground">Questions, feedback or need help with your page? Send us a message and we'll reply by email.</p>
        {sent ? (
          <div className="mt-8 rounded-3xl border bg-card p-6 text-center shadow-soft">
            <h2 className="text-xl font-bold">Message sent</h2>
            <p className="mt-2 text-sm text-muted-foreground">Thanks for reaching out — we'll get back to you at {email}.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Your email</Label>
              <Input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-msg">Message</Label>
              <Textarea id="c-msg" required minLength={10} maxLength={2000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
            </div>
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base">Send message</Button>
          </form>
        )}
      </main>
    </div>
  );
}
