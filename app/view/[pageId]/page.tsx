import { notFound } from "next/navigation";
import { PageRuntimeView } from "@/components/page-runtime-view";
import { isUuid } from "@/lib/api-utils";
import { getModels, syncDatabase } from "@/lib/models";
import { normalizePagePayloadForRuntime } from "@/lib/page-dsl";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    pageId: string;
  }>;
};

function toProjectSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function ViewPageByIdPage(context: RouteContext) {
  const { pageId } = await context.params;

  await syncDatabase();
  const { Page, Project } = getModels();
  let page = null;

  if (isUuid(pageId)) {
    page = await Page.findByPk(pageId);
  } else {
    const projects = await Project.findAll();
    const matchingProject = projects.find((project) => toProjectSlug(project.name) === pageId);

    if (matchingProject) {
      page = await Page.findOne({
        where: {
          projectId: matchingProject.id,
          isEffective: true,
        },
        order: [["createdAt", "DESC"]],
      });
    }
  }

  if (!page) {
    notFound();
  }

  const runtimePage = normalizePagePayloadForRuntime(page.payload);

  console.log(
    "[view-page] payload",
    JSON.stringify(
      {
        pageId,
        resolvedPageId: page.id,
        projectId: page.projectId,
        payload: runtimePage,
      },
      null,
      2,
    ),
  );

  return <PageRuntimeView page={runtimePage} />;
}
