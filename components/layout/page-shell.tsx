import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer/footer";
import { MenuProvider } from "@/components/navigation/menu-provider";
import { Navbar } from "./navbar";

type PageShellProps = {
  children: ReactNode;
};

/**
 * Owns the fixed-header relationship for every page.
 *
 * The header floats over content and deliberately adds no top offset, so a hero
 * can start at the top edge of the viewport. Pages that need breathing room
 * below the header declare their own padding instead.
 *
 * MenuProvider wraps the shell so the navigation overlay can inert everything
 * else while it is open.
 */
export function PageShell({ children }: PageShellProps) {
  return (
    <MenuProvider>
      <Navbar />
      <div id="site-content" className="flex flex-1 flex-col">
        {children}
      </div>
      <Footer />
    </MenuProvider>
  );
}
