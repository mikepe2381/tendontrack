import { Info } from "lucide-react";

import { CLINICAL_DISCLAIMER } from "@/lib/clinical-content";
import { cn } from "@/lib/utils";

export function ClinicalDisclaimer({ className }: { className?: string }) {
  return (
    <aside
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm",
        className,
      )}
    >
      <Info
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
      />
      <div className="space-y-1">
        <p className="font-medium">{CLINICAL_DISCLAIMER.title}</p>
        <p className="text-muted-foreground">{CLINICAL_DISCLAIMER.body}</p>
      </div>
    </aside>
  );
}
