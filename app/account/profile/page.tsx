import type { Metadata } from "next";

import { ProfileForm } from "@/components/account/profile-form";
import { requireAccess } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { profile, user } = await requireAccess("/account/profile");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">Profile</h1>
      <ProfileForm
        userId={user.id}
        fullName={profile?.full_name ?? ""}
        phone={profile?.phone ?? ""}
        email={user.email ?? ""}
        avatarUrl={profile?.avatar_url ?? ""}
      />
    </div>
  );
}
