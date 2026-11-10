import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  capText,
  grantPeriodEnd,
  GRANT_MONTHS,
  isAdminEmail,
  isTicketStatus,
  parseAdminEmails,
  requireReason,
  SUPPORT_CATEGORIES,
  validateReportInput,
} from "./admin";
import { PRO_PRICE_INR, PRO_PRICE_USD, TESTING_FREE } from "./billing";
import { FREE_LINK_LIMIT } from "./themes";

/**
 * Admin panel server functions (Step 06).
 *
 * There is NO admin role in the schema and none is added. Admin access
 * is an allowlist: the authenticated user's email must appear in the
 * server env var ADMIN_EMAILS (comma-separated, case-insensitive).
 * When the env var is unset/empty, admin is closed for EVERYONE.
 *
 * EVERY function below runs requireAdmin() first — a valid session
 * (requireSupabaseAuth) plus the allowlist check — on every call. The
 * /admin route guard in the browser is UX only; these functions are
 * the real gate. All cross-account reads/writes go through the
 * service-role client (client.server), which never leaves the server.
 *
 * Every sensitive action writes its admin_audit_log row inside the
 * same handler that performs it, with the reason the admin supplied.
 */

type AdminContext = { supabase: unknown; userId: string };

type AdminClient = Awaited<ReturnType<typeof loadAdmin>>;

async function loadAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function requireAdmin(context: AdminContext): Promise<{ email: string; admin: AdminClient }> {
  const supabase = context.supabase as {
    auth: { getUser: () => Promise<{ data: { user: { email?: string } | null } }> };
  };
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  const allowlist = parseAdminEmails(process.env["ADMIN_EMAILS"]);
  if (!isAdminEmail(email, allowlist)) {
    throw new Error("Admin access is not enabled for this account.");
  }
  return { email: email as string, admin: await loadAdmin() };
}

type AuditEntry = {
  action: string;
  targetUserId?: string | null;
  targetUsername?: string | null;
  reason?: string | null;
  details?: Record<string, string | number | boolean | null> | null;
};

async function writeAudit(admin: AdminClient, adminEmail: string, entry: AuditEntry): Promise<void> {
  const { error } = await admin.from("admin_audit_log").insert({
    admin_email: adminEmail,
    action: entry.action,
    target_user_id: entry.targetUserId ?? null,
    target_username: entry.targetUsername ?? null,
    reason: entry.reason ?? null,
    details: entry.details ?? null,
  });
  // The action already happened; a failed audit write must not undo
  // it, but it is loud in the server logs rather than silent.
  if (error) console.error("[admin] audit log write failed:", entry.action, error.message);
}

type SubLike = { plan: string; status: string; current_period_end: string | null } | null;

/** Same Pro test the account query uses (account.ts / is_pro semantics). */
function subIsActivePro(sub: SubLike): boolean {
  return (
    !!sub &&
    sub.plan === "pro" &&
    sub.status === "active" &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date())
  );
}

const uuid = (v: unknown) => {
  const s = String(v ?? "");
  return /^[0-9a-fA-F-]{36}$/.test(s) ? s : "";
};

/* ------------------------- gate check (layout) ------------------------ */

export const adminCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as {
      auth: { getUser: () => Promise<{ data: { user: { email?: string } | null } }> };
    };
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? null;
    const allowlist = parseAdminEmails(process.env["ADMIN_EMAILS"]);
    return { email, enabled: allowlist.length > 0, admin: isAdminEmail(email, allowlist) };
  });

/* ------------------------------ overview ------------------------------ */

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await requireAdmin(context);
    const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
    const [
      totalBusinesses,
      publishedShops,
      suspendedShops,
      totalProducts,
      totalViews,
      totalWhatsappClicks,
      { data: subRows },
      { data: recent },
    ] = await Promise.all([
      count(admin.from("profiles").select("id", { count: "exact", head: true })),
      count(admin.from("profiles").select("id", { count: "exact", head: true }).not("username", "is", null)),
      count(admin.from("profiles").select("id", { count: "exact", head: true }).eq("suspended", true)),
      count(admin.from("links").select("id", { count: "exact", head: true }).in("kind", ["product", "service"])),
      count(admin.from("page_views").select("id", { count: "exact", head: true })),
      count(admin.from("link_clicks").select("id", { count: "exact", head: true }).eq("kind", "whatsapp_click")),
      admin.from("subscriptions").select("user_id, plan, status, current_period_end"),
      admin
        .from("profiles")
        .select("id, username, display_name, created_at, suspended")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    const activePro = (subRows ?? []).filter((s) => subIsActivePro(s)).length;
    return {
      totalBusinesses,
      publishedShops,
      suspendedShops,
      totalProducts,
      totalViews,
      totalWhatsappClicks,
      activePro,
      freeAccounts: totalBusinesses - activePro,
      recentRegistrations: recent ?? [],
    };
  });

/* ------------------------------- growth ------------------------------- */

/**
 * Platform growth metrics (Step 08) — derived counts only, computed
 * from the same tables the overview reads. Every metric's definition
 * is rendered next to its number on the Growth page; nothing here is
 * estimated, sampled or extrapolated. Windows are fixed (7 days /
 * 30 days / all time) — there is deliberately no range picker.
 *
 * Data sources: profiles (registrations, usernames), links (product /
 * service rows — enabled = live), subscriptions (plan state),
 * page_views (one row per shop visit session), link_clicks filtered
 * to kind = "whatsapp_click" (Order/Book taps — NOT orders).
 */
export const adminGrowth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await requireAdmin(context);
    const since = (days: number) => new Date(Date.now() - days * 864e5).toISOString();
    const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
    const [
      totalBusinesses,
      newReg7,
      newReg30,
      { data: profileRows },
      { data: itemRows },
      { data: viewRows },
      whatsappClicksAll,
      whatsappClicks30,
      { data: subRows },
    ] = await Promise.all([
      count(admin.from("profiles").select("id", { count: "exact", head: true })),
      count(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since(7))),
      count(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since(30))),
      admin.from("profiles").select("id, username").limit(10000),
      admin.from("links").select("user_id, enabled").in("kind", ["product", "service"]).limit(10000),
      admin.from("page_views").select("profile_id").gte("created_at", since(30)).limit(10000),
      count(admin.from("link_clicks").select("id", { count: "exact", head: true }).eq("kind", "whatsapp_click")),
      count(
        admin
          .from("link_clicks")
          .select("id", { count: "exact", head: true })
          .eq("kind", "whatsapp_click")
          .gte("created_at", since(30)),
      ),
      admin.from("subscriptions").select("user_id, plan, status, current_period_end"),
    ]);
    const profiles = profileRows ?? [];
    const usernameByUser = new Map(profiles.map((p) => [p.id, p.username]));
    const completedOnboarding = profiles.filter((p) => !!p.username).length;
    const withItems = new Set<string>();
    const withLiveItems = new Set<string>();
    for (const r of itemRows ?? []) {
      withItems.add(r.user_id);
      if (r.enabled) withLiveItems.add(r.user_id);
    }
    // Published = a shareable link exists AND at least one item on it
    // is live: username claimed and at least one enabled item.
    let publishedShops = 0;
    for (const uid of withLiveItems) if (usernameByUser.get(uid)) publishedShops += 1;
    const activeShops30 = new Set((viewRows ?? []).map((v) => v.profile_id)).size;
    const activePro = (subRows ?? []).filter((s) => subIsActivePro(s)).length;
    return {
      totalBusinesses,
      newReg7,
      newReg30,
      completedOnboarding,
      completedOnboardingPct: pct(completedOnboarding, totalBusinesses),
      publishedShops,
      publishedPct: pct(publishedShops, totalBusinesses),
      withFirstProduct: withItems.size,
      withFirstProductPct: pct(withItems.size, totalBusinesses),
      activeShops30,
      whatsappClicksAll,
      whatsappClicks30,
      activePro,
      proConversionPct: pct(activePro, totalBusinesses),
    };
  });

/* ----------------------------- businesses ----------------------------- */

export const adminListBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string }) => ({ search: capText(d?.search, 100).toLowerCase() }))
  .handler(async ({ context, data }) => {
    const { admin } = await requireAdmin(context);
    const [{ data: profiles }, { data: subs }, { data: linkRows }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, username, display_name, category, created_at, suspended")
        .order("created_at", { ascending: false })
        .limit(500),
      admin.from("subscriptions").select("user_id, plan, status, current_period_end"),
      admin.from("links").select("user_id").in("kind", ["product", "service"]),
    ]);
    const productCounts = new Map<string, number>();
    for (const r of linkRows ?? []) productCounts.set(r.user_id, (productCounts.get(r.user_id) ?? 0) + 1);
    const subByUser = new Map((subs ?? []).map((s) => [s.user_id, s]));
    let rows = (profiles ?? []).map((p) => {
      const sub = subByUser.get(p.id) ?? null;
      return {
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        category: p.category,
        createdAt: p.created_at,
        suspended: p.suspended,
        productCount: productCounts.get(p.id) ?? 0,
        plan: subIsActivePro(sub) ? ("pro" as const) : ("free" as const),
        subStatus: sub?.status ?? null,
      };
    });
    if (data.search) {
      rows = rows.filter(
        (r) =>
          (r.displayName ?? "").toLowerCase().includes(data.search) ||
          (r.username ?? "").toLowerCase().includes(data.search),
      );
    }
    return rows.slice(0, 200);
  });

export const adminGetBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => ({ userId: uuid(d?.userId) }))
  .handler(async ({ context, data }) => {
    const { admin } = await requireAdmin(context);
    if (!data.userId) throw new Error("Business not found.");
    const [{ data: profile }, { data: sub }, productCount, views, clicks, { data: auditTrail }] =
      await Promise.all([
        admin.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
        admin.from("subscriptions").select("*").eq("user_id", data.userId).maybeSingle(),
        admin
          .from("links")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.userId)
          .in("kind", ["product", "service"])
          .then((r) => r.count ?? 0),
        admin
          .from("page_views")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", data.userId)
          .then((r) => r.count ?? 0),
        admin
          .from("link_clicks")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", data.userId)
          .eq("kind", "whatsapp_click")
          .then((r) => r.count ?? 0),
        admin
          .from("admin_audit_log")
          .select("id, created_at, admin_email, action, reason")
          .eq("target_user_id", data.userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
    if (!profile) throw new Error("Business not found.");
    // Owner email for this ONE user, via the service-role auth admin
    // API. Emails only — no credentials or tokens exist in this path.
    let ownerEmail: string | null = null;
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(data.userId);
      ownerEmail = authUser.user?.email ?? null;
    } catch {
      ownerEmail = null;
    }
    return {
      profile,
      subscription: sub ?? null,
      isPro: subIsActivePro(sub ?? null),
      ownerEmail,
      productCount,
      shopViews: views,
      whatsappClicks: clicks,
      auditTrail: auditTrail ?? [],
    };
  });

export const adminSetSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; suspended: boolean; reason: string }) => ({
    userId: uuid(d?.userId),
    suspended: d?.suspended === true,
    reason: requireReason(d?.reason),
  }))
  .handler(async ({ context, data }) => {
    const { email, admin } = await requireAdmin(context);
    if (!data.userId) throw new Error("Business not found.");
    if (!data.reason) throw new Error("A reason is required for this action.");
    const { data: profile } = await admin
      .from("profiles")
      .select("username")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("Business not found.");
    const { error } = await admin
      .from("profiles")
      .update({ suspended: data.suspended })
      .eq("id", data.userId);
    if (error) throw new Error("Could not update this business. Please try again.");
    await writeAudit(admin, email, {
      action: data.suspended ? "business.suspend" : "business.reactivate",
      targetUserId: data.userId,
      targetUsername: profile.username,
      reason: data.reason,
    });
    return { ok: true as const };
  });

export const adminGrantPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; months: number; reason: string }) => ({
    userId: uuid(d?.userId),
    months: (GRANT_MONTHS as readonly number[]).includes(Number(d?.months)) ? Number(d.months) : 0,
    reason: requireReason(d?.reason),
  }))
  .handler(async ({ context, data }) => {
    const { email, admin } = await requireAdmin(context);
    if (!data.userId) throw new Error("Business not found.");
    if (!data.months) throw new Error("Choose 1, 6 or 12 months.");
    if (!data.reason) throw new Error("A reason is required for this action.");
    const [{ data: profile }, { data: existing }] = await Promise.all([
      admin.from("profiles").select("username").eq("id", data.userId).maybeSingle(),
      admin.from("subscriptions").select("*").eq("user_id", data.userId).maybeSingle(),
    ]);
    if (!profile) throw new Error("Business not found.");
    if (subIsActivePro(existing ?? null) && existing?.razorpay_subscription_id) {
      throw new Error("This business already has an active Razorpay Pro subscription — a manual grant would clash with it.");
    }
    const periodEnd = grantPeriodEnd(data.months);
    // Same row shape the verified-payment activation writes
    // (razorpay.functions.ts): plan pro / status active / period end.
    // An existing Razorpay reference is preserved, never clobbered.
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: data.userId,
        plan: "pro",
        status: "active",
        razorpay_subscription_id: existing?.razorpay_subscription_id ?? null,
        current_period_end: periodEnd,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error("Could not grant Pro. Please try again.");
    await writeAudit(admin, email, {
      action: "subscription.grant_pro",
      targetUserId: data.userId,
      targetUsername: profile.username,
      reason: data.reason,
      details: { months: data.months, current_period_end: periodEnd },
    });
    return { ok: true as const, periodEnd };
  });

export const adminRevokePro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; reason: string }) => ({
    userId: uuid(d?.userId),
    reason: requireReason(d?.reason),
  }))
  .handler(async ({ context, data }) => {
    const { email, admin } = await requireAdmin(context);
    if (!data.userId) throw new Error("Business not found.");
    if (!data.reason) throw new Error("A reason is required for this action.");
    const [{ data: profile }, { data: existing }] = await Promise.all([
      admin.from("profiles").select("username").eq("id", data.userId).maybeSingle(),
      admin.from("subscriptions").select("*").eq("user_id", data.userId).maybeSingle(),
    ]);
    if (!profile) throw new Error("Business not found.");
    if (!existing) throw new Error("This business has no subscription record to end.");
    // The ended state mirrors the webhook's writes exactly: the row
    // keeps plan "pro" and is marked status "cancelled"
    // (razorpay-webhook.server.ts markCancelled) — is_pro() then reads
    // it as Free. Payment history (the row itself) is preserved.
    const { error } = await admin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", data.userId);
    if (error) throw new Error("Could not end this subscription. Please try again.");
    await writeAudit(admin, email, {
      action: "subscription.revoke_pro",
      targetUserId: data.userId,
      targetUsername: profile.username,
      reason: data.reason,
      details: { previous_status: existing.status, razorpay_subscription_id: existing.razorpay_subscription_id },
    });
    return { ok: true as const };
  });

/* ---------------------------- subscriptions --------------------------- */

export const adminListSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await requireAdmin(context);
    const [{ data: subs }, { data: profiles }] = await Promise.all([
      admin.from("subscriptions").select("*").order("updated_at", { ascending: false }).limit(200),
      admin.from("profiles").select("id, username, display_name"),
    ]);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (subs ?? []).map((s) => ({
      ...s,
      username: byId.get(s.user_id)?.username ?? null,
      displayName: byId.get(s.user_id)?.display_name ?? null,
      isProNow: subIsActivePro(s),
    }));
  });

/* ------------------------------- support ------------------------------ */

async function businessMap(admin: AdminClient, userIds: (string | null)[]) {
  const ids = [...new Set(userIds.filter((x): x is string => !!x))];
  if (ids.length === 0) return new Map<string, { username: string | null; displayName: string | null }>();
  const { data } = await admin.from("profiles").select("id, username, display_name").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, { username: p.username, displayName: p.display_name }]));
}

export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string }) => ({
    status: d?.status && isTicketStatus(d.status) ? d.status : null,
  }))
  .handler(async ({ context, data }) => {
    const { admin } = await requireAdmin(context);
    let q = admin.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: tickets } = await q;
    const rows = tickets ?? [];
    const businesses = await businessMap(admin, rows.map((t) => t.user_id));
    // Priority support (Step 07): tickets sent from the dashboard carry
    // the sender's user_id, so their CURRENT plan can be looked up for
    // a Pro badge in the inbox. Email-only tickets (public /contact
    // form) cannot be matched reliably — profiles store no email
    // (addresses live in auth.users), so there is deliberately no
    // email-based guess: they simply get no badge.
    const senderIds = [...new Set(rows.map((t) => t.user_id).filter((x): x is string => !!x))];
    const proByUser = new Map<string, boolean>();
    if (senderIds.length > 0) {
      const { data: subs } = await admin
        .from("subscriptions")
        .select("user_id, plan, status, current_period_end")
        .in("user_id", senderIds);
      for (const s of subs ?? []) proByUser.set(s.user_id, subIsActivePro(s));
    }
    return rows.map((t) => ({
      ...t,
      business: t.user_id ? (businesses.get(t.user_id) ?? null) : null,
      senderIsPro: t.user_id ? (proByUser.get(t.user_id) ?? false) : false,
    }));
  });

export const adminUpdateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status?: string; adminNote?: string }) => ({
    id: uuid(d?.id),
    status: d?.status && isTicketStatus(d.status) ? d.status : null,
    adminNote: d?.adminNote === undefined ? undefined : capText(d.adminNote, 2000),
  }))
  .handler(async ({ context, data }) => {
    const { email, admin } = await requireAdmin(context);
    if (!data.id) throw new Error("Ticket not found.");
    if (!data.status && data.adminNote === undefined) throw new Error("Nothing to update.");
    const { data: ticket } = await admin
      .from("contact_messages")
      .select("id, status, user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!ticket) throw new Error("Ticket not found.");
    const patch: { status?: string; admin_note?: string } = {};
    if (data.status) patch.status = data.status;
    if (data.adminNote !== undefined) patch.admin_note = data.adminNote;
    const { error } = await admin.from("contact_messages").update(patch).eq("id", data.id);
    if (error) throw new Error("Could not update this ticket. Please try again.");
    // The internal note lives only on the row, readable solely through
    // admin functions — it is never part of any customer-facing reply.
    await writeAudit(admin, email, {
      action: "support.ticket_update",
      targetUserId: ticket.user_id,
      details: {
        ticket_id: data.id,
        ...(data.status ? { status_from: ticket.status, status_to: data.status } : {}),
        ...(data.adminNote !== undefined ? { note_updated: true } : {}),
      },
    });
    return { ok: true as const };
  });

/**
 * Signed-in sellers send support requests from the dashboard. The
 * sender is the validated session user — email and account id come
 * from the server, never from form fields — and the row lands in the
 * same contact_messages inbox the public /contact form feeds.
 */
export const submitSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { category: string; subject: string; message: string }) => ({
    category: (SUPPORT_CATEGORIES as readonly string[]).includes(capText(d?.category, 60))
      ? capText(d?.category, 60)
      : "Other",
    subject: capText(d?.subject, 120),
    message: capText(d?.message, 2000),
  }))
  .handler(async ({ context, data }) => {
    if (!data.subject) throw new Error("Add a subject so we know what you need.");
    if (data.message.length < 10) throw new Error("Tell us a little more about the problem (at least 10 characters).");
    const supabase = context.supabase as {
      auth: { getUser: () => Promise<{ data: { user: { email?: string } | null } }> };
    };
    const { data: u } = await supabase.auth.getUser();
    const email = u.user?.email;
    if (!email) throw new Error("Could not read your account email. Please try again.");
    const admin = await loadAdmin();
    const { error } = await admin.from("contact_messages").insert({
      email,
      message: data.message,
      subject: data.subject,
      category: data.category,
      status: "open",
      user_id: context.userId,
    });
    if (error) throw new Error("Couldn't send your message. Please try again.");
    return { ok: true as const };
  });

/* ------------------------------- reports ------------------------------ */

/**
 * Public storefront reports. No session required (visitors report
 * shops), so there is deliberately no auth middleware: the handler
 * validates lengths, looks the shop up with the service role, and
 * inserts. Unknown usernames return the same success as real ones —
 * the endpoint never reveals whether a username exists beyond what
 * the public page itself already shows.
 */
export const submitShopReport = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; reason: string; details?: string | undefined; reporterEmail?: string | undefined }) =>
    validateReportInput(d ?? {}),
  )
  .handler(async ({ data }) => {
    if (!data) return { ok: false as const };
    const admin = await loadAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .maybeSingle();
    if (profile) {
      await admin.from("reports").insert({
        target_username: data.username,
        reason: data.reason,
        details: data.details,
        reporter_email: data.reporterEmail,
        status: "open",
      });
    }
    return { ok: true as const };
  });

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string }) => ({
    status: d?.status === "reviewed" || d?.status === "dismissed" || d?.status === "open" ? d.status : null,
  }))
  .handler(async ({ context, data }) => {
    const { admin } = await requireAdmin(context);
    let q = admin.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const adminUpdateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string; reason?: string | undefined }) => ({
    id: uuid(d?.id),
    status: d?.status === "reviewed" || d?.status === "dismissed" || d?.status === "open" ? d.status : null,
    reason: capText(d?.reason, 500) || null,
  }))
  .handler(async ({ context, data }) => {
    const { email, admin } = await requireAdmin(context);
    if (!data.id || !data.status) throw new Error("Report not found.");
    const { data: report } = await admin
      .from("reports")
      .select("id, target_username, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!report) throw new Error("Report not found.");
    const { error } = await admin.from("reports").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("Could not update this report. Please try again.");
    // A report alone never deletes or restricts anything — it only
    // records a moderation decision here; restricting a shop is the
    // separate, reasoned suspend action on the business page.
    await writeAudit(admin, email, {
      action: "report.status",
      targetUsername: report.target_username,
      reason: data.reason,
      details: { report_id: data.id, status_from: report.status, status_to: data.status },
    });
    return { ok: true as const };
  });

/* --------------------------- settings + audit -------------------------- */

export const adminPlatformConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    // Read-only by design (brief §8): these values live in code and
    // provider dashboards, so the panel shows them — configured /
    // not-configured booleans only, never a secret value.
    return {
      proPriceInr: PRO_PRICE_INR,
      proPriceUsd: PRO_PRICE_USD,
      freeLinkLimit: FREE_LINK_LIMIT,
      testingFree: TESTING_FREE,
      razorpayConfigured: Boolean(
        process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"] && process.env["RAZORPAY_PLAN_ID_INR"],
      ),
      stripeConfigured: false, // No Stripe integration exists in the codebase.
      adminAllowlistEnabled: parseAdminEmails(process.env["ADMIN_EMAILS"]).length > 0,
      supportInbox: "contact_messages (public /contact form + dashboard support page)",
    };
  });

export const adminListAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await requireAdmin(context);
    const { data } = await admin
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });
