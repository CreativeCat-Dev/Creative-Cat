import { Hero } from "@/components/sections/hero/hero";
import { NextLevelProjects } from "@/components/sections/project-aperture/project-aperture";

/**
 * Clipping is owned by the hero section itself (`overflow-x-clip`), not by this
 * wrapper. A clipped ancestor here would be a scroll container, and that is what
 * breaks the sticky stages.
 *
 * Delivery-sprint order: the aperture became the reference Next Level Projects
 * masthead in DEL-00.3A and belongs at position 3, after Capabilities / What We
 * Do (position 2) and before Selected Work (position 4). Capabilities is not
 * built yet, so the section is mounted directly after the hero for now. It is
 * still a real homepage section, not a preview route.
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <NextLevelProjects />
    </main>
  );
}
