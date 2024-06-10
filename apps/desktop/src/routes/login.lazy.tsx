import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createLazyFileRoute } from "@tanstack/react-router";

import { supabase } from "../libs/supabase";

// import type { Database } from "@craftgen/db/db/database.types";

export const Route = createLazyFileRoute("/login")({
  component: () => (
    <div>
      <LoginForm />
    </div>
  ),
});

const LoginForm = () => {
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
