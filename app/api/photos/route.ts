import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { syncDatabase } from "@/lib/models";
import { listOwnedPhotos } from "@/lib/ownership";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();

    if (auth.error || !auth.user) {
      return auth.error;
    }

    await syncDatabase();
    const photos = await listOwnedPhotos(auth.user.userId);

    return NextResponse.json(
      photos.map((photo) => ({
        id: photo.id,
        userId: photo.userId,
        alt: photo.alt,
        descrip: photo.descrip,
        link: photo.link,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
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
