import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { adminListBusinesses } from "@/lib/admin.functions";
import { AdminError, AdminLoading, fmtDate, PlanBadge } from "@/components/admin-ui";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/businesses")({
  component: AdminBusinessesPage,
});

function AdminBusinessesPage() {
  const [search, setSearch] = useState("");
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "businesses", search],
    queryFn: () => adminListBusinesses({ data: { search } }),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Businesses</h1>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by business name or shop link…"
          className="min-h-[44px] pl-10"
          aria-label="Search businesses"
        />
      </div>
      {isPending ? (
        <AdminLoading />
      ) : error || !data ? (
        <AdminError message={error instanceof Error ? error.message : "Please try again."} />
      ) : data.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">
          {search ? `No businesses match “${search}”.` : "No businesses have registered yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <span className="font-semibold">{b.displayName || "Unnamed business"}</span>
                    {b.category && <span className="block text-sm text-muted-foreground">{b.category}</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.username ? `izzytag.shop/${b.username}` : "No shop link yet"}
                  </TableCell>
                  <TableCell><PlanBadge plan={b.plan} suspended={b.suspended} /></TableCell>
                  <TableCell className="text-right">{b.productCount}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(b.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/admin/business/$userId"
                      params={{ userId: b.id }}
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      Manage
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
