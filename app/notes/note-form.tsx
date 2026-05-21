"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  createNote,
  deleteNote,
  updateNote,
} from "@/app/notes/actions";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  noteFormSchema,
  parseTagsInput,
  type NoteFormValues,
} from "@/lib/schemas/note";
import { cn } from "@/lib/utils";

type Props = {
  mode: "create" | "edit";
  noteId?: string;
  defaultValues: NoteFormValues;
};

function setValueAsOptionalString(v: unknown): string | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  return String(v);
}

export function NoteForm({ mode, noteId, defaultValues }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  const body = form.watch("body") ?? "";
  const tagsInput = form.watch("tags_input") ?? "";
  const tagsPreview = parseTagsInput(tagsInput);

  function onSubmit(values: NoteFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createNote(values)
          : await updateNote(noteId ?? "", values);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Note created" : "Note saved");
      const target =
        mode === "create" && result.id ? `/notes/${result.id}` : "/notes";
      router.push(target);
    });
  }

  function onDelete() {
    if (mode !== "edit" || !noteId) return;
    if (typeof window !== "undefined" && !window.confirm("Delete this note?")) {
      return;
    }
    startDeleteTransition(async () => {
      const result = await deleteNote(noteId);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Note deleted");
      router.push("/notes");
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <section className="space-y-2">
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          placeholder="Untitled note"
          autoComplete="off"
          {...form.register("title", { setValueAs: setValueAsOptionalString })}
        />
        {form.formState.errors.title ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label htmlFor="note-body">Body</Label>
          <div className="flex gap-1 sm:hidden" role="tablist" aria-label="Body">
            <TabButton
              selected={mobileTab === "edit"}
              onClick={() => setMobileTab("edit")}
            >
              Write
            </TabButton>
            <TabButton
              selected={mobileTab === "preview"}
              onClick={() => setMobileTab("preview")}
            >
              Preview
            </TabButton>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={cn(mobileTab === "edit" ? "block" : "hidden", "sm:block")}>
            <Textarea
              id="note-body"
              rows={12}
              placeholder="Write whatever — markdown is supported."
              className="font-mono text-sm"
              {...form.register("body", {
                setValueAs: setValueAsOptionalString,
              })}
            />
            {form.formState.errors.body ? (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {form.formState.errors.body.message}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              "rounded-md border border-border bg-card p-3",
              mobileTab === "preview" ? "block" : "hidden",
              "sm:block",
            )}
            aria-label="Body preview"
          >
            <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <MarkdownPreview source={body} emptyLabel="Nothing to preview yet." />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="note-tags">Tags</Label>
        <Input
          id="note-tags"
          placeholder="comma, separated, tags"
          autoComplete="off"
          {...form.register("tags_input", {
            setValueAs: setValueAsOptionalString,
          })}
        />
        <p className="text-xs text-muted-foreground">
          Lowercased and de-duped on save. Max 20 tags, 40 characters each.
        </p>
        {tagsPreview.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {tagsPreview.map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {serverError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            key="note-cancel"
            asChild
            type="button"
            variant="ghost"
            disabled={pending || deletePending}
          >
            <Link href="/notes">Cancel</Link>
          </Button>
          {mode === "edit" ? (
            <Button
              key="note-delete"
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={pending || deletePending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {deletePending ? "Deleting…" : "Delete"}
            </Button>
          ) : null}
        </div>
        <Button
          key="note-submit"
          type="submit"
          disabled={pending || deletePending}
          size="lg"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Add note"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-accent/40",
      )}
    >
      {children}
    </button>
  );
}
