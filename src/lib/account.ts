import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const accountQuery = queryOptions({
  queryKey: ["account"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    const [{ data: profile, error }, { data: sub }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.user.id).single(),
      supabase.from("subscriptions").select("*").eq("user_id", u.user.id).maybeSingle(),
    ]);
    if (error) throw error;
    const isPro = !!sub && sub.plan === "pro" && sub.status === "active" &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
    return { user: u.user, profile, isPro };
  },
});

export const linksQuery = (uid: string) =>
  queryOptions({
    queryKey: ["links", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("links").select("*").eq("user_id", uid).order("position");
      if (error) throw error;
      return data;
    },
  });
