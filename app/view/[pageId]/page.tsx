import { notFound } from "next/navigation";
import { PageRuntimeView } from "@/components/page-runtime-view";
import { normalizePagePayloadForRuntime, validatePagePayload } from "@/lib/page-dsl";
import { normalizeProjectName } from "@/lib/project-name";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    pageId: string;
  }>;
};

export default async function ViewPageByIdPage(context: RouteContext) {
  const { pageId: rawProjectSlug } = await context.params;
  const projectSlug = normalizeProjectName(rawProjectSlug);

  if (!projectSlug) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("name", projectSlug)
    .order("created_at", { ascending: false })
    .limit(1);

  if (projectError || !projects || projects.length === 0) {
    notFound();
  }

  const project = projects[0];

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id, project_id, payload, is_effective")
    .eq("project_id", project.id)
    .eq("is_effective", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pageError || !page) {
    notFound();
  }

  const normalized = normalizePagePayloadForRuntime(page.payload);
  const validation = validatePagePayload(normalized);

  if (!validation.success) {
    notFound();
  }

  const runtimePage = validation.data;

  console.log(
    "[view-page] payload",
    JSON.stringify(
      {
        projectSlug,
        resolvedProjectId: project.id,
        resolvedPageId: page.id,
        projectId: page.project_id,
        payload: runtimePage,
      },
      null,
      2,
    ),
  );

  return <PageRuntimeView page={runtimePage} />;
}
