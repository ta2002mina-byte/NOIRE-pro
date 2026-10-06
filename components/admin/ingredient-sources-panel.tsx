"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { IngredientSourceForm } from "@/components/admin/ingredient-source-form";
import { ToggleSourcePublishedButton } from "@/components/admin/toggle-source-published-button";
import { DeleteIngredientSourceButton } from "@/components/admin/delete-ingredient-source-button";
import { SOURCE_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDateOnly } from "@/lib/utils/format";
import { createIngredientSourceAction, updateIngredientSourceAction } from "@/lib/actions/ingredients";
import type { IngredientSource } from "@/lib/data/ingredients";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function SourceSummary({ source, onEdit }: { source: IngredientSource; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-ivory">{source.source_name}</p>
          <Badge tone={source.is_published ? "claret" : "outline"}>{source.is_published ? "Published" : "Unpublished"}</Badge>
        </div>
        <div className="space-y-0.5 text-sm text-mute">
          {source.source_type ? <p>{SOURCE_TYPE_LABELS[source.source_type] ?? source.source_type}</p> : null}
          {source.location ? <p>{source.location}</p> : null}
          {source.season_start_month && source.season_end_month ? (
            <p>
              In season {MONTHS[source.season_start_month - 1]}–{MONTHS[source.season_end_month - 1]}
            </p>
          ) : null}
          {source.harvest_date ? <p>Harvested {formatDateOnly(source.harvest_date)}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button type="button" onClick={onEdit} className="text-sm text-ivory underline hover:no-underline">
          Edit
        </button>
        <ToggleSourcePublishedButton id={source.id} isPublished={source.is_published} />
        <DeleteIngredientSourceButton id={source.id} name={source.source_name} />
      </div>
    </div>
  );
}

export function IngredientSourcesPanel({
  ingredientId,
  sources,
}: {
  ingredientId: string;
  sources: IngredientSource[];
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  // Bumped after a successful "add" so the add form remounts blank, ready for the next entry.
  const [addFormKey, setAddFormKey] = React.useState(0);
  const [showAddForm, setShowAddForm] = React.useState(sources.length === 0);

  const createAction = createIngredientSourceAction.bind(null, ingredientId);

  return (
    <div className="space-y-4">
      {sources.length === 0 ? (
        <p className="text-sm text-mute">No sources yet for this ingredient.</p>
      ) : (
        <div className="space-y-3">
          {sources.map((source) =>
            editingId === source.id ? (
              <IngredientSourceForm
                key={source.id}
                source={source}
                action={updateIngredientSourceAction.bind(null, source.id)}
                onCancel={() => setEditingId(null)}
                onSaved={() => setEditingId(null)}
              />
            ) : (
              <SourceSummary key={source.id} source={source} onEdit={() => setEditingId(source.id)} />
            ),
          )}
        </div>
      )}

      {showAddForm ? (
        <IngredientSourceForm
          key={addFormKey}
          action={createAction}
          onCancel={sources.length > 0 ? () => setShowAddForm(false) : undefined}
          onSaved={() => {
            setAddFormKey((k) => k + 1);
            setShowAddForm(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="text-sm text-ivory underline hover:no-underline"
        >
          + Add a source
        </button>
      )}
    </div>
  );
}
