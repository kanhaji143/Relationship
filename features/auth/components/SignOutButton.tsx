"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { endSession, signOutClient } from "@/features/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await endSession();
    } catch {
      // Clearing the cookie is best-effort; still clear the client session.
    }
    try {
      await signOutClient();
    } catch {
      // Firebase may be unconfigured; the cookie is already cleared.
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleSignOut} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
