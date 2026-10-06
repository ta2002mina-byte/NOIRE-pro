"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TableList, TableMap, TableMapLegend } from "@/components/reserve/table-map";
import {
  createReservationAction,
  getAvailableTablesAction,
  type AvailableTable,
} from "@/lib/actions/reservation";
import { initialReservationState } from "@/lib/constants/reservation-state";
import {
  formatSlotLabel,
  generateTimeSlots,
  maxDateString,
  MAX_PARTY_SIZE_ONLINE,
  OCCASIONS,
  SEATING_PREFERENCES,
  todayDateString,
} from "@/lib/constants/reservation";
import { cn } from "@/lib/utils";
import { formatDateOnly } from "@/lib/utils/format";
import type { DiningExperience } from "@/lib/data/experiences";

const TIME_SLOTS = generateTimeSlots();

const STEPS = [
  "date",
  "time",
  "guests",
  "experience",
  "occasion",
  "preferences",
  "table",
  "request",
  "review",
] as const;
type Step = (typeof STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
  date: "Choose a date",
  time: "Choose a time",
  guests: "How many guests?",
  experience: "Choose your experience",
  occasion: "Celebrating anything?",
  preferences: "Any seating preferences?",
  table: "Choose your table",
  request: "Anything else we should know?",
  review: "Review & confirm",
};

interface Draft {
  date: string;
  time: string;
  guestCount: number;
  experienceId: string | null;
  occasion: string | null;
  preferences: string[];
  tableId: string | null;
  specialRequest: string;
}

function Chip({
  label,
  selected,
  onSelect,
  className,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "min-h-11 rounded-2xl border px-4 py-2.5 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        selected
          ? "border-claret bg-claret/15 text-ivory"
          : "border-line text-mute hover:border-ivory/40 hover:text-ivory",
        className,
      )}
    >
      {label}
    </button>
  );
}

export function ReservationWizard({
  experiences,
  hours,
  initialExperienceId,
  isSignedIn,
}: {
  experiences: DiningExperience[];
  hours: { day: string; hours: string }[];
  initialExperienceId: string | null;
  isSignedIn: boolean;
}) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const step = STEPS[stepIndex];

  const [draft, setDraft] = React.useState<Draft>({
    date: "",
    time: "",
    guestCount: 2,
    experienceId: initialExperienceId,
    occasion: null,
    preferences: [],
    tableId: null,
    specialRequest: "",
  });

  const [tables, setTables] = React.useState<AvailableTable[] | null>(null);
  const [availabilityError, setAvailabilityError] = React.useState<string | null>(null);
  const [availabilityPending, startAvailability] = React.useTransition();

  const [submitState, setSubmitState] = React.useState(initialReservationState);
  const [submitPending, startSubmit] = React.useTransition();

  const selectedExperience = experiences.find((e) => e.id === draft.experienceId) ?? null;

  const loadAvailability = React.useCallback(() => {
    setAvailabilityError(null);
    startAvailability(async () => {
      const result = await getAvailableTablesAction({
        date: draft.date,
        time: draft.time,
        guestCount: draft.guestCount,
        experienceId: draft.experienceId,
      });
      if (result.ok) {
        setTables(result.tables);
        // The previously selected table may no longer be in the fresh list.
        setDraft((d) => (d.tableId && !result.tables.some((t) => t.id === d.tableId) ? { ...d, tableId: null } : d));
      } else {
        setTables(null);
        setAvailabilityError(result.message);
      }
    });
  }, [draft.date, draft.time, draft.guestCount, draft.experienceId]);

  function goTo(index: number) {
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
    if (STEPS[index] === "table") loadAvailability();
  }

  function next() {
    goTo(stepIndex + 1);
  }
  function back() {
    goTo(stepIndex - 1);
  }

  async function handleSubmit() {
    setSubmitState(initialReservationState);
    startSubmit(async () => {
      const result = await createReservationAction({
        date: draft.date,
        time: draft.time,
        guestCount: draft.guestCount,
        experienceId: draft.experienceId,
        occasion: draft.occasion,
        preferences: draft.preferences,
        tableId: draft.tableId,
        specialRequest: draft.specialRequest || undefined,
      });
      setSubmitState(result);
    });
  }

  const canProceed: Record<Step, boolean> = {
    date: draft.date.length > 0,
    time: draft.time.length > 0,
    guests: draft.guestCount >= 1,
    experience: true,
    occasion: true,
    preferences: true,
    table: Boolean(draft.tableId),
    request: true,
    review: false,
  };

  if (submitState.status === "success") {
    return (
      <div className="rounded-2xl border border-line bg-raised p-8 text-center sm:p-12">
        <CalendarCheck className="mx-auto h-10 w-10 text-blush" aria-hidden="true" />
        <p className="mt-4 font-display text-2xl text-ivory">Request sent.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-mute">
          Your table request for {formatDateOnly(draft.date)} at {formatSlotLabel(draft.time)} is{" "}
          <Badge tone="claret" className="mx-1 align-middle">
            Pending
          </Badge>{" "}
          until we confirm it. You’ll be able to track its status in your account.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/account/reservations" className={buttonStyles({ variant: "primary" })}>
            View my reservations
          </Link>
          <Link href="/" className={buttonStyles({ variant: "outline" })}>
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ol className="mb-8 flex flex-wrap items-center gap-x-1 gap-y-2 text-xs text-mute" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-1">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
                i < stepIndex
                  ? "border-good/50 bg-good/10 text-good"
                  : i === stepIndex
                    ? "border-claret bg-claret text-ivory"
                    : "border-line text-mute",
              )}
              aria-hidden="true"
            >
              {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            {i < STEPS.length - 1 ? <span className="mx-0.5 h-px w-3 bg-line sm:w-5" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>

      <h2 className="font-display text-2xl text-ivory sm:text-3xl">{STEP_TITLES[step]}</h2>

      <div className="mt-6 min-h-[220px]">
        {step === "date" ? (
          <div className="max-w-xs">
            <label htmlFor="reserve-date" className="text-sm text-mute">
              Date
            </label>
            <input
              id="reserve-date"
              type="date"
              value={draft.date}
              min={todayDateString()}
              max={maxDateString()}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="mt-2 h-12 w-full rounded-xl border border-line bg-raised px-4 text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
            />
            {hours.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-mute">Our hours</p>
                <dl className="mt-2 space-y-1 text-sm">
                  {hours.map((row) => (
                    <div key={row.day} className="flex justify-between gap-4">
                      <dt className="text-mute">{row.day}</dt>
                      <dd className="text-ivory">{row.hours}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "time" ? (
          <div role="radiogroup" aria-label="Time" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {TIME_SLOTS.map((slot) => (
              <Chip
                key={slot}
                label={formatSlotLabel(slot)}
                selected={draft.time === slot}
                onSelect={() => setDraft((d) => ({ ...d, time: slot }))}
              />
            ))}
          </div>
        ) : null}

        {step === "guests" ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Fewer guests"
              disabled={draft.guestCount <= 1}
              onClick={() => setDraft((d) => ({ ...d, guestCount: Math.max(1, d.guestCount - 1) }))}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-ivory transition-colors hover:border-ivory/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-16 text-center font-display text-3xl text-ivory" aria-live="polite">
              {draft.guestCount}
            </span>
            <button
              type="button"
              aria-label="More guests"
              disabled={draft.guestCount >= MAX_PARTY_SIZE_ONLINE}
              onClick={() =>
                setDraft((d) => ({ ...d, guestCount: Math.min(MAX_PARTY_SIZE_ONLINE, d.guestCount + 1) }))
              }
              className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-ivory transition-colors hover:border-ivory/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-sm text-mute">guests</span>
            {draft.guestCount >= MAX_PARTY_SIZE_ONLINE ? (
              <p className="w-full text-xs text-mute">
                For larger parties, please <Link href="/contact" className="underline">contact us</Link> directly.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === "experience" ? (
          <div role="radiogroup" aria-label="Experience" className="space-y-3">
            <Chip label="No preference" selected={draft.experienceId === null} onSelect={() => setDraft((d) => ({ ...d, experienceId: null }))} className="w-full" />
            {experiences.length === 0 ? (
              <p className="text-sm text-mute">No curated experiences are published yet — that’s alright, a table is still just a few steps away.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {experiences.map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    role="radio"
                    aria-checked={draft.experienceId === exp.id}
                    onClick={() => setDraft((d) => ({ ...d, experienceId: exp.id }))}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                      draft.experienceId === exp.id
                        ? "border-claret bg-claret/10"
                        : "border-line hover:border-ivory/40",
                    )}
                  >
                    <p className="font-display text-lg text-ivory">{exp.title}</p>
                    {exp.description ? <p className="mt-1 line-clamp-2 text-sm text-mute">{exp.description}</p> : null}
                    {exp.min_guests || exp.max_guests ? (
                      <p className="mt-2 text-xs text-mute">
                        {exp.min_guests && exp.max_guests
                          ? `${exp.min_guests}–${exp.max_guests} guests`
                          : exp.min_guests
                            ? `From ${exp.min_guests} guests`
                            : `Up to ${exp.max_guests} guests`}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {step === "occasion" ? (
          <div role="radiogroup" aria-label="Occasion" className="flex flex-wrap gap-2">
            <Chip label="Not celebrating" selected={draft.occasion === null} onSelect={() => setDraft((d) => ({ ...d, occasion: null }))} />
            {OCCASIONS.map((o) => (
              <Chip key={o.value} label={o.label} selected={draft.occasion === o.value} onSelect={() => setDraft((d) => ({ ...d, occasion: o.value }))} />
            ))}
          </div>
        ) : null}

        {step === "preferences" ? (
          <div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Seating preferences">
              {SEATING_PREFERENCES.map((p) => {
                const selected = draft.preferences.includes(p.value);
                return (
                  <Chip
                    key={p.value}
                    label={p.label}
                    selected={selected}
                    onSelect={() =>
                      setDraft((d) => ({
                        ...d,
                        preferences: selected ? d.preferences.filter((v) => v !== p.value) : [...d.preferences, p.value],
                      }))
                    }
                  />
                );
              })}
            </div>
            <p className="mt-3 text-xs text-mute">Optional — we’ll do our best to accommodate these, subject to availability.</p>
          </div>
        ) : null}

        {step === "table" ? (
          <div>
            {availabilityPending ? (
              <p className="text-sm text-mute" role="status">
                Checking availability…
              </p>
            ) : availabilityError ? (
              <EmptyState title="No tables to show" description={availabilityError}>
                <Button variant="outline" onClick={loadAvailability}>
                  Try again
                </Button>
              </EmptyState>
            ) : tables && tables.length === 0 ? (
              <EmptyState
                title="No tables configured yet"
                description="We can’t show a floor plan right now. Please contact us directly to reserve a table."
              />
            ) : tables && tables.every((t) => !t.available) ? (
              <EmptyState
                title="Fully booked for this slot"
                description="Every table that fits your party is taken at this time. Go back and try a different time or date."
              >
                <Button variant="outline" onClick={() => goTo(STEPS.indexOf("time"))}>
                  Choose another time
                </Button>
              </EmptyState>
            ) : tables ? (
              <div className="space-y-5">
                <TableMap tables={tables} selectedId={draft.tableId} onSelect={(id) => setDraft((d) => ({ ...d, tableId: id }))} />
                <TableMapLegend />
                <details className="rounded-xl border border-line p-4">
                  <summary className="cursor-pointer text-sm text-ivory">List view</summary>
                  <div className="mt-4">
                    <TableList tables={tables} selectedId={draft.tableId} onSelect={(id) => setDraft((d) => ({ ...d, tableId: id }))} />
                  </div>
                </details>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "request" ? (
          <div>
            <label htmlFor="special-request" className="text-sm text-mute">
              Special request <span className="text-mute/70">(optional)</span>
            </label>
            <textarea
              id="special-request"
              value={draft.specialRequest}
              onChange={(e) => setDraft((d) => ({ ...d, specialRequest: e.target.value.slice(0, 1000) }))}
              rows={4}
              maxLength={1000}
              placeholder="Allergies, accessibility needs, anything else we should know…"
              className="mt-2 w-full rounded-xl border border-line bg-raised px-4 py-3 text-ivory placeholder:text-mute/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
            />
            <p className="mt-1 text-right text-xs text-mute">{draft.specialRequest.length}/1000</p>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-line bg-raised p-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-mute">Date</dt>
                <dd className="text-ivory">{draft.date ? formatDateOnly(draft.date) : "—"}</dd>
              </div>
              <div>
                <dt className="text-mute">Time</dt>
                <dd className="text-ivory">{draft.time ? formatSlotLabel(draft.time) : "—"}</dd>
              </div>
              <div>
                <dt className="text-mute">Guests</dt>
                <dd className="text-ivory">{draft.guestCount}</dd>
              </div>
              <div>
                <dt className="text-mute">Experience</dt>
                <dd className="text-ivory">{selectedExperience?.title ?? "No preference"}</dd>
              </div>
              <div>
                <dt className="text-mute">Occasion</dt>
                <dd className="text-ivory">{OCCASIONS.find((o) => o.value === draft.occasion)?.label ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-mute">Table</dt>
                <dd className="text-ivory">{tables?.find((t) => t.id === draft.tableId)?.label ?? "—"}</dd>
              </div>
              {draft.preferences.length > 0 ? (
                <div className="col-span-full">
                  <dt className="text-mute">Preferences</dt>
                  <dd className="text-ivory">
                    {draft.preferences
                      .map((v) => SEATING_PREFERENCES.find((p) => p.value === v)?.label ?? v)
                      .join(", ")}
                  </dd>
                </div>
              ) : null}
              {draft.specialRequest ? (
                <div className="col-span-full">
                  <dt className="text-mute">Special request</dt>
                  <dd className="text-ivory">{draft.specialRequest}</dd>
                </div>
              ) : null}
            </dl>

            {!isSignedIn ? (
              <div className="rounded-xl border border-dashed border-line p-5 text-sm">
                <p className="text-ivory">Sign in to confirm this table.</p>
                <p className="mt-1 text-mute">We keep reservations tied to your account so you can track, edit or cancel them.</p>
                <div className="mt-4 flex gap-3">
                  <Link href="/signin?next=/reserve" className={buttonStyles({ variant: "primary", size: "sm" })}>
                    Sign in
                  </Link>
                  <Link href="/signup?next=/reserve" className={buttonStyles({ variant: "outline", size: "sm" })}>
                    Create account
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {submitState.status === "error" ? (
                  <p role="alert" className="mb-4 text-sm text-danger">
                    {submitState.message}
                  </p>
                ) : null}
                <Button onClick={handleSubmit} loading={submitPending} disabled={submitPending}>
                  {submitPending ? "Requesting your table…" : "Request this table"}
                </Button>
                <p className="mt-2 text-xs text-mute">
                  This sends a request — we’ll confirm it shortly. Nothing is guaranteed until then.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
        <Button variant="ghost" onClick={back} disabled={stepIndex === 0}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>
        {step !== "review" ? (
          <Button onClick={next} disabled={!canProceed[step]}>
            Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
