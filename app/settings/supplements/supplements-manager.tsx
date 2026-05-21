"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createSupplement,
  deleteSupplement,
  reorderSupplements,
  toggleSupplementActive,
  updateSupplement,
} from "@/app/settings/supplements/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SUPPLEMENT_TIMINGS,
  SUPPLEMENT_TIMING_LABELS,
  supplementFormSchema,
  type SupplementFormValues,
  type SupplementTiming,
} from "@/lib/schemas/supplement";
import { cn } from "@/lib/utils";

export type SupplementRow = {
  id: string;
  name: string;
  dose: string | null;
  timing: SupplementTiming | null;
  notes: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

type Props = {
  initialSupplements: SupplementRow[];
};

export function SupplementsManager({ initialSupplements }: Props) {
  const [supplements, setSupplements] = useState<SupplementRow[]>(initialSupplements);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = supplements.findIndex((s) => s.id === active.id);
    const newIndex = supplements.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = supplements;
    const next = arrayMove(supplements, oldIndex, newIndex);
    setSupplements(next);
    setTopError(null);
    startTransition(async () => {
      const result = await reorderSupplements(next.map((s) => s.id));
      if (!result.ok) {
        setSupplements(previous);
        setTopError(`Couldn't save new order: ${result.error}`);
      }
    });
  }

  function handleCreated(row: SupplementRow) {
    setSupplements((prev) => [...prev, row]);
    setAdding(false);
  }

  function handleUpdated(row: SupplementRow) {
    setSupplements((prev) => prev.map((s) => (s.id === row.id ? row : s)));
    setEditingId(null);
  }

  function handleActiveToggle(id: string, active: boolean) {
    const previous = supplements;
    setSupplements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active } : s)),
    );
    setTopError(null);
    startTransition(async () => {
      const result = await toggleSupplementActive(id, active);
      if (!result.ok) {
        setSupplements(previous);
        setTopError(`Couldn't update: ${result.error}`);
      }
    });
  }

  function handleDelete(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this supplement and its history?")
    ) {
      return;
    }
    const previous = supplements;
    setSupplements((prev) => prev.filter((s) => s.id !== id));
    setTopError(null);
    startTransition(async () => {
      const result = await deleteSupplement(id);
      if (!result.ok) {
        setSupplements(previous);
        setTopError(`Couldn't delete: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      {topError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {topError}
        </p>
      ) : null}

      {adding ? (
        <SupplementForm
          key="add-form"
          mode="add"
          onCancel={() => setAdding(false)}
          onCreated={handleCreated}
        />
      ) : (
        <Button
          key="add-button"
          type="button"
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add supplement
        </Button>
      )}

      {supplements.length === 0 ? (
        <div className="rounded-md border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          No supplements yet — tap “Add supplement” to build your stack.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={supplements.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {supplements.map((supplement) =>
                editingId === supplement.id ? (
                  <li key={supplement.id}>
                    <SupplementForm
                      key={`edit-${supplement.id}`}
                      mode="edit"
                      supplement={supplement}
                      onCancel={() => setEditingId(null)}
                      onUpdated={handleUpdated}
                    />
                  </li>
                ) : (
                  <SortableSupplementRow
                    key={supplement.id}
                    supplement={supplement}
                    onEdit={() => {
                      setEditingId(supplement.id);
                      setAdding(false);
                    }}
                    onDelete={() => handleDelete(supplement.id)}
                    onToggleActive={(active) =>
                      handleActiveToggle(supplement.id, active)
                    }
                  />
                ),
              )}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

type RowProps = {
  supplement: SupplementRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
};

function SortableSupplementRow({
  supplement,
  onEdit,
  onDelete,
  onToggleActive,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: supplement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-md border border-border bg-card p-3 transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary/30",
        !supplement.active && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${supplement.name}`}
        className="mt-1 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent/40 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-medium">{supplement.name}</p>
          {supplement.dose ? (
            <span className="text-sm text-muted-foreground">
              {supplement.dose}
            </span>
          ) : null}
          {supplement.timing ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {SUPPLEMENT_TIMING_LABELS[supplement.timing]}
            </span>
          ) : null}
          {!supplement.active ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              Inactive
            </span>
          ) : null}
        </div>
        {supplement.notes ? (
          <p className="text-sm text-muted-foreground">{supplement.notes}</p>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-2">
        <ActiveSwitch
          value={supplement.active}
          onChange={onToggleActive}
          label={`Toggle ${supplement.name} active`}
        />
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onEdit}
            aria-label={`Edit ${supplement.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            aria-label={`Delete ${supplement.name}`}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}

type ActiveSwitchProps = {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
};

function ActiveSwitch({ value, onChange, label }: ActiveSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        value ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
          value ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

type AddProps = {
  mode: "add";
  onCancel: () => void;
  onCreated: (row: SupplementRow) => void;
};

type EditProps = {
  mode: "edit";
  supplement: SupplementRow;
  onCancel: () => void;
  onUpdated: (row: SupplementRow) => void;
};

function setValueAsOptionalString(v: unknown): string | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  return String(v);
}

function setValueAsOptionalTiming(v: unknown): SupplementTiming | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  return v as SupplementTiming;
}

function SupplementForm(props: AddProps | EditProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const defaultValues: SupplementFormValues =
    props.mode === "edit"
      ? {
          name: props.supplement.name,
          dose: props.supplement.dose ?? undefined,
          timing: props.supplement.timing ?? undefined,
          notes: props.supplement.notes ?? undefined,
          active: props.supplement.active,
        }
      : {
          name: "",
          dose: undefined,
          timing: undefined,
          notes: undefined,
          active: true,
        };

  const form = useForm<SupplementFormValues>({
    resolver: zodResolver(supplementFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  function onSubmit(values: SupplementFormValues) {
    setServerError(null);
    startTransition(async () => {
      if (props.mode === "add") {
        const result = await createSupplement(values);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        if (result.id) {
          props.onCreated({
            id: result.id,
            name: values.name,
            dose: values.dose ?? null,
            timing: values.timing ?? null,
            notes: values.notes ?? null,
            active: values.active,
            sort_order: 0,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        const result = await updateSupplement(props.supplement.id, values);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        props.onUpdated({
          ...props.supplement,
          name: values.name,
          dose: values.dose ?? null,
          timing: values.timing ?? null,
          notes: values.notes ?? null,
          active: values.active,
        });
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3 rounded-md border border-border bg-card p-4"
      noValidate
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="supp-name">Name</Label>
          <Input
            id="supp-name"
            placeholder="e.g. Collagen peptides"
            autoComplete="off"
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="supp-dose">Dose</Label>
          <Input
            id="supp-dose"
            placeholder="20g, 2000 IU, 1 capsule…"
            autoComplete="off"
            {...form.register("dose", { setValueAs: setValueAsOptionalString })}
          />
          {form.formState.errors.dose ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.dose.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="supp-timing">Timing</Label>
          <select
            id="supp-timing"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
            {...form.register("timing", {
              setValueAs: setValueAsOptionalTiming,
            })}
          >
            <option value="">—</option>
            {SUPPLEMENT_TIMINGS.map((t) => (
              <option key={t} value={t}>
                {SUPPLEMENT_TIMING_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="supp-notes">Notes</Label>
          <Textarea
            id="supp-notes"
            rows={2}
            placeholder="Optional — e.g. take with food."
            {...form.register("notes", { setValueAs: setValueAsOptionalString })}
          />
          {form.formState.errors.notes ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.notes.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="supp-active"
            type="checkbox"
            className="size-4 rounded border-input"
            {...form.register("active")}
          />
          <Label htmlFor="supp-active" className="cursor-pointer">
            Active (shows in daily check-in)
          </Label>
        </div>
      </div>

      {serverError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          key="supp-cancel"
          type="button"
          variant="ghost"
          onClick={props.onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button key="supp-submit" type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : props.mode === "add"
              ? "Add supplement"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
