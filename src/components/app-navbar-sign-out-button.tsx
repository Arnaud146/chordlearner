"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function AppNavbarSignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="min-h-[44px] rounded-lg bg-[var(--song-accent)] px-3 py-2 text-xs font-semibold text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent-hover)]"
    >
      {isSigningOut ? "..." : "Sign out"}
    </Button>
  );
}
