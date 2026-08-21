import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Cake,
  House,
  Contact,
  Users,
  LogOut,
  Moon,
  Sun,
  User,
  Palette,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ACCENTS, useTheme } from "@/components/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBirthdayAlertCount } from "@/hooks/useBirthdayAlerts";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Home", icon: House },
  { to: "/friends", label: "Friends", icon: Contact },
  { to: "/circles", label: "Circles", icon: Users },
  { to: "/birthdays", label: "Birthdays", icon: Cake },
] as const;


export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopHeader />
      <DesktopSidebar />
      <main className="px-4 pb-24 pt-4 md:ml-[var(--sidebar-width)] md:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

function TopHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border accent-surface backdrop-blur md:left-0 md:right-0">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:pl-[calc(var(--sidebar-width)+1rem)] md:pr-6">
        <Link to="/dashboard" className="font-display text-lg font-semibold tracking-tight">
          Friend<span className="text-primary">Circles</span>
        </Link>
        <div className="flex items-center gap-1 md:hidden">
          <MobileUserMenu />
        </div>
      </div>
      <div aria-hidden className="accent-bar h-0.5 w-full opacity-80" />
    </header>
  );
}


function MobileUserMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode, accent, setMode, setAccent } = useTheme();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="User menu">
          <User className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setMode(mode === "dark" ? "light" : "dark")}>
          {mode === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
          {mode === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Accent colour</DropdownMenuLabel>
        {ACCENTS.map((option) => (
          <DropdownMenuItem key={option.id} onSelect={() => setAccent(option.id)}>
            <span
              aria-hidden
              data-accent={option.id}
              className="mr-2 size-3.5 rounded-full border border-border bg-[var(--accent-swatch)]"
            />
            <span className={cn(accent === option.id && "font-semibold text-foreground")}>
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileBottomNav() {
  const currentPath = useRouterState({ select: (router) => router.location.pathname });
  const birthdayCount = useBirthdayAlertCount();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border accent-surface pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-1.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = currentPath === to || currentPath.startsWith(`${to}/`);
          const badge = to === "/birthdays" && birthdayCount > 0 ? birthdayCount : 0;
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                aria-label={badge ? `${label}, ${badge} needing attention` : label}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.6875rem] font-medium leading-none transition-colors active:scale-[0.97]",
                  active
                    ? "bg-primary text-primary-foreground shadow-paper"
                    : "text-muted-foreground hover:text-foreground",
                )}

              >
                <span className="relative">
                  <Icon
                    className={cn("size-6", active && "stroke-[2.25]")}
                    aria-hidden
                  />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-semibold leading-none text-destructive-foreground">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="truncate">{label}</span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full transition-opacity",
                    active ? "bg-primary-foreground/70 opacity-100" : "opacity-0",

                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


function DesktopSidebar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode, accent, setMode, setAccent } = useTheme();
  const currentPath = useRouterState({ select: (router) => router.location.pathname });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center px-4">
        <Palette className="size-5 text-primary" aria-hidden />
        <span className="ml-2 font-display text-base font-semibold tracking-tight">Menu</span>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = currentPath === to || currentPath.startsWith(`${to}/`);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-paper"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}

                >
                  <Icon className="size-[1.125rem]" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2 text-sm font-normal text-muted-foreground hover:text-foreground">
              <Palette className="size-4" aria-hidden />
              Theme & colours
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setMode(mode === "dark" ? "light" : "dark")}>
              {mode === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
              {mode === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Accent colour</DropdownMenuLabel>
            {ACCENTS.map((option) => (
              <DropdownMenuItem key={option.id} onSelect={() => setAccent(option.id)}>
                <span
                  aria-hidden
                  data-accent={option.id}
                  className="mr-2 size-3.5 rounded-full border border-border bg-[var(--accent-swatch)]"
                />
                <span className={cn(accent === option.id && "font-semibold text-foreground")}>
                  {option.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          className="mt-1 w-full justify-start gap-2 px-2 text-sm font-normal text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
