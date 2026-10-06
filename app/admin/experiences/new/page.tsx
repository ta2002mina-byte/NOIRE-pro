import type { Metadata } from "next";

import { ExperienceForm } from "@/components/admin/experience-form";
import { requireAccess } from "@/lib/auth/session";
import { createExperienceAction } from "@/lib/actions/experiences";

export const metadata: Metadata = { title: "New experience" };

export default async function NewExperiencePage() {
  await requireAccess("/admin/experiences");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">New experience</h1>
      <ExperienceForm action={createExperienceAction} />
    </div>
  );
}
