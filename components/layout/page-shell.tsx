import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer/footer";
import { MenuProvider } from "@/components/navigation/menu-provider";
import { Navbar } from "./navbar";

type PageShellProps = {
  children: ReactNode;
};

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
