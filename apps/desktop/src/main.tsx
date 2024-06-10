import { StrictMode, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./styles.css";
import { AuthSession } from "@supabase/supabase-js";

// Import the generated route tree
import { router } from "./router";
import { supabase } from "./libs/supabase";
import { attachConsole } from "@tauri-apps/plugin-log";
import { Providers } from "./providers";

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const InnerApp = () => {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("session", session);
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    (async () => {
      const detach = await attachConsole();
      return detach;
    })();
  }, []);

  return <RouterProvider router={router} context={{ auth: session! }} />;
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
