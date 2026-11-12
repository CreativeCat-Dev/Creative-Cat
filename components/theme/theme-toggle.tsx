"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full",
        "text-foreground outline-none transition-colors duration-200",
        "hover:bg-primary hover:text-primary-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {mounted ? (
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, scale: 0.6, rotate: isDark ? -90 : 90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: isDark ? 90 : -90 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="inline-flex"
          >
            {isDark ? (
              <Moon size={18} weight="regular" aria-hidden />
            ) : (
              <Sun size={18} weight="regular" aria-hidden />
            )}
          </motion.span>
        </AnimatePresence>
      ) : (
        <Sun size={18} weight="regular" aria-hidden />
      )}
    </button>
  );
}
