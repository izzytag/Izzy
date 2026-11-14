import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Share2 } from "lucide-react";
import { referralStats } from "@/lib/referral.functions";
import { buildReferralLink } from "@/lib/referral";
import { Button } from "@/components/ui/button";

/**
 * Referral card — the referrer's view of the referral programme.
 * Shows the personal referral link with copy/share actions, and the
 * counts that are actually stored: shops signed up through the link,
 * shops that became genuinely active, and free Pro months earned.
 * Counts are hidden until referral tracking is active (migration
 * 0010 applied); the link itself always works, because attribution
 * is recorded server-side when the new account saves its profile.
 * Copy is deliberately plain: the terms are stated once, exactly.
 */
export function ReferralCard({ username }: { username: string | null }) {
  const [origin, setOrigin] = useState("https://izzytag.shop");
  useEffect(() => setOrigin(window.location.origin), []);
  const { data: stats } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: () => referralStats(),
    staleTime: 60_000,
    retry: false,
  });

  if (!username) return null;
  const link = buildReferralLink(origin, username);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied");
    } catch {
      toast.error("Copy failed. Long-press the link to copy it manually.");
    }
  }

  async function shareLink() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "izzy",
          text: "Create your shop on izzy. Products, prices, and orders on WhatsApp.",
          url: link,
        });
        return;
      } catch {
        return; // Share sheet closed — not an error.
      }
    }
    await copyLink();
  }

  const showCounts = stats?.available === true;

  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-bold">Invite sellers, earn free Pro</h2>
      <p className="mt-1 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Share your referral link. When a referred shop becomes active — shop link claimed, WhatsApp
        number set, and at least one live product — you receive one month of Pro at no cost. The
        annual limit is six months.
      </p>

      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">Your referral link</p>
        <p className="mt-1 break-all text-base font-medium text-primary">{link.replace(/^https?:\/\//, "")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyLink} className="min-h-[44px]">
            <Copy className="h-4 w-4" /> Copy link
          </Button>
          <Button onClick={shareLink} className="min-h-[44px]">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      {showCounts && (
        <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-5">
          <div>
            <p className="font-display text-2xl font-bold sm:text-3xl">{stats.signups}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Shops signed up</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold sm:text-3xl">{stats.active}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Active shops</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold sm:text-3xl">{stats.freeMonthsEarned}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Free months earned</p>
          </div>
        </div>
      )}
    </section>
  );
}
