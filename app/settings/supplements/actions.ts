"use server";

import { revalidatePath } from "next/cache";

import { requireOnboardedProfile } from "@/lib/auth/gates";
import {
  supplementFormSchema,
  supplementReorderSchema,
} from "@/lib/schemas/supplement";

export type SupplementResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function createSupplement(raw: unknown): Promise<SupplementResult> {
  const parsed = supplementFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Some fields are invalid. Please review and try again.",
    };
  }
  const data = parsed.data;
  const { supabase, user } = await requireOnboardedProfile();

  // Place new supplement at the end of the active list.
  const { data: maxRow } = await supabase
    .from("supplements")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();
  const nextSort = (maxRow?.sort_order ?? -1) + 1;

  const { data: inserted, error } = await supabase
    .from("supplements")
    .insert({
      user_id: user.id,
      name: data.name,
      dose: data.dose ?? null,
      timing: data.timing ?? null,
      notes: data.notes ?? null,
      active: data.active,
      sort_order: nextSort,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/supplements");
  revalidatePath("/log");
  return { ok: true, id: inserted?.id };
}

export async function updateSupplement(
  id: string,
  raw: unknown,
): Promise<SupplementResult> {
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing supplement id" };
  }
  const parsed = supplementFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Some fields are invalid. Please review and try again.",
    };
  }
  const data = parsed.data;
  const { supabase, user } = await requireOnboardedProfile();

  const { error } = await supabase
    .from("supplements")
    .update({
      name: data.name,
      dose: data.dose ?? null,
      timing: data.timing ?? null,
      notes: data.notes ?? null,
      active: data.active,
    })
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/supplements");
  revalidatePath("/log");
  return { ok: true };
}

export async function toggleSupplementActive(
  id: string,
  active: boolean,
): Promise<SupplementResult> {
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing supplement id" };
  }
  const { supabase, user } = await requireOnboardedProfile();
  const { error } = await supabase
    .from("supplements")
    .update({ active })
    .eq("user_id", user.id)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/supplements");
  revalidatePath("/log");
  return { ok: true };
}

export async function deleteSupplement(id: string): Promise<SupplementResult> {
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing supplement id" };
  }
  const { supabase, user } = await requireOnboardedProfile();
  // ON DELETE CASCADE on supplement_logs.supplement_id cleans up history.
  const { error } = await supabase
    .from("supplements")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/supplements");
  revalidatePath("/log");
  revalidatePath("/log/history");
  return { ok: true };
}

export async function reorderSupplements(
  orderedIds: unknown,
): Promise<SupplementResult> {
  const parsed = supplementReorderSchema.safeParse(orderedIds);
  if (!parsed.success) {
    return { ok: false, error: "Invalid ordering payload" };
  }
  const ids = parsed.data;
  const { supabase, user } = await requireOnboardedProfile();

  // One UPDATE per row. With RLS the user_id eq prevents touching anyone
  // else's data even if the client sent foreign IDs.
  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from("supplements")
      .update({ sort_order: i })
      .eq("user_id", user.id)
      .eq("id", ids[i]);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/settings/supplements");
  revalidatePath("/log");
  return { ok: true };
}
