"use server";

import { revalidatePath } from "next/cache";

import { requireOnboardedProfile } from "@/lib/auth/gates";
import { noteFormSchema, parseTagsInput } from "@/lib/schemas/note";

export type NoteResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function createNote(raw: unknown): Promise<NoteResult> {
  const parsed = noteFormSchema.safeParse(raw);
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
  const tags = parseTagsInput(data.tags_input);

  const { data: inserted, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: data.title?.trim() || null,
      body: data.body ?? null,
      tags,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return { ok: true, id: inserted?.id };
}

export async function updateNote(
  id: string,
  raw: unknown,
): Promise<NoteResult> {
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing note id" };
  }
  const parsed = noteFormSchema.safeParse(raw);
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
  const tags = parseTagsInput(data.tags_input);

  const { error } = await supabase
    .from("notes")
    .update({
      title: data.title?.trim() || null,
      body: data.body ?? null,
      tags,
    })
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteNote(id: string): Promise<NoteResult> {
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing note id" };
  }
  const { supabase, user } = await requireOnboardedProfile();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  return { ok: true };
}
