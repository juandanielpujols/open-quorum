"use client";
import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await signOut({ callbackUrl: "/login" });
        })
      }
      disabled={isPending}
      aria-label="Cerrar sesión"
      className="inline-flex size-8 items-center justify-center rounded-md text-brand-cream/70 transition-colors hover:bg-[var(--sidebar-accent)] hover:text-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-crimson disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : (
        <LogOut aria-hidden className="size-4" />
      )}
    </button>
  );
}
