"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/songs", label: "Morceaux" },
  { href: "/songs/new", label: "Nouveau" },
  { href: "/profil", label: "Profil" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/songs/new") {
    return pathname.startsWith("/songs/new");
  }
  if (href === "/songs") {
    return pathname.startsWith("/songs") && !pathname.startsWith("/songs/new");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AppNavbarProps {
  userEmail: string | null;
}

export function AppNavbar({ userEmail }: AppNavbarProps) {
  const pathname = usePathname();
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
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[#e7decc] bg-[#f8f4ea]/95",
        "backdrop-blur supports-[backdrop-filter]:bg-[#f8f4ea]/85",
        optionBDisplayFont.variable,
        optionBBodyFont.variable,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
        <Link
          href={userEmail ? "/songs" : "/login"}
          className={cn(
            "shrink-0 text-3xl leading-none font-bold text-[#2d2a24]",
            optionBClassNames.display,
          )}
        >
          ChordLearner
        </Link>

        {userEmail ? (
          <nav
            aria-label="Navigation principale"
            className={cn("flex items-center gap-1 overflow-x-auto", optionBClassNames.body)}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-sm px-3 py-2 text-sm font-semibold transition-colors",
                    "text-[#5a5246] hover:bg-[#efe6d6] hover:text-[#2d2a24]",
                    isActive ? "bg-[#2d2a24] text-[#f8f4ea] hover:bg-[#2d2a24]" : "",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div className="flex-1" />
        )}

        <div className={cn("flex items-center gap-2", optionBClassNames.body)}>
          {userEmail ? (
            <>
              <span className="hidden max-w-40 truncate text-xs font-medium text-[#5a5246] sm:block">
                {userEmail}
              </span>
              <Button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-sm bg-[#2d2a24] px-3 py-2 text-xs font-semibold text-[#f8f4ea] hover:bg-[#2d2a24]/90"
              >
                {isSigningOut ? "..." : "Deconnexion"}
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-sm px-3 py-2 text-sm font-semibold text-[#5a5246] transition-colors hover:bg-[#efe6d6] hover:text-[#2d2a24]"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-sm bg-[#2d2a24] px-3 py-2 text-sm font-semibold text-[#f8f4ea] transition-colors hover:bg-[#2d2a24]/90"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
