import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CakeSlice,
  Gift,
  Users,
  CircleDashed,
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
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Gift },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/circles", label: "Circles", icon: CircleDashed },
  { to: "/birthdays", label: "Birthdays", icon: CakeSlice },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopHeader />
      <DesktopSidebar />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 md:pl-[calc(var(--sidebar-width)+1rem)] md:pr-6 lg:px-8">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}

function TopHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur md:left-0 md:right-0">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:pl-[calc(var(--sidebar-width)+1rem)] md:pr-6">
        <Link to="/dashboard" className="font-display text-lg font-semibold tracking-tight">
          Friend<span className="text-primary">Circles</span>
        </Link>
        <div className="flex items-center gap-1 md:hidden">
          <MobileUserMenu />
        </div>
      </div>
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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = currentPath === to || currentPath.startsWith(`${to}/`);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span>{label}</span>
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-border bg-card md:flex">
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
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
