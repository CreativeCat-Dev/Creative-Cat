"use client";

import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { startThemeTransition } from "@/lib/theme-transition";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  animated?: boolean;
  className?: string;
};

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({ animated = true, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";

    if (!animated) {
      setTheme(next);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const origin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: 0 };

    startThemeTransition(origin, () => {
      document.documentElement.classList.toggle("dark", next === "dark");
      flushSync(() => setTheme(next));
    });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full",
        "text-foreground outline-none transition-colors duration-200",
        "hover:bg-primary hover:text-primary-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {isDark ? (
        <Moon size={18} weight="regular" aria-hidden />
      ) : (
        <Sun size={18} weight="regular" aria-hidden />
      )}
    </button>
  );
}
