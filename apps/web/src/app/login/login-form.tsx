"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useTheme } from "next-themes";

import type { Database } from "@seocraft/supabase/db/database.types";

import { BASE_URL } from "@/lib/constants";

export const LoginForm = () => {
  const supabase = createClientComponentClient<Database>();
  const { theme } = useTheme();

  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: "#000",
              brandAccent: "#222",
            },
          },
        },
      }}
      theme={theme}
      redirectTo={`${BASE_URL}/api/auth/callback`}
      providers={["google"]}
    />
  );
};
