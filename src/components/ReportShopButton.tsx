import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { REPORT_REASONS } from "@/lib/admin";
import { submitShopReport } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * "Report this shop" (Step 06 §7) — a discreet footer action on the
 * public storefront. Reports go to the admin inbox via a server
 * function; nothing is ever removed or restricted automatically, and
 * the reporter is told exactly that much — a review, not a verdict.
 */
export function ReportShopButton({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await submitShopReport({
      data: { username, reason, details: details || undefined, reporterEmail: email || undefined },
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return void toast.error("Couldn't send your report. Please try again.");
    setSent(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-page-muted transition hover:text-page-fg"
      >
        <Flag className="h-4 w-4" /> Report this shop
      </button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSent(false); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this shop</DialogTitle>
          </DialogHeader>
          {sent ? (
            <div className="space-y-3 py-2">
              <p className="text-base leading-relaxed">
                Thanks — your report has been sent to the izzy team for review.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A report doesn't remove a shop by itself. We look at every report and only act when there's a real problem.
              </p>
              <Button className="min-h-[44px] w-full" onClick={() => setOpen(false)}>Done</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="report-reason">What's the problem?</Label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-details">Details (optional)</Label>
                <Textarea
                  id="report-details"
                  rows={4}
                  maxLength={1000}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Anything that helps us understand — a product name, what looks wrong…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-email">Your email (optional)</Label>
                <Input
                  id="report-email"
                  type="email"
                  maxLength={120}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Only if you'd like us to follow up"
                  className="min-h-[44px]"
                />
              </div>
              <Button type="submit" disabled={busy} className="min-h-[44px] w-full">
                {busy ? "Sending…" : "Send report"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
