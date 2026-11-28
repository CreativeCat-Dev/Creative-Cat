import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/work/project-detail";
import {
  getNextWorkProject,
  getWorkProject,
  getWorkProjectIndex,
  WORK_PROJECTS,
} from "@/lib/work";

/**
 * One route per canonical project. The slug is the only identity; metadata,
 * artwork, category and the next project all come from `lib/work.ts`.
 *
 * `cacheComponents` (Next 16) does not allow `dynamicParams = false`. Every
 * canonical slug is generated below and `ensureStatic = 'navigation'` requires
 * the complete route to come from that static output, so an unknown slug cannot
 * serve a partial 200 shell before `notFound()` resolves.
 */
export const ensureStatic = "navigation";

/**
 * The showcase reads the slug to resolve its project and metadata, so the route
 * is allowed to block rather than serve a generic instant shell. This is the
 * documented cacheComponents escape hatch for URL-data pages and keeps the
 * static output (and its 404) authoritative.
 */
export const instant = false;

export function generateStaticParams() {
  return WORK_PROJECTS.map((project) => ({ slug: project.slug }));
}

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getWorkProject(slug);

  if (!project) {
    return { title: "Project not found — Creative Cat" };
  }

  return {
    title: `${project.name} — Creative Cat`,
    description: project.category
      ? `${project.name}, a ${project.category.toLowerCase()} project by Creative Cat.`
      : `${project.name}, selected work by Creative Cat.`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getWorkProject(slug);
  if (!project) notFound();

  const index = getWorkProjectIndex(slug);
  const next = getNextWorkProject(slug);

  return (
    <main
      data-work-project
      data-header-surface="inherit"
      className="w-full flex-1 px-5 pt-32 pb-24 md:px-9 md:pt-40 lg:px-12 xl:px-16"
    >
      <div className="mx-auto w-full max-w-[1240px]">
        <ProjectDetail project={project} index={index} next={next} />
      </div>
    </main>
  );
}
