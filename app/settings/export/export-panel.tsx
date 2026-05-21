"use client";

import { useState, useTransition } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import {
  exportAllAsJson,
  exportTableAsRows,
  type ExportTable,
} from "@/app/settings/export/actions";
import { Button } from "@/components/ui/button";

const CSV_TABLES: { key: ExportTable; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "milestones", label: "Milestones" },
  { key: "daily_logs", label: "Daily logs" },
  { key: "supplements", label: "Supplements" },
  { key: "supplement_logs", label: "Supplement logs" },
  { key: "appointments", label: "Appointments" },
  { key: "notes", label: "Notes" },
];

function timestampSlug(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "string"
      ? value
      : typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : JSON.stringify(value);
  // Quote any field that contains a comma, quote, newline, or carriage return.
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  // Use the union of all keys so per-row missing columns still render in the
  // right column. Order: keys of the first row, then any extras appended.
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }
  const lines = [keys.join(",")];
  for (const row of rows) {
    lines.push(keys.map((k) => csvEscape(row[k])).join(","));
  }
  return lines.join("\r\n");
}

export function ExportPanel() {
  const [jsonPending, startJsonTransition] = useTransition();
  const [pendingTable, setPendingTable] = useState<ExportTable | null>(null);
  const [csvPending, startCsvTransition] = useTransition();

  function handleJson() {
    startJsonTransition(async () => {
      const result = await exportAllAsJson();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      triggerDownload(blob, `tendontrack-${timestampSlug()}.json`);
      toast.success("JSON export downloaded");
    });
  }

  function handleCsv(table: ExportTable) {
    setPendingTable(table);
    startCsvTransition(async () => {
      const result = await exportTableAsRows(table);
      if (!result.ok) {
        toast.error(result.error);
        setPendingTable(null);
        return;
      }
      if (result.rows.length === 0) {
        toast.info(`No rows in ${table}.`);
        setPendingTable(null);
        return;
      }
      const csv = rowsToCsv(result.rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      triggerDownload(blob, `tendontrack-${table}-${timestampSlug()}.csv`);
      toast.success(`${table} CSV downloaded`);
      setPendingTable(null);
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-md border border-border p-4">
        <div className="flex items-start gap-3">
          <FileJson
            aria-hidden
            className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
          />
          <div className="space-y-1">
            <p className="font-medium">Everything as JSON</p>
            <p className="text-sm text-muted-foreground">
              A single file with your profile and every record across all
              tables. Best for backup or migrating to another tool.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={handleJson} disabled={jsonPending}>
            <Download className="h-4 w-4" aria-hidden />
            {jsonPending ? "Preparing…" : "Download JSON"}
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-md border border-border p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet
            aria-hidden
            className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
          />
          <div className="space-y-1">
            <p className="font-medium">Per-table CSV</p>
            <p className="text-sm text-muted-foreground">
              One file per table — easier to open in Excel, Google Sheets, or
              Numbers.
            </p>
          </div>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CSV_TABLES.map((t) => {
            const isPending = csvPending && pendingTable === t.key;
            return (
              <li key={t.key}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handleCsv(t.key)}
                  disabled={csvPending}
                >
                  <span>{t.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {isPending ? "…" : ".csv"}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
