import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import {
  and,
  db,
  eq,
  project,
  projectMembers,
  user,
} from "@seocraft/supabase/db";
import type { Database } from "@seocraft/supabase/db/database.types";

import { BASE_URL } from "@/lib/constants";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const scopes = requestUrl.searchParams.get("scopeKeys")?.split(",");
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return Response.json({ error: "No code provided" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });

  const AuthResponse = await supabase.auth.exchangeCodeForSession(code);
  const session = AuthResponse.data.session;

  if (scopes && session) {
    await db
      .update(user)
      .set({ google_scopes: scopes })
      .where(eq(user.id, session?.user.id));
  }

  const redirectPath = requestUrl.searchParams.get("redirect");
  if (redirectPath) {
    return redirect(`${BASE_URL}/${redirectPath}`);
  }
  const [projectS] = await db
    .select()
    .from(project)
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.userId, session?.user.id!),
        eq(projectMembers.projectId, project.id),
      ),
    )
    .where(
      and(eq(project.personal, true), eq(project.id, projectMembers.projectId)),
    )
    .limit(1);
  if (!projectS) {
    redirect(`${BASE_URL}/explore`);
  }
  redirect(`${BASE_URL}/${projectS.project.slug}`);
}
