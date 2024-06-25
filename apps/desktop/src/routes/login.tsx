import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createFileRoute, Link } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";

import { createClient } from "../libs/supabase";

export const Route = createFileRoute("/login")({
  component: () => (
    <div>
      <LoginForm />
    </div>
  ),
});

function getLocalHostUrl(port: number) {
  return `http://localhost:${port}`;
}

const LoginForm = () => {
  const supabase = createClient();
  const [port, setPort] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Refresh", port);
    if (port) return;

    const unlisten = listen("oauth://url", (data) => {
      setPort(null);
      if (!data.payload) return;

      const url = new URL(data.payload as string);
      const code = new URLSearchParams(url.search).get("code");

      console.log("here", data.payload, code);
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error, data }) => {
          if (data) {
            console.log("GOT DATA", data);
          }
          if (error) {
            alert(error.message);
            console.error(error);
            return;
          }
          location.reload();
        });
      }
    });

    let _port: number | null = null;
    invoke("plugin:oauth|start").then(async (port) => {
      setPort(port as number);
      _port = port as number;
    });

    () => {
      unlisten?.then((u) => u());
      invoke("plugin:oauth|cancel", { port: _port });
    };
  }, [port]);
  const onProviderLogin = (provider: "google" | "github") => async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      options: {
        skipBrowserRedirect: true,
        scopes: provider === "google" ? "profile email" : "",
        redirectTo: getLocalHostUrl(port!),
      },
      provider: provider,
    });

    if (data.url) {
      // console.log("OPENING", data.url);
      open(data.url);
    } else {
      alert(error?.message);
    }
  };

  return (
    <div>
      <button onClick={onProviderLogin("google")}>Google</button>
      <Link to="/">Home</Link>
      {/* <Auth
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
        additionalData={
          {
            // skipRe
          }
        }
        // theme={theme}

        redirectTo={getLocalHostUrl(port!)}
        providers={["google"]}
      /> */}
    </div>
  );
};
