export default function AboutPage() {
  return (
    <div className="container max-w-2xl space-y-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">About TendonTrack</h1>
      <p className="text-muted-foreground">
        TendonTrack is a personal recovery journal for people healing from an
        Achilles tendon injury — surgical or non-surgical. It helps you log
        daily symptoms, manage supplements, anticipate milestones, and prepare
        for appointments.
      </p>
      <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
        <strong className="font-medium">
          Educational content, not medical advice.
        </strong>{" "}
        Recovery varies widely between individuals. Use this as a starting
        point for conversations with your surgeon and physiotherapist, not as
        a substitute for their guidance.
      </div>
    </div>
  );
}
