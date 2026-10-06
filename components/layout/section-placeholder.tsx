interface SectionPlaceholderProps {
  title: string;
  description: string;
  /** The phase in which this section is built. */
  phase: string;
}

/** Honest placeholder for a protected section whose feature ships in a later phase. */
export function SectionPlaceholder({ title, description, phase }: SectionPlaceholderProps) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      <div className="rounded-2xl border border-dashed border-line p-8 sm:p-12">
        <p className="max-w-prose text-mute">{description}</p>
        <p className="mt-4 text-sm text-ivory">Planned for {phase}.</p>
      </div>
    </div>
  );
}
