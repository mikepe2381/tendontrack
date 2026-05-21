import { z } from "zod";

const MAX_TAG_LENGTH = 40;
const MAX_TAGS = 20;

export const noteFormSchema = z.object({
  title: z.string().max(200, "Title can't exceed 200 characters").optional(),
  body: z.string().max(50000, "Note body is too long").optional(),
  // Free-form comma-separated string from the input; the server parses it
  // into a clean string[] before persisting.
  tags_input: z.string().max(1000, "Too many tags").optional(),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

export function parseTagsInput(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const piece of raw.split(",")) {
    const t = piece.trim().toLowerCase();
    if (!t) continue;
    if (t.length > MAX_TAG_LENGTH) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    tags.push(t);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

export function formatTagsForInput(tags: string[] | null | undefined): string {
  if (!tags || tags.length === 0) return "";
  return tags.join(", ");
}

export function firstLine(body: string | null | undefined): string {
  if (!body) return "";
  for (const raw of body.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    // Strip a leading markdown heading marker so the preview reads cleanly.
    return trimmed.replace(/^#{1,6}\s+/, "");
  }
  return "";
}
