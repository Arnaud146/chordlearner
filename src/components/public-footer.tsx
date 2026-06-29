import Link from "next/link";
import {
  optionBBodyFont,
  optionBClassNames,
  optionBDisplayFont,
} from "@/components/option-b/theme";
import { cn } from "@/lib/utils";

export function PublicFooter() {
  return (
    <footer
      className={cn(
        "bg-[var(--song-hero-dark)] text-[#c4b697]",
        optionBDisplayFont.variable,
        optionBBodyFont.variable,
      )}
    >
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <p
              className={cn(
                "text-xl font-bold text-[#f8f4ea]",
                optionBClassNames.display,
              )}
            >
              ChordLearner
            </p>
            <span className="hidden text-[#5a5246] sm:inline" aria-hidden>
              |
            </span>
            <p
              className={cn(
                "hidden text-sm text-[#8e8068] sm:block",
                optionBClassNames.body,
              )}
            >
              Learn the piano through chords
            </p>
          </div>

          <nav
            aria-label="Legal links"
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm",
              optionBClassNames.body,
            )}
          >
            <Link
              href="/mentions-legales"
              className="min-h-[44px] min-w-[44px] flex items-center text-[#a89a80] transition-colors hover:text-[#f8f4ea]"
            >
              Legal notice
            </Link>
            <Link
              href="/cgu"
              className="min-h-[44px] min-w-[44px] flex items-center text-[#a89a80] transition-colors hover:text-[#f8f4ea]"
            >
              Terms
            </Link>
            <Link
              href="/confidentialite"
              className="min-h-[44px] min-w-[44px] flex items-center text-[#a89a80] transition-colors hover:text-[#f8f4ea]"
            >
              Privacy
            </Link>
          </nav>
        </div>

        <div
          className={cn(
            "mt-6 border-t border-[#3d3a34] pt-5 text-center text-xs text-[#6b6152]",
            optionBClassNames.body,
          )}
        >
          &copy; {new Date().getFullYear()} ChordLearner. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
