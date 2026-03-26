import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    const supabase = await createSupabaseServerClient();
    const { data: photos, error } = await supabase
      .from("photos")
      .select("id, user_id, bucket, path, alt, descrip, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      (photos ?? []).map((photo) => ({
        id: photo.id,
        userId: photo.user_id,
        alt: photo.alt,
        descrip: photo.descrip,
        link: supabase.storage.from(photo.bucket).getPublicUrl(photo.path).data.publicUrl,
        bucket: photo.bucket,
        createdAt: photo.created_at,
        updatedAt: photo.updated_at,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible de charger les photos.",
      },
      { status: 500 },
    );
  }
}
