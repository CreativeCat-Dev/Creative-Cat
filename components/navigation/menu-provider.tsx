"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { MenuOverlay } from "./menu-overlay";

type MenuContextValue = {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenu(): MenuContextValue {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used inside MenuProvider");
  }
  return context;
}

/**
 * Owns menu state for the whole shell.
 *
 * The overlay is rendered as a sibling of the inert wrapper rather than inside
 * the header: that keeps it above the header in the stacking order, and lets the
 * entire shell (header included) go inert while the menu is open.
 *
 * Navigation is deferred until the overlay reports its close animation finished.
 */
export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const router = useRouter();

  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ open, openMenu, closeMenu }),
    [open, openMenu, closeMenu]
  );

  return (
    <MenuContext.Provider value={value}>
      <div inert={open} className="flex flex-1 flex-col">
        {children}
      </div>
      <MenuOverlay
        open={open}
        onClose={closeMenu}
        onNavigate={setPendingHref}
        onClosed={() => {
          if (!pendingHref) return;
          const href = pendingHref;
          setPendingHref(null);
          router.push(href);
        }}
      />
    </MenuContext.Provider>
  );
}
