"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { firstLine } from "@/lib/schemas/note";
import { cn } from "@/lib/utils";

export type NoteListItem = {
  id: string;
  title: string | null;
  body: string | null;
  tags: string[];
  created_at: string;
};

export function NotesList({ notes }: { notes: NoteListItem[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect unique tags across all notes, sorted alphabetically so the chip
  // row is stable as notes are added or edited.
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) for (const t of n.tags) set.add(t);
    return Array.from(set).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (activeTag && !n.tags.includes(activeTag)) return false;
      if (!q) return true;
      const haystack = [
        n.title ?? "",
        n.body ?? "",
        n.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [notes, query, activeTag]);

  if (notes.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        No notes yet — tap the + button to write one.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes by title, body, or tag"
          className="pl-9 pr-9"
          aria-label="Search notes"
        />
        {query ? (
          <button
            key="notes-search-clear"
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/40"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {allTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const selected = activeTag === tag;
            return (
              <button
                key={`tag-${tag}`}
                type="button"
                onClick={() => setActiveTag(selected ? null : tag)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground hover:bg-accent/40",
                )}
                aria-pressed={selected}
              >
                #{tag}
              </button>
            );
          })}
          {activeTag ? (
            <button
              key="tag-clear"
              type="button"
              onClick={() => setActiveTag(null)}
              className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-accent/40"
            >
              Clear filter
            </button>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          No notes match your search.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {filtered.map((n) => (
            <li key={n.id}>
              <Link
                href={`/notes/${n.id}`}
                className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {n.title?.trim() || "Untitled note"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(n.created_at)}
                  </p>
                </div>
                {firstLine(n.body) ? (
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {firstLine(n.body)}
                  </p>
                ) : null}
                {n.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {n.tags.map((t) => (
                      <span
                        key={`${n.id}-${t}`}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-secondary-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
