import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createLazyFileRoute } from "@tanstack/react-router";

import { createClient } from "../libs/supabase";

export const Route = createLazyFileRoute("/login")({
  component: () => (
    <div>
      <LoginForm />
    </div>
  ),
});

const LoginForm = () => {
  const supabase = createClient();
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
      // theme={theme}
      // redirectTo={`${BASE_URL}/api/auth/callback`}
      providers={["google"]}
    />
  );
};
