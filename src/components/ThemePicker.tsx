import { Moon, Palette, Sun } from "lucide-react";
import { ACCENTS, useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const { mode, accent, setMode, setAccent } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme and colours">
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setMode(mode === "dark" ? "light" : "dark")}>
          {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {mode === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Accent colour</DropdownMenuLabel>
        {ACCENTS.map((option) => (
          <DropdownMenuItem key={option.id} onSelect={() => setAccent(option.id)}>
            <span
              aria-hidden
              data-accent={option.id}
              className="size-3.5 rounded-full border border-border bg-[var(--accent-swatch)]"
            />
            <span className={cn(accent === option.id && "font-semibold text-foreground")}>
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
