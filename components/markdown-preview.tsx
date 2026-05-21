import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

type Props = {
  source: string | null | undefined;
  className?: string;
  emptyLabel?: string;
};

// Tailwind `prose` plugin isn't installed, so we style the rendered tree by
// targeting the children directly. Classes mirror the look of the rest of the
// app — readable body text, muted-foreground for quotes, secondary chips for
// code spans.
export function MarkdownPreview({ source, className, emptyLabel }: Props) {
  const text = (source ?? "").trim();
  if (!text) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyLabel ?? "Nothing here yet."}
      </p>
    );
  }
  return (
    <div
      className={cn(
        "markdown-body space-y-3 break-words text-sm leading-relaxed text-foreground",
        "[&_h1]:mt-2 [&_h1]:text-xl [&_h1]:font-semibold",
        "[&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_p]:leading-relaxed",
        "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-0.5",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre>code]:bg-transparent [&_pre>code]:p-0",
        "[&_hr]:my-3 [&_hr]:border-border",
        "[&_strong]:font-semibold",
        className,
      )}
    >
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
