import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in or sign up — izzy" },
      { name: "description", content: "Create your free izzy page in under a minute." },
      { property: "og:title", content: "Log in or sign up — izzy" },
      { property: "og:description", content: "Create your free izzy page in under a minute." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  function friendlyError(message: string, isSignup: boolean) {
    if (/weak password|pwned|easy to guess/i.test(message)) {
      return "That password is too common or has appeared in a data leak, so it was rejected. Please use a strong, unique password you have not used before.";
    }
    if (/not allowed|placeholder|reserved|mistyped/i.test(message)) {
      return "That email address was rejected — please use a real email address you can receive mail at, not a test or example address.";
    }
    if (/invalid login credentials/i.test(message)) {
      return isSignup
        ? "Could not create that account. If you already have an account, switch to Log in below."
        : "Invalid email or password. If you signed up with Google before, enter that Google email above, tap Forgot password, set a password, then log in here.";
    }
    return message;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard" }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/dashboard" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth" } });
      if (error) { const msg = friendlyError(error.message, true); setFormError(msg); toast.error(msg); } else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { const msg = friendlyError(error.message, false); setFormError(msg); toast.error(msg); }
    }
    setBusy(false);
  }

  async function forgotPassword() {
    if (!email) { setFormError("Enter your email first, then tap Forgot password."); return; }
    setBusy(true);
    setFormError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
    setBusy(false);
    if (error) { const msg = friendlyError(error.message, false); setFormError(msg); toast.error(msg); return; }
    toast.success("Password reset email sent", { description: `Check ${email} for a reset link.` });
    setFormError(`Password reset email sent to ${email}. Check spam too, then use the link to set a password and log in here.`);
  }

  // Google sign-in is intentionally NOT offered in this Vercel build (2026-10-26 test):
  // the Supabase project backing this app has no Google OAuth secret configured,
  // so the Supabase authorize step fails with "Unsupported provider: missing OAuth secret"
  // instead of reaching Google. Email sign-in/sign-up below is the working route.
  // To re-enable Google: configure Google OAuth (client ID + secret) in the Supabase
  // project and allow the Vercel redirect URL, then restore a signInWithOAuth button here.

  return (
    <div className="flex min-h-dvh flex-col bg-hero px-4 py-6">
      <Logo />
      <div className="mx-auto mt-8 w-full max-w-md rounded-[2rem] border bg-card p-6 shadow-soft sm:mt-12 sm:p-8">
        {sent ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">We sent a confirmation link to {email}. Click it to start building your page. If it does not arrive in a few minutes, check spam, and make sure you used a real email address.</p>
            <button className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl border text-base font-semibold" onClick={() => setSent(false)}>Use a different email</button>
          </div>
        ) : (
          <>
            <div className="flex rounded-full bg-muted p-1" role="tablist" aria-label="Sign up or log in">
              <button type="button" onClick={() => { setFormError(""); setMode("signup"); }} className={`min-h-[44px] flex-1 rounded-full text-base font-semibold ${mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Sign up</button>
              <button type="button" onClick={() => { setFormError(""); setMode("signin"); }} className={`min-h-[44px] flex-1 rounded-full text-base font-semibold ${mode === "signin" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Log in</button>
            </div>
            <h1 className="mt-6 text-3xl font-bold">{mode === "signup" ? "Create your page" : "Welcome back"}</h1>
            <p className="mt-1 text-base text-muted-foreground">{mode === "signup" ? "Free forever. No card needed." : "Log in to your izzy dashboard."}</p>
            {mode === "signin" && (
              <p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Signed up with Google before? Enter that Google email above, tap Forgot password, set a password, then log in here.</p>
            )}
            {formError && (
              <p role="alert" className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-base font-medium leading-relaxed text-destructive">{formError}</p>
            )}
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="space-y-2"><Label htmlFor="email" className="text-base font-medium">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pw" className="text-base font-medium">Password</Label>
                  {mode === "signin" && (
                    <button type="button" onClick={forgotPassword} className="text-xs font-semibold text-primary">Forgot password?</button>
                  )}
                </div>
                <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                {mode === "signup" && (
                  <p className="text-sm text-muted-foreground">Use a strong, unique password. Common or leaked passwords are rejected.</p>
                )}
              </div>
              <Button type="submit" disabled={busy} className="min-h-[52px] w-full rounded-xl text-lg">{mode === "signup" ? "Sign up" : "Log in"}</Button>
            <p className="text-center text-sm text-muted-foreground">Google sign-in is not set up yet for this version — please use email for now.</p>
            </form>
            <button className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl border text-base text-muted-foreground" onClick={() => { setFormError(""); setMode(mode === "signup" ? "signin" : "signup"); }}>
              {mode === "signup" ? "Already have an account? Log in" : "New here? Sign up"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
