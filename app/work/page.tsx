import type { Metadata } from "next";
import { ProjectGallery } from "@/components/work/project-gallery";

export const metadata: Metadata = {
  title: "Our Work — Creative Cat",
  description:
    "Selected projects by Creative Cat — brand, design and digital work.",
};

/**
 * DEL-01D.1 — the Work route follows the visitor's saved global theme.
 *
 * It previously forced a midnight surface in both themes. The route now consumes
 * the existing tokens (`bg-background`, `text-foreground`, `text-muted-foreground`,
 * `border-border`, `bg-primary`) and declares `data-header-surface="inherit"`, so
 * the navbar follows the same light/dark surface contract as every other page.
 * Nothing here writes the theme store.
 */
export default function WorkPage() {
  return (
    <main
      data-work-page
      data-header-surface="inherit"
      className="w-full flex-1 bg-background px-5 pb-24 pt-32 text-foreground md:px-9 md:pt-40 lg:px-12 xl:px-16"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <ProjectGallery />
      </div>
    </main>
  );
}
