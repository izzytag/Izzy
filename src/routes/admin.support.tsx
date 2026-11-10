import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminListTickets, adminUpdateTicket } from "@/lib/admin.functions";
import { TICKET_STATUSES, TICKET_STATUS_LABELS, type TicketStatus } from "@/lib/admin";
import { AdminError, AdminLoading, fmtDateTime } from "@/components/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupportPage,
});

const FILTERS: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...TICKET_STATUSES.map((s) => ({ value: s as TicketStatus | "all", label: TICKET_STATUS_LABELS[s] })),
];

/**
 * Support inbox over contact_messages. The public /contact form and
 * the in-dashboard support page both land here. Replies to customers
 * happen by email, outside izzy — no email provider is configured in
 * the app, and nothing here claims a notification was sent. The
 * internal note is admin-only: it is stored on the ticket row and read
 * solely through these admin functions.
 */
function AdminSupportPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<TicketStatus>("open");

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "tickets", filter],
    queryFn: () => adminListTickets({ data: filter === "all" ? {} : { status: filter } }),
  });

  const selected = data?.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setNote(selected.admin_note ?? "");
      setStatus((selected.status as TicketStatus) || "open");
    }
  }, [selectedId, selected]);

  const mutation = useMutation({
    mutationFn: (patch: { id: string; status?: TicketStatus; adminNote?: string }) =>
      adminUpdateTicket({ data: patch }),
    onSuccess: () => {
      toast.success("Ticket updated — the change is in the audit log.");
      void qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update this ticket."),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Support inbox</h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Messages from the public contact page and the in-dashboard support form. Reply to the customer by email
        from your own mailbox — izzy doesn't send email. Internal notes are never shown to customers.
      </p>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => { setFilter(f.value); setSelectedId(null); }}
            className={cn(
              "min-h-[40px] rounded-full border px-4 text-sm font-semibold transition",
              filter === f.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <AdminLoading />
      ) : error || !data ? (
        <AdminError message={error instanceof Error ? error.message : "Please try again."} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="overflow-hidden rounded-xl border bg-card">
            {data.length === 0 ? (
              <p className="p-5 text-muted-foreground">No tickets{filter !== "all" ? " with this status" : ""} yet.</p>
            ) : (
              <ul className="divide-y">
                {data.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn("block w-full px-4 py-3 text-left transition hover:bg-muted", selectedId === t.id && "bg-primary-soft")}
                    >
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate font-semibold">{t.subject || t.message.split("\n")[0]}</span>
                        {t.senderIsPro && <Badge>Pro</Badge>}
                        <Badge variant={t.status === "open" ? "default" : "secondary"}>
                          {TICKET_STATUS_LABELS[(t.status as TicketStatus)] ?? t.status}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {t.email}
                        {t.business?.username ? ` · @${t.business.username}` : ""}
                        {t.category ? ` · ${t.category}` : ""}
                      </span>
                      <span className="text-sm text-muted-foreground">{fmtDateTime(t.created_at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5">
            {!selected ? (
              <p className="text-muted-foreground">Select a ticket to read it, add an internal note, or change its status.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">{selected.subject || "Contact form message"}</h2>
                  {selected.senderIsPro && (
                    <p className="mt-1.5"><Badge>Pro</Badge> <span className="text-sm text-muted-foreground">Priority support — this shop is on an active Pro plan.</span></p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    From {selected.email}
                    {selected.business?.username ? ` · ${selected.business.displayName || ""} (@${selected.business.username})` : " · sent from the public contact page"}
                    {selected.category ? ` · ${selected.category}` : ""}
                    {" · "}{fmtDateTime(selected.created_at)}
                  </p>
                </div>
                <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-base leading-relaxed">{selected.message}</p>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-status">Status</Label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      id="ticket-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TicketStatus)}
                      className="min-h-[44px] rounded-md border border-input bg-background px-3 py-2 text-base"
                    >
                      {TICKET_STATUSES.map((s) => (
                        <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <Button
                      className="min-h-[44px]"
                      disabled={mutation.isPending || status === selected.status}
                      onClick={() => mutation.mutate({ id: selected.id, status })}
                    >
                      Update status
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-note">Internal note (admins only — never shown to the customer)</Label>
                  <Textarea
                    id="ticket-note"
                    rows={4}
                    maxLength={2000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What you've checked, what you replied by email, what's pending…"
                  />
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                    disabled={mutation.isPending || note === (selected.admin_note ?? "")}
                    onClick={() => mutation.mutate({ id: selected.id, adminNote: note })}
                  >
                    Save note
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
