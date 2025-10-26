import React from "react";
const { createContext, useContext, useEffect, useMemo, useState } = React;

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
}: ProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );

  // Load stored preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored) setTheme(stored);
    } catch {}
  }, []);

  // Track system preference and compute resolved theme
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const compute = () => {
      const sys = media.matches ? "dark" : "light";
      setResolved(theme === "system" && enableSystem ? sys : (theme as "light" | "dark"));
    };

    compute();
    if (enableSystem) media.addEventListener("change", compute);
    return () => {
      if (enableSystem) media.removeEventListener("change", compute);
    };
  }, [theme, enableSystem]);

  // Apply theme to document element (class strategy)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (resolved === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [resolved]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme: resolved,
    setTheme: (t: Theme) => {
      setTheme(t);
      try { localStorage.setItem("theme", t); } catch {}
    },
  }), [theme, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback to avoid crashing if used outside provider
    return { theme: "system" as Theme, resolvedTheme: "light" as const, setTheme: () => {} };
  }
  return ctx;
};
