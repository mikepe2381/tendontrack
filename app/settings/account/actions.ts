"use server";

import { createClient as createServerSupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@/lib/auth/gates";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

// Deleting the auth.users row requires the service-role key — the user's own
// session can't reach into the auth schema. The admin client is created ad
// hoc here so it never leaks into client bundles or normal request paths.
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — account deletion requires it.",
    );
  }
  return createServerSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const USER_DATA_TABLES = [
  "supplement_logs",
  "supplements",
  "daily_logs",
  "appointments",
  "notes",
  "milestones",
  "profiles",
] as const;

export async function deleteAccount(
  confirmation: string,
): Promise<DeleteAccountResult> {
  if (confirmation !== "DELETE") {
    return { ok: false, error: 'Type "DELETE" to confirm.' };
  }

  const { supabase, user } = await requireUser();

  // RLS-scoped deletes from user data tables. Ordered child-first so any
  // foreign-key cascades aren't surprising. Each table failure short-circuits
  // because partial deletion would leave the account in a bad state.
  for (const table of USER_DATA_TABLES) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) {
      return {
        ok: false,
        error: `Couldn't remove rows from ${table}: ${error.message}`,
      };
    }
  }

  // Finally, drop the auth.users row using the service role. After this the
  // session cookie still exists but is dangling, so we explicitly sign out.
  let admin;
  try {
    admin = adminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
  const { error: adminError } = await admin.auth.admin.deleteUser(user.id);
  if (adminError) {
    return {
      ok: false,
      error: `Couldn't delete account: ${adminError.message}`,
    };
  }

  await supabase.auth.signOut();
  return { ok: true };
}
