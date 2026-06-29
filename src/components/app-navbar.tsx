import Link from "next/link";
import { headers } from "next/headers";
import { AppNavbarSignOutButton } from "@/components/app-navbar-sign-out-button";
import { optionBBodyFont, optionBClassNames, optionBDisplayFont } from "@/components/option-b/theme";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/songs", label: "Songs" },
  { href: "/songs/new", label: "New" },
  { href: "/profil", label: "Profile" },
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

export async function AppNavbar({ userEmail }: AppNavbarProps) {
  const pathname = (await headers()).get("x-pathname") ?? "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[var(--song-border-soft)] bg-[var(--song-bg)]/95",
        "backdrop-blur supports-[backdrop-filter]:bg-[var(--song-bg)]/85",
        optionBDisplayFont.variable,
        optionBBodyFont.variable,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
        <Link
          href={userEmail ? "/songs" : "/login"}
          className={cn(
            "shrink-0 text-3xl leading-none font-bold text-[var(--song-text)]",
            optionBClassNames.display,
          )}
        >
          ChordLearner
        </Link>

        {userEmail ? (
          <nav
            aria-label="Main navigation"
            className={cn("flex items-center gap-1 overflow-x-auto", optionBClassNames.body)}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "min-h-[44px] min-w-[44px] flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    "text-[var(--song-text-muted)] hover:bg-[var(--song-surface-highlight)] hover:text-[var(--song-text)]",
                    isActive ? "bg-[var(--song-accent)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-accent-hover)]" : "",
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
              <span className="hidden max-w-40 truncate text-xs font-medium text-[var(--song-text-muted)] sm:block">
                {userEmail}
              </span>
              <AppNavbarSignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-semibold text-[var(--song-text-muted)] transition-colors hover:bg-[var(--song-surface-highlight)] hover:text-[var(--song-text)]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex min-h-[44px] items-center rounded-lg bg-[var(--song-accent)] px-3 py-2 text-sm font-semibold text-[var(--song-accent-foreground)] transition-colors hover:bg-[var(--song-accent-hover)]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
