"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonStyles, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Media } from "@/components/ui/media";
import { SpiceLevel } from "@/components/menu/spice-level";
import { SubmitButton } from "@/components/forms/submit-button";
import { findMyDishAction, initialFindMyDishState } from "@/lib/actions/find-my-dish";
import { HUNGER_LEVELS, NO_PREFERENCE, SPICE_LEVELS } from "@/lib/constants/find-my-dish";
import { MOOD_FILTERS } from "@/lib/constants/menu-filters";
import type { DishFacets } from "@/lib/recommendations/find-my-dish";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";

interface QuizAnswers {
  mood: string;
  hunger: string;
  spice: string;
  flavor: string;
  texture: string;
  mealType: string;
  occasion: string;
}

const EMPTY_ANSWERS: QuizAnswers = {
  mood: "",
  hunger: "",
  spice: "",
  flavor: NO_PREFERENCE,
  texture: NO_PREFERENCE,
  mealType: NO_PREFERENCE,
  occasion: NO_PREFERENCE,
};

interface StepDef {
  id: keyof QuizAnswers;
  title: string;
  optional?: boolean;
}

function buildSteps(facets: DishFacets): StepDef[] {
  const steps: StepDef[] = [
    { id: "mood", title: "What are you in the mood for?" },
    { id: "hunger", title: "How hungry are you?" },
    { id: "spice", title: "How much spice do you want?" },
  ];
  if (facets.flavors.length > 0) steps.push({ id: "flavor", title: "Any flavor you're craving?", optional: true });
  if (facets.textures.length > 0) steps.push({ id: "texture", title: "Any texture you're craving?", optional: true });
  if (facets.mealTypes.length > 0) steps.push({ id: "mealType", title: "What's the occasion of the meal?", optional: true });
  if (facets.occasions.length > 0) steps.push({ id: "occasion", title: "Celebrating anything tonight?", optional: true });
  return steps;
}

function ChipOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "min-h-14 rounded-2xl border px-4 py-3 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        selected
          ? "border-claret bg-claret/15 text-ivory"
          : "border-line text-mute hover:border-ivory/40 hover:text-ivory",
      )}
    >
      {label}
    </button>
  );
}

export function FindMyDishQuiz({
  facets,
  isAuthenticated,
  currency,
}: {
  facets: DishFacets;
  isAuthenticated: boolean;
  currency: string;
}) {
  const [state, formAction] = useActionState(findMyDishAction, initialFindMyDishState);
  const [answers, setAnswers] = React.useState<QuizAnswers>(EMPTY_ANSWERS);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [showResult, setShowResult] = React.useState(false);

  const steps = React.useMemo(() => buildSteps(facets), [facets]);
  const step = steps[stepIndex];
  const isReview = stepIndex === steps.length;
  const totalSteps = steps.length + 1; // + review

  const resultReady = state.status === "success" && showResult;

  function setAnswer(id: keyof QuizAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function canAdvance() {
    if (!step) return true;
    if (step.optional) return true;
    return answers[step.id].trim().length > 0;
  }

  function goNext() {
    if (!canAdvance()) return;
    setStepIndex((i) => Math.min(i + 1, steps.length));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function startOver() {
    setAnswers(EMPTY_ANSWERS);
    setStepIndex(0);
    setShowResult(false);
  }

  function handleSubmit() {
    setShowResult(true);
  }

  if (resultReady) {
    return <QuizResult state={state} onStartOver={startOver} currency={currency} />;
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="mx-auto max-w-2xl" noValidate>
      {/* Always-present, controlled fields — the visible steps below are just a UI over these. */}
      <input type="hidden" name="mood" value={answers.mood} />
      <input type="hidden" name="hunger" value={answers.hunger} />
      <input type="hidden" name="spice" value={answers.spice} />
      <input type="hidden" name="flavor" value={answers.flavor} />
      <input type="hidden" name="texture" value={answers.texture} />
      <input type="hidden" name="mealType" value={answers.mealType} />
      <input type="hidden" name="occasion" value={answers.occasion} />

      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-mute">
        <span>
          Step {Math.min(stepIndex, steps.length) + 1} of {totalSteps}
        </span>
        {step?.optional ? <span>Optional</span> : null}
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-raised" aria-hidden="true">
        <div
          className="h-full rounded-full bg-claret transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${((Math.min(stepIndex, steps.length) + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {isReview ? (
        <ReviewStep
          steps={steps}
          answers={answers}
          isAuthenticated={isAuthenticated}
          formState={state}
        />
      ) : step ? (
        <QuizStep
          step={step}
          value={answers[step.id]}
          facets={facets}
          onChange={(value) => setAnswer(step.id, value)}
        />
      ) : null}

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className={cn(
            "inline-flex items-center gap-2 text-sm text-mute transition-colors hover:text-ivory disabled:pointer-events-none disabled:opacity-0",
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        {isReview ? (
          <SubmitButton pendingLabel="Finding your dish…">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Find my dish
          </SubmitButton>
        ) : (
          <Button type="button" onClick={goNext} disabled={!canAdvance()}>
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </form>
  );
}

function QuizStep({
  step,
  value,
  facets,
  onChange,
}: {
  step: StepDef;
  value: string;
  facets: DishFacets;
  onChange: (value: string) => void;
}) {
  let options: { value: string; label: string }[];
  switch (step.id) {
    case "mood":
      options = MOOD_FILTERS.map((mood) => ({ value: mood.value, label: mood.label }));
      break;
    case "hunger":
      options = HUNGER_LEVELS.map((level) => ({ value: level.value, label: level.label }));
      break;
    case "spice":
      options = SPICE_LEVELS.map((level) => ({ value: String(level.value), label: level.label }));
      break;
    case "flavor":
      options = facets.flavors.map((flavor) => ({ value: flavor, label: flavor }));
      break;
    case "texture":
      options = facets.textures.map((texture) => ({ value: texture, label: texture }));
      break;
    case "mealType":
      options = facets.mealTypes.map((mealType) => ({ value: mealType, label: mealType }));
      break;
    case "occasion":
      options = facets.occasions.map((occasion) => ({ value: occasion, label: occasion }));
      break;
    default:
      options = [];
  }

  return (
    <fieldset className="mt-8">
      <legend className="text-2xl text-ivory sm:text-3xl">{step.title}</legend>
      <div
        role="radiogroup"
        aria-label={step.title}
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {step.optional ? (
          <ChipOption label="No preference" selected={value === NO_PREFERENCE} onSelect={() => onChange(NO_PREFERENCE)} />
        ) : null}
        {options.map((option) => (
          <ChipOption
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function ReviewStep({
  steps,
  answers,
  isAuthenticated,
  formState,
}: {
  steps: StepDef[];
  answers: QuizAnswers;
  isAuthenticated: boolean;
  formState: { fieldErrors?: Record<string, string[] | undefined>; message?: string; status: string };
}) {
  const labelFor = React.useCallback((id: keyof QuizAnswers, value: string): string => {
    if (!value || value === NO_PREFERENCE) return "No preference";
    switch (id) {
      case "mood":
        return MOOD_FILTERS.find((m) => m.value === value)?.label ?? value;
      case "hunger":
        return HUNGER_LEVELS.find((h) => h.value === value)?.label ?? value;
      case "spice":
        return SPICE_LEVELS.find((s) => String(s.value) === value)?.label ?? value;
      default:
        return value;
    }
  }, []);

  return (
    <div className="mt-8">
      <h2 className="text-2xl text-ivory sm:text-3xl">Your answers</h2>
      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line">
        {steps.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <dt className="text-sm text-mute">{s.title}</dt>
            <dd className="text-sm text-ivory">{labelFor(s.id, answers[s.id])}</dd>
          </div>
        ))}
      </dl>

      {isAuthenticated ? (
        <label className="mt-6 flex items-start gap-3 text-sm text-mute">
          <input
            type="checkbox"
            name="save"
            className="mt-0.5 h-4 w-4 rounded border-line bg-surface text-claret focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
          />
          Save these preferences to my account
        </label>
      ) : (
        <p className="mt-6 text-sm text-mute">
          <Link href="/signin?next=%2Ffind-my-dish" className="text-ivory underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to save these preferences to your account.
        </p>
      )}

      {formState.status === "error" && formState.message ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {formState.message}
        </p>
      ) : null}
    </div>
  );
}

function QuizResult({
  state,
  onStartOver,
  currency,
}: {
  state: Awaited<ReturnType<typeof findMyDishAction>>;
  onStartOver: () => void;
  currency: string;
}) {
  const result = state.result;

  if (!result || !result.matched) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          title="No dish matched every answer tonight."
          description="Try a different combination, or browse the full menu — new dishes and moods are added regularly."
        >
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onStartOver} className={buttonStyles({ variant: "outline" })}>
              Try again
            </button>
            <Link href="/menu" className={buttonStyles()}>
              Explore the menu
            </Link>
          </div>
        </EmptyState>
      </div>
    );
  }

  const { dish, reasons } = result;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-blush">Your match</p>
      <h2 className="mt-3 text-center text-3xl text-ivory sm:text-4xl">{dish.name}</h2>
      {state.saved ? (
        <p role="status" className="mt-3 text-center text-sm text-good">
          Your preferences were saved to your account.
        </p>
      ) : null}

      <div className="mt-10 grid gap-10 sm:grid-cols-2 sm:items-start">
        <Media src={dish.image_url} alt={dish.name} ratio="aspect-[4/5]" />

        <div>
          <div className="flex flex-wrap gap-2">
            {dish.is_chef_choice ? <Badge tone="claret">Chef&rsquo;s Choice</Badge> : null}
            {dish.is_featured ? <Badge tone="outline">Featured</Badge> : null}
          </div>

          {dish.category ? <p className="mt-5 text-xs uppercase tracking-[0.2em] text-mute">{dish.category.name}</p> : null}
          <p className="mt-2 text-2xl text-ivory">{formatPrice(dish.price, currency)}</p>

          {dish.description ? <p className="mt-4 text-mute">{dish.description}</p> : null}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <SpiceLevel level={dish.spice_level} />
            {dish.dietary_tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {dish.dietary_tags.map((tag) => (
                  <Badge key={tag} tone="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          {reasons.length > 0 ? (
            <div className="mt-6 border-t border-line pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-mute">Why it matches</p>
              <ul className="mt-2 space-y-1 text-sm text-mute">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/menu/${dish.slug}`} className={buttonStyles()}>
              View dish
            </Link>
            <Link href="/reserve" className={buttonStyles({ variant: "outline" })}>
              Reserve a table
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={onStartOver}
          className="text-sm text-mute underline-offset-4 hover:text-ivory hover:underline"
        >
          Take the quiz again
        </button>
      </div>
    </div>
  );
}
