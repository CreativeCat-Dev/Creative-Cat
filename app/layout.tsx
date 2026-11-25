import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "lenis/dist/lenis.css";
import "./globals.css";
import { clashDisplay, montserrat } from "./fonts";
import { PageShell } from "@/components/layout/page-shell";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { HERO_STORY_INIT } from "@/components/sections/hero/hero-story.config";

export const metadata: Metadata = {
  title: "Creative Cat",
  description:
    "Creative Cat - Expert in SEO, SSM, Web Dev, Design & content Your one-stop digital growth partner",
  icons: {
    icon: "/logos/Asset-4.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", montserrat.variable, clashDisplay.variable)}
    >
      <body className="min-h-full flex flex-col">
        {/*
          The hero's pre-hydration height switch. It has to run during parse,
          before the browser restores a scroll position, so it cannot be queued
          for hydration and cannot live in a component that is re-rendered on a
          client-side navigation. The root layout renders once per document and
          stays mounted, so this executes in the initial HTML and is never
          re-created by a route change. It is generated from the hero config and
          fails closed (no JS, reduced motion or a narrow viewport leave the
          hero one viewport tall).
        */}
        <script dangerouslySetInnerHTML={{ __html: HERO_STORY_INIT }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScrollProvider>
            <PageShell>{children}</PageShell>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
