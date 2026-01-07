import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [statusText, setStatusText] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const errorDescription = params.get("error_description") || params.get("error");

      if (errorDescription) {
        setStatusText("Sign-in failed. Redirecting…");
        await sleep(900);
        if (!cancelled) navigate("/auth", { replace: true });
        return;
      }

      const code = params.get("code");
      if (code) {
        // Complete the PKCE OAuth flow
        await supabase.auth.exchangeCodeForSession(code);
      }

      // Wait briefly for the session to resolve
      const getSession = async () => {
        const { data } = await supabase.auth.getSession();
        return data.session;
      };

      let session = await getSession();
      if (!session?.user) {
        await sleep(300);
        session = await getSession();
      }

      if (!session?.user) {
        setStatusText("Could not complete sign-in. Redirecting…");
        await sleep(900);
        if (!cancelled) navigate("/auth", { replace: true });
        return;
      }

      const user = session.user;

      // Ensure a profile row exists so the app doesn't treat the user as incomplete.
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const meta = (user.user_metadata ?? {}) as Record<string, any>;
        const first_name = meta.first_name ?? meta.given_name ?? null;
        const last_name = meta.last_name ?? meta.family_name ?? null;
        const display_name = meta.display_name ?? meta.full_name ?? meta.name ?? null;

        await supabase.from("profiles").insert({
          user_id: user.id,
          first_name,
          last_name,
          display_name,
        });
      }

      // Use the same destination logic as email login: main app if onboarded, otherwise onboarding.
      const { data: profileAfter } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      const destination = profileAfter?.onboarding_completed ? "/" : "/onboarding";
      if (!cancelled) navigate(destination, { replace: true });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <section className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">Signing you in…</h1>
        <p className="mt-2 text-sm text-muted-foreground">{statusText}</p>
      </section>
    </main>
  );
};

export default AuthCallbackPage;
