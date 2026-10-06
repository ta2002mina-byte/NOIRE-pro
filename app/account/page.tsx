import { requireAccess } from "@/lib/auth/session";
import { getFirstName } from "@/lib/utils/name";

export default async function AccountOverviewPage() {
  const { profile, user } = await requireAccess("/account");
  const firstName = getFirstName(profile?.full_name);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin/customer-uploaded URL, not a static page asset
          <img
            src={profile.avatar_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full border border-line object-cover"
          />
        ) : null}
        <h1 className="text-3xl sm:text-5xl">{firstName ? `Welcome, ${firstName}.` : "Welcome."}</h1>
      </div>

      <dl className="grid gap-6 rounded-2xl border border-line p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <dt className="text-sm text-mute">Name</dt>
          <dd className="mt-1 break-words">{profile?.full_name ?? "Not added yet"}</dd>
        </div>
        <div>
          <dt className="text-sm text-mute">Email</dt>
          <dd className="mt-1 break-all">{user.email}</dd>
        </div>
      </dl>

      {!profile ? (
        <p role="status" className="text-sm text-mute">
          Your profile is still being set up. If this message stays, sign out and back in.
        </p>
      ) : null}

      <p className="max-w-prose text-mute">
        Your reservations, dining journal and passport will appear here as they are switched on.
      </p>
    </div>
  );
}
