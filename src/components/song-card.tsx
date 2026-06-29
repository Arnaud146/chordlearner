"use client";

import { useEffect, useId, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { optionBClassNames } from "@/components/option-b/theme";
import { Button } from "@/components/ui/button";

interface SongCardProps {
  id: string;
  title: string;
  artist: string | null;
  musicalKey?: string;
}

function buildDeleteErrorMessage(status: number, fallback?: string): string {
  if (fallback?.trim()) return fallback;

  switch (status) {
    case 401:
    case 403:
      return "Deletion denied. Check your session and log in again.";
    case 404:
      return "This song no longer exists. Reload the page.";
    case 409:
      return "Deletion blocked by a dependency. Try again after syncing.";
    default:
      return "Unable to delete the song right now. Try again in a few seconds.";
  }
}

export function SongCard({ id, title, artist, musicalKey }: SongCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  useEffect(() => {
    if (!isDeleteConfirmOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setIsDeleteConfirmOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDeleteConfirmOpen, isDeleting]);

  async function handleDeleteConfirmed() {
    if (isDeleting) return;

    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/songs/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(buildDeleteErrorMessage(response.status, payload.error));
      }

      setIsDeleteConfirmOpen(false);
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Deletion failed. Check your connection and try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <article className="group rounded-2xl border border-[var(--song-border-soft)] bg-[var(--song-surface)] p-4 shadow-[var(--song-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--song-shadow-hover)]">
        <header className="space-y-1">
          <h3 className={`${optionBClassNames.display} text-3xl leading-none font-bold text-[var(--song-text)]`}>
            <Link href={`/songs/${id}`} className="transition-colors hover:text-[var(--song-text-muted)]">
              {title}
            </Link>
          </h3>
          <p className={`${optionBClassNames.body} text-sm text-[var(--song-text-subtle)]`}>
            {artist ?? "Unknown artist"}
          </p>
        </header>

        <div className="mt-4 space-y-3">
          {musicalKey ? (
            <p
              className={`${optionBClassNames.body} inline-flex rounded-full border border-[var(--song-border)] bg-[var(--song-surface-highlight)] px-2.5 py-1 text-xs font-semibold text-[var(--song-text-muted)]`}
            >
              Key: {musicalKey}
            </p>
          ) : (
            <p
              className={`${optionBClassNames.body} inline-flex rounded-full border border-[var(--song-border-soft)] bg-[var(--song-surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--song-text-subtle)]`}
            >
              Key not set
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-highlight)] text-[var(--song-text)] hover:bg-[var(--song-surface-muted)]`}
            >
              <Link href={`/songs/${id}`}>Open</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text-muted)] hover:bg-[var(--song-surface-highlight)]`}
              onClick={() => {
                if (isDeleting) return;
                setDeleteError(null);
                setIsDeleteConfirmOpen(true);
              }}
              disabled={isDeleting}
              aria-label={`Delete ${title}`}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>

          {deleteError ? (
            <p className={`${optionBClassNames.body} text-xs text-[var(--song-danger)]`}>{deleteError}</p>
          ) : null}
        </div>
      </article>

      {isDeleteConfirmOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end p-4 sm:place-items-center">
          <button
            type="button"
            aria-label="Close the confirmation dialog"
            className="absolute inset-0 bg-black/45"
            onClick={() => {
              if (!isDeleting) setIsDeleteConfirmOpen(false);
            }}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            className="relative w-full max-w-sm rounded-2xl border border-[var(--song-border)] bg-[var(--song-surface)] p-5 shadow-[var(--song-shadow-hover)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-full bg-[var(--song-danger-surface)] text-[var(--song-danger)]">
                <AlertTriangle className="size-4" />
              </span>
              <div>
                <h4 id={dialogTitleId} className={`${optionBClassNames.display} text-3xl font-bold text-[var(--song-text)]`}>
                  Delete this song?
                </h4>
                <p
                  id={dialogDescriptionId}
                  className={`${optionBClassNames.body} mt-1 text-sm text-[var(--song-text-muted)]`}
                >
                  This action is permanent and will remove &quot;{title}&quot; from your library.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className={`${optionBClassNames.body} rounded-xl border-[var(--song-border)] bg-[var(--song-surface-soft)] text-[var(--song-text-muted)] hover:bg-[var(--song-surface-highlight)]`}
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className={`${optionBClassNames.body} rounded-xl bg-[var(--song-danger)] text-[var(--song-accent-foreground)] hover:bg-[var(--song-danger)]/90`}
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
