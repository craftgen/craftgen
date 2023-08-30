"use client";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Auth } from "@supabase/auth-ui-react";
import { BASE_URL } from "@/lib/constants";
import { Database } from "@seocraft/supabase/db/database.types";

export const LoginForm = () => {
  const supabase = createClientComponentClient<Database>();

  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
      }}
      redirectTo={`${BASE_URL}/api/auth/callback`}
      // queryParams={{
      //   access_type: "offline",
      //   prompt: "consent",
      // }}
      // providerScopes={{
      //   google:
      //     "https://www.googleapis.com/auth/indexing, https://www.googleapis.com/auth/webmasters.readonly",
      // }}
      providers={["google"]}
    />
  );
};
