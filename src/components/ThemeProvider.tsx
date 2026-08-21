import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const ACCENTS = [
  { id: "terracotta", label: "Terracotta" },
  { id: "sage", label: "Sage" },
  { id: "indigo", label: "Indigo" },
  { id: "plum", label: "Plum" },
] as const;

export type Accent = (typeof ACCENTS)[number]["id"];
export type Mode = "light" | "dark";

type ThemeState = {
  mode: Mode;
  accent: Accent;
  setMode: (mode: Mode) => void;
  setAccent: (accent: Accent) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

const MODE_KEY = "fc-mode";
const ACCENT_KEY = "fc-accent";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");
  const [accent, setAccentState] = useState<Accent>("terracotta");

  useEffect(() => {
    const storedMode = localStorage.getItem(MODE_KEY) as Mode | null;
    const storedAccent = localStorage.getItem(ACCENT_KEY) as Accent | null;
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setModeState(storedMode ?? (prefersDark ? "dark" : "light"));
    if (storedAccent) setAccentState(storedAccent);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.dataset["accent"] = accent;
  }, [mode, accent]);

  const setMode = (next: Mode) => {
    setModeState(next);
    localStorage.setItem(MODE_KEY, next);
  };
  const setAccent = (next: Accent) => {
    setAccentState(next);
    localStorage.setItem(ACCENT_KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
