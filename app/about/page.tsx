import Link from "next/link";
import { Github } from "lucide-react";

import { CLINICAL_DISCLAIMER } from "@/lib/clinical-content";

export const metadata = {
  title: "About — TendonTrack",
  description:
    "A personal recovery journal for people healing from an Achilles tendon injury.",
};

const REPO_URL = "https://github.com/mikepe/tendontrack";

export default function AboutPage() {
  return (
    <div className="container max-w-2xl space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          About TendonTrack
        </h1>
        <p className="text-muted-foreground">
          TendonTrack is a personal recovery journal for people healing from an
          Achilles tendon injury — surgical or non-surgical. It helps you log
          daily symptoms, manage supplements, anticipate milestones, and prepare
          for appointments.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Who built this</h2>
        <p className="text-sm text-muted-foreground">
          Built by{" "}
          <Link
            href="https://example.com"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Your Name
          </Link>{" "}
          while going through Achilles recovery — a tool I wanted but couldn&apos;t
          find. Open-sourced in case it&apos;s useful to anyone else on the same
          path.
        </p>
        <p>
          <Link
            href={REPO_URL}
            className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            <Github aria-hidden className="h-4 w-4" />
            Source on GitHub
          </Link>
        </p>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-muted/40 p-4 text-sm">
        <h2 className="text-base font-semibold">
          {CLINICAL_DISCLAIMER.title}
        </h2>
        <p className="text-muted-foreground">{CLINICAL_DISCLAIMER.body}</p>
        <p className="text-muted-foreground">
          Recovery timelines vary substantially between individuals. Symptoms,
          progression, and the appropriateness of any specific exercise,
          supplement, or activity depend on your injury, your surgeon and
          physiotherapist&apos;s judgement, and factors not visible to this app.
          Use what you record here to ask better questions of your care team —
          not as a stand-in for their guidance.
        </p>
      </section>
    </div>
  );
}
