import { Hero } from "@/components/sections/hero/hero";
import { NextLevelProjects } from "@/components/sections/project-aperture/project-aperture";
import { SelectedWork } from "@/components/sections/selected-work/selected-work";

/**
 * Clipping is owned by the hero section itself (`overflow-x-clip`), not by this
 * wrapper. A clipped ancestor here would be a scroll container, and that is what
 * breaks the sticky stages.
 *
 * Delivery-sprint order: Hero -> What We Do -> Next Level Projects -> Selected
 * Work. What We Do is not built yet, so the aperture follows the hero directly.
 * DEL-01 mounts the Selected Work gallery after the aperture; both are real
 * homepage sections, not preview routes.
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <NextLevelProjects />
      <SelectedWork />
    </main>
  );
}
