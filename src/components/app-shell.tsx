import Link from "next/link";
import type { Rol } from "@/generated/prisma";
import { auth, signOut } from "@/lib/auth";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  CalendarCheck2,
  Users,
  Tag,
  ShieldCheck,
  Vote,
  LogOut,
} from "lucide-react";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Votaciones";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV_BY_ROLE: Record<Rol, { label: string; items: NavItem[] }> = {
  ADMIN: {
    label: "Administración",
    items: [
      { href: "/admin/eventos", label: "Eventos", icon: CalendarCheck2 },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users },
      { href: "/admin/tags", label: "Tags", icon: Tag },
    ],
  },
  REVIEWER: {
    label: "Revisión",
    items: [{ href: "/reviewer/eventos", label: "Eventos", icon: ShieldCheck }],
  },
  VOTANTE: {
    label: "Mis votaciones",
    items: [{ href: "/votante/eventos", label: "Votaciones activas", icon: Vote }],
  },
};

function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 48"
      className={className}
      role="img"
      aria-label="Monograma CGR"
    >
      <text
        x="0"
        y="38"
        fontFamily='"Crimson Pro", Georgia, serif'
        fontWeight="600"
        fontSize="42"
        letterSpacing="-1.5"
        fill="currentColor"
      >
        C
      </text>
      <polygon points="52,30 64,15 64,38" fill="#C62828" />
      <text
        x="72"
        y="38"
        fontFamily='"Crimson Pro", Georgia, serif'
        fontWeight="600"
        fontSize="42"
        letterSpacing="-1.5"
        fill="currentColor"
      >
        R
      </text>
    </svg>
  );
}

const ROLE_BADGE: Record<Rol, string> = {
  ADMIN: "Admin",
  REVIEWER: "Reviewer",
  VOTANTE: "Votante",
};

export async function AppShell({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  const session = await auth();
  if (!session) return <>{children}</>;
  const rol = session.user.rol;
  const nav = NAV_BY_ROLE[rol];

  async function cerrarSesion() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-[var(--sidebar-border)]">
        <SidebarHeader className="py-5">
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
            <Monogram className="h-7 w-auto text-brand-cream group-data-[collapsible=icon]:h-6" />
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="font-display text-base font-semibold text-brand-cream">
                {APP_NAME}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">
                {ROLE_BADGE[rol]}
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator className="bg-[var(--sidebar-border)]" />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-cream/50">
              {nav.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {nav.items.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="py-4">
          <div className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium text-brand-cream">
                {session.user.nombre}
              </p>
              <p className="truncate text-[11px] text-brand-cream/50">
                {session.user.email}
              </p>
            </div>
            <form action={cerrarSesion}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                className="inline-flex size-8 items-center justify-center rounded-md text-brand-cream/70 transition-colors hover:bg-[var(--sidebar-accent)] hover:text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-crimson"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-brand-border/60 bg-brand-cream/80 px-4 backdrop-blur-sm lg:px-6">
          <SidebarTrigger className="-ml-1 text-brand-ink/70 hover:text-brand-ink" />
          {pageTitle && (
            <h1 className="font-display text-lg font-semibold text-brand-ink">
              {pageTitle}
            </h1>
          )}
        </header>
        <div className="min-h-[calc(100vh-3.5rem)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
