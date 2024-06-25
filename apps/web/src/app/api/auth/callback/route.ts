import { redirect } from "next/navigation";

import { and, db, eq, project, projectMembers, user } from "@craftgen/db/db";

import { BASE_URL } from "@/lib/constants";
import PostHogClient from "@/lib/posthog";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const scopes = requestUrl.searchParams.get("scopeKeys")?.split(",");
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return Response.json({ error: "No code provided" }, { status: 400 });
  }

  const supabase = createClient();

  const AuthResponse = await supabase.auth.exchangeCodeForSession(code);
  const session = AuthResponse.data.session;
  const posthog = PostHogClient();

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
    // TODO: redirect to onboarding to create user personal project.
    redirect(`${BASE_URL}/explore?identify`);
  }
  posthog.identify({
    distinctId: session?.user.id!,
    properties: {
      email: session?.user.email,
      name: session?.user.user_metadata?.full_name,
    },
  });

  posthog.capture({
    distinctId: session?.user.id!,
    event: "Login",
    properties: {
      $set: {
        currentProjectSlug: projectS.project.slug,
      },
    },
  });

  await supabase.auth.updateUser({
    data: {
      currentProjectSlug: projectS.project.slug,
    },
  });

  redirect(`${BASE_URL}/${projectS.project.slug}?identify`);
}
