import Link from "next/link";
import { Plus } from "lucide-react";

import { NotesList, type NoteListItem } from "@/app/notes/notes-list";
import { requireOnboardedProfile } from "@/lib/auth/gates";

type NoteRow = {
  id: string;
  title: string | null;
  body: string | null;
  tags: string[] | null;
  created_at: string;
};

export default async function NotesPage() {
  const { supabase, user } = await requireOnboardedProfile();

  const { data, error } = await supabase
    .from("notes")
    .select("id, title, body, tags, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const notes: NoteListItem[] = error
    ? []
    : ((data ?? []) as NoteRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        tags: row.tags ?? [],
        created_at: row.created_at,
      }));

  return (
    <div className="container relative max-w-3xl space-y-6 py-8 pb-28">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Notes</h1>
        <p className="text-sm text-muted-foreground">
          Freeform notes — questions, observations, anything you want to come
          back to.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Couldn&apos;t load your notes: {error.message}
        </p>
      ) : null}

      <NotesList notes={notes} />

      <Link
        href="/notes/new"
        aria-label="Add note"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-8 sm:right-8"
      >
        <Plus className="h-6 w-6" aria-hidden />
      </Link>
    </div>
  );
}
