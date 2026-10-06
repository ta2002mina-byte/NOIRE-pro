import type { Metadata } from "next";

import { StoryForm } from "@/components/admin/story-form";
import { requireAccess } from "@/lib/auth/session";
import { createStoryAction } from "@/lib/actions/stories";

export const metadata: Metadata = { title: "New story" };

export default async function NewStoryPage() {
  await requireAccess("/admin/stories");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">New story</h1>
      <StoryForm action={createStoryAction} />
    </div>
  );
}
