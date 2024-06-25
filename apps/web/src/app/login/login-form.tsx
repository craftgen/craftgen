"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useTheme } from "next-themes";

import { BASE_URL } from "@/lib/constants";
import { createClient } from "@/utils/supabase/client";

export const LoginForm = () => {
  const supabase = createClient();

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
