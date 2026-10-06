"use client";

import { useActionState } from "react";
import Link from "next/link";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { buttonStyles } from "@/components/ui/button";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { DIET_FILTERS } from "@/lib/constants/menu-filters";
import type { AdminMenuItem, Category } from "@/lib/data/menu";

interface MenuItemFormProps {
  item?: AdminMenuItem;
  categories: Category[];
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
}

function nutritionValue(item: AdminMenuItem | undefined, key: string): string {
  const nutrition = item?.nutrition as Record<string, unknown> | null | undefined;
  const value = nutrition?.[key];
  return typeof value === "number" ? String(value) : "";
}

/** Create and edit share one form; ingredient links and recommendation
 * attributes are managed separately below it, once the dish exists. */
export function MenuItemForm({ item, categories, action }: MenuItemFormProps) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = state.values;

  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormMessage state={state} />

      <TextField
        name="name"
        label="Dish name"
        placeholder="Seared scallops, brown butter"
        required
        maxLength={160}
        defaultValue={v?.name ?? item?.name ?? ""}
        error={state.fieldErrors?.name}
      />

      <TextField
        name="slug"
        label="Slug"
        placeholder="seared-scallops-brown-butter"
        maxLength={80}
        defaultValue={v?.slug ?? item?.slug ?? ""}
        hint="Leave blank to generate one from the name."
        error={state.fieldErrors?.slug}
      />

      <SelectField
        name="categoryId"
        label="Category (optional)"
        defaultValue={v?.categoryId ?? item?.category_id ?? ""}
        error={state.fieldErrors?.categoryId}
      >
        <option value="">None</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
            {!category.is_active ? " (inactive)" : ""}
          </option>
        ))}
      </SelectField>

      <TextareaField
        name="description"
        label="Description"
        placeholder="What's on the plate — shown on the menu."
        maxLength={600}
        defaultValue={v?.description ?? item?.description ?? ""}
        error={state.fieldErrors?.description}
      />

      <TextareaField
        name="story"
        label="Story (optional)"
        placeholder="The dish's story — where it came from, why it's on the menu."
        maxLength={2000}
        defaultValue={v?.story ?? item?.story ?? ""}
        error={state.fieldErrors?.story}
      />

      <TextareaField
        name="chefNote"
        label="Chef's note (optional)"
        maxLength={1000}
        defaultValue={v?.chefNote ?? item?.chef_note ?? ""}
        error={state.fieldErrors?.chefNote}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          name="price"
          label="Price"
          type="number"
          step="0.01"
          min={0}
          required
          defaultValue={v?.price ?? item?.price?.toString() ?? ""}
          error={state.fieldErrors?.price}
        />
        <ImageUploadField
          name="imageUrl"
          label="Dish photo"
          folder="menu"
          defaultValue={v?.imageUrl ?? item?.image_url ?? ""}
          error={state.fieldErrors?.imageUrl}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectField
          name="spiceLevel"
          label="Spice level"
          defaultValue={v?.spiceLevel ?? item?.spice_level?.toString() ?? "0"}
          error={state.fieldErrors?.spiceLevel}
        >
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>
              {level} {level === 0 ? "(none)" : ""}
            </option>
          ))}
        </SelectField>

        <SelectField
          name="dietType"
          label="Diet type (optional)"
          defaultValue={v?.dietType ?? item?.diet_type ?? ""}
          error={state.fieldErrors?.dietType}
        >
          <option value="">Unspecified</option>
          {DIET_FILTERS.map((diet) => (
            <option key={diet.value} value={diet.value}>
              {diet.label}
            </option>
          ))}
        </SelectField>
      </div>

      <TextField
        name="dietaryTags"
        label="Dietary tags (optional)"
        placeholder="gluten-free, dairy-free, nut-free"
        defaultValue={v?.dietaryTags ?? item?.dietary_tags?.join(", ") ?? ""}
        hint="Comma-separated. Free text — whatever the kitchen wants to flag."
        error={state.fieldErrors?.dietaryTags}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm text-ivory">Nutrition (optional)</legend>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <TextField name="caloriesKcal" label="Calories" type="number" min={0} defaultValue={v?.caloriesKcal ?? nutritionValue(item, "calories_kcal")} />
          <TextField name="proteinG" label="Protein (g)" type="number" min={0} defaultValue={v?.proteinG ?? nutritionValue(item, "protein_g")} />
          <TextField name="carbsG" label="Carbs (g)" type="number" min={0} defaultValue={v?.carbsG ?? nutritionValue(item, "carbs_g")} />
          <TextField name="fatG" label="Fat (g)" type="number" min={0} defaultValue={v?.fatG ?? nutritionValue(item, "fat_g")} />
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CheckboxField name="isAvailable" label="Available tonight" defaultChecked={item?.is_available ?? true} />
        <CheckboxField name="isFeatured" label="Featured" defaultChecked={item?.is_featured ?? false} />
        <CheckboxField name="isChefChoice" label="Chef's choice" defaultChecked={item?.is_chef_choice ?? false} />
      </div>

      <TextField
        name="sortOrder"
        label="Display order"
        type="number"
        min={0}
        max={9999}
        defaultValue={v?.sortOrder ?? item?.sort_order?.toString() ?? "0"}
        hint="Lower numbers appear first within a category."
        error={state.fieldErrors?.sortOrder}
      />

      <div className="flex flex-wrap gap-3 pt-2">
        <SubmitButton pendingLabel="Saving…">{item ? "Save changes" : "Create dish"}</SubmitButton>
        <Link href="/admin/menu" className={buttonStyles({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
