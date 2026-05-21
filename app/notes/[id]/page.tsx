import Link from "next/link";
import { notFound } from "next/navigation";

import { NoteForm } from "@/app/notes/note-form";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import { formatTagsForInput, type NoteFormValues } from "@/lib/schemas/note";

type NoteRow = {
  id: string;
  title: string | null;
  body: string | null;
  tags: string[] | null;
};

type PageParams = { params: Promise<{ id: string }> };

export default async function NoteDetailPage({ params }: PageParams) {
  const { id } = await params;
  const { supabase, user } = await requireOnboardedProfile();

  const { data } = await supabase
    .from("notes")
    .select("id, title, body, tags")
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle<NoteRow>();

  if (!data) notFound();

  const defaultValues: NoteFormValues = {
    title: data.title ?? undefined,
    body: data.body ?? undefined,
    tags_input: formatTagsForInput(data.tags) || undefined,
  };

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/notes" className="underline-offset-2 hover:underline">
            Notes
          </Link>{" "}
          / Edit
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Edit note</h1>
      </header>

      <NoteForm mode="edit" noteId={data.id} defaultValues={defaultValues} />
    </div>
  );
}
