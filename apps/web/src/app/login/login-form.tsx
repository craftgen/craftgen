"use client";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Auth } from "@supabase/auth-ui-react";
import { BASE_URL } from "@/lib/constants";
import { Database } from "@turboseo/supabase/db/database.types";
import { useEffect } from "react";

export const LoginForm = () => {
  const supabase = createClientComponentClient<Database>();
  useEffect(() => {
    supabase.from('user').select('*').then(console.log)
  }) 

  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
      }}
      redirectTo={`${BASE_URL}/api/auth/callback`}
      providers={["google"]}
    />
  );
};
