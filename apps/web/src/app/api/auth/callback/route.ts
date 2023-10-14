import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";
import type { Database } from "@seocraft/supabase/db/database.types";
import { BASE_URL } from "@/lib/constants";
import {
  and,
  db,
  eq,
  project,
  projectMembers,
  user,
} from "@seocraft/supabase/db";

// export const runtime = "edge";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const scopes = requestUrl.searchParams.get("scopeKeys")?.split(",");
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
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

  const redirect = requestUrl.searchParams.get("redirect");
  if (redirect) {
    return NextResponse.redirect(`${BASE_URL}/${redirect}`);
  }
  const [projectS] = await db
    .select()
    .from(project)
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.userId, session?.user.id!),
        eq(projectMembers.projectId, project.id)
      )
    )
    .where(
      and(eq(project.personal, true), eq(project.id, projectMembers.projectId))
    )
    .limit(1);
  if (!projectS.project) {
    return NextResponse.redirect(`${BASE_URL}/explore`);
  }
  return NextResponse.redirect(`${BASE_URL}/${projectS.project.slug}`);
}
