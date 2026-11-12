import { SignInButton } from "@/components/InternetIdentity";
import { useAccessSummary } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof ClipboardList;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/formato-1", label: "Formato 1", icon: ClipboardList },
  { to: "/formato-2", label: "Formato 2", icon: FileSpreadsheet },
  { to: "/panel", label: "Panel de Control", icon: LayoutDashboard },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/admin", label: "Accesos", icon: Users, adminOnly: true },
];

function isActivePath(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

/**
 * Shell de la aplicación: barra superior marina, menú principal y pie.
 * El enlace de administración solo se muestra a administradores.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { data: summary } = useAccessSummary();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = summary?.isAdmin ?? false;
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-primary/40 bg-primary text-primary-foreground shadow-subtle">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-primary-foreground/70">
                CPNNA · Registro Estadístico
              </span>
              <span className="truncate font-display text-base font-semibold sm:text-lg">
                Actividades Semanales
              </span>
            </span>
          </Link>
          <SignInButton className="h-9 shrink-0 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-3 text-xs font-medium text-primary-foreground transition-smooth hover:bg-primary-foreground/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 sm:text-sm" />
        </div>

        <nav
          aria-label="Menú principal"
          data-ocid="nav.menu"
          className="border-t border-primary-foreground/10 bg-primary/95"
        >
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-4">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-ocid={`nav.${item.to.replace(/^\//, "").replace(/\//g, "-")}_link`}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                    active
                      ? "border-accent text-accent"
                      : "border-transparent text-primary-foreground/75 hover:text-primary-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <span>CPNNA · Registro Estadístico de Actividades Semanales</span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="transition-smooth hover:text-foreground"
          >
            © {new Date().getFullYear()}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
