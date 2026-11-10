import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListAudit } from "@/lib/admin.functions";
import { AdminError, AdminLoading, fmtDateTime } from "@/components/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
});

/**
 * The audit log is append-only from the panel's side: entries are
 * written by the admin server functions at the moment an action
 * happens (suspend/reactivate, Pro grant/revoke, ticket updates,
 * report decisions), and this page only reads them.
 */
function AdminAuditPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => adminListAudit(),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Audit log</h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Every sensitive admin action, with who did it, when, and the reason they gave. Newest first, latest 200 entries.
      </p>
      {isPending ? (
        <AdminLoading />
      ) : error || !data ? (
        <AdminError message={error instanceof Error ? error.message : "Please try again."} />
      ) : data.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">No admin actions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(a.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.admin_email}</TableCell>
                  <TableCell><Badge variant="secondary">{a.action}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.target_username ? `izzytag.shop/${a.target_username}` : a.target_user_id ? "An account" : "—"}
                  </TableCell>
                  <TableCell>{a.reason || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
