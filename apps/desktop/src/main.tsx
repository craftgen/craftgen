import { StrictMode, useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import "./styles.css";

import { AuthSession } from "@supabase/supabase-js";
import { attachConsole } from "@tauri-apps/plugin-log";

import { api } from "@craftgen/ui/lib/api";

import { createClient } from "./libs/supabase";
import { Providers } from "./providers";
// Import the generated route tree
import { router } from "./router";
import { checkForAppUpdates } from "./updater";

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

document.addEventListener("keydown", (ev) => {
  // cancel backspace and delete
  if (ev.key === "Backspace" || ev.key === "Delete") {
    ev.preventDefault();
    return;
  }
});

const InnerApp = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("session", session);
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      await checkForAppUpdates();
      const detach = await attachConsole();
      return detach;
    })();
  }, []);

  const client = api.useUtils();
  return (
    <RouterProvider router={router} context={{ auth: session!, client }} />
  );
};

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <Providers>
        <InnerApp />
      </Providers>
    </StrictMode>,
  );
}
