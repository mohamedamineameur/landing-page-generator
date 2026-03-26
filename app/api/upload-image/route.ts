import path from "node:path";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function resolveExtension(fileName: string, mimeType: string) {
  const extensionFromName = path.extname(fileName).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extensionFromName)) {
    return extensionFromName === ".jpeg" ? ".jpg" : extensionFromName;
  }

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";

  return ".png";
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const supabase = await createSupabaseServerClient();

    const formData = await request.formData();
    const file = formData.get("file");
    const slugValue = formData.get("slug");
    const altValue = formData.get("alt");
    const descripValue = formData.get("descrip");
    const slug = typeof slugValue === "string" && slugValue.trim() ? slugValue.trim() : "page";
    const alt = typeof altValue === "string" && altValue.trim() ? altValue.trim().slice(0, 255) : null;
    const descrip = typeof descripValue === "string" && descripValue.trim() ? descripValue.trim().slice(0, 2000) : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier image n'a ete envoye." }, { status: 400 });
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json(
        { error: "Format non pris en charge. Utilise PNG, JPG, WEBP ou GIF." },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "L'image est trop lourde. Maximum 10 Mo." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = resolveExtension(file.name, file.type);
    const normalizedSlug = slug
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "visuel";

    const objectPath = `${auth.user.userId}/${normalizedSlug}-${Date.now()}${extension}`;

    const { error: uploadError } = await supabase.storage.from("photos").upload(objectPath, buffer, {
      contentType: file.type || `image/${extension.replace(".", "")}`,
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(objectPath);
    const src = publicUrlData.publicUrl;

    const { error: insertError } = await supabase.from("photos").insert({
      user_id: auth.user.userId,
      bucket: "photos",
      path: objectPath,
      alt,
      descrip,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      src,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible d'envoyer l'image.",
      },
      { status: 500 },
    );
  }
}
