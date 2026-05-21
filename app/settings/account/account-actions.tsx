"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

import { deleteAccount } from "@/app/settings/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountActions() {
  const router = useRouter();
  const [signOutPending, setSignOutPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function onSignOut() {
    setSignOutPending(true);
    try {
      const res = await fetch("/auth/signout", { method: "POST" });
      if (!res.ok && res.status !== 0) {
        toast.error("Sign out failed");
        return;
      }
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Sign out failed");
    } finally {
      setSignOutPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium">Sign out</p>
          <p className="text-sm text-muted-foreground">
            End your session on this device.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onSignOut}
          disabled={signOutPending}
        >
          {signOutPending ? "Signing out…" : "Sign out"}
        </Button>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-destructive">Delete account</p>
          <p className="text-sm text-muted-foreground">
            Permanently erases your profile, milestones, logs, supplements,
            appointments, and notes. This can&apos;t be undone.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirmOpen(true)}
        >
          Delete account
        </Button>
      </section>

      {confirmOpen ? (
        <DeleteAccountModal onClose={() => setConfirmOpen(false)} />
      ) : null}
    </div>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    setServerError(null);
    startTransition(async () => {
      const result = await deleteAccount(value);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Account deleted");
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={pending ? undefined : onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md space-y-4 rounded-t-xl border border-border bg-background p-5 shadow-lg sm:rounded-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle aria-hidden className="h-5 w-5" />
              <h2
                id="delete-account-title"
                className="text-lg font-semibold tracking-tight"
              >
                Delete account
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This permanently removes every record tied to your account:
              profile, milestones, daily logs, supplements, appointments, and
              notes. There is no recovery.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            disabled={pending}
            className="-mr-2 -mt-2 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delete-confirm">
            Type <span className="font-mono font-semibold">DELETE</span> to
            confirm
          </Label>
          <Input
            id="delete-confirm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            disabled={pending}
            autoFocus
          />
        </div>

        {serverError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={pending || value !== "DELETE"}
          >
            {pending ? "Deleting…" : "Delete my account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
