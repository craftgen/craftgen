"use client";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Auth } from "@supabase/auth-ui-react";
import { BASE_URL } from "@/lib/constants";
import { Database } from "@seocraft/supabase/db/database.types";
import { useTheme } from "next-themes";

export const LoginForm = () => {
  const supabase = createClientComponentClient<Database>();
  const { theme } = useTheme();

  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
      }}
      theme={theme}
      redirectTo={`${BASE_URL}/api/auth/callback`}
      providers={["google"]}
    />
  );
};
