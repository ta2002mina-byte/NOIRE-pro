import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/** A plain form that posts to a server action, so it works even before any JavaScript loads. */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm" className={className}>
        Sign out
      </Button>
    </form>
  );
}
