import { SupplementsManager } from "@/app/settings/supplements/supplements-manager";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import type { SupplementTiming } from "@/lib/schemas/supplement";

type SupplementRow = {
  id: string;
  name: string;
  dose: string | null;
  timing: SupplementTiming | null;
  notes: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export default async function SupplementsPage() {
  const { supabase, user } = await requireOnboardedProfile();

  const { data, error } = await supabase
    .from("supplements")
    .select("id, name, dose, timing, notes, active, sort_order, created_at")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const supplements: SupplementRow[] = error ? [] : ((data ?? []) as SupplementRow[]);

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight">Supplements</h1>
        <p className="text-sm text-muted-foreground">
          Active supplements appear in your daily check-in. Inactive ones are
          hidden going forward but their history is kept.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Couldn&apos;t load your supplements: {error.message}
        </p>
      ) : null}

      <SupplementsManager initialSupplements={supplements} />
    </div>
  );
}
