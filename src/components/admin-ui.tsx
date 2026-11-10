import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      {title && <h2 className="mb-4 text-base font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function PlanBadge({ plan, suspended }: { plan: "pro" | "free"; suspended?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={plan === "pro" ? "default" : "secondary"}>{plan === "pro" ? "Pro" : "Free"}</Badge>
      {suspended && <Badge variant="destructive">Suspended</Badge>}
    </span>
  );
}

/**
 * Confirmation dialog for sensitive admin actions. A reason is
 * required by default — it lands in the audit log next to the action,
 * written by the same server function that performs it.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  reasonRequired = true,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean | undefined;
  reasonRequired?: boolean | undefined;
  busy?: boolean | undefined;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open ]);
  const canConfirm = !busy && (!reasonRequired || reason.trim().length > 0);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="admin-action-reason">Reason{reasonRequired ? "" : " (optional)"}</Label>
          <Textarea
            id="admin-action-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Recorded in the audit log with your email and the time."
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={(e) => {
              e.preventDefault();
              onConfirm(reason.trim());
            }}
          >
            {busy ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-base">
      <p className="font-semibold">Couldn't load this section.</p>
      <p className="mt-1 text-muted-foreground">{message}</p>
    </div>
  );
}

export function AdminLoading() {
  return <p className="py-10 text-center text-muted-foreground">Loading…</p>;
}
