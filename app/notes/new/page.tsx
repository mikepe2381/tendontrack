import Link from "next/link";

import { NoteForm } from "@/app/notes/note-form";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import type { NoteFormValues } from "@/lib/schemas/note";

export default async function NewNotePage() {
  await requireOnboardedProfile();
  const defaultValues: NoteFormValues = {
    title: undefined,
    body: undefined,
    tags_input: undefined,
  };

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/notes" className="underline-offset-2 hover:underline">
            Notes
          </Link>{" "}
          / New
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">New note</h1>
      </header>

      <NoteForm mode="create" defaultValues={defaultValues} />
    </div>
  );
}
