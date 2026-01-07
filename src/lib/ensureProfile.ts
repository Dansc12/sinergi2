import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type EnsureProfileOptions = {
  defaults?: Record<string, unknown>;
};

type EnsureProfileResult = {
  onboarding_completed: boolean;
};

const selectOnboardingCompleted = async (key: "id" | "user_id", userId: string) => {
  return supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq(key, userId)
    .limit(1)
    .maybeSingle();
};

const insertProfile = async (
  key: "id" | "user_id",
  user: Pick<User, "id" | "email">,
  defaults: Record<string, unknown>
) => {
  const base: Record<string, unknown> = {
    [key]: user.id,
    onboarding_completed: false,
    ...defaults,
  };

  if (user.email) base.email = user.email;

  let { error } = await supabase.from("profiles").insert(base);

  // If we hit duplicate key (profile already created elsewhere), proceed to fetch.
  if (error && (error.code === "23505" || /duplicate key/i.test(error.message))) {
    return { error: null };
  }

  // If optional columns don't exist (e.g., email), retry without them.
  if (error && /column/i.test(error.message) && /email/i.test(error.message)) {
    const withoutEmail = { ...base };
    delete (withoutEmail as any).email;
    ({ error } = await supabase.from("profiles").insert(withoutEmail));

    if (error && (error.code === "23505" || /duplicate key/i.test(error.message))) {
      return { error: null };
    }
  }

  return { error };
};

/**
 * Ensures a profiles row exists for the authenticated user.
 *
 * - Detects whether the user foreign key is `id` or `user_id`
 * - Creates a minimal row when missing
 * - Returns `{ onboarding_completed }` (defaults to false)
 */
export const ensureProfile = async (
  user: Pick<User, "id" | "email">,
  options?: EnsureProfileOptions
): Promise<EnsureProfileResult> => {
  const defaults = (options?.defaults ?? {}) as Record<string, unknown>;

  // 1) Try `id` first
  const byId = await selectOnboardingCompleted("id", user.id);
  if (!byId.error && byId.data) {
    return { onboarding_completed: !!byId.data.onboarding_completed };
  }

  // 2) Fall back to `user_id`
  const byUserId = await selectOnboardingCompleted("user_id", user.id);
  if (!byUserId.error && byUserId.data) {
    return { onboarding_completed: !!byUserId.data.onboarding_completed };
  }

  // 3) No row found: attempt insert (id first, then user_id)
  const insId = await insertProfile("id", user, defaults);
  if (!insId.error) {
    const after = await selectOnboardingCompleted("id", user.id);
    return { onboarding_completed: !!after.data?.onboarding_completed };
  }

  const insUserId = await insertProfile("user_id", user, defaults);
  if (!insUserId.error) {
    const after = await selectOnboardingCompleted("user_id", user.id);
    return { onboarding_completed: !!after.data?.onboarding_completed };
  }

  // 4) Last resort: return safe default
  return { onboarding_completed: false };
};
