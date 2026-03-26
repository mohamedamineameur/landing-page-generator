import { redirect } from "next/navigation";
import { getOptionalAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auth = await getOptionalAuthenticatedUser();

  redirect(auth.user ? "/dashboard" : "/auth");
}
