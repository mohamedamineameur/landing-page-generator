import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { modifyPageWithImage } from "@/lib/openai-page-generator";
import {
  applyLocalizationConstraint,
  applyThemeConstraint,
  buildPromptWithConstraints,
  sanitizeLocalizationConstraint,
  sanitizePromptInput,
  sanitizeThemeConstraint,
} from "@/lib/page-generation-constraints";
import { normalizePagePayloadForRuntime, validatePagePayload, type PagePayload } from "@/lib/page-dsl";
import { createPageVersionForProject, getCurrentWorkspacePage } from "@/lib/workspace";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const body = (await request.json()) as {
      prompt?: unknown;
      page?: unknown;
      save?: unknown;
      themeConstraint?: unknown;
      localizationConstraint?: unknown;
    };

    const prompt = sanitizePromptInput(body.prompt);
    const themeConstraint = sanitizeThemeConstraint(body.themeConstraint);
    const localizationConstraint = sanitizeLocalizationConstraint(body.localizationConstraint);

    if (!prompt) {
      return NextResponse.json({ error: "La demande de modification est requise." }, { status: 400 });
    }

    const currentWorkspace = !body.page ? await getCurrentWorkspacePage(auth.user.userId) : null;
    const sourcePage = body.page ?? currentWorkspace?.effectivePage;

    if (!sourcePage) {
      return NextResponse.json(
        { error: "Aucune page de depart disponible. Cree ou genere d'abord une premiere page." },
        { status: 400 },
      );
    }

    const normalizedSourcePage = normalizePagePayloadForRuntime(sourcePage);
    const sourceValidation = validatePagePayload(normalizedSourcePage);

    if (!sourceValidation.success) {
      return NextResponse.json(
        { error: sourceValidation.errors[0] ?? "La page de depart est invalide." },
        { status: 400 },
      );
    }

    const constrainedPrompt = buildPromptWithConstraints(prompt, themeConstraint, localizationConstraint);
    const result = await modifyPageWithImage(sourceValidation.data as PagePayload, constrainedPrompt, auth.user.userId);
    const themedPage = applyThemeConstraint(result.page, themeConstraint);
    const finalPage = applyLocalizationConstraint(themedPage, localizationConstraint);
    const shouldSave = body.save !== false;
    let createdVersionId: string | null = null;

    if (shouldSave) {
      const workspace = currentWorkspace ?? await getCurrentWorkspacePage(auth.user.userId);

      if (!workspace.currentProject) {
        return NextResponse.json(
          { error: "Aucun projet courant. Cree d'abord ton premier projet." },
          { status: 400 },
        );
      }

      const createdVersion = await createPageVersionForProject(
        auth.user.userId,
        workspace.currentProject.id,
        finalPage,
      );
      createdVersionId = createdVersion?.pageRecord.id ?? null;
    }

    return NextResponse.json({
      success: true,
      message: shouldSave
        ? "La page a ete modifiee puis sauvegardee."
        : "La page a ete modifiee.",
      pageId: createdVersionId,
      page: finalPage,
      images: result.images,
      imageDisplay: result.imageDisplay,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue est survenue pendant la modification.",
      },
      { status: 500 },
    );
  }
}
