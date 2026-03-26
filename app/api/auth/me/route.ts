import { NextResponse } from "next/server";
import { getOptionalAuthenticatedUser } from "@/lib/auth";
import { getModels, syncDatabase } from "@/lib/models";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getOptionalAuthenticatedUser();

  if (!auth.user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  await syncDatabase();
  const { User } = getModels();

  const user = await User.findByPk(auth.user.userId);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    },
  });
}
