import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
      { name: "robots", content: "noindex" },
      { name: "description", content: "Create your free izzy shop in under a minute." },
      { property: "og:title", content: "Log in or sign up — izzy" },
      { property: "og:description", content: "Create your free izzy shop in under a minute." },
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
  // Password recovery: a reset link lands here with a recovery session.
  // While recovery is in play the page must NOT bounce to /dashboard
  // (the recovery session would look like a normal sign-in) — it shows
  // the "Set a new password" form instead. The ref guards the async
  // session callbacks, which can resolve before the state updates.
  const [recovery, setRecovery] = useState(false);
  const recoveryRef = useRef(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryDone, setRecoveryDone] = useState(false);

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
    // Recovery links arrive with #...&type=recovery — check the hash
    // synchronously so the session callbacks below are guarded from
    // the start, and also listen for Supabase's PASSWORD_RECOVERY
    // event, which is the canonical signal.
    if (new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type") === "recovery") {
      recoveryRef.current = true;
      setRecovery(true);
    }
    supabase.auth.getSession().then(({ data }) => { if (data.session && !recoveryRef.current) navigate({ to: "/dashboard" }); });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryRef.current = true;
        setRecovery(true);
        return;
      }
      if (s && !recoveryRef.current) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    // Same validation and messages as the Settings password form.
    if (newPassword.length < 8) {
      setRecoveryError("Use at least 8 characters — a strong, unique password you haven't used elsewhere.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError("The two passwords don't match.");
      return;
    }
    setRecoveryError("");
    setRecoveryBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setRecoveryBusy(false);
    if (error) {
      // Supabase rejects common or leaked passwords server-side;
      // surface its message rather than guessing.
      setRecoveryError(error.message);
      return;
    }
    setRecoveryDone(true);
    toast.success("Password updated");
    window.setTimeout(() => navigate({ to: "/dashboard" }), 1200);
  }

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
    <div className="flex min-h-dvh flex-col bg-background px-4 py-6">
      <Logo />
      <div className="mx-auto mt-8 w-full max-w-md rounded-[2rem] border bg-card p-6 shadow-pin sm:mt-12 sm:p-8">
        {recovery ? (
          <div>
            <h1 className="text-3xl font-bold">Set a new password</h1>
            <p className="mt-1 text-base text-muted-foreground">Choose a new password for your izzy account.</p>
            {recoveryDone ? (
              <p role="status" className="mt-4 rounded-xl bg-muted p-4 text-base font-medium leading-relaxed">
                Password updated — taking you to your dashboard…
              </p>
            ) : (
              <>
                {recoveryError && (
                  <p role="alert" className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-base font-medium leading-relaxed text-destructive">{recoveryError}</p>
                )}
                <form onSubmit={submitNewPassword} className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="recovery-new-password" className="text-base font-medium">New password</Label>
                    <Input id="recovery-new-password" type="password" autoComplete="new-password" value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="recovery-confirm-password" className="text-base font-medium">Type it again</Label>
                    <Input id="recovery-confirm-password" type="password" autoComplete="new-password" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={recoveryBusy} className="min-h-[52px] w-full rounded-full text-lg">
                    {recoveryBusy ? "Updating…" : "Set new password"}
                  </Button>
                </form>
              </>
            )}
          </div>
        ) : sent ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">We sent a confirmation link to {email}. Click it to start building your shop. If it does not arrive in a few minutes, check spam, and make sure you used a real email address.</p>
            <button className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl border text-base font-semibold" onClick={() => setSent(false)}>Use a different email</button>
          </div>
        ) : (
          <>
            <div className="flex rounded-full bg-muted p-1" role="tablist" aria-label="Sign up or log in">
              <button type="button" onClick={() => { setFormError(""); setMode("signup"); }} className={`min-h-[44px] flex-1 rounded-full text-base font-semibold ${mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Sign up</button>
              <button type="button" onClick={() => { setFormError(""); setMode("signin"); }} className={`min-h-[44px] flex-1 rounded-full text-base font-semibold ${mode === "signin" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Log in</button>
            </div>
            <h1 className="mt-6 text-3xl font-bold">{mode === "signup" ? "Create your shop" : "Welcome back"}</h1>
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
                    <button type="button" onClick={forgotPassword} className="text-sm font-semibold text-primary">Forgot password?</button>
                  )}
                </div>
                <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                {mode === "signup" && (
                  <p className="text-sm text-muted-foreground">Pick a strong, unique password before you sign up — common or leaked passwords are rejected, so use one you don't use anywhere else.</p>
                )}
              </div>
              <Button type="submit" disabled={busy} className="min-h-[52px] w-full rounded-full text-lg">{mode === "signup" ? "Sign up" : "Log in"}</Button>
            <p className="text-center text-sm text-muted-foreground">Please use email for now — Google sign-in is coming soon.</p>
            </form>
            <button className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-full border text-base text-muted-foreground" onClick={() => { setFormError(""); setMode(mode === "signup" ? "signin" : "signup"); }}>
              {mode === "signup" ? "Already have an account? Log in" : "New here? Sign up"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
