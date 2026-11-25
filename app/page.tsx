import { Hero } from "@/components/sections/hero/hero";

/**
 * Clipping is owned by the hero section itself (`overflow-x-clip`), not by this
 * wrapper. A clipped ancestor here would be a scroll container, and that is what
 * breaks the sticky stage the scroll story will need in HERO-03.
 */
export default function Home() {
  return (
    <main>
      <Hero />
    </main>
  );
}
