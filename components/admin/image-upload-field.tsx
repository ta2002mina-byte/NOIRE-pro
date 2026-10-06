"use client";

import * as React from "react";
import { ImageOff, Loader2, Upload, X } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { buildMediaPath, MEDIA_BUCKET, validateImageFile } from "@/lib/utils/image";
import { cn } from "@/lib/utils";

export interface ImageUploadFieldProps {
  /** Form field name the resulting URL is submitted under (e.g. "imageUrl"). */
  name: string;
  label: string;
  /** Storage sub-folder for this form, e.g. "menu", "ingredients", "chef", "stories", "experiences". */
  folder: string;
  defaultValue?: string | null;
  hint?: string;
  error?: string[];
}

/**
 * Uploads an image straight from the browser to Supabase Storage (bucket
 * "media"), authenticated as the signed-in staff/admin session — RLS on
 * storage.objects (see the Phase 15 migration) is what actually authorizes
 * this, not anything client-side. The resulting public URL is written into a
 * plain text input with `name`, so it submits with the surrounding
 * `<form action={...}>` exactly like the old "paste a URL" field did — a URL
 * can still be pasted or edited directly there, e.g. to reuse an image
 * already uploaded elsewhere.
 */
export function ImageUploadField({ name, label, folder, defaultValue, hint, error }: ImageUploadFieldProps) {
  const id = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [url, setUrl] = React.useState(defaultValue ?? "");
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [imageBroken, setImageBroken] = React.useState(false);

  const message = error?.[0] ?? uploadError ?? undefined;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  async function handleFile(file: File) {
    const invalid = validateImageFile(file);
    if (invalid) {
      setUploadError(invalid);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const path = buildMediaPath(folder, file);
      const { error: uploadErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (uploadErr) {
        setUploadError("Upload failed. Please try again.");
        console.error("[ImageUploadField] upload failed:", uploadErr.message);
        return;
      }
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      setImageBroken(false);
      setUrl(data.publicUrl);
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
      console.error("[ImageUploadField] upload threw:", err);
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm text-ivory">
        {label}
      </label>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-dashed border-line bg-surface p-4 transition-colors sm:flex-row sm:items-center",
          "hover:border-ivory/30",
        )}
      >
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-raised">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-mute" aria-hidden="true" />
          ) : url && !imageBroken ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary/just-uploaded URL, not a page asset
            <img src={url} alt="" className="h-full w-full object-cover" onError={() => setImageBroken(true)} />
          ) : (
            <ImageOff className="h-6 w-6 text-mute" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-sm text-ivory transition-colors hover:border-ivory/60 hover:bg-raised disabled:opacity-50"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {uploading ? "Uploading…" : url ? "Replace image" : "Upload image"}
            </button>
            {url ? (
              <button
                type="button"
                onClick={() => {
                  setUrl("");
                  setImageBroken(false);
                }}
                disabled={uploading}
                className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm text-mute transition-colors hover:text-ivory disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </div>
          <p className="truncate text-xs text-mute">
            {url ? url : "Drag an image here, or click Upload. JPEG, PNG, WebP or GIF, up to 5MB."}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={onInputChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>

      {/* The actual form field — still editable directly for pasting an existing URL. */}
      <input
        id={id}
        name={name}
        type="url"
        value={url}
        onChange={(event) => {
          setUrl(event.target.value);
          setImageBroken(false);
        }}
        placeholder="https://…"
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? errorId : hint ? hintId : undefined}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ivory placeholder:text-mute/70 transition-colors",
          "hover:border-ivory/30 focus-visible:border-ivory/60 aria-[invalid=true]:border-danger",
        )}
      />

      {hint && !message ? (
        <p id={hintId} className="text-sm text-mute">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}
